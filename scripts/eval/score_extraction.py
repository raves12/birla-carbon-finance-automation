"""Field-level scoring of an extraction run against ground truth (Phase 40).

  python scripts/eval/score_extraction.py <results.json> [ground_truth.json] [--md out.md]

results.json: {"documents": {file: raw structured output}} as written from
di_genai_output (keys are the DocIntel field names lower-cased without
spaces). Ground truth lists only fields printed on each document.

Counts per field:
  expected   printed on the document (in ground truth)
  extracted  a non-empty value was returned
  exact      equal after trimming
  normalized equal after normalisation (case, spaces, number format,
             country names, ISO dates)
  missed     expected but empty
  incorrect  expected, returned, not equal after normalisation
  false_pos  not printed (absent from ground truth) but a value returned
Critical fields (AP): vendor_name, invoice_number, po_number, currency,
gross_amount, tax_amount. (AR): customer_name, payment reference, payment
amount, currency, invoice references. A document is straight-through when
every critical field is correct and no critical field is a false positive.
No value is estimated: every number comes from this comparison.
"""
import io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(io.open(os.path.join(HERE, '..', 'deploy', 'native_extraction_config.json'), encoding='utf8'))
norm_key = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
KEYMAP = {}
for uc in CFG['use_cases']:
    for f in uc['fields']:
        KEYMAP[(uc['key'], norm_key(f[2]))] = f[1]

COUNTRY = {'usa': 'united states', 'us': 'united states', 'u.s.a.': 'united states', 'uk': 'united kingdom', 'deutschland': 'germany'}
NUMERIC = {'net_amount', 'tax_amount', 'gross_amount', 'tax_rate_pct', 'vat_amount', 'cgst_amount', 'sgst_amount', 'igst_amount', 'wht_amount',
           'wht_rate_pct', 'discount_amount', 'freight_amount', 'payment_amount', 'deduction_amount', 'quantity', 'unit_price', 'amount_applied', 'invoice_amount'}
AP_CRITICAL = ['vendor_name', 'invoice_number', 'po_number', 'currency', 'gross_amount', 'tax_amount']
AR_CRITICAL = ['customer_name', 'payment_ref', 'payment_amount', 'currency', 'invoice_refs']
IGNORE_FP = {'buyer_name', 'comments', 'document_language', 'lines_json', 'invoice_lines_json'}


def empty(v):
    return v is None or (isinstance(v, str) and v.strip() == '') or v == []


def num(v):
    """Same rule as NativeDocumentIntelligenceProvider._num: the last separator
    followed by one or two digits is the decimal mark."""
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return round(float(v), 2)
    s = re.sub(r'[^0-9.,\-]', '', str(v))
    if s in ('', '-'):
        return None
    last_dot, last_comma = s.rfind('.'), s.rfind(',')
    decimal = '.' if last_dot > last_comma else ','
    at = max(last_dot, last_comma)
    if at >= 0 and len(s) - at - 1 > 2:
        decimal = None
    if decimal == ',' and last_dot < 0 and s.count(',') > 1:
        decimal = None
    if decimal == ',':
        s = s.replace('.', '').replace(',', '.')
    elif decimal == '.':
        s = s.replace(',', '')
    else:
        s = s.replace('.', '').replace(',', '')
    try:
        return round(float(s), 2)
    except ValueError:
        return None


def normalize(field, v):
    if empty(v):
        return None
    if field in NUMERIC:
        return num(v)
    s = re.sub(r'\s+', ' ', str(v)).strip().lower()
    if field in ('vendor_country',):
        s = COUNTRY.get(s, s)
    return s


def compare(field, expected, got):
    """Returns one of exact / normalized / incorrect / missed."""
    if empty(got):
        return 'missed'
    if str(got).strip() == str(expected).strip():
        return 'exact'
    if field in NUMERIC and num(got) is not None and num(got) == num(expected):
        return 'normalized'
    if normalize(field, got) == normalize(field, expected):
        return 'normalized'
    return 'incorrect'


def map_doc(kind, raw):
    out = {}
    for k, v in raw.items():
        field = KEYMAP.get((kind, norm_key(k)))
        if field:
            out[field] = v
    return out


def score(results, truth):
    rows, totals = [], {}
    def add(group, outcome):
        t = totals.setdefault(group, {'expected': 0, 'extracted': 0, 'exact': 0, 'normalized': 0, 'missed': 0, 'incorrect': 0, 'false_pos': 0})
        t[outcome] += 1
    docs = []
    for kind in ('ap', 'ar'):
        for file, gt in truth[kind].items():
            raw = results['documents'].get(file)
            if raw is None:
                docs.append({'file': file, 'kind': kind, 'status': 'NOT RUN'})
                continue
            got = map_doc(kind, raw)
            detail, critical_ok = [], True
            # header fields
            ref_field = 'payment_reference' if 'payment_reference' in gt else 'bank_reference'
            for field, expected in gt.items():
                if field in ('lines', 'invoice_lines') or (kind == 'ar' and field == ref_field):
                    continue
                outcome = compare(field, expected, got.get(field))
                add('header', 'expected')
                if not empty(got.get(field)):
                    add('header', 'extracted')
                add('header', outcome)
                if outcome in ('missed', 'incorrect'):
                    detail.append('%s: expected %r, got %r' % (field, expected, got.get(field)))
                if field in AP_CRITICAL + AR_CRITICAL:
                    add('critical', 'expected')
                    if not empty(got.get(field)):
                        add('critical', 'extracted')
                    add('critical', outcome)
                    if outcome in ('missed', 'incorrect'):
                        critical_ok = False
            if kind == 'ar':
                # payment reference: the bank reference may be returned as payment or bank reference
                ref = gt.get(ref_field)
                cands = [got.get('payment_reference'), got.get('bank_reference')]
                ok = any(not empty(c) and str(c).strip() == ref for c in cands)
                for g in ('header', 'critical'):
                    add(g, 'expected')
                    add(g, 'exact' if ok else 'missed')
                if ok:
                    add('critical', 'extracted')
                if not empty(got.get('bank_reference')):
                    add('header', 'extracted')
                if not ok:
                    critical_ok = False
                    detail.append('payment reference: expected %r, got %r' % (ref, cands))
            # false positives on header fields not printed
            for field, v in got.items():
                if field in IGNORE_FP or field in gt or empty(v):
                    continue
                if kind == 'ar' and field in ('bank_reference', 'payment_reference') and not ('payment_reference' in gt and 'bank_reference' in gt):
                    continue
                add('header', 'false_pos')
                detail.append('%s: not printed, got %r' % (field, v))
                if field in AP_CRITICAL + AR_CRITICAL:
                    critical_ok = False
            # lines
            gt_lines = gt.get('lines') if kind == 'ap' else gt.get('invoice_lines')
            raw_lines = got.get('lines_json') if kind == 'ap' else got.get('invoice_lines_json')
            if isinstance(raw_lines, str):
                try:
                    raw_lines = json.loads(raw_lines)
                except ValueError:
                    raw_lines = []
            raw_lines = raw_lines or []
            refs_ok = True
            for i, gl in enumerate(gt_lines or []):
                rl = raw_lines[i] if i < len(raw_lines) else {}
                for field, expected in gl.items():
                    outcome = compare(field, expected, rl.get(field))
                    add('line', 'expected')
                    if not empty(rl.get(field)):
                        add('line', 'extracted')
                    add('line', outcome)
                    if outcome in ('missed', 'incorrect'):
                        detail.append('line %d %s: expected %r, got %r' % (i + 1, field, expected, rl.get(field)))
                        if field == 'invoice_reference':
                            refs_ok = False
            for i in range(len(gt_lines or []), len(raw_lines)):
                add('line', 'false_pos')
                detail.append('extra line %d returned' % (i + 1))
            if kind == 'ar':
                add('critical', 'expected')
                if raw_lines:
                    add('critical', 'extracted')
                add('critical', 'exact' if refs_ok else 'incorrect')
                if not refs_ok:
                    critical_ok = False
            docs.append({'file': file, 'kind': kind, 'status': 'CRITICAL OK' if critical_ok else 'CRITICAL FIELD WRONG', 'detail': detail})
    return docs, totals


def pct(a, b):
    return 'n/a' if b == 0 else '%.1f %%' % (100.0 * a / b)


def report(docs, totals, results_path):
    lines = ['| Group | Expected | Extracted | Exact | Normalized | Correct | Missed | Incorrect | False positive | Accuracy (correct / expected) |',
             '|---|---|---|---|---|---|---|---|---|---|']
    for g in ('header', 'line', 'critical'):
        t = totals.get(g)
        if not t:
            continue
        correct = t['exact'] + t['normalized']
        lines.append('| %s | %d | %d | %d | %d | %d | %d | %d | %d | %s |' % (g, t['expected'], t['extracted'], t['exact'], t['normalized'], correct,
                                                                       t['missed'], t['incorrect'], t['false_pos'], pct(correct, t['expected'])))
    run = [d for d in docs if d['status'] != 'NOT RUN']
    stp = [d for d in run if d['status'] == 'CRITICAL OK']
    lines.append('')
    lines.append('Documents scored: %d. Straight-through extraction (every critical field correct, no critical false positive): %d (%s). Extraction needing correction: %d (%s). Whether a document then flows through without review is decided by the deterministic pipeline (confidence, completeness, matching), not by this score.' % (
        len(run), len(stp), pct(len(stp), len(run)), len(run) - len(stp), pct(len(run) - len(stp), len(run))))
    lines.append('')
    lines.append('| Document | Result | Differences |')
    lines.append('|---|---|---|')
    for d in docs:
        lines.append('| %s | %s | %s |' % (d['file'], d['status'], '; '.join(d.get('detail') or []) or 'none'))
    return '\n'.join(lines)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    md = sys.argv[sys.argv.index('--md') + 1] if '--md' in sys.argv else None
    if md in args:
        args.remove(md)
    results = json.load(io.open(args[0], encoding='utf8'))
    truth = json.load(io.open(args[1] if len(args) > 1 else os.path.join(HERE, 'ground_truth_synthetic.json'), encoding='utf8'))
    docs, totals = score(results, truth)
    text = report(docs, totals, args[0])
    print(text)
    if md:
        io.open(md, 'w', encoding='utf8', newline='\n').write(text + '\n')

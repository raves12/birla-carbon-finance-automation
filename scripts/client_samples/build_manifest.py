"""Client sample manifest (local, confidential).

Reads test/client_samples/pack/* (git-ignored) and writes
test/client_samples/manifest.json (also git-ignored) with, per file: SHA-256,
size, page count, whether each page has a text layer (digital) or not
(scan / image-only), the writing scripts found in the text layer, and
content-identical duplicates (same SHA-256 under another name).

Language and country are NOT inferred from file names. The script only reports
which writing systems appear in the text layer (Latin, CJK, Hangul, Thai,
Arabic, Devanagari); a scan has no text layer, so its language stays
"undetermined" until Document Intelligence or a reviewer reads the page.

  python scripts/client_samples/build_manifest.py
"""
import hashlib, io, json, os, re

import pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
PACK = os.path.join(REPO, 'test', 'client_samples', 'pack')
OUT = os.path.join(REPO, 'test', 'client_samples', 'manifest.json')

SCRIPTS = [
    ('Hangul', [(0xAC00, 0xD7AF), (0x1100, 0x11FF), (0x3130, 0x318F)]),
    ('CJK', [(0x4E00, 0x9FFF), (0x3400, 0x4DBF)]),
    ('Thai', [(0x0E00, 0x0E7F)]),
    ('Arabic', [(0x0600, 0x06FF), (0x0750, 0x077F)]),
    ('Devanagari', [(0x0900, 0x097F)]),
]


def scripts_in(text):
    counts = {}
    for ch in text:
        cp = ord(ch)
        for name, ranges in SCRIPTS:
            if any(a <= cp <= b for a, b in ranges):
                counts[name] = counts.get(name, 0) + 1
                break
        else:
            if ch.isalpha() and cp < 0x250:
                counts['Latin'] = counts.get('Latin', 0) + 1
    return counts


def main():
    files = sorted(os.listdir(PACK))
    rows, by_hash = [], {}
    for name in files:
        path = os.path.join(PACK, name)
        data = open(path, 'rb').read()
        sha = hashlib.sha256(data).hexdigest()
        head = data[:8]
        kind = 'pdf' if head.startswith(b'%PDF') else 'png' if head.startswith(b'\x89PNG') else 'jpeg' if head[:3] == b'\xff\xd8\xff' else 'other'
        row = {'file': name, 'sha256': sha, 'bytes': len(data), 'format': kind}
        if kind == 'pdf':
            doc = pymupdf.open(path)
            per_page, images, all_text = [], [], ''
            for page in doc:
                t = page.get_text()
                per_page.append(len(re.sub(r'\s', '', t)))
                images.append(len(page.get_images()))
                all_text += t
            pages = doc.page_count
            text_pages = sum(1 for c in per_page if c >= 40)
            row.update({
                'pages': pages,
                'text_chars_per_page': per_page,
                'images_per_page': images,
                'layer': 'digital' if text_pages == pages else 'scan' if text_pages == 0 else 'mixed',
                'scripts_in_text_layer': scripts_in(all_text),
            })
        rows.append(row)
        by_hash.setdefault(sha, []).append(name)
    for row in rows:
        same = [n for n in by_hash[row['sha256']] if n != row['file']]
        row['identical_to'] = same
    io.open(OUT, 'w', encoding='utf8').write(json.dumps(rows, indent=2, ensure_ascii=False))
    for r in rows:
        print('%-62s %-6s p=%-3s %-7s %s %s' % (r['file'][:62], r['format'], r.get('pages', '-'), r.get('layer', '-'),
              json.dumps(r.get('scripts_in_text_layer', {})), ('DUP of ' + ', '.join(r['identical_to'])) if r['identical_to'] else ''))


if __name__ == '__main__':
    main()

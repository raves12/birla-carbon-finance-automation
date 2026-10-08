"""Drift-guard baselines from a deployed loader.

A script include deployed from an uncommitted working copy is not in git, so
the drift guard of the next deploy cannot use `git show`. The loader that put
it live embeds its exact script; this extracts it to
scripts/deploy/baselines/<Name>.<label>.js and checks that it hashes to the
"work" value the loader's own guard recorded (the version it made live).

  python scripts/deploy/baseline_from_loader.py <loader_bg.js> <ScriptIncludeName> <label>
"""
import io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def h(t):
    a = 7
    for ch in t:
        a = (a * 31 + ord(ch)) % 2147483647
    return a


def main(loader, name, label):
    text = io.open(loader, encoding='utf8').read()
    files = json.loads(re.search(r'var files = (\[.*?\]);\n', text, re.S).group(1))
    guard = json.loads(re.search(r'var G = (\[.*?\]),', text).group(1))
    api = 'x_695068_bcfa.' + name
    for f in files:
        xml = f['xml']
        if '<api_name>' + api + '</api_name>' not in xml:
            continue
        m = re.search(r'<script><!\[CDATA\[(.*?)\]\]></script>', xml, re.S)
        script = m.group(1).replace('\r\n', '\n')
        work = next((g['work'] for g in guard if g['api'] == api), None)
        out = os.path.join(HERE, 'baselines', name + '.' + label + '.js')
        io.open(out, 'w', encoding='utf8', newline='\n').write(script)
        print(out, 'hash', h(script), 'loader work hash', work, 'MATCH' if work == h(script) else ('(new in that loader)' if work is None else 'MISMATCH'))
        return
    sys.exit(name + ' not found in ' + loader)


if __name__ == '__main__':
    main(*sys.argv[1:4])

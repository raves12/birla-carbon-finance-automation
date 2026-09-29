# Builds a Scripts - Background patch for app script includes: line hunks
# computed from git HEAD vs the working copy. Applied only if the live script
# (CRLF normalised) hashes to HEAD; the result must hash to the working copy.
# Usage: python mkpatch2.py OUT.js Name1 Name2 ...
import difflib, io, json, subprocess, sys

REPO = r'C:\Projects\birla-carbon-finance-automation'

def h(t):
    a = 7
    for ch in t:
        a = (a * 31 + ord(ch)) % 2147483647
    return a

def utf16_len(t):
    # JavaScript string length (UTF-16 code units)
    return len(t.encode('utf-16-le')) // 2

out, names = sys.argv[1], sys.argv[2:]
patches = []
for name in names:
    rel = 'src/server/script-includes/' + name + '.server.js'
    head = subprocess.run(['git', 'show', 'HEAD:' + rel], cwd=REPO, capture_output=True, check=True).stdout.decode('utf8').replace('\r\n', '\n')
    work = io.open(REPO + '\\' + rel.replace('/', '\\'), encoding='utf8', newline='').read().replace('\r\n', '\n')
    hl, wl = head.splitlines(True), work.splitlines(True)
    offs = [0]
    for line in hl:
        offs.append(offs[-1] + utf16_len(line))
    hunks = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, hl, wl, autojunk=False).get_opcodes():
        if tag == 'equal':
            continue
        hunks.append([offs[i1], offs[i2] - offs[i1], ''.join(wl[j1:j2])])
    for c in head + work:
        if ord(c) > 0xFFFF:
            raise SystemExit('astral character in ' + name)
    patches.append({'api': 'x_695068_bcfa.' + name, 'headHash': h(head), 'workHash': h(work), 'workLen': utf16_len(work), 'hunks': hunks})

sn = ("(function() {\n"
      "function h(t) { var a = 7; for (var i = 0; i < t.length; i++) a = (a * 31 + t.charCodeAt(i)) % 2147483647; return a; }\n"
      "var P = " + json.dumps(patches, ensure_ascii=True) + ";\n"
      "var out = [], ok = true, recs = [];\n"
      "P.forEach(function(x) { var si = new GlideRecord('sys_script_include'); si.addQuery('api_name', x.api); si.query();\n"
      "  if (!si.next()) { ok = false; out.push(x.api + ' NOT FOUND'); return; }\n"
      "  var s = si.getValue('script').replace(/\\r\\n/g, '\\n');\n"
      "  if (h(s) === x.workHash) { out.push(x.api + ' already patched'); return; }\n"
      "  if (h(s) !== x.headHash) { ok = false; out.push(x.api + ' LIVE DIFFERS FROM HEAD len=' + s.length); return; }\n"
      "  for (var k = x.hunks.length - 1; k >= 0; k--) { var u = x.hunks[k]; s = s.substr(0, u[0]) + u[2] + s.substr(u[0] + u[1]); }\n"
      "  if (h(s) !== x.workHash) { ok = false; out.push(x.api + ' RESULT HASH MISMATCH'); return; }\n"
      "  recs.push({ si: si, script: s, x: x }); });\n"
      "if (ok) recs.forEach(function(r) { r.si.setValue('script', r.script); r.si.update(); var c = new GlideRecord('sys_script_include'); c.get(r.si.getUniqueValue());"
      " out.push(r.x.api + (h(c.getValue('script').replace(/\\r\\n/g, '\\n')) === r.x.workHash ? ' patched' : ' WRITE CHECK FAILED')); });\n"
      "gs.info('BCFA_PATCH ' + (ok ? 'APPLIED ' : 'NOTHING CHANGED ') + out.join(' | '));\n"
      "})();")
io.open(out, 'w', encoding='utf8', newline='\n').write(sn)
print('bytes', len(sn), ', '.join(p['api'].split('.')[1] + ':' + str(len(p['hunks'])) for p in patches))

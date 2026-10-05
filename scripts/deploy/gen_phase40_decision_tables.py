"""Phase 40: generates scripts/deploy/phase40_decision_tables_bg.js. It reuses
the Phase 15 build machinery (phase15_decision_tables_bg.js: supported
sn_dt Decision Table API only) with the Phase 40 table specs below, then
checks every table through FinancePolicy.
Usage: python scripts/deploy/gen_phase40_decision_tables.py"""
import io, os

HERE = os.path.dirname(os.path.abspath(__file__))
src = io.open(os.path.join(HERE, 'phase15_decision_tables_bg.js'), encoding='utf8').read()
machinery = src[src.index('var out = [];'):src.index('function check(label, actual, expected) {')]
c = src.index('function check(label, actual, expected) {')
check_fn = src[c:src.index('try {', c)]
old = "if (tableId && (REBUILD || questionCount(tableId) === 0)) {"
assert machinery.count(old) == 1
machinery = machinery.replace(old, "if (tableId && (REBUILD || REBUILD_NAMES.indexOf(spec.name) >= 0 || questionCount(tableId) === 0)) {")

header = io.open(os.path.join(HERE, 'specs', 'phase40_decision_table_specs.js'), encoding='utf8').read()
checks = io.open(os.path.join(HERE, 'specs', 'phase40_decision_table_checks.js'), encoding='utf8').read()
dst = os.path.join(HERE, 'phase40_decision_tables_bg.js')
io.open(dst, 'w', encoding='utf8', newline='\n').write(header + '\n' + machinery + check_fn + checks)
print('written', dst)

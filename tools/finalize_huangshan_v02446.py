from pathlib import Path
import subprocess

subprocess.run(['python','tools/build_huangshan_compact.py'],check=True)

idx=Path('index.html')
s=idx.read_text(encoding='utf-8')
if 'V0.24.45' not in s or 'xyt-cache-reset-02445' not in s:
    raise SystemExit('index baseline is not V0.24.45; refusing blind patch')
s=s.replace('02445','02446')
css='  <link rel="stylesheet" href="./battle-huangshan-v02446.css?v=02446" />\n'
css_anchor='  <link rel="stylesheet" href="./battle-wuji-original-v02441.css?v=02446" />\n'
if css not in s:
    if css_anchor not in s: raise SystemExit('Huangshan CSS anchor missing')
    s=s.replace(css_anchor,css_anchor+css,1)
js='  <script type="module" src="./src/v02446-huangshan-compact.js?v=02446"></script>\n'
js_anchor='  <script type="module" src="./src/v02441-wuji-original-ultimate.js?v=02446"></script>\n'
if js not in s:
    if js_anchor not in s: raise SystemExit('Huangshan JS anchor missing')
    s=s.replace(js_anchor,js_anchor+js,1)
idx.write_text(s,encoding='utf-8')

for q in [
    '.github/workflows/v02446-finalize-huangshan.yml',
    '.github/workflows/v02446-install-streaming-huangshan.yml',
    '.v02446-huangshan-file-audit.txt',
    '.v02446-cdn-diagnostic.txt',
    '.v02446-finalize-trigger',
    '.v02446-finalize-log.txt',
]:
    Path(q).unlink(missing_ok=True)

Path('.github/workflows/js-syntax-check.yml').write_text("""name: JS syntax check

on:
  push:
    paths:
      - 'src/**/*.js'
      - '.github/workflows/js-syntax-check.yml'
  workflow_dispatch:

jobs:
  syntax:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Check JavaScript syntax
        shell: bash
        run: |
          set -euo pipefail
          while IFS= read -r -d '' file; do
            echo "Checking $file"
            node --check "$file"
          done < <(find src -type f -name '*.js' -print0)
""",encoding='utf-8')

Path('tools/build_huangshan_compact.py').unlink(missing_ok=True)
Path('tools/finalize_huangshan_v02446.py').unlink(missing_ok=True)

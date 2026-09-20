"""Create a store ZIP from runtime files only, and validate local dependencies."""
import json
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent.parent
manifest = json.loads((ROOT / 'manifest.json').read_text())
files = {'manifest.json', 'newtab.html', 'style.css', 'LICENSE'}
# Deliberately exclude native helpers, tests, docs, local settings and archives.
files.update(p.name for p in ROOT.glob('*.js'))
files.update(str(p.relative_to(ROOT)) for p in (ROOT / 'icons').glob('*') if p.suffix in {'.png', '.svg'})
for package in ('app-i18n', 'app-support'):
    files.update(str(p.relative_to(ROOT)) for p in (ROOT / 'packages' / package).glob('*.js'))
for name in sorted(files):
    if name.endswith('.js'):
        source = (ROOT / name).read_text()
        for relative in re.findall(r'(?:from\s*|import\s*)[\'"](\.[^\'"]+)[\'"]', source):
            resolved = (ROOT / name).parent.joinpath(relative).resolve().relative_to(ROOT)
            assert str(resolved) in files, f'Missing dependency: {name} -> {relative}'
    elif name.endswith('.html'):
        for relative in re.findall(r'(?:src|href)="([^"#]+)"', (ROOT / name).read_text()):
            assert relative in files, f'Missing HTML resource: {relative}'
for icon in manifest['icons'].values():
    assert icon in files
assert manifest['background']['service_worker'] in files
output = ROOT / 'releases' / f'ChromeTabX-{manifest["version"]}-store.zip'
output.parent.mkdir(exist_ok=True)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in sorted(files):
        archive.write(ROOT / name, name)
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert set(archive.namelist()) == files
print(f'{output}\n{len(files)} files; {output.stat().st_size:,} bytes; validated')

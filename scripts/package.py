"""Build a runtime-only .pteroext (ZIP) with a root-level manifest."""
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'extension.json').read_text())
entry = root / manifest['ui']['entry']
if not entry.is_file():
    raise SystemExit('Missing built entry; run npm run build first.')
out = root / 'release' / f"{manifest['id']}-{manifest['version']}.pteroext"
out.parent.mkdir(exist_ok=True)
with ZipFile(out, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
    for name in ['extension.json', 'README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md']:
        archive.write(root / name, name)
    for source in sorted((root / 'dist').rglob('*')):
        if source.is_file() and source.suffix != '.map':
            archive.write(source, source.relative_to(root))
    for name in ['LICENSE', 'ThirdPartyNotices.txt']:
        archive.write(root / 'node_modules' / 'monaco-editor' / name, 'notices/monaco-' + name)
print(f'{out} ({out.stat().st_size:,} bytes)')

download = out.with_suffix('.zip')
with ZipFile(download, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
    archive.write(out, out.name)
    archive.writestr('README.txt', (
        'Thank you for downloading PteroMonaco!\n\n'
        'To install, upload the included .pteroext file in Admin > Extensions,\n'
        'enable PteroMonaco, and reload your browser.\n\n'
        'For support, join our Discord: https://discord.gg/32KvMKFVpU\n'
    ))
print(f'{download} ({download.stat().st_size:,} bytes)')

"""Exporta fonte portável. Nunca inclui .env, .git ou identidade do Site."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parent.parent
output = root / 'dist' / 'mesa-10-netlify.zip'
files = [root / name for name in ['README.md','NETLIFY.md','FONTES.md','PWA.md','CONTRIBUTING.md','SECURITY.md','CHANGELOG.md','package.json','netlify.toml','.env.example','.gitignore','.editorconfig','.gitattributes','.github/workflows/ci.yml','mesa-10.html']]
files += [root / 'dist' / name for name in ['index.html','mesa-10.html','style.css','engine.js','coach.js','cash.js','cash-coach.js','cash-ui.js','cash.css','app.js','pwa.js','pwa.css','manifest.webmanifest','sw.js']]
files += [root / 'dist/icons' / name for name in ['icon.svg','icon-192.png','icon-512.png','maskable-512.png','apple-touch-icon.png']]
for folder in ['netlify','scripts','tests','docs']:
    files += [p for p in (root / folder).rglob('*') if p.is_file() and p.suffix in ['.mjs','.cjs','.js','.py','.md','.jpg'] and not any(part.startswith('__') for part in p.parts)]
with ZipFile(output,'w',ZIP_DEFLATED) as archive:
    for file in sorted(files):
        archive.write(file, 'mesa-10/' + str(file.relative_to(root)))
print(f'{output} ({output.stat().st_size} bytes, {len(files)} arquivos)')

from pathlib import Path
from PIL import Image

base = Path('/home/ubuntu/family-repo-review/50_开发_dev')
source_root = base / 'reports/bangyang_pptx_app_pages/assets/media'
out = base / 'reports/bangyang_pptx_app_pages/loop-strips'
out.mkdir(parents=True, exist_ok=True)

# Measured from 1672 x 941 embedded composite images.
for page in ('page-05', 'page-06', 'page-08'):
    image = Image.open(source_root / page / 'image1.png')
    # Preserve both the process loop and the lower design/benefit strip.
    image.crop((20, 735, 1652, 925)).save(out / f'{page}-bottom-loop.png', optimize=True)
    image.crop((20, 630, 1652, 830)).save(out / f'{page}-ui-to-loop.png', optimize=True)
    print(page)

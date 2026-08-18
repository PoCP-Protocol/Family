from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/family-repo-review/50_开发_dev/apps/web/src/assets/bangyang-reference/home-screen-reference-654x1138.png')
target = Path('/home/ubuntu/family-repo-review/50_开发_dev/apps/web/src/assets/bangyang-reference/home-screen-ui-crop.png')

image = Image.open(source)
# Remove PowerPoint selection handles and keep the reference phone/app canvas.
# Coordinates are measured from the user-supplied 654 x 1138 source image.
app_canvas = image.crop((22, 18, 632, 1120))
app_canvas.save(target, optimize=True)
print(f'{target} {app_canvas.size[0]}x{app_canvas.size[1]}')

from pathlib import Path
from PIL import Image

base = Path('/home/ubuntu/family-repo-review/50_开发_dev')
media = base / 'reports/bangyang_pptx_app_pages/assets/media'
out = base / 'apps/web/public/bangyang-reference/ui18'
out.mkdir(parents=True, exist_ok=True)

# Coordinates were measured against the 1672 x 941 PPT embedded composite images.
# Each crop intentionally retains the original phone frame, status bar, and visual details.
columns = [(27, 266), (300, 540), (577, 817), (848, 1092), (1126, 1370), (1402, 1646)]
sets = {
    'core': ('page-05/image1.png', 136, 800, ['core-01-home', 'core-02-assessment', 'core-03-ai-report', 'core-04-growth-plan', 'core-05-delivery-community', 'core-06-mine-member']),
    'growth': ('page-06/image1.png', 98, 643, ['growth-01-assessment-entry', 'growth-02-ai-report', 'growth-03-daily-task', 'growth-04-child-assistant', 'growth-05-family-ranking', 'growth-06-growth-poster']),
    'commerce': ('page-08/image1.png', 98, 643, ['commerce-01-mall-home', 'commerce-02-product-detail', 'commerce-03-invite', 'commerce-04-group-buy', 'commerce-05-points-task', 'commerce-06-mine-member']),
}

manifest = []
for group, (relative, top, bottom, names) in sets.items():
    source = Image.open(media / relative)
    for index, ((left, right), name) in enumerate(zip(columns, names), start=1):
        crop = source.crop((left, top, right, bottom))
        target = out / f'{name}.png'
        crop.save(target, optimize=True)
        manifest.append(f'{group},{index},{target.name},{crop.width}x{crop.height}\n')

(out / 'manifest.csv').write_text('group,index,file,dimensions\n' + ''.join(manifest), encoding='utf-8')
print(f'Created {len(manifest)} UI crops in {out}')

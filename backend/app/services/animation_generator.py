from pathlib import Path
from PIL import Image

class AnimationGenerator:
    async def generate(self, reference_path: Path):
        image = Image.open(reference_path)
        return [image]

animation_generator = AnimationGenerator()

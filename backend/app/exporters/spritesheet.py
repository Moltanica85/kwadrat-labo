from PIL import Image
from pathlib import Path

class SpriteSheetExporter:
    def export(self, frames, output_dir: Path):
        output_dir.mkdir(parents=True, exist_ok=True)

        if not frames:
            raise ValueError("No frames")

        frame_w, frame_h = frames[0].size

        sheet = Image.new(
            "RGBA",
            (frame_w * len(frames), frame_h)
        )

        for i, frame in enumerate(frames):
            sheet.paste(frame, (i * frame_w, 0))

        out_path = output_dir / "spritesheet.png"
        sheet.save(out_path)

        return out_path

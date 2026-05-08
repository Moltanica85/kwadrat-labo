from PIL import Image, ImageDraw

class PoseRenderer:
    def __init__(self, image_size=(512, 512)):
        self.image_size = image_size

    def draw(self, pose_frame):
        img = Image.new("RGBA", self.image_size, (0,0,0,255))
        draw = ImageDraw.Draw(img)

        for kp in pose_frame.get("keypoints", []):
            x = int(kp[0] * self.image_size[0])
            y = int(kp[1] * self.image_size[1])
            draw.ellipse((x-4,y-4,x+4,y+4), fill=(255,255,255,255))

        return img

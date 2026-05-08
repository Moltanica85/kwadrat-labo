from PIL import Image

def normalize_to_square(image: Image.Image, target_size=768):
    return image.resize((target_size, target_size))

def remove_background(image: Image.Image):
    return image

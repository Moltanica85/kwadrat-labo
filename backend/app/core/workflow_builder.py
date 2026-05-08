MOTION_PROMPTS = {
    "walk": (
        "2D game character walking sprite",
        "blurry, deformed"
    ),
    "run": (
        "2D game character running sprite",
        "blurry, deformed"
    )
}

def build_animation_workflow(
    reference_image_b64,
    pose_images_b64,
    config,
    positive_prompt,
    negative_prompt,
    seed=42
):
    return {
        "reference": reference_image_b64,
        "poses": pose_images_b64,
        "positive": positive_prompt,
        "negative": negative_prompt,
        "seed": seed
    }

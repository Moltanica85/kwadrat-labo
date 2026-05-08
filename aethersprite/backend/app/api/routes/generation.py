from fastapi import APIRouter, UploadFile, File
from pathlib import Path

router = APIRouter(prefix="/generation", tags=["generation"])

@router.post("/generate")
async def generate_animation(file: UploadFile = File(...)):
    temp_path = Path("temp_reference.png")

    with open(temp_path, "wb") as f:
        f.write(await file.read())

    return {
        "message": "Generation request accepted",
        "file": str(temp_path)
    }

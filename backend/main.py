from fastapi import FastAPI
from app.api.routes.generation import router as generation_router

app = FastAPI(title="AetherSprite")

app.include_router(generation_router)

@app.get("/")
async def root():
    return {"status": "running"}

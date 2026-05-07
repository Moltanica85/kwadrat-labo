# kwadrat-labo
t# ✦ AetherSprite

AetherSprite to darmowe, otwartoźródłowe narzędzie oparte na sztucznej inteligencji, pozwalające na generowanie płynnych animacji 2D (np. chód, bieg, atak) na podstawie pojedynczego, statycznego obrazka referencyjnego (sprite'a). Jest to potężna alternatywa dla płatnych narzędzi typu PixelLab.

## 🚀 Funkcje
* **AI Riggowanie i Animacja:** Wykorzystuje modele DWPose, ControlNet OpenPose oraz AnimateDiff do przekształcania płaskich grafik w animacje.
* **Biblioteka Ruchów:** Wbudowane klasyczne cykle animacji (walk, run, idle, attack, jump).
* **Eksporter:** Bezpośredni eksport do formatu Sprite Sheet (PNG + JSON) gotowego do użycia w silnikach Godot i Unity.
* **Interpolacja:** Płynne podnoszenie klatek (FPS) dzięki technologii FILM.
* **Interfejs Node-Based:** Wygodny frontend zbudowany w React Flow i PixiJS.

## 🛠 Stos technologiczny
* **Backend:** Python 3.11, FastAPI, Uvicorn
* **AI Engine:** ComfyUI (headless), PyTorch, ControlNet, DWPose, AnimateDiff
* **Frontend:** React, TypeScript, Zustand, React Flow, PixiJS
* **Środowisko:** Docker (obsługa CUDA)

## 📦 Uruchomienie (Docker)

Wymagane jest wsparcie dla NVIDIA GPU (CUDA).

```bash
git clone [https://github.com/TWOJA_NAZWA/aethersprite.git](https://github.com/TWOJA_NAZWA/aethersprite.git)
cd aethersprite
docker compose up --build

# Digital Threads of Tradition — Flask Backend

A modular Flask API serving the AI virtual try-on pipeline.
Currently ships with a **mock inference** that simulates latency and
returns the input person image as a base64 PNG, so the frontend can
demo end-to-end without a GPU. Swap `services/tryon_service.py` with
your StableVITON inference call when ready.

## Structure
```
backend/
├── app.py                  # Flask entrypoint + CORS
├── requirements.txt
├── routes/
│   └── tryon_routes.py     # POST /tryon
└── services/
    └── tryon_service.py    # Mock inference (replace with StableVITON)
```

## Run
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
# → http://localhost:5000
```

## Wire to frontend
Create a `.env` at the project root:
```
VITE_TRYON_ENDPOINT=http://localhost:5000/tryon
```
The Try-On page will automatically POST `multipart/form-data`
with fields `person` and `garment` and expect:
```json
{ "image_base64": "data:image/png;base64,..." }
```

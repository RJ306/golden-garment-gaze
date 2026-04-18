"""
/tryon route — accepts a person and garment image, returns a try-on result.

Validation is intentionally strict to match the frontend's expectations.
"""

from flask import Blueprint, jsonify, request

from services.tryon_service import run_tryon

tryon_bp = Blueprint("tryon", __name__)

ALLOWED = {"image/png", "image/jpeg", "image/webp"}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@tryon_bp.post("/tryon")
def tryon():
    person = request.files.get("person")
    garment = request.files.get("garment")

    if not person or not garment:
        return jsonify({"error": "Both 'person' and 'garment' files are required."}), 400

    for f in (person, garment):
        if f.mimetype not in ALLOWED:
            return jsonify({"error": f"Unsupported type: {f.mimetype}"}), 415
        f.stream.seek(0, 2)  # to end
        if f.stream.tell() > MAX_BYTES:
            return jsonify({"error": "File too large (max 10MB)."}), 413
        f.stream.seek(0)

    try:
        image_b64 = run_tryon(person.read(), garment.read())
        return jsonify({"image_base64": image_b64})
    except Exception as exc:  # pragma: no cover
        return jsonify({"error": f"Inference failed: {exc}"}), 500

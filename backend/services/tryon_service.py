"""
Mock try-on service.

For the FYP demo we simulate inference latency and simply return the
person image re-encoded as a base64 PNG. When the real StableVITON
checkpoint is integrated, swap `run_tryon` with the genuine call:

    from inference.stableviton import StableVITONInference
    _model = StableVITONInference(checkpoint="weights/stableviton.ckpt")
    def run_tryon(person_bytes, garment_bytes):
        return _model.infer(person_bytes, garment_bytes)  # returns base64
"""

import base64
import io
import time

from PIL import Image


def run_tryon(person_bytes: bytes, garment_bytes: bytes) -> str:
    """Simulate AI inference and return a base64-encoded PNG data URL."""
    # Simulate model latency so the frontend's loading shimmer is visible.
    time.sleep(2.4)

    # Read the person image and round-trip it to PNG.
    img = Image.open(io.BytesIO(person_bytes)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"

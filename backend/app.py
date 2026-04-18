"""
Digital Threads of Tradition — Flask API entrypoint.

Boots a small Flask app, enables CORS for the React frontend,
and registers the /tryon blueprint.
"""

from flask import Flask, jsonify
from flask_cors import CORS

from routes.tryon_routes import tryon_bp


def create_app() -> Flask:
    app = Flask(__name__)
    # Allow the Vite dev server (and any frontend) to call us during dev.
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register feature blueprints
    app.register_blueprint(tryon_bp)

    @app.get("/")
    def health():
        return jsonify({"status": "ok", "service": "digital-threads-tryon"})

    return app


if __name__ == "__main__":
    app = create_app()
    # Host 0.0.0.0 so the API is reachable from a containerized frontend too.
    app.run(host="0.0.0.0", port=5000, debug=True)

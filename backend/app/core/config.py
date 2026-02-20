from pathlib import Path

# Base directory: backend/
BASE_DIR = Path(__file__).resolve().parents[2]

# App info
APP_NAME = "GatorMind API"
ENVIRONMENT = "development"

# Paths used by the backend
DATA_DIR = BASE_DIR / "data"
ONNX_MODELS_DIR = BASE_DIR / "ONNX_models"
ACTIVATION_CACHE_DIR = BASE_DIR / "activation_cache"

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.model_utils.activation_reader import list_models, list_cluster_path_sets, load_metadata
from backend.model_utils.activation_reader import load_centroids
from backend.model_utils.activation_reader import load_example_path
from backend.model_utils.activation_reader import load_example_paths
import base64
from io import BytesIO
from backend.model_utils.image_extractor import ImageExtractor
from backend.app.db.connection import get_collection
from datetime import datetime
import hashlib
import secrets
from pymongo.errors import DuplicateKeyError

def pil_to_base64(img):
    """
    Convert a PIL Image object into a base64-encoded JPEG string.

    This is used so images can be returned directly inside JSON responses
    from the API. The frontend can then decode the base64 string and render
    the image without needing a separate static file server.

    Steps:
    1. Create an in-memory buffer (BytesIO) to avoid writing to disk.
    2. Save the PIL image into the buffer as a JPEG.
    3. Read the raw bytes from the buffer.
    4. Base64-encode those bytes and convert them to a UTF-8 string.
    """
    buffer = BytesIO()                 # In-memory byte buffer
    img.save(buffer, format="JPEG")    # Write image data into buffer
    return base64.b64encode(           # Encode raw bytes → base64
        buffer.getvalue()
    ).decode("utf-8")                  # Convert bytes → string for JSON


router = APIRouter()


class SignUpRequest(BaseModel):
    email: str
    password: str


class SignInRequest(BaseModel):
    email: str
    password: str

"""Initialize a global ImageExtractor used by the image API routes.

This loads:
- the CelebA image directory
- the cluster-path assignments (paths.json)
- the model metadata (layer order, etc.)

Creating it once at startup avoids reloading these files on every request.
"""
extractor = ImageExtractor(
    celeba_root="C:/Users/mikes/.cache/torch/datasets/celeba/img_align_celeba",
    paths_file="activation_cache/CelebA/set_01/paths.json",
    metadata_file="activation_cache/CelebA/metadata.json"
)


def _hash_password(password: str, salt: str) -> str:
    """Return a salted SHA-256 hash for the given password."""
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()


@router.post("/auth/signup")
def sign_up(payload: SignUpRequest):
    """Create a new user account in MongoDB with email and password.

    - Stores a salted SHA-256 hash of the password (never the raw password).
    - Enforces unique email addresses.
    """

    users = get_collection("users")
    # Ensure there is a unique index on email (safe to call multiple times)
    users.create_index("email", unique=True)

    email_normalized = payload.email.lower()
    salt = secrets.token_hex(16)
    password_hash = _hash_password(payload.password, salt)

    try:
        users.insert_one(
            {
                "email": email_normalized,
                "password_hash": password_hash,
                "salt": salt,
                "created_at": datetime.utcnow(),
            }
        )
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Account already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Account created"}


@router.post("/auth/signin")
def sign_in(payload: SignInRequest):
    """Validate user credentials against MongoDB.

    On success, returns a friendly message used by the frontend.
    On failure (no such account or wrong password), returns 404 with
    detail "account not found" so the frontend can display the
    required prompt.
    """

    users = get_collection("users")
    email_normalized = payload.email.lower()

    user = users.find_one({"email": email_normalized})
    if not user:
        raise HTTPException(status_code=404, detail="account not found")

    salt = user.get("salt", "")
    expected_hash = user.get("password_hash", "")
    if not salt or not expected_hash:
        # Corrupt or legacy record; treat as not found for security.
        raise HTTPException(status_code=404, detail="account not found")

    if _hash_password(payload.password, salt) != expected_hash:
        raise HTTPException(status_code=404, detail="account not found")

    return {"message": "sign in successfully"}

@router.get("/images/example/{example_id}")
def get_image_by_example(example_id: int):
    """
    Return a single CelebA image (base64‑encoded) for the given example ID.
    """
    try:
        img = extractor.get_image_by_id(example_id)
        encoded = pil_to_base64(img)
        return {"example_id": example_id, "image_base64": encoded}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Image not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/images/cluster/{layer_name}/{cluster_id}")
def get_images_for_cluster(layer_name: str, cluster_id: int, limit: int = 20):
    """
    Return base64‑encoded images belonging to a specific cluster
    within a given layer (e.g., conv3 → cluster 2).
    """
    try:
        imgs = extractor.get_images_for_cluster(layer_name, cluster_id, limit=limit)
        encoded = [pil_to_base64(img) for img in imgs]
        return {
            "layer": layer_name,
            "cluster_id": cluster_id,
            "limit": limit,
            "images": encoded
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/images/path")
def get_images_for_path(payload: dict):
    """
    Return base64‑encoded images that follow a full cluster‑path
    sequence across all layers (e.g., [2, 0, 4]).
    """
    try:
        path = payload.get("path")
        limit = payload.get("limit", 20)

        if not isinstance(path, list):
            raise HTTPException(status_code=400, detail="Path must be a list")

        imgs = extractor.get_images_for_path(path, limit=limit)
        encoded = [pil_to_base64(img) for img in imgs]

        return {
            "path": path,
            "limit": limit,
            "images": encoded
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health():
    """
    Health check endpoint.

    Used to verify that the backend server is running.
    """
    return {"status": "ok"}


@router.get("/models")
def get_models():
    """
    Returns a list of available model names found in activation_cache/.

    """
    try: 
        return {"models": list_models()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/models/{model_name}/sets")
def get_sets(model_name: str):
    """
    returns available cluster-path sets for a given model
    """
    try:
        sets = list_cluster_path_sets(model_name)
        return {"model": model_name, "sets": sets}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/models/{model_name}/metadata")
def get_metadata(model_name: str):
    """
    returns metadata for a given model
    """
    try:
        metadata = load_metadata(model_name)
        return {"model": model_name, "metadata": metadata}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/{model_name}/sets/{set_name}/centroids")
def get_centroids(model_name: str, set_name: str):
    """
    Returns centroids for a given model + set.

    """
    try:
        centroids = load_centroids(model_name, set_name)
        return {
            "model": model_name, 
            "set": set_name,
            "centroids": centroids

            }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model or set not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/models/{model_name}/sets/{set_name}/paths/{example_id}")
def get_single_path(model_name: str, set_name: str, example_id: str):
    """
    Returns the cluster-path sequence for one example_id.
    Example: [1,0,2,4,3]
    """
    try:
        path = load_example_path(model_name, set_name, example_id)
        if path is None:
            raise HTTPException(status_code=404, detail="Example not found")

        return {
            "model": model_name,
            "set": set_name,
            "example_id": example_id,
            "path": path
        }

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model or set not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/models/{model_name}/sets/{set_name}/paths")
def get_paths_preview(model_name: str, set_name: str, limit: int = 50, offset: int = 0):
    """
    Returns a slice of paths.json so the frontend doesn't load the entire file.
    limit: how many examples to return
    offset: how many to skip
    """
    try:
        paths = load_example_paths(model_name, set_name)  # big dict

        keys = list(paths.keys())
        total = len(keys)

        # clamp
        if limit < 1:
            limit = 1
        if limit > 200:
            limit = 200
        if offset < 0:
            offset = 0

        sliced_keys = keys[offset: offset + limit]
        sliced = {k: paths[k] for k in sliced_keys}

        return {
            "model": model_name,
            "set": set_name,
            "total": total,
            "limit": limit,
            "offset": offset,
            "paths": sliced
        }

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model or set not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
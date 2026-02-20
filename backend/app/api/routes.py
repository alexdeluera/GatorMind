from fastapi import APIRouter, HTTPException
from backend.model_utils.activation_reader import list_models, list_cluster_path_sets, load_metadata
from backend.model_utils.activation_reader import load_centroids
from backend.model_utils.activation_reader import load_example_path
from backend.model_utils.activation_reader import load_example_paths


router = APIRouter()

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
"""
activation_reader.py

Utility functions for reading precomputed activation data from the
activation_cache/ directory. These functions DO NOT run the model or
compute activations — they simply load files produced by the
activation extraction pipeline.

These utilities will be used by backend API routes to expose:
- available models
- available cluster path sets
- centroids
- example → path mappings
- metadata
"""

from pathlib import Path
import numpy as np
import json
import os

# Base directory where all extracted activation data is stored
BASE_DIR = Path(__file__).resolve().parents[2] / "activation_cache"

# Returns a list of model names by scanning the top-level folders inside activation_cache/.
def list_models():
    return [d.name for d in BASE_DIR.iterdir() if d.is_dir()]


# Returns all cluster-path set folders for a given model. Example: ["set_01", "set_02"]
def list_cluster_path_sets(model_name: str):
    model_dir = BASE_DIR / model_name

    sets = []
    for name in os.listdir(model_dir):
        full = model_dir / name
        if full.is_dir() and name.startswith("set_"):
            sets.append(name)

    return sets



# Loads the centroids.npy file for a specific cluster-path set.
# Returns a NumPy array.
def load_centroids(model_name: str, set_name: str):
    path = BASE_DIR / model_name / set_name / "centroids.json"
    with open(path) as f:
        return json.load(f)

# Loads paths.json, which maps each example ID to its cluster-path sequence.
# Returns a dict: { "example_0001": [3,1,4,2], ... }
def load_example_paths(model_name: str, set_name: str):
    path = BASE_DIR / model_name / set_name / "paths.json"
    with open(path) as f:
        return json.load(f)

# Returns the cluster-path sequence for a single example.
# Example: [3,1,4,2]
def load_example_path(model_name: str, set_name: str, example_id: str):

    paths = load_example_paths(model_name, set_name)
    return paths.get(example_id)

#Loads mode l-level metadata (labels, image IDs, etc.) from metadata.json.
def load_metadata(model_name: str):
    path = BASE_DIR / model_name / "metadata.json"
    with open(path) as f:
        return json.load(f)
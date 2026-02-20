"""
Quick test script for activation_reader.py

This script verifies that the reader utilities can:
- detect models
- detect cluster path sets
- load centroids
- load example → path mappings
- load metadata

Run this file from the project root with:
    python -m backend.tests.test_reader
"""

from backend.model_utils.activation_reader import (
    list_models,
    list_cluster_path_sets,
    load_centroids,
    load_example_paths,
    load_example_path,
    load_metadata,
)

def main():
    print("\n=== Testing activation_reader utilities ===\n")

    # 1. List models
    print("Available models:")
    models = list_models()
    print(models)

    if not models:
        print("\nNo models found in activation_cache/. Add a dummy folder to test.\n")
        return

    model = models[0]
    print(f"\nUsing model: {model}")

    # 2. List cluster path sets
    print("\nCluster path sets:")
    sets = list_cluster_path_sets(model)
    print(sets)

    if not sets:
        print("\nNo cluster path sets found. Add a dummy set folder to test.\n")
        return

    set_name = sets[0]
    print(f"\nUsing cluster path set: {set_name}")

    # 3. Load centroids (JSON now)
    try:
        centroids = load_centroids(model, set_name)
        print("\nCentroids loaded successfully.")
        print("Keys:", list(centroids.keys()))
    except Exception as e:
        print("\nFailed to load centroids:", e)

    # 4. Load example paths
    try:
        example_paths = load_example_paths(model, set_name)
        print("\nExample paths loaded successfully.")
        print("Keys:", list(example_paths.keys())[:5])
    except Exception as e:
        print("\nFailed to load example paths:", e)
        return

    # 5. Load a single example path
    if example_paths:
        example_id = list(example_paths.keys())[0]
        try:
            path = load_example_path(model, set_name, example_id)
            print(f"\nPath for {example_id}: {path}")
        except Exception as e:
            print("\nFailed to load single example path:", e)

    # 6. Load metadata
    try:
        metadata = load_metadata(model)
        print("\nMetadata loaded successfully.")
        print("Keys:", list(metadata.keys()))
    except Exception as e:
        print("\nFailed to load metadata:", e)

    print("\n=== Test complete ===\n")


if __name__ == "__main__":
    main()
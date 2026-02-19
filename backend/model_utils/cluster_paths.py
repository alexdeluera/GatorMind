import os
import json
import numpy as np
from pathlib import Path
from sklearn.cluster import MiniBatchKMeans
from tqdm import tqdm


def iter_activation_batches(layer_dir, batch_size=256):
    """
    Generator that yields batches of FLATTENED activations.
    Ensures each activation is reshaped to 1D.
    """
    files = sorted([f for f in os.listdir(layer_dir) if f.endswith(".npy")])
    batch = []
    batch_ids = []

    for fname in files:
        idx = int(fname.replace(".npy", ""))
        arr = np.load(os.path.join(layer_dir, fname)).reshape(-1)  # <-- flatten here

        batch.append(arr)
        batch_ids.append(idx)

        if len(batch) == batch_size:
            yield np.stack(batch), batch_ids
            batch = []
            batch_ids = []

    if batch:
        yield np.stack(batch), batch_ids


def compute_clusters_streaming(layer_dir, k=5, batch_size=256):
    print("  Initializing MiniBatchKMeans...")
    kmeans = MiniBatchKMeans(
        n_clusters=k,
        random_state=0,
        batch_size=batch_size,
        max_iter=100
    )

    # First pass: partial_fit
    print("  First pass: partial_fit on batches...")
    for batch, _ in tqdm(iter_activation_batches(layer_dir, batch_size), desc="  partial_fit"):
        kmeans.partial_fit(batch)

    # Second pass: predict labels
    print("  Second pass: predicting labels...")
    labels_dict = {}

    for batch, batch_ids in tqdm(iter_activation_batches(layer_dir, batch_size), desc="  predict"):
        preds = kmeans.predict(batch)
        for ex_id, label in zip(batch_ids, preds):
            labels_dict[str(ex_id)] = int(label)

    return labels_dict, kmeans.cluster_centers_


def generate_cluster_paths(model_dir, k=5, set_name="set_01"):
    """
    Main pipeline:
    - Detect layers
    - Stream activations
    - Run MiniBatchKMeans per layer
    - Build cluster paths
    - Save centroids + paths.json + metadata.json
    """

    model_dir = Path(model_dir)
    layer_dirs = [d for d in model_dir.iterdir() if d.is_dir() and d.name not in ["set_01", "set_02"]]

    # Sort layers for consistent ordering
    layer_dirs = sorted(layer_dirs, key=lambda p: p.name)

    print(f"Detected layers: {[d.name for d in layer_dirs]}")

    all_centroids = {}
    layer_assignments = {}

    # -----------------------------
    # Process each layer
    # -----------------------------
    for layer_dir in layer_dirs:
        print(f"\nProcessing layer: {layer_dir.name}")

        labels_dict, centroids = compute_clusters_streaming(layer_dir, k=k, batch_size=256)

        all_centroids[layer_dir.name] = centroids.tolist()
        layer_assignments[layer_dir.name] = labels_dict

    # -----------------------------
    # Build cluster paths per example
    # -----------------------------
    print("\nBuilding cluster paths...")

    example_ids = sorted([int(e) for e in layer_assignments[layer_dirs[0].name].keys()])
    paths = {}

    for ex_id in example_ids:
        path = []
        for layer_dir in layer_dirs:
            layer_name = layer_dir.name
            path.append(layer_assignments[layer_name][str(ex_id)])
        paths[f"example_{ex_id:04d}"] = path

    # -----------------------------
    # Save output
    # -----------------------------
    output_dir = model_dir / set_name
    output_dir.mkdir(exist_ok=True)

    # Save centroids
    with open(output_dir / "centroids.json", "w") as f:
        json.dump(all_centroids, f, indent=2)

    # Save paths.json
    with open(output_dir / "paths.json", "w") as f:
        json.dump(paths, f, indent=2)

    # Save metadata.json
    metadata = {
        "num_examples": len(example_ids),
        "layers": [d.name for d in layer_dirs],
        "k": k
    }
    with open(model_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nCluster paths saved to: {output_dir}")
    print("Metadata saved to:", model_dir / "metadata.json")


# -----------------------------
# CLI entry point
# -----------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Cluster-path generator")
    parser.add_argument("--input", type=str, required=True,
                        help="Path to activation_cache/<model_name>/")
    parser.add_argument("--k", type=int, default=5,
                        help="Number of clusters per layer")
    parser.add_argument("--set", type=str, default="set_01",
                        help="Name of the cluster-path set")

    args = parser.parse_args()

    generate_cluster_paths(args.input, k=args.k, set_name=args.set)
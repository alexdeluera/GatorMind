import os
import numpy as np
from tqdm import tqdm
from PIL import Image

from backend.model_utils.activation_extractor import ActivationExtractor


def batch_extract(
    dataset,
    model_path,
    output_dir,
    extractor_class=ActivationExtractor,
    image_size=(64, 64),
):
    """
    Generic batch activation extraction pipeline.
    Works with ANY dataset that returns (image, label).

    Args:
        dataset: PyTorch-style dataset returning (image, label)
        model_path: Path to ONNX model (instrumented)
        output_dir: Directory to save activations
        extractor_class: Activation extractor class to use
        image_size: Expected input size for the ONNX model
    """

    # -----------------------------
    # Prepare output directories
    # -----------------------------
    os.makedirs(output_dir, exist_ok=True)

    # Initialize extractor
    extractor = extractor_class(model_path)

    # Get layer names from extractor
    layer_names = list(extractor.activation_nodes.keys())

    # Create subfolders for each layer
    for layer in layer_names:
        os.makedirs(os.path.join(output_dir, layer), exist_ok=True)

    labels = []
    image_ids = []

    # -----------------------------
    # Extraction loop
    # -----------------------------
    for idx in tqdm(range(len(dataset)), desc="Extracting activations"):
        img, label = dataset[idx]

        # Save metadata
        labels.append(label)
        image_ids.append(idx)

        # Convert tensor → numpy → HWC → PIL
        np_img = img.numpy().transpose(1, 2, 0) * 255
        np_img = np_img.astype(np.uint8)
        pil_img = Image.fromarray(np_img).resize(image_size)

        # Ensure temp directory exists
        temp_dir = "activation_cache/temp"
        os.makedirs(temp_dir, exist_ok=True)

        # Save temporary image for extractor
        temp_path = os.path.join(temp_dir, "temp_img.jpg")
        pil_img.save(temp_path)

        # Extract activations
        acts = extractor.extract(temp_path)

        # Save each layer's activation
        for layer_name in layer_names:
            np.save(
                os.path.join(output_dir, layer_name, f"{idx}.npy"),
                acts[layer_name],
            )

    # Save metadata
    np.save(os.path.join(output_dir, "labels.npy"), np.array(labels))
    np.save(os.path.join(output_dir, "image_ids.npy"), np.array(image_ids))

    print(f"Done! Activations saved to: {output_dir}")


# -----------------------------
# Driver section (CelebA only loaded currently)
# -----------------------------
if __name__ == "__main__":
    from backend.model_utils.datasets.CelebA_loader import load_CelebA

    dataset = load_CelebA(split="train")

    # Take only the first 5 images for testing
    subset = [dataset[i] for i in range(5)]

    batch_extract(
        dataset=subset,   # <-- Use the subset here
        model_path="ONNX_models/CelebA_CNN_instrumented.onnx",
        output_dir="activation_cache/CelebA_test_subset/"
    )

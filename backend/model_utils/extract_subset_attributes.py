"""
extract_subset_attributes.py

This script generates a clean JSON file containing attribute labels
for ONLY the subset of images used by your model (e.g., the 5k CelebA subset).

It is written in a modular way so that:
- CelebA support works immediately
- Adding new datasets later only requires adding:
    1) a dataset-specific attribute loader
    2) a dataset-specific filename formatter

No other parts of the script need to change.
"""

import json
import numpy as np
import os

# ---------------------------------------------------------------------
# DATASET-SPECIFIC FUNCTIONS (CelebA)
# ---------------------------------------------------------------------

def load_celeba_attributes(attr_file):
    """
    Loads the full CelebA attribute file (list_attr_celeba.txt).

    Returns:
        dict: { "000123.jpg": { "Blond_Hair": 1, "Male": 0, ... }, ... }
    """
    with open(attr_file, "r") as f:
        lines = f.readlines()

    num_images = int(lines[0].strip())
    attr_names = lines[1].strip().split()

    attributes = {}
    for line in lines[2:]:
        parts = line.strip().split()
        filename = parts[0]  # e.g., 000123.jpg
        values = list(map(int, parts[1:]))
        attributes[filename] = dict(zip(attr_names, values))

    return attributes


def format_celeba_filename(img_id):
    """
    Converts a numeric image ID (e.g., 123) into a CelebA filename (000123.jpg).
    """
    return f"{img_id:06d}.jpg"


# ---------------------------------------------------------------------
# UNIVERSAL SUBSET FILTERING LOGIC
# ---------------------------------------------------------------------

def filter_subset_attributes(full_attrs, subset_ids, filename_formatter):
    """
    Filters the full attribute dictionary down to only the subset of images.

    Args:
        full_attrs (dict): full dataset attributes
        subset_ids (list[int]): list of image IDs used by the model
        filename_formatter (callable): function mapping ID -> filename

    Returns:
        dict: { image_id: {attr_name: value, ...}, ... }
    """
    subset_attrs = {}

    for img_id in subset_ids:
        filename = filename_formatter(img_id)
        if filename in full_attrs:
            subset_attrs[img_id] = full_attrs[filename]
        else:
            print(f"WARNING: {filename} not found in attribute file")

    return subset_attrs


# ---------------------------------------------------------------------
# MAIN EXECUTION LOGIC
# ---------------------------------------------------------------------

def main():
    # Hardcoded CelebA paths for now
    ATTR_FILE = "../../data/celeba/list_attr_celeba.txt"
    IMAGE_IDS_FILE = "../../activation_cache/CelebA/image_ids.npy"
    OUTPUT_FILE = "../../activation_cache/CelebA/subset_attributes.json"

    print("Loading subset image IDs...")
    subset_ids = np.load(IMAGE_IDS_FILE).tolist()

    print("Loading full CelebA attributes...")
    full_attrs = load_celeba_attributes(ATTR_FILE)

    print("Filtering to subset...")
    subset_attrs = filter_subset_attributes(
        full_attrs,
        subset_ids,
        filename_formatter=format_celeba_filename
    )

    print(f"Saving subset attributes to {OUTPUT_FILE}...")
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, "w") as f:
        json.dump(subset_attrs, f, indent=2)

    print("Done! Subset attribute file created.")


if __name__ == "__main__":
    main()
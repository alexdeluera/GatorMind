import os
import json
import shutil
import numpy as np

# -----------------------------
# CONFIG — UPDATE THESE PATHS
# -----------------------------

# Full CelebA dataset (your local path)
FULL_DATASET_DIR = r"C:\Users\mikes\Documents\CIS 4914 - Senior Design\data\celeba\img_align_celeba"

# Project root: GatorMind/GatorMind
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

# CelebA activation cache root
CELEBA_ROOT = os.path.join(PROJECT_ROOT, "activation_cache", "CelebA")

# Subset activation cache (created by batch_extract.py)
IMAGE_IDS_PATH = os.path.join(CELEBA_ROOT, "image_ids.npy")

# Output folder for subset images
OUTPUT_DIR = os.path.join(CELEBA_ROOT, "images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -----------------------------
# LOAD SUBSET IMAGE IDS
# -----------------------------
image_ids = np.load(IMAGE_IDS_PATH).tolist()
print(f"Loaded {len(image_ids)} subset example IDs")

# -----------------------------
# COPY IMAGES
# -----------------------------
copied = 0
missing = 0

for example_id in image_ids:
    # CelebA filenames are 1-indexed
    filename = f"{example_id + 1:06d}.jpg"

    src = os.path.join(FULL_DATASET_DIR, filename)
    dst = os.path.join(OUTPUT_DIR, filename)

    if os.path.exists(src):
        shutil.copy(src, dst)
        copied += 1
    else:
        missing += 1

print(f"Copied: {copied}")
print(f"Missing: {missing}")
print(f"Subset stored in: {OUTPUT_DIR}")
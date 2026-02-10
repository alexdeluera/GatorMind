
# GatorMind

---

# Environment Setup (for Activation Extraction Pipeline)

This environment is used to run ONNX models, load datasets, and extract intermediate activations for downstream clustering and visualization.

---

## 1. Create the Conda environment

```bash
conda create -n clusterpaths python=3.11
conda activate clusterpaths
```

---

## 2. Install required Python packages

Install ONNX Runtime (CPU):

```bash
pip install onnxruntime
```

Install PyTorch and torchvision (CPU‑only):

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

Install supporting libraries:

```bash
pip install numpy pillow tqdm
```

Optional:

```bash
pip install matplotlib
```

---

## 3. Verify ONNX Runtime

```python
import onnxruntime as ort
print(ort.get_device())
```

Expected:

```
CPU
```

---

## 4. ONNX model location

The instrumented ONNX model must be located at:

```
ONNX_models/CelebA_CNN_instrumented.onnx
```

No training notebooks or `.pth` files are required.

---

## 5. Dataset setup

The CelebA loader automatically downloads the dataset into:

```
backend/data/celeba/
```

This folder is ignored by Git.

---

## 6. Run the subset extraction test

From the project root:

```bash
python -m backend.model_utils.batch_extract --subset 5
```

This confirms:

- ONNX model loads  
- CelebA downloads  
- Activations extract correctly  
- Output directory structure is correct  

---

## 7. Run full extraction (optional)

```bash
python batch_extract.py
```

This populates:

```
backend/activation_cache/CelebA_train/
```

---

# Activation Extraction Pipeline (Backend)

This subsystem generates intermediate neural network activations from ONNX models. These activations support clustering, centroid computation, and cluster‑path visualization.

---

## Overview

The pipeline:

- Loads an ONNX model  
- Loads a dataset (CelebA)  
- Runs inference on each image  
- Extracts intermediate activations  
- Saves activations in a structured directory  
- Produces metadata (`labels.npy`, `image_ids.npy`)  

The system is model‑agnostic and dataset‑agnostic as long as the ONNX model exposes intermediate outputs.

---

## Folder Structure

```
backend/
    model_utils/
        activation_extractor.py
        batch_extract.py
        add_intermediate_outputs.py
        inspect_onnx_nodes.py
        datasets/
            __init__.py
            CelebA_loader.py
    ONNX_models/
        CelebA_CNN_instrumented.onnx
        CelebA_CNN.onnx
    activation_cache/
        .gitignore
    data/
        .gitignore
```

---

## Running a Subset Extraction (Quick Test)

```bash
python batch_extract.py --dataset celeba --subset 5

Note: Always run the extraction script using the module form:

    python -m backend.model_utils.batch_extract --subset 5

Running the script directly (e.g., python batch_extract.py) will cause
Python to lose the package context and result in import errors.

```

Output structure:

```
activation_cache/CelebA_test_subset/
    conv1/
    conv2/
    conv3/
    fc1/
    fc2/
    labels.npy
    image_ids.npy
```

---

## Running Full Extraction

```bash
cd backend/model_utils
python batch_extract.py --dataset celeba
```

Creates:

```
activation_cache/CelebA_train/
    conv1/
    conv2/
    conv3/
    fc1/
    fc2/
    labels.npy
    image_ids.npy
```

---

## Activation Cache Format

Each layer folder contains one `.npy` file per image:

```
conv1/
    0.npy
    1.npy
    ...
```

Expected activation shapes:

| Layer | Shape |
|-------|--------|
| conv1 | (1, 16, 64, 64) |
| conv2 | (1, 32, 32, 32) |
| conv3 | (1, 64, 16, 16) |
| fc1   | (1, 128) |
| fc2   | (1, 64) |

Metadata:

- `labels.npy` — class labels  
- `image_ids.npy` — dataset indices  

---

## How Backend Uses This

The activation cache is used for:

- k‑means clustering  
- centroid computation  
- cluster assignment  
- cluster‑path generation  
- caching for frontend visualization  

Each layer is processed independently.

---

## Developer Notes

- Do not commit datasets (`data/.gitignore`).  
- Do not commit activation outputs (`activation_cache/.gitignore`).  
- ONNX models are safe to commit.  
- PyTorch `.pth` files should not be committed.  
- New datasets can be added under `model_utils/datasets/`.  

---

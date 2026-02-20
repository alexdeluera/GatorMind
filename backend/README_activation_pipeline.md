# GatorMind — Backend

This backend powers the activation‑extraction and clustering pipeline used to generate interpretable cluster‑path data for neural network models. These precomputed artifacts will later be served through FastAPI for visualization in the dashboard.

---

# Environment Setup

This environment is used for:

- Running ONNX models  
- Extracting intermediate activations  
- Streaming MiniBatchKMeans clustering  
- Generating centroids, cluster paths, and metadata  

---

## 1. Create and activate the Conda environment

```bash
conda create -n clusterpaths python=3.11
conda activate clusterpaths
```

---

## 2. Install required packages

### ONNX Runtime (CPU)

```bash
pip install onnxruntime
```

### PyTorch (CPU‑only)

```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### Supporting libraries

```bash
pip install numpy pillow tqdm scikit-learn
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

# Activation Extraction Pipeline

The extraction pipeline loads an ONNX model, runs inference on the CelebA dataset, and saves intermediate activations in a structured directory for downstream clustering.

### ONNX model location

Place the instrumented ONNX model here:

```
ONNX_models/CelebA_CNN_instrumented.onnx
```

---

# Dataset Setup

The CelebA loader automatically downloads the dataset into:

```
backend/data/celeba/
```

This directory is ignored by Git.

---

# Running Extraction

### Quick subset test (recommended)

```bash
python -m backend.model_utils.batch_extract --subset 5
```

This verifies:

- ONNX model loads  
- CelebA downloads  
- Activations extract correctly  
- Output directory structure is valid  

### Full extraction

```bash
python -m backend.model_utils.batch_extract
```

Outputs to:

```
backend/activation_cache/CelebA/
    conv1/
    conv2/
    conv3/
    fc1/
    fc2/
```

Each folder contains one `.npy` activation file per image.

---

# Clustering Pipeline (Updated)

The clustering step now uses **streaming MiniBatchKMeans**, allowing full CelebA clustering on limited RAM.

Run clustering:

```bash
python -m backend.model_utils.cluster_paths --input activation_cache/CelebA/
```

This generates:

```
activation_cache/CelebA/set_01/
    centroids.json
    paths.json

activation_cache/CelebA/metadata.json
```

These files contain everything needed for backend API endpoints and frontend visualization.

---

# Activation Cache Format

### Per‑layer activations

```
conv1/
    0.npy
    1.npy
    ...
```

### Cluster outputs

- `set_01/centroids.json` — cluster centroids per layer  
- `set_01/paths.json` — cluster path for each example  
- `metadata.json` — layer names, number of examples, cluster count  

---

# Developer Notes

- **Do not commit datasets** (`data/` is git‑ignored).  
- **Do not commit activation outputs or cluster sets** (`activation_cache/` is git‑ignored).  
- ONNX models *may* be committed.  
- PyTorch `.pth` files should not be committed.  
- New datasets can be added under `model_utils/datasets/`.  
- The clustering pipeline is now fully streaming and memory‑safe.  

---

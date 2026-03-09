import os
from torchvision.datasets import CelebA
from torchvision import transforms


def load_CelebA(
    root=None,
    split="train",
    image_size=(64, 64),
    download=True
):
    transform = transforms.Compose([
        transforms.Resize(image_size),
        transforms.ToTensor(),
    ])

    # If no root is provided, use TorchVision's default cache directory
    if root is None:
        root = os.path.expanduser("~/.cache/torch/datasets")

    dataset = CelebA(
        root=root,
        split=split,
        transform=transform,
        download=download
    )

    return dataset


    """
    Loads the CelebA dataset with the same transforms used during training.

    Args:
        root (str): Directory where CelebA is stored or will be downloaded.
        split (str): "train", "valid", or "test".
        image_size (tuple): Expected input size for the ONNX model.
        download (bool): Whether to download CelebA if missing.

    Returns:
        dataset: A PyTorch-style dataset returning (image_tensor, label)
    """

    transform = transforms.Compose([
        transforms.Resize(image_size),
        transforms.ToTensor(),
    ])

    dataset = CelebA(
        root=root,
        split=split,
        transform=transform,
        download=download
    )

    return dataset
import torch
from torchvision.datasets import CIFAR10
from torchvision import transforms


def load_catdog(split="train"):
    """
    Loads CIFAR-10 but filters only cat (3) and dog (5).
    Returns a PyTorch dataset.
    """

    transform = transforms.Compose([
        transforms.ToTensor(),
    ])

    dataset = CIFAR10(
        root="./data",
        train=(split == "train"),
        download=True,
        transform=transform,
    )

    # Filter only cat (3) and dog (5)
    filtered_data = []
    for img, label in dataset:
        if label == 3 or label == 5:
            new_label = 0 if label == 3 else 1  # cat=0, dog=1
            filtered_data.append((img, new_label))

    return filtered_data
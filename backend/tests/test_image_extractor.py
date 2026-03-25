import pytest
from backend.model_utils.image_extractor import ImageExtractor
from PIL import Image
import os

CELEBA_ROOT = "activation_cache/CelebA/images"
PATHS_FILE = "activation_cache/CelebA/set_01/paths.json"
METADATA_FILE = "activation_cache/CelebA/metadata.json"


@pytest.fixture
def extractor():
    return ImageExtractor(
        celeba_root=CELEBA_ROOT,
        paths_file=PATHS_FILE,
        metadata_file=METADATA_FILE
    )


def test_get_image_by_id(extractor):
    # Pick a real example key like "example_0016"
    example_key = next(iter(extractor.paths.keys()))
    # Extract the numeric part
    example_id = int(example_key.replace("example_", ""))
    img = extractor.get_image_by_id(example_id)
    assert isinstance(img, Image.Image)


def test_get_images_for_cluster(extractor):
    imgs = extractor.get_images_for_cluster("conv3", 0, limit=5)
    assert len(imgs) <= 5
    for img in imgs:
        assert isinstance(img, Image.Image)


def test_get_images_for_path(extractor):
    example_key = next(iter(extractor.paths.keys()))
    real_path = extractor.paths[example_key]

    imgs = extractor.get_images_for_path(real_path, limit=5)
    assert len(imgs) <= 5
    for img in imgs:
        assert isinstance(img, Image.Image)
import os
import json
from PIL import Image

class ImageExtractor:
    def __init__(self, celeba_root, paths_file, metadata_file):
        self.celeba_root = celeba_root

        with open(paths_file, "r") as f:
            self.paths = json.load(f)

        with open(metadata_file, "r") as f:
            self.metadata = json.load(f)

        self.layers = self.metadata["layers"]

    def get_image_by_id(self, example_id):
        # CelebA filenames start at 1, but model indices start at 0
        filename = f"{example_id + 1:06d}.jpg"
        path = os.path.join(self.celeba_root, filename)
        return Image.open(path)

    def get_images_for_cluster(self, layer_name, cluster_id, limit=20):
        layer_index = self.layers.index(layer_name)
        results = []

        for key, path in self.paths.items():
            if path[layer_index] == cluster_id:
                ex_id = int(key.split("_")[1])
                results.append(self.get_image_by_id(ex_id))
                if len(results) >= limit:
                    break

        return results

    def get_images_for_path(self, target_path, limit=20):
        results = []

        for key, path in self.paths.items():
            if path == target_path:
                ex_id = int(key.split("_")[1])
                results.append(self.get_image_by_id(ex_id))
                if len(results) >= limit:
                    break

        return results
import onnxruntime as ort
import numpy as np
from PIL import Image
import os


class ActivationExtractor:
    """
    Loads an ONNX model and extracts intermediate activations
    from specific internal nodes.
    """

    def __init__(self, model_path: str):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")

        # These are the ONNX *tensor* names for the activations
        self.activation_nodes = {
            "conv1": "relu",
            "conv2": "relu_1",
            "conv3": "relu_2",
            "fc1": "relu_3",
            "fc2": "relu_4",
        }

        # Configure session to output both final logits AND internal activations
        self.session = ort.InferenceSession(
            model_path,
            providers=["CPUExecutionProvider"],
        )

        # Build the full output list (activations + final output)
        self.output_names = list(self.activation_nodes.values())
        self.output_names.append(self.session.get_outputs()[0].name)  # logits

    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Loads and preprocesses an image into a 1x3x64x64 tensor.
        """
        img = Image.open(image_path).convert("RGB")
        img = img.resize((64, 64))

        arr = np.array(img).astype(np.float32) / 255.0
        arr = np.transpose(arr, (2, 0, 1))  # HWC → CHW
        arr = np.expand_dims(arr, axis=0)   # Add batch dimension

        return arr

    def extract(self, image_path: str) -> dict:
        """
        Runs inference and returns a dictionary of activations.
        """
        input_tensor = self.preprocess_image(image_path)

        # Run inference requesting all desired outputs
        outputs = self.session.run(self.output_names, {"input": input_tensor})

        # Map outputs back to readable names
        activations = {
            layer_name: output
            for layer_name, output in zip(self.activation_nodes.keys(), outputs[:-1])
        }

        # Add final logits
        activations["logits"] = outputs[-1]

        return activations


if __name__ == "__main__":
    # Example usage
    extractor = ActivationExtractor("../../models/CelebA_CNN_instrumented.onnx")
    acts = extractor.extract("../../test_images/test.jpg")

    print("Extracted activations:")
    for k, v in acts.items():
        print(k, v.shape)
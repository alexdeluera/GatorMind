import onnx
from onnx import helper, TensorProto

# Path to your ONNX model
model_path = "../../models/CelebA_CNN.onnx"
output_path = "../../models/CelebA_CNN_instrumented.onnx"

# Load model
model = onnx.load(model_path)
graph = model.graph

# These are the tensor names we want to expose
activation_tensors = [
    "relu",
    "relu_1",
    "relu_2",
    "relu_3",
    "relu_4",
]

# Add each tensor as a graph output
for tensor_name in activation_tensors:
    graph.output.append(
        helper.make_tensor_value_info(
            tensor_name,
            TensorProto.FLOAT,
            None  # Let ONNX infer the shape
        )
    )

# Save new model
onnx.save(model, output_path)
print("Saved instrumented model to:", output_path)
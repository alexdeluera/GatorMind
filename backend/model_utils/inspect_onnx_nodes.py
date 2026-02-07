import onnx

model = onnx.load("../../models/CelebA_CNN.onnx")
graph = model.graph

print("=== ONNX Nodes and Outputs ===")
for node in graph.node:
    print(f"{node.name} ({node.op_type})")
    for output in node.output:
        print(f"    output tensor: {output}")
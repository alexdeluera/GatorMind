import { useState, useCallback } from "react";
import "../styles/upload.css";
import NavLoggedIn from '../components/NavLoggedIn.jsx';

export default function Upload() {
  const [datasetFile, setDatasetFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleDatasetChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setDatasetFile(file);
    setStatus("");
  };

  const handleModelChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".onnx")) {
      setStatus("Model file must be in ONNX (.onnx) format.");
      return;
    }

    setModelFile(file);
    setStatus("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!modelFile) {
      setStatus("Please upload an ONNX model file.");
      return;
    }

    const formData = new FormData();
    if (datasetFile) formData.append("dataset", datasetFile);
    formData.append("model", modelFile);

    try {
      setStatus("Uploading...");

      //// NEED TO UPDATE THIS ENDPOINT WITH REAL BACKEND URL
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      //// ENDPOINT UPDATE

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setStatus("Upload successful!");
      setDatasetFile(null);
      setModelFile(null);
    } catch (error) {
      setStatus("Upload failed. Please try again.");
    }
  };

  return (
    <div>
      <NavLoggedIn />

      <section className="upload-container">
        <h1>Upload Dataset & ONNX Model</h1>

        <form onSubmit={handleSubmit} className="upload-form">
          {/* Dataset Upload */}
          <div className="upload-card">
            <h2>Dataset (Optional)</h2>
            <input
              type="file"
              accept=".csv,.json,.zip"
              onChange={handleDatasetChange}
            />
            {datasetFile && (
              <p className="file-info">
                Selected: {datasetFile.name}
              </p>
            )}
          </div>

          {/* ONNX Model Upload */}
          <div className="upload-card">
            <h2>ONNX Model (Required)</h2>
            <input
              type="file"
              accept=".onnx"
              onChange={handleModelChange}
              required
            />
            {modelFile && (
              <p className="file-info">
                Selected: {modelFile.name}
              </p>
            )}
          </div>

          <button type="submit" className="upload-button">
            Upload Files
          </button>
        </form>

        {status && <p className="upload-status">{status}</p>}
      </section>
    </div>
  );
}

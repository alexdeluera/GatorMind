import { useEffect, useState } from "react";
import "../styles/dashboard.css";
import NavLoggedIn from '../components/NavLoggedIn.jsx';

export default function Dashboard() {
  const [models, setModels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedDataset, setSelectedDataset] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {

    //// NEED TO UPDATE THIS ENDPOINT WITH REAL BACKEND URL
    async function fetchFiles() {
      try {
        const res = await fetch("/api/files");
        const data = await res.json();
        setModels(data.models || []);
        setDatasets(data.datasets || []);
      } catch (err) {
        console.error("Failed to fetch files");
      }
    }
    //// ENDPOINT UPDATE

    fetchFiles();
  }, []);

  const handleRun = async () => {
    if (!selectedModel || !selectedDataset) {
      setStatus("Please select both a model and dataset.");
      return;
    }

    try {
      setStatus("Running model...");
      setResult(null);

      //// NEED TO UPDATE THIS ENDPOINT WITH REAL BACKEND URL
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          dataset: selectedDataset,
        }),
      });
      //// ENDPOINT UPDATE

      const data = await res.json();
      setResult(data);
      setStatus("Run complete.");
    } catch (err) {
      setStatus("Error running model.");
    }
  };

  return (
    <div>
      <NavLoggedIn />

      <section className="dashboard-container">
        <h1>Dashboard</h1>

        <div className="selection-panel">
          <div className="selector">
            <label>Select ONNX Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="">-- Choose Model --</option>
              {models.map((model, index) => (
                <option key={index} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <div className="selector">
            <label>Select Dataset</label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
            >
              <option value="">-- Choose Dataset --</option>
              {datasets.map((dataset, index) => (
                <option key={index} value={dataset}>
                  {dataset}
                </option>
              ))}
            </select>
          </div>

          <button className="run-button" onClick={handleRun}>
            Run Model
          </button>
        </div>

        {status && <p className="status">{status}</p>}

        <div className="results-panel">
          <h2>Results</h2>

          {!result && <p>No results yet. Run a model to see output.</p>}

          {result && (
            <pre className="result-box">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}

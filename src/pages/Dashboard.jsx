// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import {useParams} from "react-router-dom";
import Plot from "react-plotly.js";
import "../styles/dashboard.css";
import NavLoggedIn from '../components/NavLoggedIn.jsx';
import { fetchModels, fetchMetadata as apiFetchMetadata, fetchPaths, runModelApi } from "../api";

export default function Dashboard() {
  const rawName = localStorage.getItem("username") || "User";
  const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const [models, setModels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [selectedModel, setSelectedModel] = useState("CelebA_CNN.onnx");
  const [selectedDataset, setSelectedDataset] = useState("CelebA");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");

  const [metadata, setMetadata] = useState(null);
  const [layerSankey, setLayerSankey] = useState({ labels: [], source: [], target: [], value: [], x: [], y: [] });

  // useEffect(() => {
  //   // fetch metadata for the CelebA model and derive options
  //   async function fetchMetadata() {
  //     try {
  //       const data = await apiFetchMetadata("CelebA");

  //       setMetadata(data.metadata || null);

  //       if (data.model) {
  //         setModels([data.model]);
  //       }

  //       if (data.metadata && Array.isArray(data.metadata.layers)) {
  //         setDatasets(data.metadata.layers);
  //       } else if (data.datasets) {
  //         setDatasets(data.datasets);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch metadata", err);
  //     }
  //   }

  //   fetchMetadata();
  // }, []);


  useEffect(() => {
  async function loadInitialData() {
    try {
      const modelsRes = await fetchModels();
      const modelList = modelsRes.models || [];

      setDatasets(modelList);

      const initialDataset = modelList.includes("CelebA")
        ? "CelebA"
        : modelList[0] || "";

      setSelectedDataset(initialDataset);

      if (initialDataset) {
        const data = await apiFetchMetadata(initialDataset);
        setMetadata(data.metadata || null);
      }

      setModels(["CelebA_CNN.onnx"]);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    }
  }

  loadInitialData();
}, []);

  async function buildLayerSankeyFromSet(setName = "set_01", limit = 50, offset = 0) {
    if (!metadata) return;
    try {
      const { layers = [], k = 0 } = metadata;
      if (!layers.length || k <= 0) return;

      const labels = [];
      const x = [];
      const y = [];
      const layerNodeIndices = [];

      layers.forEach((layerName, li) => {
        layerNodeIndices[li] = [];
        for (let ci = 0; ci < k; ci++) {
          layerNodeIndices[li].push(labels.length);
          labels.push(`${layerName} C${ci}`);
          x.push(li / Math.max(layers.length - 1, 1));
          y.push(ci / Math.max(k - 1, 1));
        }
      });

      // const pathsRes = await fetchPaths("CelebA", setName, limit, offset);
      const pathsRes = await fetchPaths(selectedDataset, setName, limit, offset);

      const paths = pathsRes.paths || {};

      const counts = new Map();
      for (const exampleId of Object.keys(paths)) {
        const seq = paths[exampleId];
        if (!Array.isArray(seq) || seq.length < 2) continue;
        for (let i = 0; i < seq.length - 1; i++) {
          const a = seq[i];
          const b = seq[i + 1];
          if (typeof a !== "number" || typeof b !== "number") continue;
          if (a < 0 || a >= k || b < 0 || b >= k) continue;
          const src = layerNodeIndices[i][a];
          const tgt = layerNodeIndices[i + 1][b];
          const key = `${src}|${tgt}`;
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      }

      const source = [];
      const target = [];
      const value = [];

      for (const [key, cnt] of counts.entries()) {
        const [s, t] = key.split("|").map((v) => parseInt(v, 10));
        source.push(s);
        target.push(t);
        value.push(cnt);
      }

      setLayerSankey({ labels, source, target, value, x, y });
    } catch (err) {
      console.error("Error building Sankey from set paths:", err);
    }
  }

  const handleRun = async () => {
    if (!selectedModel || !selectedDataset) {
      setStatus("Please select both a model and dataset.");
      return;
    }

    try {
      setStatus("Running model...");
      setResult(null);

      let runSucceeded = false;
      try {
        const data = await runModelApi(selectedModel, selectedDataset);
        setResult(data);
        setStatus("Run complete.");
        runSucceeded = true;
      } catch (e) {
        console.warn("Error calling run endpoint:", e);
        setStatus("Backend run unavailable; building Sankey from cached paths.");
      }

      //const setToUse = selectedDataset === "CelebA" ? "set_01" : selectedDataset;
      const setToUse = "set_01";
      await buildLayerSankeyFromSet(setToUse, 50, 0);

      if (!runSucceeded) {
        setStatus("Sankey built from cached paths.");
      }
    } catch (err) {
      setStatus("Error running model.");
    }
  };

  return (
    <div>
      <NavLoggedIn />

      <section className="dashboard-container">
        <h1>Dashboard for {capitalizedName}</h1>

        <div className="selection-panel">
          <div className="selector">
            <label>Select ONNX Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="">-- Choose Model --</option>
              {/* ensure the ONNX filename is available as a default */}
              {!models.includes("CelebA_CNN.onnx") && (
                <option value="CelebA_CNN.onnx">CelebA_CNN.onnx</option>
              )}
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
              {/* ensure CelebA is available as a default selection */}
              {!datasets.includes("CelebA") && (
                <option value="CelebA">CelebA</option>
              )}
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
        {/* metadata Sankey diagram */}
        {layerSankey.labels.length > 0 && (
          <div className="sankey-container" style={{ marginTop: 24 }}>
            <h2>Metadata Sankey</h2>
            <Plot
              data={[
                {
                  type: "sankey",
                  arrangement: "snap",
                  node: {
                    label: layerSankey.labels,
                    x: layerSankey.x,
                    y: layerSankey.y,
                    pad: 15,
                    thickness: 15,
                  },
                  link: {
                    source: layerSankey.source,
                    target: layerSankey.target,
                    value: layerSankey.value,
                  },
                },
              ]}
              layout={{
                title: "Layers × clusters (k = " + metadata.k + ")",
                font: { size: 10 },
                margin: { l: 0, r: 0, t: 40, b: 0 },
              }}
              useResizeHandler
              style={{ width: "100%", height: "420px" }}
              config={{ displayModeBar: true, responsive: true }}
            />
          </div>
        )}

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
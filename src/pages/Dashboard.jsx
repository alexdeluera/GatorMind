// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import {useParams} from "react-router-dom";
import Plot from "react-plotly.js";
import "../styles/dashboard.css";
import NavLoggedIn from '../components/NavLoggedIn.jsx';
import { fetchModels, fetchMetadata as apiFetchMetadata, fetchPaths, runModelApi, fetchExampleImage, fetchImages, fetchAttributes, fetchAttributeIds} from "../api";

export default function Dashboard() {
  const rawName = localStorage.getItem("username") || "User";
  const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const [models, setModels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [selectedModel, setSelectedModel] = useState("CelebA_CNN.onnx");
  const [selectedDataset, setSelectedDataset] = useState("CelebA");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");

  const [attributes, setAttributes] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState("");
  const [modelRun, setModelRun] = useState(false);

  const [attributeIdsValue1, setAttributeIdsValue1] = useState([]);
  const [attributeImages, setAttributeImages] = useState([]);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [highlightedPaths, setHighlightedPaths] = useState([]);

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

  useEffect(() => {
    async function loadAttributeData() {
      if (selectedDataset && selectedAttribute && modelRun) {
        try {
          const idsValue1 = await fetchAttributeIds(selectedDataset, selectedAttribute, 1);
          const ids = idsValue1.example_ids || [];
          
          setAttributeIdsValue1(ids);
          
          // Select 16 random IDs and fetch their images
          if (ids.length > 0) {
            const shuffled = [...ids].sort(() => 0.5 - Math.random());
            const selectedIds = shuffled.slice(0, Math.min(16, ids.length));
            
            const imagePromises = selectedIds.map(id => fetchExampleImage(id));
            const images = await Promise.all(imagePromises);
            
            setAttributeImages(images.map(img => img.image_base64));
            setSelectedImageIds(selectedIds);
            
            // Fetch all paths for the attribute using fetchPaths with a large limit
            const pathsRes = await fetchPaths(selectedDataset, "set_01", Math.max(ids.length + 100, 10000), 0);
            const allPaths = pathsRes.paths || {};
            
            // Filter paths to only include IDs from this attribute
            const attributePaths = [];
            const idSet = new Set(ids);
            
            for (const exampleId of Object.keys(allPaths)) {
              const numericId = parseInt(exampleId.replace(/[^\d]/g, ''), 10);
              if (idSet.has(numericId)) {
                attributePaths.push(allPaths[exampleId]);
              }
            }
            
            setHighlightedPaths(attributePaths);
          } else {
            setAttributeImages([]);
            setSelectedImageIds([]);
            setHighlightedPaths([]);
          }
        } catch (err) {
          console.error("Failed to fetch attribute IDs", err);
          setAttributeIdsValue1([]);
          setAttributeImages([]);
          setHighlightedPaths([]);
        }
      }
    }

    loadAttributeData();
  }, [selectedDataset, selectedAttribute, modelRun]);

  async function buildLayerSankeyFromSet(setName = "set_01", limit = 1000, offset = 0) {
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
      const colors = [];

      for (const [key, cnt] of counts.entries()) {
        const [s, t] = key.split("|").map((v) => parseInt(v, 10));
        source.push(s);
        target.push(t);
        value.push(cnt);
        colors.push('rgba(31, 119, 180, 0.4)'); 
      }

      if (highlightedPaths.length > 0) {
        const highlightedCounts = new Map();
        
        highlightedPaths.forEach(path => {
          if (!Array.isArray(path) || path.length < 2) return;
          for (let i = 0; i < path.length - 1; i++) {
            const a = path[i];
            const b = path[i + 1];
            if (typeof a !== "number" || typeof b !== "number") continue;
            if (a < 0 || a >= k || b < 0 || b >= k) continue;
            const src = layerNodeIndices[i][a];
            const tgt = layerNodeIndices[i + 1][b];
            const key = `${src}|${tgt}`;
            highlightedCounts.set(key, (highlightedCounts.get(key) || 0) + 1);
          }
        });

        for (let i = 0; i < source.length; i++) {
          const key = `${source[i]}|${target[i]}`;
          if (highlightedCounts.has(key)) {
            colors[i] = 'rgba(255, 127, 14, 0.8)';
          }
        }
      }

      setLayerSankey({ 
        labels, 
        source, 
        target, 
        value, 
        x, 
        y,
        colors
      });
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

      try {
        const attrs = await fetchAttributes(selectedDataset);
        setAttributes(attrs.attributes || []);
        setSelectedAttribute(""); 
        setModelRun(true);
      } catch (err) {
        console.error("Failed to fetch attributes", err);
        setAttributes([]);
        setSelectedAttribute("");
      }

      const setToUse = "set_01";
      await buildLayerSankeyFromSet(setToUse, 10000, 0);

      if (!runSucceeded) {
        setStatus("Run complete.");
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
            <h2>Sankey Diagram</h2>
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
                    color: layerSankey.colors,
                  },
                  name: 'Paths'
                }
              ]}
              layout={{
                title: "Layers × clusters (k = " + metadata.k + ")" + (highlightedPaths.length > 0 ? ` - ${highlightedPaths.length} highlighted paths` : ""),
                font: { size: 10 },
                margin: { l: 0, r: 0, t: 40, b: 0 },
              }}
              useResizeHandler
              style={{ width: "100%", height: "420px" }}
              config={{ displayModeBar: true, responsive: true }}
            />
          </div>
        )}

        {/* Attribute selector dropdown */}
        {modelRun && attributes.length > 0 && (
          <div className="attribute-selector" style={{ marginTop: 24 }}>
            <h3>Select Attribute</h3>
            <select
              value={selectedAttribute}
              onChange={(e) => setSelectedAttribute(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
                minWidth: '200px'
              }}
            >
              <option value="">-- Select an attribute --</option>
              {attributes.map((attribute, index) => (
                <option key={index} value={attribute}>
                  {attribute}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Attribute Images Grid */}
        {attributeImages.length > 0 && (
          <div className="attribute-images-section" style={{ marginTop: 24 }}>
            <h2>Sample Images for "{selectedAttribute}" ({attributeIdsValue1.length} total examples)</h2>
            <div className="attribute-images-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              marginTop: '10px'
            }}>
              {attributeImages.map((base64, index) => (
                <img
                  key={index}
                  src={`data:image/jpeg;base64,${base64}`}
                  alt={`Sample ${index + 1} for ${selectedAttribute}`}
                  title={`Example ID: ${selectedImageIds[index] || 'Unknown'}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
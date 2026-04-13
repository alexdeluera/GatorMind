// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import {useParams} from "react-router-dom";
import Plot from "react-plotly.js";
import "../styles/dashboard.css";
import NavLoggedIn from '../components/NavLoggedIn.jsx';
import { fetchModels, fetchMetadata as apiFetchMetadata, fetchPaths, runModelApi, fetchExampleImage, fetchExamplePath, fetchImages, fetchAttributes, fetchAttributeIds, fetchIdToIndexMapping, fetchImagesForPath } from "../api";

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
  const [idToIndexMapping, setIdToIndexMapping] = useState({});
  const [activeTab, setActiveTab] = useState("attribute");
  const [availableExampleIds, setAvailableExampleIds] = useState([]);
  const [selectedExampleId, setSelectedExampleId] = useState("");
  const [selectedExampleImage, setSelectedExampleImage] = useState(null);
  const [selectedExamplePath, setSelectedExamplePath] = useState([]);
  const [selectedPath, setSelectedPath] = useState([]);
  const [pathRes, setPathRes] = useState(null);

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
        // Fetch filtered IDs ONCE
        const res = await fetchAttributeIds(selectedDataset, selectedAttribute, 1);
        const ids = res.example_ids || [];

        setAttributeIdsValue1(ids);

        // Select 16 random IDs and fetch their images
        if (ids.length > 0) {

          const shuffled = [...ids].sort(() => 0.5 - Math.random());
          const selectedIds = shuffled.slice(0, Math.min(16, ids.length));

          const imagePromises = selectedIds.map(id => fetchExampleImage(id));
          const images = await Promise.all(imagePromises);

          setAttributeImages(images.map(img => img.image_base64));
          setSelectedImageIds(selectedIds);

          // Fetch the mapping from CelebA IDs to subset path indices
          const mappingRes = await fetchIdToIndexMapping(selectedDataset);
          const mapping = mappingRes.id_to_index || {};
          setIdToIndexMapping(mapping);

          // Convert the selected CelebA attribute IDs into subset example indices
          const subsetIndices = ids
            .map((id) => mapping[id])
            .filter((index) => typeof index === "number" && !Number.isNaN(index));
          const subsetIndexSet = new Set(subsetIndices);

          // Fetch all paths for the attribute using fetchPaths with a large limit
          const pathsRes = await fetchPaths(selectedDataset, "set_01", Math.max(ids.length + 100, 10000), 0);
          const allPaths = pathsRes.paths || {};

          // Filter paths to only include IDs from this attribute
          const attributePaths = [];

          for (const exampleId of Object.keys(allPaths)) {
            const match = exampleId.match(/(\d+)$/);
            const numericId = match ? parseInt(match[1], 10) : NaN;
            if (subsetIndexSet.has(numericId)) {
              attributePaths.push(allPaths[exampleId]);
            }
          }

          console.log("attributePaths first 10:", attributePaths.slice(0, 10));
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



  useEffect(() => {
    async function loadExampleIdOptions() {
      if (!modelRun || !selectedDataset) return;
      try {
        const pathsRes = await fetchPaths(selectedDataset, "set_01", 10000, 0);
        const ids = Object.keys(pathsRes.paths || {}).sort((a, b) => {
          const aMatch = a.match(/(\d+)$/);
          const bMatch = b.match(/(\d+)$/);
          return (aMatch ? parseInt(aMatch[1], 10) : 0) - (bMatch ? parseInt(bMatch[1], 10) : 0);
        });
        setAvailableExampleIds(ids);
      } catch (err) {
        console.error("Failed to load example IDs", err);
        setAvailableExampleIds([]);
      }
    }

    loadExampleIdOptions();
  }, [modelRun, selectedDataset]);

  useEffect(() => {
    if (!selectedDataset || !selectedExampleId) {
      if (activeTab === "image") {
        setSelectedExampleImage(null);
        setSelectedExamplePath([]);
        setHighlightedPaths([]);
      }
      return;
    }

    async function loadExampleSelection() {
      try {
        const pathRes = await fetchExamplePath(selectedDataset, "set_01", selectedExampleId);
        const path = pathRes.path || [];
        setSelectedExamplePath(path);
        setHighlightedPaths([path]);

        const match = selectedExampleId.match(/(\d+)$/);
        const exampleIndex = match ? parseInt(match[1], 10) : NaN;
        if (!Number.isNaN(exampleIndex)) {
          const imageRes = await fetchExampleImage(exampleIndex);
          setSelectedExampleImage(imageRes.image_base64);
        } else {
          setSelectedExampleImage(null);
        }
      } catch (err) {
        console.error("Failed to load selected example image or path", err);
        setSelectedExampleImage(null);
        setSelectedExamplePath([]);
        setHighlightedPaths([]);
      }
    }

    if (activeTab === "image") {
      loadExampleSelection();
    }
  }, [activeTab, selectedExampleId, selectedDataset]);

  useEffect(() => {
    if (activeTab !== "path" || !metadata) return;
    setSelectedPath((prev) => {
      if (prev.length === metadata.layers.length) return prev;
      return new Array(metadata.layers.length).fill(0);
    });
  }, [activeTab, metadata]);

  useEffect(() => {
    if (activeTab !== "path" || !selectedPath.length || !selectedDataset) return;

    async function loadSelectedPathImages() {
      try {
        setHighlightedPaths([selectedPath]);
        const pathResponse = await fetchImagesForPath(selectedPath, 16);
        setPathRes(pathResponse);
      } catch (err) {
        console.error("Failed to load images for selected path", err);
        setPathRes(null);
        setHighlightedPaths([]);
      }
    }

    loadSelectedPathImages();
  }, [activeTab, selectedPath, selectedDataset]);

  useEffect(() => {
    if (!metadata) return;
    const setToUse = "set_01";
    buildLayerSankeyFromSet(setToUse, 10000, 0);
  }, [highlightedPaths, metadata, selectedDataset]);

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

        {/* Tab navigation for analysis sections */}
        {modelRun && attributes.length > 0 && (
          <div className="analysis-tabs" style={{ display: 'flex', gap: '10px', marginTop: 24 }}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('attribute');
                setSelectedExampleId('');
                setSelectedExampleImage(null);
                setSelectedExamplePath([]);
                setSelectedPath([]);
                setPathRes(null);
                setHighlightedPaths([]);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: activeTab === 'attribute' ? '2px solid #1f77b4' : '1px solid #ccc',
                background: activeTab === 'attribute' ? '#e8f2ff' : '#fff',
                cursor: 'pointer'
              }}
            >
              Attribute Analysis
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('path');
                setSelectedAttribute('');
                setAttributeImages([]);
                setSelectedImageIds([]);
                setAttributeIdsValue1([]);
                setSelectedExampleId('');
                setSelectedExampleImage(null);
                setSelectedExamplePath([]);
                setHighlightedPaths([]);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: activeTab === 'path' ? '2px solid #1f77b4' : '1px solid #ccc',
                background: activeTab === 'path' ? '#e8f2ff' : '#fff',
                cursor: 'pointer'
              }}
            >
              Path Analysis
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('image');
                setSelectedAttribute('');
                setAttributeImages([]);
                setSelectedImageIds([]);
                setAttributeIdsValue1([]);
                setSelectedPath([]);
                setPathRes(null);
                setHighlightedPaths([]);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: activeTab === 'image' ? '2px solid #1f77b4' : '1px solid #ccc',
                background: activeTab === 'image' ? '#e8f2ff' : '#fff',
                cursor: 'pointer'
              }}
            >
              Image Analysis
            </button>
          </div>
        )}

        {activeTab === 'attribute' && modelRun && attributes.length > 0 && (
          <div className="attribute-analysis-section" style={{ marginTop: 24 }}>
            <div className="attribute-selector">
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
          </div>
        )}

        {activeTab === 'image' && modelRun && (
          <div className="image-analysis-section" style={{ marginTop: 24 }}>
            <div className="image-selector">
              <h3>Select Example ID</h3>
              <select
                value={selectedExampleId}
                onChange={(e) => setSelectedExampleId(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  minWidth: '220px'
                }}
              >
                <option value="">-- Select an example --</option>
                {availableExampleIds.map((exampleId) => (
                  <option key={exampleId} value={exampleId}>
                    {exampleId}
                  </option>
                ))}
              </select>
            </div>

            {selectedExampleImage && (
              <div className="selected-image-section" style={{ marginTop: 24 }}>
                <h2>Selected Example: {selectedExampleId}</h2>
                <img
                  src={`data:image/jpeg;base64,${selectedExampleImage}`}
                  alt={`Selected example ${selectedExampleId}`}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'path' && modelRun && metadata && (
          <div className="path-analysis-section" style={{ marginTop: 24 }}>
            <h3>Select a path across layers</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {Array.from({ length: metadata.layers.length }).map((_, layerIndex) => (
                <span key={layerIndex} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={selectedPath[layerIndex] ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      setSelectedPath((prev) => {
                        const next = [...(prev.length ? prev : new Array(metadata.layers.length).fill(0))];
                        next[layerIndex] = value;
                        return next;
                      });
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      fontSize: '14px'
                    }}
                  >
                    {Array.from({ length: metadata.k }).map((__, optionIndex) => (
                      <option key={optionIndex} value={optionIndex}>
                        {optionIndex}
                      </option>
                    ))}
                  </select>
                  {layerIndex < metadata.layers.length - 1 && <span style={{ fontSize: '18px' }}>→</span>}
                </span>
              ))}
            </div>

            {pathRes && pathRes.images && pathRes.images.length > 0 && (
              <div className="path-images-section" style={{ marginTop: 24 }}>
                <h2>Images matching path {selectedPath.join(' → ')}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' }}>
                  {pathRes.images.slice(0, 16).map((base64, index) => (
                    <img
                      key={index}
                      src={`data:image/jpeg;base64,${base64}`}
                      alt={`Path image ${index + 1}`}
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
          </div>
        )}

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

      </section>
    </div>
  );
}
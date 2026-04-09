// src/api.js
const BASE_URL = "http://127.0.0.1:8000";

async function getJSON(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${path} -> ${res.status} ${res.statusText} ${text ? `\n${text}` : ""}`);
  }
  return res.json();
}

export const fetchModels = () => getJSON(`/models`);

export const fetchSets = (model) =>
  getJSON(`/models/${encodeURIComponent(model)}/sets`);

export const fetchMetadata = (model) =>
  getJSON(`/models/${encodeURIComponent(model)}/metadata`);

export const fetchCentroids = (model, setName) =>
  getJSON(`/models/${encodeURIComponent(model)}/sets/${encodeURIComponent(setName)}/centroids`);

export const fetchExamplePath = (model, setName, exampleId) =>
  getJSON(`/models/${encodeURIComponent(model)}/sets/${encodeURIComponent(setName)}/paths/${encodeURIComponent(exampleId)}`);

export const fetchPaths = (model, setName, limit = 50, offset = 0) =>
  getJSON(
    `/models/${encodeURIComponent(model)}/sets/${encodeURIComponent(setName)}/paths?limit=${limit}&offset=${offset}`
  );

export const fetchExampleImage = (exampleId) =>
  getJSON(`/images/example/${encodeURIComponent(exampleId)}`);

export const fetchImages = (layerName, clusterId) =>
  getJSON(`/images/cluster/${encodeURIComponent(layerName)}/${encodeURIComponent(clusterId)}`);

export const fetchAttributes = (model) =>
  getJSON(`/models/${encodeURIComponent(model)}/attributes`);

export const fetchAttributeIds = (model, attribute, value = 0) =>
  getJSON(
    `/models/${encodeURIComponent(model)}/attributes/filter?attr=${encodeURIComponent(attribute)}&value=${value}`
  );

export const runModelApi = async (model, dataset) => {
  const res = await fetch(`${BASE_URL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, dataset }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST /run -> ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
};

export const signUp = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `Sign up failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
};

export const signIn = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `Sign in failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
};

import axios from "axios";

const rawBase = import.meta.env.VITE_API_BASE_URL?.trim();
const BASE = rawBase
  ? rawBase.replace(/\/+$/, "")
  : "http://localhost:8000/api";

export const uploadCSV = (file) => {
  const form = new FormData();
  form.append("file", file);
  return axios.post(`${BASE}/upload`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const trainModel = () => axios.post(`${BASE}/train`);
export const getTrainStatus = () => axios.get(`${BASE}/train/status`);
export const predictLoan = (data, options = {}) => {
  const config =
    options.track === false ? { params: { track: false } } : undefined;
  return axios.post(`${BASE}/predict`, data, config);
};
export const getModelPerformance = () =>
  axios.get(`${BASE}/analytics/model-performance`);
export const getFeatureImportance = () =>
  axios.get(`${BASE}/analytics/feature-importance`);
export const getFairness = () => axios.get(`${BASE}/analytics/fairness`);
export const getApprovalDist = () =>
  axios.get(`${BASE}/analytics/approval-distribution`);

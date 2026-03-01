import axios from "axios";
import { camelizeKeys, decamelizeKeys } from "humps";

const api = axios.create({
  baseURL: `${window.location.origin}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  responseType: "json",
});

api.interceptors.request.use((config) => {
  if (config.data) {
    config.data = decamelizeKeys(config.data);
  }

  if (config.params) {
    config.params = decamelizeKeys(config.params);
  }

  return config;
});

api.interceptors.response.use((response) => {
  response.data = camelizeKeys(response.data);
  return response;
});

export default api;

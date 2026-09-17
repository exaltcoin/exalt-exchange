import axios from "axios";

const API = "https://api.exaltexchange.io/api/ai";
export const getAISummary = async () => {
  const response = await axios.get(`${API}/summary/all`);
  return response.data;
};

export const getModuleData = async (module) => {
  const response = await axios.get(`${API}/${module}`);
  return response.data;
};

export const createAIRecord = async (data) => {
  const response = await axios.post(API, data);
  return response.data;
};

export default {
  getAISummary,
  getModuleData,
  createAIRecord,
};
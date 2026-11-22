import axios from "axios";

// Create a reusable Axios instance for backend API calls
const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export default api; 
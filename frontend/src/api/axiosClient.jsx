import axios from "axios";

const axiosClient = axios.create({
  // baseURL: "https://restaurant-management-system-e54e.onrender.com", 
  baseURL: "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  }
});

export default axiosClient;

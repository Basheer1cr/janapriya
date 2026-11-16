import axios from "axios";

// Base URL of our Python FastAPI backend
export const BACKEND_URL = "http://localhost:8000";

const API = axios.create({
  baseURL: BACKEND_URL,
});

// 1. Send Mock OTP (always returns 123456 for demo)
export async function sendOTP(phone, name, village) {
  const response = await API.post("/api/otp/send", { phone, name, village });
  return response.data;
}

// 2. Verify Mock OTP (123456) and get citizen JWT token
export async function verifyOTP(phone, otp_code, name, village) {
  const response = await API.post("/api/otp/verify", {
    phone,
    otp_code,
    name,
    village,
  });
  return response.data;
}

// 3. Submit citizen development request (supports text, voice blob, photo, GPS, WhatsApp mode)
export async function submitCitizenRequest(formData) {
  const response = await API.post("/api/citizen/submit", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// 4. Fetch recent citizen submissions for live feed
export async function fetchRecentSubmissions() {
  const response = await API.get("/api/citizen/recent?limit=6");
  return response.data;
}

// 5. MP / Admin Login (mp@vizag.gov.in / admin123)
export async function loginMP(email, password) {
  const response = await API.post("/api/mp/login", { email, password });
  return response.data;
}

// 6. Get AI-ranked priority clusters for MP Dashboard (with optional village/category filters)
export async function fetchMPPriorities(village = "All", category = "All") {
  const params = {};
  if (village && village !== "All") params.village = village;
  if (category && category !== "All") params.category = category;
  const response = await API.get("/api/mp/priorities", { params });
  return response.data;
}

// 7. Get 3 sample citizen proofs + photos + GPS points for a specific cluster card
export async function fetchClusterProofs(clusterId) {
  const response = await API.get(`/api/mp/cluster/${clusterId}/proofs`);
  return response.data;
}

// 8. Update cluster status (Approve / In-Progress / Completed)
export async function updateClusterStatus(clusterId, status) {
  const response = await API.patch(`/api/mp/cluster/${clusterId}/status`, {
    status,
  });
  return response.data;
}
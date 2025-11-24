import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const adminLogin = async (email, password) => {
  const res = await axios.post(`${API_BASE_URL}/admin/login`, { email, password });
  localStorage.setItem("adminToken", res.data.access_token);
  return res.data;
};

export const getPrograms = async (token, programType = "all_programs") => {
  const res = await axios.get(`${API_BASE_URL}/admin/${programType}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createProgram = async (token, program, programType = "all_programs") => {
  const res = await axios.post(`${API_BASE_URL}/admin/${programType}`, program, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateProgram = async (token, programId, updates, programType = "all_programs") => {
  const res = await axios.put(`${API_BASE_URL}/admin/${programType}/${programId}`, updates, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteProgram = async (token, programId, programType = "all_programs") => {
  const res = await axios.delete(`${API_BASE_URL}/admin/${programType}/${programId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ------------------- USERS -------------------

export const getUsers = async (token) => {
  const res = await axios.get(`${API_BASE_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createUser = async (token, userData) => {
  const res = await axios.post(`${API_BASE_URL}/admin/users`, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateUser = async (token, userId, updates) => {
  const res = await axios.put(`${API_BASE_URL}/admin/users/${userId}`, updates, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteUser = async (token, userId) => {
  const res = await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import UniFinder from "./pages/UniFinder";
import Results from "./pages/Results";
import ComparePage from "./pages/ComparePage";
import CompareProgram from "./pages/CompareProgram";
import "./index.css";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/admin/Settings"
import Users from "./pages/admin/Users"
import Programs from "./pages/admin/Programs"
import Universities from "./pages/admin/Universities"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/unifinder" element={<UniFinder />} />
        <Route path="/results" element={<Results />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/compare-program" element={<CompareProgram />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/universities" element={<Universities />} />
        <Route path="/admin/programs" element={<Programs />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

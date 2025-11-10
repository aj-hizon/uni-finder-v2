import { useEffect, useState, useCallback } from "react";
import { X, Trash2 } from "lucide-react";

export default function HistoryLogModal({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Format timestamp in PH timezone
  const formatPHDate = (utcDate) => {
    if (!utcDate) return "-";
    const date = new Date(utcDate);
    return date.toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/history-log`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Server returned non-JSON response:", text);
        return;
      }

      const data = await res.json();
      setUser(data.user || null);
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to fetch history log:", err);
    }
  }, [API_BASE_URL]);

  const clearHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!window.confirm("Are you sure you want to clear your history?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/clear-history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to clear history");
      }

      setLogs([]);
      alert("History cleared successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen, fetchHistory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen bg-black/80 backdrop-blur-sm font-[Poppins] px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-blue-800/40 backdrop-blur-md border border-blue-400/20 rounded-2xl w-full max-w-2xl p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-red-400 transition"
        >
          <X size={24} />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-4 text-center font-poppins">
          History Log
        </h2>

        {/* User info */}
        {user && (
          <div className="mb-4 space-y-1 text-sm sm:text-base">
            <p>
              <strong>Name:</strong> {user.full_name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Account Created:</strong> {formatPHDate(user.created_at)}
            </p>
          </div>
        )}

        {/* Clear History Button */}
        <div className="flex justify-end mb-2">
          <button
            className="flex items-center gap-2 text-red-500 hover:text-red-400 hover:drop-shadow-[0_0_5px_rgba(255,0,0,0.6)] text-sm font-semibold transition-all duration-200"
            onClick={clearHistory}
          >
            <Trash2 size={16} /> Clear History
          </button>
        </div>

        {/* Logs Table */}
        <div className="overflow-y-auto max-h-80">
          <table className="w-full text-left border-collapse text-sm sm:text-base">
            <thead>
              <tr className="border-b border-blue-400/50">
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-white/70">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr
                    key={index}
                    className={`border-b border-blue-400/30 ${
                      index % 2 === 0 ? "bg-blue-900/20" : "bg-blue-900/10"
                    }`}
                  >
                    <td className="py-2 px-3 capitalize">{log.action}</td>
                    <td className="py-2 px-3">{formatPHDate(log.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

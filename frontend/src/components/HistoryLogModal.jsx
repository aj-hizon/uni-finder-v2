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
      className="fixed inset-0 z-9999 flex items-center justify-center 
                 min-h-screen bg-black/80 backdrop-blur-sm font-[Poppins] px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-blue-800/40 backdrop-blur-md border border-blue-400/20 
                   rounded-2xl w-full max-w-2xl p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
  onClick={onClose}
  className="absolute top-4 right-4 transition-colors duration-200"
  style={{
    background: "transparent", // ensures no background in any mode
    color: "rgb(191, 219, 254)", // Tailwind blue-200 (soft neutral)
  }}
  onMouseEnter={(e) => (e.currentTarget.style.color = "rgb(248, 113, 113)")} // red-400 on hover
  onMouseLeave={(e) => (e.currentTarget.style.color = "rgb(191, 219, 254)")} // back to blue-200
>
  <X size={24} />
</button>


        {/* Title */}
        <h2 className="text-2xl font-bold mb-4 text-center">History Log</h2>

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

       <div className="flex justify-end mb-2">
  <button
  onClick={clearHistory}
  className="flex items-center gap-2 px-4 py-2 
             border border-red-500/70 hover:border-red-500 
             text-red-400 hover:text-red-300 
              hover:bg-transparent 
             !bg-transparent !backdrop-filter-none !backdrop-blur-none 
             rounded-md font-semibold text-sm 
             transition-all duration-200 font-poppins 
             shadow-none"
  style={{ backgroundColor: "transparent", boxShadow: "none" }}
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

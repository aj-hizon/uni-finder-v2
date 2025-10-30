import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Trash2 } from "lucide-react";

// ✅ Reusable Confirmation Modal Component
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-poppins">
      <div className="bg-[#0a1733]/90 border border-blue-400/20 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl relative font-poppins">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-red-400 transition"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold mb-3 text-center font-poppins">{title}</h3>
        <p className="text-center text-white/80 mb-6 font-poppins">{message}</p>

        <div className="flex justify-center gap-3 font-poppins">
          {/* ❌ Cancel Button */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-blue-800/40 bg-blue-600/30 hover:bg-blue-600/50 text-white font-semibold transition font-poppins"
          >
            {cancelText}
          </button>

          {/* ✅ Yes / Confirm Button */}
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-lg border border-red-500/40 bg-red-600/40 hover:bg-red-600/60 text-white font-semibold transition font-poppins"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function PreviousResultsModal({ isOpen, onClose }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view previous results.");
      return;
    }

    const fetchPreviousResults = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("http://localhost:8000/previous-results", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch previous results");
        const data = await res.json();

        const userResults = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
          ? data.results
          : [];

        setResults(userResults);
      } catch (err) {
        console.error(err);
        setError("Error loading previous results.");
      } finally {
        setLoading(false);
      }
    };

    fetchPreviousResults();
  }, [isOpen]);

  const handleClearResults = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to clear results.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("http://localhost:8000/clear-results", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to clear previous results.");

      const data = await res.json();
      console.log("🗑️", data.message);

      setResults([]);
    } catch (err) {
      console.error(err);
      setError("Error clearing previous results.");
    } finally {
      setLoading(false);
    }
  };

  const schoolImages = {
    "Holy Angel University": "/logos/hau.png",
    "CELTECH": "/logos/celtech.png",
    "Our Lady Of Fatima University": "/logos/fatima.png",
    "University of the Assumption": "/logos/ua.png",
    "Angeles University Foundation": "/logos/auf.png",
    "AMA Computer College San Fernando Pampanga": "/logos/ama.png",
    "AMA Computer College – Angeles City": "/logos/ama.png",
    "Mabalacat City College": "/logos/mcc.png",
    "City College of Angeles": "/logos/cca.png",
    "City College of San Fernando, Pampanga": "/logos/ccsf.png",
    "Bulacan State University": "/logos/bulsu.png",
    "UPEP PAMPANGA": "/logos/UP.png",
    "Pampanga State Agricultural University": "/logos/psau.png",
    "Pampanga State University": "/logos/psu.png",
    "Pampanga State University - Santo Tomas Campus": "/logos/psu.png",
    "Pampanga State University - Porac Campus": "/logos/psu.png",
    "Pampanga State University - Mexico Campus": "/logos/psu.png",
    "Pampanga State University - Lubao Campus": "/logos/psu.png",
    "Pampanga State University - Candaba Campus": "/logos/psu.png",
    "Pampanga State University - Apalit Campus": "/logos/psu.png",
  };

  const getTuitionDisplay = (tuition) => {
    if (!tuition || tuition === "N/A" || tuition === "n/a") return "Free";
    return tuition;
  };

  const getBoardPassingRateDisplay = (rate) => {
    if (!rate || rate === "-" || rate.toLowerCase().includes("n/a")) {
      return "No Board Exam";
    }
    return rate;
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-center items-start bg-black/60 backdrop-blur-sm overflow-y-auto py-10 px-4 font-poppins">
      <div className="relative bg-[#0a1733]/90 backdrop-blur-2xl border border-blue-400/20 rounded-2xl w-full max-w-6xl p-6 text-white shadow-2xl font-poppins">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-red-400 transition"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold mb-6 text-center font-poppins">
          Previous Results
        </h2>

        <div className="flex justify-end mb-4 font-poppins">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-red-500/70 hover:border-red-500 text-red-400 hover:text-red-300 rounded-lg font-semibold text-sm transition font-poppins"
            onClick={() => setShowConfirmModal(true)}
            disabled={loading}
          >
            <Trash2 size={16} /> {loading ? "Clearing..." : "Clear Results"}
          </button>
        </div>

        {loading ? (
          <p className="text-center text-white/70 font-poppins">
            Loading previous results...
          </p>
        ) : error ? (
          <p className="text-center text-red-400 font-poppins">{error}</p>
        ) : results.length === 0 ? (
          <p className="text-center text-white/70 font-poppins">
            No previous results found.
          </p>
        ) : (
          <div className="space-y-8 font-poppins">
            {results.map((resItem, index) => (
              <div
                key={resItem._id || index}
                className="bg-blue-900/20 p-5 rounded-xl border border-blue-400/30 font-poppins"
              >
                <h3 className="text-xl font-semibold mb-4 text-blue-300 font-poppins">
                  Result #{index + 1}
                </h3>

                {resItem.grades && Object.keys(resItem.grades).length > 0 && (
                  <div className="mb-5 font-poppins">
                    <h4 className="font-semibold mb-2 text-blue-200 font-poppins">
                      Your Grades
                    </h4>
                    <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-400/10 text-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-poppins">
                      {Object.entries(resItem.grades).map(([subject, grade]) => (
                        <div
                          key={subject}
                          className="flex justify-between items-center bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-400/10"
                        >
                          <span className="text-blue-100 font-medium">{subject}</span>
                          <span className="text-white font-semibold">{grade}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Your Previous Answer */}
                <div className="mb-5 font-poppins">
                  <h4 className="font-semibold mb-2 text-blue-200 font-poppins">
                    Your Previous Answer
                  </h4>
                  <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-400/10 text-sm space-y-1 leading-relaxed font-poppins">
                    {Object.entries(resItem.answers || {}).map(([key, value]) => (
                      <div key={key} className="flex gap-1 flex-wrap">
                        <span className="font-medium capitalize text-blue-100">
                          {key}:
                        </span>
                        <span className="text-white/80 break-words">
                          {Array.isArray(value)
                            ? value.join(", ")
                            : typeof value === "object"
                            ? JSON.stringify(value)
                            : value?.toString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Programs */}
                <div className="font-poppins">
                  <h4 className="font-semibold mb-3 text-blue-200 font-poppins">
                    Recommended Programs
                  </h4>
                  {resItem.results && resItem.results.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-blue-400/20 font-poppins">
                      <table className="w-full min-w-[700px] sm:min-w-full text-left border-collapse text-xs sm:text-sm font-poppins">
                        <thead className="bg-blue-950/40 border-b border-blue-400/30 font-semibold text-white whitespace-nowrap font-poppins">
                          <tr>
                            <th className="py-2 px-3">Logo</th>
                            <th className="py-2 px-3">School Name</th>
                            <th className="py-2 px-3">Program / Course Name</th>
                            <th className="py-2 px-3">Location</th>
                            <th className="py-2 px-3">School Type</th>
                            <th className="py-2 px-3">Tuition Fee</th>
                            <th className="py-2 px-3">Board Passing Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resItem.results.map((r, i) => (
                            <tr
                              key={i}
                              className={`border-b border-blue-400/10 hover:bg-blue-950/20 transition font-medium font-poppins ${
                                i % 2 === 0 ? "bg-blue-900/10" : "bg-blue-900/5"
                              }`}
                            >
                              <td className="py-2 px-3">
                                <div className="flex items-center justify-center bg-white p-1 rounded-md w-10 h-10 sm:w-14 sm:h-14 border border-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                                  <img
                                    src={
                                      schoolImages[r.school] ||
                                      "https://via.placeholder.com/80x60?text=School"
                                    }
                                    alt={r.school || "School"}
                                    className="w-8 h-8 sm:w-12 sm:h-12 object-contain rounded"
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-3 font-semibold text-blue-100 whitespace-normal break-words">
                                {r.school || "-"}
                              </td>
                              <td className="py-2 px-3 text-blue-200 whitespace-normal break-words">
                                {r.program || r.course || "N/A"}
                              </td>
                              <td className="py-2 px-3 whitespace-normal break-words">
                                {r.location || "-"}
                              </td>
                              <td className="py-2 px-3 capitalize">
                                {r.school_type || "-"}
                              </td>
                              <td className="py-2 px-3 font-semibold text-blue-200">
                                {getTuitionDisplay(r.tuition_per_semester)}
                              </td>
                              <td className="py-2 px-3">
                                {getBoardPassingRateDisplay(r.board_passing_rate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-white/70 font-poppins">
                      No recommendations found for this result.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🧩 Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleClearResults}
          title="Clear All Results?"
          message="Are you sure you want to delete all previous results? This action cannot be undone."
          confirmText="Yes, Clear"
          cancelText="Cancel"
        />
      </div>
    </div>,
    document.body
  );
}

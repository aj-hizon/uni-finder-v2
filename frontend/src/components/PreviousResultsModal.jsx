import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Trash2 } from "lucide-react";

export default function PreviousResultsModal({ isOpen, onClose }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  // 🏫 Local logo mapping (from /public/logos/)
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

  // 👇 Render the modal at document.body level (prevents clipping or layout bugs)
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

        {/* Clear Results Button */}
        <div className="flex justify-end mb-4 font-poppins">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-red-500/70 hover:border-red-500 text-red-400 hover:text-red-300 rounded-lg font-semibold text-sm transition"
            onClick={() => alert("Clear results feature coming soon!")}
          >
            <Trash2 size={16} /> Clear Results
          </button>
        </div>

        {/* Loading / Error / Empty states */}
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

                {/* User Answers */}
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

                {/* Recommendations */}
                <div className="font-poppins">
                  <h4 className="font-semibold mb-3 text-blue-200 font-poppins">
                    Recommended Programs
                  </h4>
                  {resItem.results && resItem.results.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-blue-400/20 font-poppins">
                      <table className="w-full min-w-[600px] sm:min-w-full text-left border-collapse text-xs sm:text-sm font-poppins">
                        <thead className="bg-blue-950/40 border-b border-blue-400/30 font-semibold text-white whitespace-nowrap">
                          <tr>
                            <th className="py-2 px-3">Logo</th>
                            <th className="py-2 px-3">School Name</th>
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
                              className={`border-b border-blue-400/10 hover:bg-blue-950/20 transition font-medium ${
                                i % 2 === 0
                                  ? "bg-blue-900/10"
                                  : "bg-blue-900/5"
                              }`}
                            >
                              {/* Logo */}
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

                              {/* School Name */}
                              <td className="py-2 px-3 font-semibold text-blue-100 whitespace-normal break-words">
                                {r.school || "-"}
                              </td>

                              {/* Location */}
                              <td className="py-2 px-3 whitespace-normal break-words">
                                {r.location || "-"}
                              </td>

                              {/* School Type */}
                              <td className="py-2 px-3 capitalize">
                                {r.school_type || "-"}
                              </td>

                              {/* Tuition Fee */}
                              <td className="py-2 px-3 font-semibold text-blue-200">
                                {getTuitionDisplay(r.tuition_per_semester)}
                              </td>

                              {/* Board Passing Rate */}
                              <td className="py-2 px-3">
                                {getBoardPassingRateDisplay(
                                  r.board_passing_rate
                                )}
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
      </div>
    </div>,
    document.body // ✅ renders at the root of the DOM
  );
}

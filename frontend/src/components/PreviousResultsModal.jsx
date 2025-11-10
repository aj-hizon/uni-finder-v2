import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Trash2 } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";

// Mapping school names to images
const schoolImages = {
  "Holy Angel University": "/logos/hau.png",
  CELTECH: "/logos/celtech.png",
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

// Helper functions
const getTuitionDisplay = (tuition) => {
  if (tuition === null || tuition === undefined) return "-";

  // If it's a number, format it as currency
  if (typeof tuition === "number") return `₱${tuition.toLocaleString()}`;

  // If it's a string
  if (typeof tuition === "string") {
    const trimmed = tuition.trim().toLowerCase();
    if (trimmed === "n/a" || trimmed === "") return "Free";
    return tuition;
  }

  // fallback for unexpected types
  return String(tuition);
};

const getBoardPassingRateDisplay = (rate) => {
  if (rate === null || rate === undefined) return "No Board Exam";
  if (typeof rate === "string") {
    const trimmed = rate.trim().toLowerCase();
    if (trimmed === "-" || trimmed === "n/a") return "No Board Exam";
    return rate;
  }
  // If it's a number
  if (typeof rate === "number") return `${rate}%`;
  return String(rate);
};

// === Sub-components ===

function GradesGrid({ grades }) {
  if (!grades || Object.keys(grades).length === 0) return null;
  return (
    <div className="mb-5">
      <h4 className="font-semibold mb-2 text-blue-200">Your Grades</h4>
      <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-400/10 text-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(grades).map(([subject, grade]) => (
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
  );
}

function AnswersList({ answers }) {
  if (!answers) return null;
  return (
    <div className="mb-5">
      <h4 className="font-semibold mb-2 text-blue-200">Your Previous Answer</h4>
      <div className="bg-blue-950/30 p-4 rounded-lg border border-blue-400/10 text-sm space-y-1 leading-relaxed">
        {Object.entries(answers).map(([key, value]) => (
          <div key={key} className="flex gap-1 flex-wrap">
            <span className="font-medium capitalize text-blue-100">{key}:</span>
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
  );
}

function ProgramsTable({ results }) {
  if (!results || results.length === 0)
    return (
      <p className="text-white/70">No recommendations found for this result.</p>
    );

  return (
    <div className="overflow-x-auto rounded-lg border border-blue-400/20">
      <table className="w-full min-w-[700px] sm:min-w-full text-left border-collapse text-xs sm:text-sm">
        <thead className="bg-blue-950/40 border-b border-blue-400/30 font-semibold text-white whitespace-nowrap">
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
          {results.map((r, i) => (
            <tr
              key={i}
              className={`border-b border-blue-400/10 hover:bg-blue-950/20 transition font-medium ${
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
              <td className="py-2 px-3 font-semibold text-blue-100">
                {r.school || "-"}
              </td>
              <td className="py-2 px-3 text-blue-200">
                {r.program || r.course || "N/A"}
              </td>
              <td className="py-2 px-3">{r.location || "-"}</td>
              <td className="py-2 px-3 capitalize">{r.school_type || "-"}</td>
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
  );
}

function ResultCard({ resItem, index }) {
  return (
    <div className="bg-blue-900/20 p-5 rounded-xl border border-blue-400/30">
      <h3 className="text-xl font-semibold mb-4 text-blue-300">
        Result #{index + 1}
      </h3>
      <GradesGrid grades={resItem.grades} />
      <AnswersList answers={resItem.answers} />
      <div>
        <h4 className="font-semibold mb-3 text-blue-200">
          Recommended Programs
        </h4>
        <ProgramsTable results={resItem.results} />
      </div>
    </div>
  );
}

// === Main Component ===
export default function PreviousResultsModal({ isOpen, onClose }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!isOpen) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view previous results.");
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE_URL}/previous-results`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420",
          },
        });

        // If server returns non-JSON, log it for debugging
        const contentType = res.headers.get("content-type");
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          console.error("Expected JSON but got:", text);
          throw new Error("Server returned non-JSON response");
        }

        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error("Fetch previous results error:", err);
        setError("Failed to fetch previous results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [isOpen]);

  const handleClearResults = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setError("You must be logged in to clear results.");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/clear-results`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to clear results.");
      setResults([]);
    } catch (err) {
      console.error(err);
      setError("Error clearing previous results.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-center items-start bg-black/60 backdrop-blur-sm overflow-y-auto py-10 px-4">
      <div className="relative bg-[#0a1733]/90 rounded-2xl w-full max-w-6xl p-6 text-white shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4">
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold mb-6 text-center font-poppins">
          Previous Results
        </h2>

        <div className="flex justify-end mb-4">
          <button
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-red-400 hover:text-red-300"
            onClick={() => setShowConfirmModal(true)}
            disabled={loading}
          >
            <Trash2 size={16} /> {loading ? "Clearing..." : "Clear Results"}
          </button>
        </div>

        {loading ? (
          <p className="text-center">Loading previous results...</p>
        ) : error ? (
          <p className="text-center text-red-400">{error}</p>
        ) : results.length === 0 ? (
          <p className="text-center">No previous results found.</p>
        ) : (
          <div className="space-y-6">
            {results.map((resItem, idx) => (
              <ResultCard
                key={resItem._id || idx}
                resItem={resItem}
                index={idx}
              />
            ))}
          </div>
        )}

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

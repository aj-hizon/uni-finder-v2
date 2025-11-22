import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

// Program Card Component
const ProgramCard = ({ program, onEdit, onDelete }) => (
  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg hover:shadow-2xl relative transition text-white font-poppins">
    {/* Top Section: Logo + Names */}
    <div className="flex flex-col md:flex-row items-start gap-4 mb-4">
      {program.school_logo && (
        <img
          src={program.school_logo}
          alt={program.school}
          className="w-20 h-auto rounded"
        />
      )}
      <div>
        <h3 className="text-lg font-bold text-white">{program.school}</h3>
        <h2 className="text-xl font-bold">{program.name}</h2>
      </div>
    </div>

    {/* Fields as Table */}
    <div className="text-white grid grid-cols-1 sm:grid-cols-2 gap-2 mb-10">
      {program.location && (
        <>
          <span className="font-semibold">Location:</span>
          <span className="border-b border-white/40">{program.location}</span>
        </>
      )}
      {program.school_type && (
        <>
          <span className="font-semibold">School Type:</span>
          <span className="border-b border-white/40">{program.school_type}</span>
        </>
      )}
      {program.category && (
        <>
          <span className="font-semibold">Category:</span>
          <span className="border-b border-white/40">{program.category}</span>
        </>
      )}
      {program.uni_rank && (
        <>
          <span className="font-semibold">Uni Rank:</span>
          <span className="border-b border-white/40">{program.uni_rank}</span>
        </>
      )}
      {program.board_passing_rate && (
        <>
          <span className="font-semibold">Board Passing Rate:</span>
          <span className="border-b border-white/40">{program.board_passing_rate}</span>
        </>
      )}
      {program.admission_requirements && (
        <>
          <span className="font-semibold">Admission Requirements:</span>
          <span className="border-b border-white/40">{program.admission_requirements}</span>
        </>
      )}
      {program.grade_requirements && (
        <>
          <span className="font-semibold">Grade Requirements:</span>
          <span className="border-b border-white/40">{program.grade_requirements}</span>
        </>
      )}
      {program.school_requirements && (
        <>
          <span className="font-semibold">School Requirements:</span>
          <span className="border-b border-white/40">{program.school_requirements}</span>
        </>
      )}
      {program.tuition_per_semester && (
        <>
          <span className="font-semibold">Tuition / Semester:</span>
          <span className="border-b border-white/40">{program.tuition_per_semester}</span>
        </>
      )}
      {program.tuition_annual && (
        <>
          <span className="font-semibold">Annual Tuition:</span>
          <span className="border-b border-white/40">{program.tuition_annual}</span>
        </>
      )}
      {program.tuition_notes && (
        <>
          <span className="font-semibold">Tuition Notes:</span>
          <span className="border-b border-white/40">{program.tuition_notes}</span>
        </>
      )}
      {program.school_website && (
        <>
          <span className="font-semibold">Website:</span>
          <span className="border-b border-white/40">
            <a
              href={program.school_website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 underline font-semibold"
            >
              {program.school_website}
            </a>
          </span>
        </>
      )}
      {program.description && (
        <>
          <span className="font-semibold">Description:</span>
          <span className="border-b border-white/40">{program.description}</span>
        </>
      )}
    </div>

    {/* Edit/Delete Buttons */}
    <div className="absolute bottom-4 right-4 flex gap-2">
      <button
        onClick={() => onEdit(program)}
        className="px-3 py-1 bg-green-400/30 backdrop-blur-md border border-green-300 text-white font-semibold rounded hover:bg-green-400/50 transition"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(program.id)}
        className="px-3 py-1 bg-red-400/30 backdrop-blur-md border border-red-300 text-white font-semibold rounded hover:bg-red-400/50 transition"
      >
        Delete
      </button>
    </div>
  </div>
);

const Management = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [recentPrograms, setRecentPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSchool, setFilterSchool] = useState("");
  const [showRecent, setShowRecent] = useState(false);
  const [schools, setSchools] = useState([
    "Pampanga State University",
    "Pampanga State Agricultural University",
    "Bulacan State University",
    "UPEP",
    "City College of San Fernando",
    "City College of Angeles",
    "Mabalacat City College",
    "Holy Angel University",
    "AMA Computer College",
    "Angeles University Foundation",
    "University of the Assumption",
    "Our Lady of Fatima University",
    "Central Luzon College of Science and Technology (Celtech)",
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({});

  // Toast message
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  const triggerMessage = (text) => {
    setMessage(text);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  // ---------------------------
  // ADMIN PROTECTION
  // ---------------------------
  useEffect(() => {
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // ---------------------------
  // Fetch Programs
  // ---------------------------
  const fetchPrograms = async () => {
    try {
      const res = await axios.get("http://localhost:8000/admin/program_vectors");
      const data = res.data.map(({ vector, ...rest }) => rest);
      setPrograms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPrograms = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/admin/program_vectors/recent"
      );
      const data = res.data.map(({ vector, ...rest }) => rest);
      setRecentPrograms(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchRecentPrograms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNew = () => {
    setFormData({});
    setEditingProgram(null);
    setShowModal(true);
  };

  const handleEdit = (program) => {
    setEditingProgram(program);
    setFormData(program);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProgram) {
        await axios.put(
          `http://localhost:8000/admin/program_vectors/${editingProgram.id}`,
          formData
        );
        triggerMessage("Program updated successfully!");
      } else {
        await axios.post(
          "http://localhost:8000/admin/program_vectors",
          formData
        );
        triggerMessage("New program created successfully!");
      }

      const newSchool = formData.school?.trim();
      if (newSchool && !schools.includes(newSchool)) {
        setSchools((prev) => [...prev, newSchool]);
      }

      setShowModal(false);
      fetchPrograms();
      fetchRecentPrograms();
    } catch (err) {
      console.error(err);
      triggerMessage("Operation failed. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this program?")) return;
    try {
      await axios.delete(`http://localhost:8000/admin/program_vectors/${id}`);
      triggerMessage("Program deleted successfully!");
      fetchPrograms();
      fetchRecentPrograms();
    } catch (err) {
      console.error(err);
      triggerMessage("Failed to delete the program.");
    }
  };

  const filteredPrograms = filterSchool
    ? programs.filter(
        (p) =>
          p.school.split(" ")[0].toLowerCase() ===
          filterSchool.split(" ")[0].toLowerCase()
      )
    : programs;

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0f2c]">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-white/20 rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen font-poppins text-white" style={{ backgroundColor: "#0a0f2c" }}>
      {/* Toast message */}
      {showMessage && (
        <div className="fixed top-6 right-6 bg-green-400/30 backdrop-blur-md border border-green-300 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity duration-300">
          {message}
        </div>
      )}

      <div className="pt-32 px-4 sm:px-8 relative z-10">
        <Navbar />

        {/* Page Title */}
        <h1 className="text-3xl font-bold text-center mb-6 mt-6">
          Admin Management Page
        </h1>

        {/* Filter + Recent Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between w-full">
          <div className="flex gap-4 items-center w-full sm:w-auto">
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="px-3 py-1 rounded bg-gray-900 text-white border border-white/20"
            >
              <option value="">All Schools</option>
              {schools.map((s) => (
                <option key={s} value={s} className="bg-gray-900 text-white">
                  {s}
                </option>
              ))}
            </select>

            <button
              onClick={handleNew}
              className="px-4 py-2 bg-blue-400/30 backdrop-blur-md border border-blue-300 text-white rounded hover:bg-blue-400/50 transition"
            >
              + Create New
            </button>
          </div>

          {recentPrograms.length > 0 && (
            <button
              onClick={() => setShowRecent((prev) => !prev)}
              className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded hover:bg-white/20 transition mt-2 sm:mt-0"
            >
              {showRecent
                ? "Hide Recently Added / Edited"
                : "Show Recently Added / Edited"}
            </button>
          )}
        </div>

        {/* Recently Added / Edited */}
        {showRecent && recentPrograms.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-4">
              Recently Added / Edited Programs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {recentPrograms.map((p) => (
                <ProgramCard
                  key={p.id}
                  program={p}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}

        {/* All Programs */}
        <h2 className="text-2xl font-bold mb-4">All Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto text-white font-poppins">
              <h2 className="text-xl font-bold mb-4">
                {editingProgram ? "Edit Program" : "New Program"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3">
                {[
                  "school",
                  "name",
                  "description",
                  "tuition_per_semester",
                  "tuition_annual",
                  "admission_requirements",
                  "grade_requirements",
                  "school_requirements",
                  "school_website",
                  "location",
                  "school_type",
                  "board_passing_rate",
                  "category",
                  "tuition_notes",
                  "uni_rank",
                ].map((field) => (
                  <div key={field}>
                    <label className="block font-semibold capitalize mb-1">
                      {field.replaceAll("_", " ")}
                    </label>
                    {field === "description" ? (
                      <textarea
                        name={field}
                        value={formData[field] || ""}
                        onChange={handleChange}
                        className="w-full border border-white/20 px-2 py-1 rounded bg-white/10 backdrop-blur-md text-white"
                      />
                    ) : (
                      <input
                        type="text"
                        name={field}
                        value={formData[field] || ""}
                        onChange={handleChange}
                        className="w-full border border-white/20 px-2 py-1 rounded bg-white/10 backdrop-blur-md text-white"
                      />
                    )}
                  </div>
                ))}

                <div>
                  <label className="block font-semibold mb-1">School Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      const uploadData = new FormData();
                      uploadData.append("file", file);

                      try {
                        const res = await axios.post(
                          "http://localhost:8000/admin/upload_logo",
                          uploadData,
                          { headers: { "Content-Type": "multipart/form-data" } }
                        );
                        setFormData((prev) => ({
                          ...prev,
                          school_logo: res.data.url,
                        }));
                      } catch (err) {
                        console.error("Logo upload failed:", err);
                      }
                    }}
                    className="w-full border border-white/20 px-2 py-1 rounded bg-white/10 backdrop-blur-md text-white"
                  />
                  {formData.school_logo && (
                    <img
                      src={formData.school_logo}
                      alt="School Logo"
                      className="mt-2 w-24 h-auto rounded"
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-red-400/30 backdrop-blur-md border border-red-300 rounded hover:bg-red-400/50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-400/30 backdrop-blur-md border border-blue-300 rounded hover:bg-blue-400/50 transition"
                  >
                    {editingProgram ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Management;

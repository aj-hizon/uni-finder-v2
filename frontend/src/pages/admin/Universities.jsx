import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { Dialog } from "@headlessui/react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const fields = [
  "school",
  "school_logo",
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
  "national_passing_rate",
];

const normalizeUni = (uni) => ({
  ...uni,
  _id: uni._id || uni.id,
});

const Universities = () => {
  const [universities, setUniversities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // <-- loader state

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setError("Admin token is missing!");
      setLoading(false);
      return;
    }

    const fetchUniversities = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/program_vectors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUniversities(res.data.map(normalizeUni));
      } catch (err) {
        console.error(
          "Error fetching universities:",
          err.response?.data || err
        );
        setError(err.response?.data?.detail || "Failed to fetch universities");
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, [token]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const closeModal = () => {
    setIsModalOpen(false);
    setForm({});
    setEditingId(null);
  };

  const handleAddOrUpdate = async () => {
    if (!token) return alert("Admin token is missing!");
    try {
      let res;
      if (editingId) {
        const { _id, ...dataToUpdate } = form;
        res = await axios.put(
          `${API_BASE_URL}/admin/program_vectors/${editingId}`,
          dataToUpdate,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUniversities(
          universities.map((u) =>
            u._id === editingId ? normalizeUni(res.data) : u
          )
        );
      } else {
        res = await axios.post(`${API_BASE_URL}/admin/program_vectors`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUniversities([...universities, normalizeUni(res.data)]);
      }
      closeModal();
    } catch (err) {
      console.error("Error saving university:", err.response?.data || err);
      alert(err.response?.data?.detail || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return console.error("University ID is undefined!");
    if (!confirm("Are you sure you want to delete this university?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/program_vectors/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUniversities(universities.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Error deleting university:", err.response?.data || err);
      alert(err.response?.data?.detail || err.message);
    }
  };

  const openEditModal = (uni) => {
    setForm(uni);
    setEditingId(uni._id);
    setIsModalOpen(true);
  };

  if (error)
    return <div className="text-red-500 font-bold p-4">Error: {error}</div>;

  const filteredUniversities = universities.filter((uni) =>
    (uni.name || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  const totalPages = Math.ceil(filteredUniversities.length / itemsPerPage);
  const paginatedUniversities = filteredUniversities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-blue-50 to-white relative">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-400"></div>
        </div>
      )}

      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-6 font-poppins text-blue-800">
          Universities & Programs Management
        </h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="mb-6 bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add University
        </button>

        {/* Search input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="text-black w-full md:w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* University Table */}
        <div className="bg-white p-4 rounded-xl shadow-lg max-h-[600px] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4 font-poppins text-gray-700">
            University List
          </h2>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-gray-600">School</th>
                <th className="py-2 text-gray-600">Program</th>
                <th className="py-2 text-gray-600">Location</th>
                <th className="py-2 text-gray-600">Category</th>
                <th className="py-2 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUniversities.map((uni) => (
                <tr
                  key={uni._id}
                  className="border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer text-sm"
                  onClick={() => openEditModal(uni)}
                >
                  <td className="py-1 text-black">{uni.school}</td>
                  <td className="py-1 text-black">{uni.name}</td>
                  <td className="py-1 text-black">{uni.location}</td>
                  <td className="py-1 text-black">{uni.category}</td>
                  <td className="py-1 flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(uni._id);
                      }}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination controls (same as before) */}
          {/* Pagination Controls */}
          <div className="flex justify-center mt-4 gap-2 text-black text-sm">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Prev
            </button>

            {currentPage > 2 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  1
                </button>
                {currentPage > 3 && <span className="px-2">...</span>}
              </>
            )}

            {Array.from({ length: 3 }, (_, i) => currentPage - 1 + i)
              .filter((page) => page >= 1 && page <= totalPages)
              .map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${
                    currentPage === page
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {page}
                </button>
              ))}

            {currentPage < totalPages - 1 && (
              <>
                {currentPage < totalPages - 2 && (
                  <span className="px-2">...</span>
                )}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Modal (same as before) */}
        <Dialog
          open={isModalOpen}
          onClose={closeModal}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-semibold font-poppins text-gray-800">
                  {editingId ? "Update University" : "Add University"}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div key={field} className="flex flex-col">
                    <label className="font-poppins text-gray-700 mb-1 capitalize">
                      {field.replaceAll("_", " ")}
                    </label>
                    <input
                      type="text"
                      name={field}
                      value={form[field] || ""}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-300 text-black"
                    />
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-red-400 hover:bg-red-500 transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrUpdate}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  {editingId ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default Universities;

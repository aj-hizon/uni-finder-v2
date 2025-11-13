import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Star,
  ListChecks,
  Award,
  Home,
  Bus,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";
import Navbar from "../components/Navbar";

function normalize(str) {
  return str.toLowerCase().replace(/\s+/g, " ").trim();
}

function findSchoolData(schoolName, schoolsArray) {
  const normalizedName = normalize(schoolName);
  return (
    schoolsArray.find((school) => normalize(school.school) === normalizedName) ||
    null
  );
}

export default function ComparePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedSchools = location.state?.selectedSchools || [];
  const [schoolsData, setSchoolsData] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Remove duplicates (case-insensitive)
  const uniqueSchools = Array.from(
    new Map(selectedSchools.map((s) => [normalize(s.school), s])).values()
  );

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/school-strengths`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => setSchoolsData(data.schools || []))
      .catch((error) => {
        console.error("Error fetching school strengths:", error);
        setSchoolsData([]);
      });
  }, [API_BASE_URL]);

  const specs = [
    { label: "Known For", key: "what_theyre_known_for", icon: Star },
    {
      label: "Institutional Strengths",
      key: "institutional_strengths",
      icon: ListChecks,
      format: (v) => (v?.length ? v.join(", ") : "No data available"),
    },
    {
      label: "PH Rank",
      key: "unirank",
      icon: Award,
      format: (v) => {
        if (!v) return "No ranking available";
        if (v.central_luzon_rank) return `#${v.central_luzon_rank} Central Luzon`;
        if (v.country_rank && v.world_rank) return `#${v.country_rank} PH / #${v.world_rank} Global`;
        return "No ranking available";
      },
    },
    { label: "Dorm / Apartment", key: "dorm_apartment", icon: Home },
    { label: "Transport Access", key: "transport_access", icon: Bus },
    {
      label: "Scholarships Offered",
      key: "scholarships_offered",
      icon: GraduationCap,
      format: (v) => (v?.length ? v.join(", ") : "No scholarships listed"),
    },
  ];

  const softGradients = [
    "from-[#1e3a8a]/40 via-[#3b82f6]/20 to-[#93c5fd]/10",
    "from-[#6d28d9]/30 via-[#8b5cf6]/20 to-[#c4b5fd]/10",
    "from-[#991b1b]/30 via-[#ef4444]/20 to-[#fca5a5]/10",
    "from-[#064e3b]/30 via-[#10b981]/20 to-[#6ee7b7]/10",
    "from-[#92400e]/30 via-[#f59e0b]/20 to-[#fcd34d]/10",
    "from-[#7c2d12]/30 via-[#ea580c]/20 to-[#fdba74]/10",
    "from-[#1e293b]/30 via-[#334155]/20 to-[#64748b]/10",
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white font-Poppins pt-32 px-4 pb-24"
      style={{ backgroundImage: "url('/images/main.jpg')" }}
    >
      <Navbar />

      {uniqueSchools.length === 0 ? (
        <p className="text-center text-gray-400 font-Poppins mt-10">
          No schools selected. Please return and choose at least two.
        </p>
      ) : (
        <div>
          <div
            className={`mt-12 grid gap-6 justify-center ${
              uniqueSchools.length === 1
                ? "grid-cols-1 max-w-md mx-auto"
                : uniqueSchools.length === 2
                ? "grid-cols-1 sm:grid-cols-2 max-w-6xl mx-auto"
                : "md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {uniqueSchools.map((school, i) => {
              const data = findSchoolData(school.school, schoolsData);

              return (
                <div
                  key={i}
                  className={`bg-gradient-to-tr ${softGradients[i % softGradients.length]} backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition ${
                    uniqueSchools.length === 2 ? "w-full" : ""
                  }`}
                >
                  {data?.logo && (
                    <div className="flex justify-center mb-4">
                      <div className="bg-white/90 p-2 rounded-full shadow-md">
                        <img
                          src={`/logos/${data.logo}`}
                          alt={school.school}
                          className="w-16 h-16 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <h2 className="text-xl font-bold text-center mb-4 font-Merriweather">
                    {school.school}
                  </h2>

                  <ul className="divide-y divide-white/10 mt-4">
                    {specs.map((spec, idx) => {
                      const Icon = spec.icon;
                      const value = spec.format
                        ? spec.format(data?.[spec.key])
                        : data?.[spec.key] || "No data available";

                      return (
                        <li
                          key={idx}
                          className="flex items-start gap-3 py-2 text-sm text-gray-200 font-Poppins"
                        >
                          <Icon className="w-5 h-5 mt-0.5 text-white/80 shrink-0" />
                          <div>
                            <p className="font-medium text-white font-Merriweather">
                              {spec.label}
                            </p>
                            <p className="text-gray-300 font-Poppins">{value}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <button
              onClick={() =>
                navigate("/compare-program", { state: { selectedSchools } })
              }
              className="!px-5 !py-2.5 sm:!px-8 sm:!py-3 !rounded-full !bg-blue-800/20 !backdrop-blur-md !border !border-white/30 !text-white text-xs sm:text-sm font-Poppins font-medium !shadow-lg hover:!bg-blue-800/30 transition duration-300 ease-in-out flex items-center w-full sm:w-auto"
              style={{
                WebkitBackdropFilter: "blur(10px)",
                backdropFilter: "blur(10px)",
              }}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

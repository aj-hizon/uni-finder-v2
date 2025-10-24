import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Award } from "lucide-react";

import {
  GraduationCap,
  BookOpen,
  Building2,
  MapPin,
  ListChecks,
  FileText,
  DollarSign,
  Globe,
} from "lucide-react";

/** Helpers */
const hasValue = (v) => {
  if (v === 0) return true;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  return v !== null && v !== undefined;
};

const valueOf = (obj, aliases) => {
  for (const key of aliases) {
    if (Object.prototype.hasOwnProperty.call(obj ?? {}, key)) {
      const v = obj[key];
      if (hasValue(v)) return v;
      return v;
    }
  }
  return null;
};

const renderValue = (v) => {
  if (!hasValue(v)) return "N/A";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const normalizeSchool = (school) => {
  const n = {};
  n.school = valueOf(school, ["school", "school_name", "name"]);
  n.school_logo = valueOf(school, ["school_logo", "logo", "image"]);
  n.program = valueOf(school, ["program", "course", "degree"]);
  n.category = valueOf(school, ["category", "field", "discipline"]);
  n.school_type = valueOf(school, ["school_type", "type"]);
  n.location = valueOf(school, ["location", "city", "address"]);
  n.admission_requirements = valueOf(school, [
    "admission_requirements",
    "admission",
  ]);
  n.grade_requirements = valueOf(school, [
    "grade_requirements",
    "gwa_requirement",
  ]);
  n.school_requirements = valueOf(school, [
    "school_requirements",
    "other_requirements",
  ]);
  n.tuition_per_semester = valueOf(school, [
    "tuition_per_semester",
    "tuition_semester",
  ]);
  n.tuition_annual = valueOf(school, ["tuition_annual", "annual_tuition"]);
  n.tuition_notes = valueOf(school, ["tuition_notes", "notes"]);
  n.board_passing_rate = valueOf(school, [
    "board_passing_rate",
    "passing_rate",
  ]);
  n.uni_rank = valueOf(school, ["uni_rank", "ranking", "rank"]);
  n.school_website = valueOf(school, ["school_website", "website"]);
  return n;
};

export default function CompareProgram() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedSchools = location.state?.selectedSchools || [];

  const [activeFilter, setActiveFilter] = useState(""); // default empty
  const [subOption, setSubOption] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!selectedSchools.length) {
    return (
      <div
        className="min-h-screen bg-cover bg-center text-white font-Poppins"
        style={{ backgroundImage: "url('/images/bg-home3.jpg')" }}
      >
        <Navbar />
        <div className="p-6 sm:p-8 text-center pt-24 font-Poppins">
          <p className="text-sm sm:text-base">
            No schools selected for comparison.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2.5 rounded-full bg-blue-800/30 backdrop-blur-md border border-white/30 text-white text-sm font-medium shadow-lg hover:bg-blue-800/40 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const normalizedSchools = selectedSchools.map((s) => normalizeSchool(s));
  let displayedResults = [...normalizedSchools];

  /** === Sorting / Filtering Logic === */
  if (activeFilter === "board" && subOption) {
    if (subOption === "board_high") {
      displayedResults.sort(
        (a, b) =>
          (parseFloat(b.board_passing_rate) || 0) -
          (parseFloat(a.board_passing_rate) || 0)
      );
    } else if (subOption === "board_low") {
      displayedResults.sort(
        (a, b) =>
          (parseFloat(a.board_passing_rate) || 0) -
          (parseFloat(b.board_passing_rate) || 0)
      );
    }
  } else if (activeFilter === "tuition" && subOption) {
    displayedResults = displayedResults.filter((s) => {
      const tuition = parseFloat(s.tuition_per_semester) || 0;
      if (subOption === "0-3000") return tuition <= 3000;
      if (subOption === "3000-5000") return tuition > 3000 && tuition <= 5000;
      if (subOption === "5000-8000") return tuition > 5000 && tuition <= 8000;
      if (subOption === "8000-12000") return tuition > 8000 && tuition <= 12000;
      if (subOption === "12000+") return tuition > 12000;
      return true;
    });
  } else if (activeFilter === "school_type" && subOption) {
    displayedResults = displayedResults.filter((s) =>
      s.school_type?.toLowerCase().includes(subOption.toLowerCase())
    );
  } else if (activeFilter === "location" && subOption) {
    if (subOption === "Other") {
      displayedResults = displayedResults.filter(
        (s) =>
          !["angeles", "san fernando", "mabalacat"].some((city) =>
            s.location?.toLowerCase().includes(city)
          )
      );
    } else {
      displayedResults = displayedResults.filter((s) =>
        s.location?.toLowerCase().includes(subOption.toLowerCase())
      );
    }
  } else if (activeFilter === "unirank") {
  // --- UniRank Sorting (School-level grouping) ---
  // Step 1: Group programs by school
  const grouped = {};
  normalizedSchools.forEach((item) => {
    if (!grouped[item.school]) grouped[item.school] = [];
    grouped[item.school].push(item);
  });

  // Step 2: Sort schools by their UniRank
  const sortedSchools = Object.keys(grouped).sort((a, b) => {
    const rankA = parseInt(grouped[a][0].uni_rank) || 999;
    const rankB = parseInt(grouped[b][0].uni_rank) || 999;
    return rankA - rankB;
  });

  // Step 3: Flatten programs but grouped per school
  displayedResults = sortedSchools.flatMap((school) => grouped[school]);
}


  const rows = [
    { label: "Program", key: "program", icon: <BookOpen className="w-4 h-4" /> },
    { label: "Category", key: "category", icon: <ListChecks className="w-4 h-4" /> },
    { label: "Type", key: "school_type", icon: <Building2 className="w-4 h-4" /> },
    { label: "Location", key: "location", icon: <MapPin className="w-4 h-4" /> },
    { label: "Admission Requirements", key: "admission_requirements", icon: <FileText className="w-4 h-4" /> },
    { label: "Grade Requirements", key: "grade_requirements", icon: <ListChecks className="w-4 h-4" /> },
    { label: "Other Requirements", key: "school_requirements", icon: <FileText className="w-4 h-4" /> },
    { label: "Tuition / Semester", key: "tuition_per_semester", icon: <DollarSign className="w-4 h-4" /> },
    { label: "Tuition / Year", key: "tuition_annual", icon: <DollarSign className="w-4 h-4" /> },
    { label: "Tuition Notes", key: "tuition_notes", icon: <FileText className="w-4 h-4" /> },
    { label: "Board Passing Rate", key: "board_passing_rate", icon: <GraduationCap className="w-4 h-4" /> },
    { label: "Website", key: "school_website", icon: <Globe className="w-4 h-4" />, isLink: true },
  ];

  const softGradients = [
    "from-[#1e3a8a]/40 via-[#0ea5e9]/25 to-[#99f6e4]/10"
  ];

  return (
    <div
      className="compare-program min-h-screen bg-cover bg-center bg-no-repeat text-white pt-24 px-4 sm:px-8 pb-28"
      style={{ backgroundImage: "url('/images/main.jpg')" }}
    >
      <Navbar />

      {/* Sorting & Filtering */}
      <div className="flex flex-wrap justify-center gap-3 mt-10 mb-12 text-white font-Poppins">
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setSubOption("");
          }}
          className="bg-white/10 border border-white/30 rounded-full px-4 py-2 backdrop-blur-md text-white"
        >
          <option value="">Select Filter / Sort</option>
          <option value="board">Board Passing Rate</option>
          <option value="tuition">Tuition Fee</option>
          <option value="school_type">School Type</option>
          <option value="location">Location</option>
          <option value="unirank">UniRank</option>
        </select>

        {activeFilter === "board" && (
          <select
            value={subOption}
            onChange={(e) => setSubOption(e.target.value)}
            className="bg-white/10 border border-white/30 rounded-full px-4 py-2 backdrop-blur-md text-white"
          >
            <option value="">Select Board Rate</option>
            <option value="board_high">High → Low</option>
            <option value="board_low">Low → High</option>
          </select>
        )}

        {activeFilter === "tuition" && (
          <select
            value={subOption}
            onChange={(e) => setSubOption(e.target.value)}
            className="bg-white/10 border border-white/30 rounded-full px-4 py-2 backdrop-blur-md text-white"
          >
            <option value="">Select Tuition Range</option>
            <option value="0-3000">₱0 - ₱3,000</option>
            <option value="3000-5000">₱3,000 - ₱5,000</option>
            <option value="5000-8000">₱5,000 - ₱8,000</option>
            <option value="8000-12000">₱8,000 - ₱12,000</option>
            <option value="12000+">₱12,000+</option>
          </select>
        )}

        {activeFilter === "school_type" && (
          <select
            value={subOption}
            onChange={(e) => setSubOption(e.target.value)}
            className="bg-white/10 border border-white/30 rounded-full px-4 py-2 backdrop-blur-md text-white"
          >
            <option value="">Select School Type</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        )}

        {activeFilter === "location" && (
          <select
            value={subOption}
            onChange={(e) => setSubOption(e.target.value)}
            className="bg-white/10 border border-white/30 rounded-full px-4 py-2 backdrop-blur-md text-white"
          >
            <option value="">Select Location</option>
            <option value="Angeles">Angeles</option>
            <option value="San Fernando">San Fernando</option>
            <option value="Mabalacat">Mabalacat</option>
            <option value="Other">Other</option>
          </select>
        )}

        {activeFilter === "unirank" && (
          <div className="text-white font-semibold px-4 py-2 bg-white/10 rounded-full">
            Sorted by UniRank
          </div>
        )}

        {(activeFilter || subOption) && (
          <button
            onClick={() => {
              setActiveFilter("");
              setSubOption("");
            }}
            className="bg-red-600/50 hover:bg-red-600/70 text-white px-4 py-2 rounded-full"
          >
            Clear
          </button>
        )}
      </div>

      {/* School Cards */}
      <div
        className="grid gap-8 justify-center"
        style={{
          gridTemplateColumns:
            displayedResults.length === 1
              ? "minmax(280px, 520px)"
              : displayedResults.length === 2
              ? "repeat(2, minmax(300px, 480px))"
              : "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {displayedResults.map((s, idx) => {
          // Compute rank properly (school-level rank for unirank)
let rank;
if (activeFilter === "unirank") {
  const uniqueSchools = [...new Set(displayedResults.map((r) => r.school))];
  rank = uniqueSchools.indexOf(s.school) + 1;
} else {
  rank = idx + 1;
}

const showMedal =
  ((activeFilter === "board" && subOption) ||
    activeFilter === "unirank" ||
    (activeFilter === "tuition" && subOption)) &&
  rank <= 3;


          const medalColors = {
            1: "text-yellow-400 drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]",
            2: "text-gray-300 drop-shadow-[0_0_6px_rgba(200,200,200,0.6)]",
            3: "text-amber-700 drop-shadow-[0_0_6px_rgba(205,127,50,0.6)]",
          };

          return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${
                softGradients[idx % softGradients.length]
              } border border-white/30 rounded-3xl p-6 sm:p-8 shadow-lg backdrop-blur-lg hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-shadow duration-300 font-Poppins relative`}
            >
              {showMedal && (
  <div className="absolute top-3 left-3 flex items-center gap-2">
    <Award
      size={36}
      className={`${medalColors[rank] || "text-gray-500"} drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] animate-pulse`}
    />
    <span className="text-white font-semibold text-sm sm:text-base">
      {rank === 1 ? "1st Place" : rank === 2 ? "2nd Place" : "3rd Place"}
    </span>
  </div>
)}


              <div className="flex flex-col items-center mb-6">
                {hasValue(s.school_logo) && (
                  <img
                    src={s.school_logo}
                    alt={s.school}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-full mb-3 bg-white p-2 shadow-lg"
                  />
                )}
                <h2 className="font-semibold text-white text-center text-lg sm:text-xl tracking-wide">
                  {s.school}
                </h2>
              </div>

              <div className="divide-y divide-white/20 mt-4 text-white text-sm font-Poppins">
                {rows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className="py-3 group transition-all duration-200 hover:bg-white/5 rounded-lg px-3 font-Poppins"
                  >
                    <div className="flex items-center flex-wrap gap-2 text-left font-Poppins">
                      <span className="text-sky-400">{row.icon}</span>
                      <h3 className="font-semibold text-gray-100 text-sm sm:text-base tracking-wide font-Poppins">
                        {row.label}:
                      </h3>

                      {row.isLink && hasValue(s[row.key]) ? (
                        <a
                          href={s[row.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 underline text-xs sm:text-sm hover:text-blue-100 transition break-all font-Poppins"
                        >
                          {new URL(s[row.key]).hostname.replace("www.", "")}
                        </a>
                      ) : (
                        <p className="text-gray-300 text-xs sm:text-sm leading-snug break-words font-Poppins">
                          {renderValue(s[row.key])}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center font-Poppins">
        <button
          onClick={() => navigate("/results")}
          className="px-6 py-3 rounded-full bg-blue-800/30 backdrop-blur-md border border-white/30 text-white text-sm font-medium shadow-lg hover:bg-blue-800/40 transition"
        >
          Back to Results
        </button>
        <button
          onClick={() => navigate("/Compare", { state: { selectedSchools } })}
          className="px-6 py-3 rounded-full bg-blue-800/30 backdrop-blur-md border border-white/30 text-white text-sm font-medium shadow-lg hover:bg-blue-800/40 transition"
        >
          View More
        </button>
      </div>
    </div>
  );
}

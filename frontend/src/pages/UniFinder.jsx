import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MapPin,
  DollarSign,
  School,
  Search,
  HelpCircle,
  Award,
} from "lucide-react";
import Navbar from "../components/Navbar";

function UniFinder() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [answers, setAnswers] = useState({
    academics: [],
    fields: [],
    activities: [],
    goals: [],
    environment: [],
    custom: {
      academics: "",
      fields: "",
      activities: "",
      goals: "",
      environment: "",
    },
  });

  const [schoolType, setSchoolType] = useState("any");
  const [locations, setLocations] = useState([]);
  const [maxBudget, setMaxBudget] = useState(50000);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleCheckboxChange = (questionKey, choice) => {
    setAnswers((prevAnswers) => {
      const selected = prevAnswers[questionKey];
      const isSelected = selected.includes(choice);

      // If already selected, remove it
      if (isSelected) {
        return {
          ...prevAnswers,
          [questionKey]: selected.filter((item) => item !== choice),
        };
      } else {
        // Limit to 2 choices only
        if (selected.length >= 2) return prevAnswers;
        return {
          ...prevAnswers,
          [questionKey]: [...selected, choice],
        };
      }
    });
  };

  const handleCustomChange = (category, value) => {
    setAnswers((prev) => ({
      ...prev,
      custom: { ...prev.custom, [category]: value },
    }));
  };

  const allLocations = [
    "Angeles",
    "Apalit",
    "Bacolor",
    "Candaba",
    "Mabalacat",
    "Magalang",
    "Malolos, Bulacan",
    "Mexico",
    "Porac",
    "San Fernando",
  ];
  const filteredLocations =
    schoolType === "private" ? ["Angeles", "San Fernando"] : allLocations;

  const questions = [
    {
      key: "academics",
      title: "Which school subjects or learning areas excite you the most?",
      choices: [
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "English",
        "History",
        "Geography",
        "Sports",
        "Visual Arts",
        "Music",
        "Drama/Performing Arts",
        "ICT",
        "Economics",
        "Philosophy",
        "Languages",
      ],
    },
    {
      key: "fields",
      title:
        "Which career industries or professional fields interest you most?",
      choices: [
        "Engineering",
        "Architecture",
        "Graphic Design",
        "Film & Animation",
        "Healthcare",
        "Education",
        "Community & Social Work",
        "Law & Governance",
        "Information Technology",
        "Research & Development",
        "Entrepreneurship",
        "Environmental Science",
      ],
    },
    {
      key: "activities",
      title: "What types of tasks do you naturally enjoy or excel at?",
      choices: [
        "Designing/Creating",
        "Problem-solving",
        "Writing/Storytelling",
        "Hands-on building/Repairing",
        "Mentoring/Guiding others",
        "Researching/Analyzing",
        "Presenting/Speaking",
        "Organizing/Planning",
        "Data Interpretation",
        "Experimenting/Testing",
        "Strategizing/Decision-making",
      ],
    },
    {
      key: "goals",
      title: "What outcomes or achievements matter most in your future career?",
      choices: [
        "Improving lives",
        "Driving innovation",
        "Educating others",
        "Growing a business",
        "Promoting fairness & justice",
        "Protecting the environment",
        "Mastering expertise in a field",
        "Gaining recognition for work",
        "Creating sustainable solutions",
        "Building professional networks",
      ],
    },
    {
      key: "environment",
      title:
        "What kind of workplace or setting do you see yourself thriving in?",
      choices: [
        "Corporate office",
        "Academic institution",
        "Hospital or clinic",
        "Outdoor/nature setting",
        "Workshop or laboratory",
        "Creative studio",
        "Tech-driven workspace",
        "Remote/flexible work",
        "Fast-paced/high-pressure environment",
        "Collaborative team setting",
        "Independent/solo projects",
      ],
    },
  ];

  // Add this function inside your UniFinder component, above the search function
  const resetForm = () => {
    setGrades({
      math: "",
      science: "",
      english: "",
      filipino: "",
      social: "",
    });
    setAnswers({
      academics: [],
      fields: [],
      activities: [],
      goals: [],
      environment: [],
      custom: {
        academics: "",
        fields: "",
        activities: "",
        goals: "",
        environment: "",
      },
    });
    setSchoolType("any");
    setLocations([]);
    setMaxBudget(50000);
    setCurrentQuestionIndex(0);
    setStep(1);
  };

  const search = async () => {
    setLoading(true);

    const payload = { answers, school_type: schoolType, locations, grades };
    if (schoolType === "private") payload.max_budget = maxBudget;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 403) {
        alert("You must be logged in to use this feature.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem("results", JSON.stringify(data.results || []));
      localStorage.setItem("message", data.message || "");
      localStorage.setItem("type", data.type || "exact");

      // Reset form after successful submission
      resetForm();

      navigate("/results");
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const [grades, setGrades] = useState({
    math: "",
    science: "",
    english: "",
    filipino: "",
    social: "",
  });

  const ProgressBar = () => {
    const steps = [
      {
        id: 1,
        label: "Grades",
        icon: <Award size={24} className="text-green-400" />,
      },
      {
        id: 2,
        label: "Questions",
        icon: <HelpCircle size={24} className="text-purple-500" />,
      },
      {
        id: 3,
        label: "School Type",
        icon: <School size={24} className="text-yellow-400" />,
      },
      {
        id: 4,
        label: "Location",
        icon: <MapPin size={24} className="text-red-400" />,
      },
    ];

    let progressPercent = 0;

    if (step === 1) {
      progressPercent = 0;
    } else if (step === 2) {
      const totalQuestions = 5;
      const sectionBase = 100 / (steps.length - 1); // distance between circles
      const questionProgress = currentQuestionIndex / totalQuestions;
      progressPercent = sectionBase * (1 + questionProgress); // start at step 2's circle
    } else if (step === 3) {
      progressPercent = (2 / (steps.length - 1)) * 100;
    } else if (step === 4) {
      progressPercent = 100;
    }

    return (
      <div className="w-full max-w-3xl mx-auto mt-12">
        <div className="relative flex items-center justify-between px-4">
          {/* Background Line */}
          <div className="absolute left-14 right-14 top-1/2 -translate-y-1/2 -mt-[8px] h-[6px] bg-blue-900 rounded-full" />

          {/* Progress Line */}
          <div
            className="absolute left-14 top-1/2 -translate-y-1/2 -mt-[8px] h-[6px] bg-blue-400 rounded-full shadow-[0_0_20px_4px_rgba(59,130,246,0.8)] transition-all duration-500"
            style={{
              width: `calc((100% - 7rem) * ${progressPercent / 100})`,
            }}
          />

          {/* Circles */}
          {steps.map((s) => {
            let extraGlow = "";
            if (s.id === 2 && step === 1 && currentQuestionIndex > 0) {
              const progressToStep2 =
                currentQuestionIndex / (questions.length - 1);
              extraGlow = `shadow-[0_0_${10 + progressToStep2 * 20}px_${
                2 + progressToStep2 * 4
              }px_rgba(59,130,246,${0.3 + progressToStep2 * 0.5})]`;
            }

            return (
              <div
                key={s.id}
                className="flex flex-col items-center relative z-10"
              >
                <div
                  className={`w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all duration-500
                  bg-blue-800/20 backdrop-blur-md
                  ${
                    s.id === step || s.id < step
                      ? "border-blue-400"
                      : "border-white/20"
                  } ${extraGlow}`}
                >
                  {s.icon}
                </div>
                <span className="mt-3 text-sm text-white">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat px-4 text-white pt-16 sm:pt-20 lg:pt-36"
        style={{
          backgroundImage: "url('/images/main.jpg')",
        }}
      >
        <div className="max-w-5xl mx-auto space-y-8">
          <ProgressBar />

          {/* STEP 1: GRADES */}
          {step === 1 && (
            <>
              <div
                className="bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-blue-900/40 backdrop-blur-2xl 
                    border border-white/20 rounded-3xl p-8 sm:p-10 md:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.4)] 
                    space-y-8 w-full max-w-6xl mx-auto transition-all duration-500"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  {/* Left Side: Icon + Title */}
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-tr from-blue-400/30 to-cyan-300/30 p-3 sm:p-4 rounded-2xl shadow-inner">
                      <School className="text-blue-300 w-7 h-7 sm:w-8 sm:h-8" />
                    </div>

                    <div>
                      <h2 className="text-[clamp(1.3rem,2.2vw,1.9rem)] font-semibold font-inter text-white tracking-tight leading-snug">
                        Enter & Customize Your Core Grades
                      </h2>
                      <p className="text-[clamp(0.8rem,1.5vw,1rem)] text-white/60 font-poppins mt-1.5 leading-relaxed max-w-2xl">
                        Input your latest grades — edit subjects or add up to
                        <span className="text-blue-300 font-medium">
                          {" "}
                          8 subjects
                        </span>
                        .
                      </p>
                    </div>
                  </div>

{/* Info Button */}
<button
  onClick={() => setShowNote(true)}
  className="flex items-center gap-2 text-sm sm:text-base font-poppins 
             text-[#93c5fd] hover:text-[#60a5fa] transition-colors duration-300 
             bg-transparent border-none outline-none shadow-none"
  style={{
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
  }}
  title="View note"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
    className="w-5 h-5 sm:w-6 sm:h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
  <span className="hidden sm:inline">Important Note</span>
</button>


{/* Popup Modal */}
{showNote && (
  <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-transparent">
    <div
      className="bg-gradient-to-br from-blue-950/90 via-blue-900/85 to-blue-950/90
                 border border-blue-300/20 rounded-[2rem] shadow-2xl
                 p-6 sm:p-8 w-[90%] sm:w-[500px] text-center
                 animate-in fade-in duration-200"
    >
      <h3 className="text-white font-semibold text-lg sm:text-xl mb-3 font-inter">
        Why grades aren’t everything
      </h3>

      <p className="text-white/70 font-poppins leading-relaxed text-[0.9rem] sm:text-base">
        Your grades don’t define your potential — they simply guide the system in understanding 
        your strengths. A low grade in one subject doesn’t mean you can’t thrive in that field. 
        What truly matters is your passion, effort, and curiosity to keep learning.
      </p>

    <button
  onClick={() => setShowNote(false)}
  className="mt-6 px-4 py-2 rounded-lg
             bg-blue-500/10 hover:bg-blue-500/20
             border border-blue-300/30 text-blue-200
             font-medium font-poppins
             backdrop-blur-sm
             transition-colors duration-200 ease-in-out
             focus:outline-none focus:ring-2 focus:ring-blue-400/40
             shadow-none"
>
  Got it
</button>


    </div>
  </div>
)}


</div>



                {/* Subjects Grid (2 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(grades).map(([subject, grade], index) => (
                    <div
                      key={index}
                      className="group relative flex flex-col gap-3 bg-blue-300/10 
                       border border-white/10 backdrop-blur-md rounded-2xl px-5 py-4 
                       hover:border-blue-400/40 hover:bg-blue-200/20 transition-all duration-300"
                    >
                      {/* Labels Row */}
                      <div className="flex justify-between text-white/70 text-sm font-poppins mb-1">
                        <label>Subject</label>
                        <label className="pr-8">Grade</label>
                      </div>

                      {/* Inputs Row */}
                      <div className="flex items-center justify-between gap-3">
                        {/* Subject Input */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={subject}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setGrades((prev) => {
                                const updated = { ...prev };
                                const oldValue = updated[subject];
                                delete updated[subject];
                                updated[newName] = oldValue;
                                return updated;
                              });
                            }}
                            placeholder="Enter subject name"
                            className="w-full bg-transparent border-b border-white/20 focus:border-blue-300 
                             text-white placeholder-white/40 text-base font-poppins py-1 
                             outline-none transition-all duration-200"
                          />
                        </div>

                        {/* Grade Input */}
                        <div className="w-24">
                          <input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            max="100"
                            value={grade}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val === "") {
                                setGrades((prev) => ({
                                  ...prev,
                                  [subject]: "",
                                }));
                                return;
                              }
                              let num = parseInt(val);
                              if (isNaN(num)) num = "";
                              if (num > 100) num = 100;
                              if (num < 0) num = 0;
                              setGrades((prev) => ({
                                ...prev,
                                [subject]: num,
                              }));
                            }}
                            placeholder="ex.100"
                            className="w-full text-center bg-transparent border-b border-white/20 focus:border-blue-300 
                             text-white placeholder-white/40 text-base font-poppins py-1 outline-none 
                             appearance-none [&::-webkit-outer-spin-button]:appearance-none 
                             [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>

              {/* Delete Button */}
              {Object.keys(grades).length > 1 && (
                <button
  onClick={() => {
    setGrades((prev) => {
      const updated = { ...prev };
      delete updated[subject];
      return updated;
    });
  }}
  className="!bg-transparent !border-none !outline-none !shadow-none !ring-0 text-[#e11d48] hover:text-[#fb7185] transition text-lg font-semibold"
  style={{
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
  }}
  title="Remove subject"
>
  ✕
</button>

              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Subject Button */}
{Object.keys(grades).length < 8 && (
  <div className="flex justify-end mt-3">
    <button
      onClick={() => {
        const newSubjectName = `Subject ${Object.keys(grades).length + 1}`;
        setGrades((prev) => ({ ...prev, [newSubjectName]: "" }));
      }}
      className="flex items-center gap-1.5 
                 px-3 py-1.5 sm:px-4 sm:py-2
                 rounded-lg 
                 text-xs sm:text-sm 
                 font-poppins text-white
                 border border-white/20 backdrop-blur-sm transition
                 hover:border-blue-300 hover:bg-blue-400/20
                 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}
    >
      <span className="text-base leading-none text-blue-300">＋</span>
      Add Subject
    </button>
  </div>
)}


    </div>

              {/* Continue Button */}
              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setStep(2)}
                  disabled={
                    Object.values(grades).some((g) => g === "" || isNaN(g)) ||
                    Object.keys(grades).length === 0
                  }
                  className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 
                   rounded-lg sm:rounded-xl 
                   text-sm sm:text-base md:text-lg 
                   font-poppins text-white 
                   border border-white/20 backdrop-blur-sm transition
                   hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* STEP 2: QUESTIONS */}
          {step === 2 && (
            <>
              {(() => {
                const q = questions[currentQuestionIndex];
                const hasSelectedChoices = answers[q.key].length > 0;
                const hasTypedCustom = answers.custom[q.key].trim() !== "";

                return (
                  <div
                    className="bg-blue-800/20 backdrop-blur-md 
                     p-6 sm:p-8 md:p-10 
                     rounded-2xl sm:rounded-3xl 
                     border border-white/20 shadow-lg space-y-6 sm:space-y-8"
                  >
                    {/* Question Header */}
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-blue-300/20 p-2.5 sm:p-3 rounded-md">
                          <Heart className="text-blue-300 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                        </div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold font-inter text-white">
                          {q.title}
                        </h2>
                      </div>
                      <p className="text-white/70 font-poppins text-sm sm:text-base leading-relaxed ml-1 sm:ml-2">
                        Choose up to{" "}
                        <span className="font-semibold text-blue-300">2</span>{" "}
                        that best describe your interests, or type your own
                        answers freely if none of the choices fit.
                      </p>
                    </div>

                    {/* Choices */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                      {q.choices.map((choice) => {
                        const isSelected = answers[q.key].includes(choice);
                        const isDisabled = hasTypedCustom;
                        return (
                          <div
                            key={choice}
                            onClick={() =>
                              !isDisabled && handleCheckboxChange(q.key, choice)
                            }
                            className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-3.5 md:py-1.5 rounded-full text-xs sm:text-sm md:text-base font-medium cursor-pointer transition ${
                              isSelected
                                ? "bg-blue-500/40 border-2 border-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.6)]"
                                : "bg-white/10 border border-blue-400 hover:bg-blue-900/30"
                            } backdrop-blur-sm text-white font-poppins ${
                              isDisabled ? "opacity-40 cursor-not-allowed" : ""
                            }`}
                          >
                            {choice}
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom Input */}
                    <input
                      type="text"
                      placeholder="Other (optional)..."
                      className={`mt-2 w-full border border-white/20 bg-white/10 
                       rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 
                       text-xs sm:text-sm md:text-base 
                       placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400
                       ${
                         hasSelectedChoices
                           ? "opacity-40 cursor-not-allowed"
                           : ""
                       }`}
                      value={answers.custom[q.key]}
                      onChange={(e) =>
                        !hasSelectedChoices &&
                        handleCustomChange(q.key, e.target.value)
                      }
                      disabled={hasSelectedChoices}
                    />
                  </div>
                );
              })()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-4">
                {currentQuestionIndex > 0 ? (
                  <button
                    className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 
                     rounded-lg sm:rounded-xl 
                     text-sm sm:text-base md:text-lg 
                     font-poppins text-white 
                     border border-white/20 backdrop-blur-sm transition
                     hover:border-blue-300"
                    style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                    onClick={() =>
                      setCurrentQuestionIndex(currentQuestionIndex - 1)
                    }
                  >
                    Back
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 
                     rounded-lg sm:rounded-xl 
                     text-sm sm:text-base md:text-lg 
                     font-poppins text-white 
                     border border-white/20 backdrop-blur-sm transition
                     hover:border-blue-300"
                    style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                    onClick={() => setStep(1)}
                  >
                    Back to Grades
                  </button>
                )}

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 
                     rounded-lg sm:rounded-xl 
                     text-sm sm:text-base md:text-lg 
                     font-poppins font-medium text-white 
                     border border-white/20 backdrop-blur-sm transition
                     hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                    disabled={
                      answers[questions[currentQuestionIndex].key].length ===
                        0 &&
                      answers.custom[
                        questions[currentQuestionIndex].key
                      ].trim() === ""
                    }
                    onClick={() =>
                      setCurrentQuestionIndex(currentQuestionIndex + 1)
                    }
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 
                     rounded-lg sm:rounded-xl 
                     text-sm sm:text-base md:text-lg 
                     font-poppins font-medium text-white 
                     border border-white/20 backdrop-blur-sm transition
                     hover:border-blue-300"
                    style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                    onClick={() => setStep(3)}
                  >
                    Continue
                  </button>
                )}
              </div>
            </>
          )}

          {/* STEP 3: SCHOOL TYPE */}
          {step === 3 && (
            <>
              <div
                className="bg-blue-800/20 backdrop-blur-md border border-white/20 
                    rounded-lg sm:rounded-xl shadow-lg 
                    p-5 sm:p-6 md:p-8 max-w-3xl mx-auto"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="bg-blue-400/20 p-2 sm:p-2.5 rounded-lg">
                    <School className="text-blue-300 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-inter">
                      Preferred School Type
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-blue-100 font-poppins">
                      Choose which type of school you prefer
                    </p>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {[
                    {
                      value: "public",
                      label: "Public Schools",
                      desc: "State-funded, affordable options",
                    },
                    {
                      value: "private",
                      label: "Private Schools",
                      desc: "Privately-run with more variety",
                    },
                    {
                      value: "any",
                      label: "Both Types",
                      desc: "I'm open to all options",
                    },
                  ].map(({ value, label, desc }) => (
                    <label
                      key={value}
                      className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border transition cursor-pointer 
                text-sm sm:text-base
                ${
                  schoolType === value
                    ? "border-2 sm:border-4 border-blue-400 bg-blue-500/20"
                    : "border border-white/20 hover:border-blue-300"
                }`}
                    >
                      <input
                        type="radio"
                        name="schoolType"
                        value={value}
                        checked={schoolType === value}
                        onChange={(e) => {
                          const selected = e.target.value;
                          setSchoolType(selected);
                          if (selected === "private") {
                            setLocations((prev) =>
                              prev.filter((loc) =>
                                ["Angeles", "San Fernando"].includes(loc)
                              )
                            );
                          }
                        }}
                        className="w-4 h-4 sm:w-5 sm:h-5 opacity-0 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold font-poppins">
                          {label}
                        </span>
                        <p className="text-xs sm:text-sm text-blue-100 font-poppins">
                          {desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {schoolType === "private" && (
                <div
                  className="bg-blue-800/20 backdrop-blur-md border border-white/20 
                      rounded-lg sm:rounded-xl shadow-lg 
                      p-5 sm:p-6 md:p-8 max-w-3xl mx-auto mt-4 sm:mt-5"
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="bg-blue-300/20 p-2 sm:p-2.5 rounded-lg">
                      <DollarSign className="text-blue-300 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold font-inter">
                        Maximum Tuition
                      </h2>
                      <p className="text-xs sm:text-sm md:text-base text-blue-100 font-poppins">
                        Set your budget per semester
                      </p>
                    </div>
                  </div>

                  <label className="block text-xs sm:text-sm md:text-base text-blue-100 font-medium mb-1 sm:mb-2 font-poppins">
                    Selected: ₱{maxBudget.toLocaleString()}
                  </label>

                  <input
                    type="range"
                    min={5000}
                    max={100000}
                    step={1000}
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(Number(e.target.value))}
                    className="w-full accent-blue-400"
                  />

                  <div className="flex justify-between text-[10px] sm:text-sm text-blue-200 mt-1 sm:mt-2 font-poppins">
                    <span>₱5,000</span>
                    <span>₱50,000</span>
                    <span>₱100,000</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-4 sm:mt-5 pb-5 sm:pb-6 max-w-3xl mx-auto">
                <button
                  className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 
                   rounded-lg sm:rounded-xl 
                   text-sm sm:text-base md:text-lg 
                   font-poppins text-white 
                   border border-white/20 backdrop-blur-sm transition
                   hover:border-blue-300"
                  style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                  onClick={() => setStep(2)}
                >
                  Back
                </button>

                <button
                  className="px-4 py-2 sm:px-6 sm:py-3 md:px-7 md:py-3.5 
                   rounded-lg sm:rounded-xl 
                   text-sm sm:text-base md:text-lg 
                   font-poppins font-medium text-white 
                   border border-white/20 backdrop-blur-sm transition
                   hover:border-blue-300"
                  style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                  onClick={() => setStep(4)}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* STEP 4: LOCATION */}
          {step === 4 && (
            <>
              <div
                className="bg-blue-800/20 backdrop-blur-md border border-white/20 
                    rounded-xl sm:rounded-2xl shadow-lg 
                    p-6 sm:p-8 md:p-10"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="bg-blue-300/20 p-2 sm:p-3 rounded-lg">
                    <MapPin className="text-blue-300 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-semibold font-inter">
                      Preferred Locations
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-blue-100 font-inter">
                      Choose cities in Pampanga where you'd like to study
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                  {filteredLocations.map((loc) => {
                    const isSelected = locations.includes(loc);
                    return (
                      <div
                        key={loc}
                        onClick={() => {
                          setLocations((prev) =>
                            isSelected
                              ? prev.filter((l) => l !== loc)
                              : [...prev, loc]
                          );
                        }}
                        className={`px-3 py-1.5 sm:px-5 sm:py-2 md:px-6 md:py-3 rounded-full 
                        text-sm sm:text-base md:text-lg font-medium font-poppins cursor-pointer transition ${
                          isSelected
                            ? "bg-blue-500/40 border-2 sm:border-4 border-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.6)]"
                            : "bg-white/10 border border-blue-400 opacity-80 hover:opacity-100 hover:bg-blue-900/30"
                        } backdrop-blur-sm text-white`}
                      >
                        {loc}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between mt-4 sm:mt-6 mb-10 sm:mb-12">
                <button
                  className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 
                   rounded-lg sm:rounded-xl 
                   text-sm sm:text-base md:text-lg 
                   font-poppins text-white 
                   border border-white/20 backdrop-blur-sm transition
                   hover:border-blue-300"
                  style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                  onClick={() => setStep(3)}
                >
                  Back
                </button>

                <button
                  onClick={search}
                  className="px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 
                   rounded-lg sm:rounded-xl 
                   text-sm sm:text-base md:text-lg 
                   font-poppins font-semibold text-white 
                   border border-white/20 backdrop-blur-sm transition
                   hover:border-blue-300 flex items-center"
                  style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                >
                  <Search className="inline-block w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
                  Find Programs
                </button>
              </div>
            </>
          )}

          {loading && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
              <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-400"></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default UniFinder;

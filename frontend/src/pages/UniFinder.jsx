import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Heart, MapPin, DollarSign, School, Search, HelpCircle } from "lucide-react"
import Navbar from "../components/Navbar"

function UniFinder() {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false);


  const [answers, setAnswers] = useState({
    academics: [],
    fields: [],
    activities: [],
    goals: [],
    environment: [],
    custom: {
      academics: "", fields: "", activities: "", goals: "", environment: "",
    }
  })

  const [schoolType, setSchoolType] = useState("any")
  const [locations, setLocations] = useState([])
  const [maxBudget, setMaxBudget] = useState(50000)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const handleCheckboxChange = (questionKey, choice) => {
  setAnswers(prevAnswers => {
    const selected = prevAnswers[questionKey];
    const isSelected = selected.includes(choice);

    // If already selected, remove it
    if (isSelected) {
      return {
        ...prevAnswers,
        [questionKey]: selected.filter(item => item !== choice)
      };
    } else {
      // Limit to 2 choices only
      if (selected.length >= 2) return prevAnswers;
      return {
        ...prevAnswers,
        [questionKey]: [...selected, choice]
      };
    }
  });
};


  const handleCustomChange = (category, value) => {
    setAnswers(prev => ({
      ...prev,
      custom: { ...prev.custom, [category]: value }
    }))
  }

  const allLocations = ["Angeles", "Apalit", "Bacolor", "Candaba", "Mabalacat", "Magalang", "Malolos, Bulacan", "Mexico", "Porac", "San Fernando"]
  const filteredLocations = schoolType === "private" ? ["Angeles", "San Fernando"] : allLocations

  const questions = [
  { 
    key: "academics", 
    title: "Which school subjects or learning areas excite you the most?", 
    choices: ["Math", "Science", "English", "History/Social Studies", "Physical Education", "Arts & Design", "Technology/ICT"] 
  },
  { 
    key: "fields", 
    title: "Which career industries or professional fields interest you most?", 
    choices: ["Engineering", "Architecture", "Arts & Media", "Healthcare", "Education", "Community & Social Work", "Law & Governance", "Information Technology"] 
  },
  { 
    key: "activities", 
    title: "What types of tasks do you naturally enjoy or excel at?", 
    choices: ["Designing/Creating", "Solving complex problems", "Writing/Storytelling", "Hands-on building/Repairing", "Guiding/Mentoring others", "Researching/Analyzing", "Presenting/Speaking"] 
  },
  { 
    key: "goals", 
    title: "What outcomes or achievements matter most in your future career?", 
    choices: ["Improving lives", "Driving innovation", "Educating others", "Growing a business", "Promoting fairness & justice", "Protecting the environment", "Mastering expertise in a field"] 
  },
  { 
    key: "environment", 
    title: "What kind of workplace or setting do you see yourself thriving in?", 
    choices: ["Corporate office", "Academic institution", "Hospital or clinic", "Outdoor/nature setting", "Workshop or laboratory", "Creative studio", "Tech-driven workspace"] 
  }
];


  const search = async () => {
  setLoading(true);

  const payload = { answers, school_type: schoolType, locations };
  if (schoolType === "private") payload.max_budget = maxBudget;

  const token = localStorage.getItem("token"); // ✅ get token saved from login

  try {
    const response = await fetch("http://127.0.0.1:8000/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }), // ✅ add Authorization header
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

    navigate("/results");
  } catch (error) {
    console.error("Error fetching results:", error);
  } finally {
    setLoading(false);
  }
};





const ProgressBar = () => {
  const steps = [
    { id: 1, label: "Questions", icon: <HelpCircle size={24} className="text-red-400" /> },
    { id: 2, label: "School Type", icon: <School size={24} className="text-green-400" /> },
    { id: 3, label: "Location", icon: <MapPin size={24} className="text-yellow-400" /> },
  ];

  let progressPercent = 0;

  if (step === 1) {
    if (currentQuestionIndex === 0) {
      progressPercent = 0;
    } else {
      progressPercent =
        (currentQuestionIndex / (questions.length - 1)) *
        (100 / (steps.length - 1));
    }
  } else if (step === 2) {
    progressPercent = 100 / (steps.length - 1);
  } else if (step === 3) {
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
            const progressToStep2 = currentQuestionIndex / (questions.length - 1);
            extraGlow = `shadow-[0_0_${10 + progressToStep2 * 20}px_${2 + progressToStep2 * 4}px_rgba(59,130,246,${0.3 + progressToStep2 * 0.5})]`;
          }

          return (
            <div key={s.id} className="flex flex-col items-center relative z-10">
              <div
                className={`w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all duration-500
                  bg-blue-800/20 backdrop-blur-md
                  ${s.id === step || s.id < step ? "border-blue-400" : "border-white/20"} ${extraGlow}`}
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

        {/* Step 1 */}
{step === 1 && (
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
          {/* question title and instructions */}
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
    Choose up to <span className="font-semibold text-blue-300">2</span> that best describe your interests,
    or type your own answers freely if none of the choices fit.
  </p>
</div>


          {/* Choices */}
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
            {q.choices.map((choice) => {
              const isSelected = answers[q.key].includes(choice);
              const isDisabled = hasTypedCustom; // disable if typing

              return (
                <div
                  key={choice}
                  onClick={() =>
                    !isDisabled && handleCheckboxChange(q.key, choice)
                  }
                  className={`
                    px-3 py-1.5 sm:px-4 sm:py-2 
                    rounded-full text-sm sm:text-base md:text-lg 
                    font-medium cursor-pointer transition
                    ${isSelected
                      ? "border-2 sm:border-4 border-white"
                      : "border border-blue-400 opacity-80 hover:opacity-100"}
                    bg-white/10 backdrop-blur-sm
                    text-white font-poppins
                    ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}
                  `}
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
                       ${hasSelectedChoices ? "opacity-40 cursor-not-allowed" : ""}`}
            value={answers.custom[q.key]}
            onChange={(e) =>
              !hasSelectedChoices && handleCustomChange(q.key, e.target.value)
            }
            disabled={hasSelectedChoices} // disable input if choices picked
          />
        </div>
      );
    })()}

    {/* Buttons */}
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
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
        >
          Back
        </button>
      ) : (
        <span></span>
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
            answers[questions[currentQuestionIndex].key].length === 0 &&
            answers.custom[questions[currentQuestionIndex].key].trim() === ""
          }
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
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
          onClick={() => setStep(2)}
        >
          Continue
        </button>
      )}
    </div>
  </>
)}




{/* Step 2 */}
{step === 2 && (
  <>
    {/* School Type Card */}
    <div className="bg-blue-800/20 backdrop-blur-md border border-white/20 
                    rounded-lg sm:rounded-xl shadow-lg 
                    p-5 sm:p-6 md:p-8 max-w-3xl mx-auto">
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

      {/* Options */}
      <div className="space-y-2 sm:space-y-3">
        {[{ value: "public", label: "Public Schools", desc: "State-funded, affordable options" },
          { value: "private", label: "Private Schools", desc: "Privately-run with more variety" },
          { value: "any", label: "Both Types", desc: "I'm open to all options" }].map(({ value, label, desc }) => (
            <label
              key={value}
              className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border transition cursor-pointer 
                text-sm sm:text-base
                ${schoolType === value
                  ? "border-2 sm:border-4 border-blue-400 bg-blue-500/20"
                  : "border border-white/20 hover:border-blue-300"}`}
            >
              <input
                type="radio"
                name="schoolType"
                value={value}
                checked={schoolType === value}
                onChange={(e) => {
                  const selected = e.target.value
                  setSchoolType(selected)
                  if (selected === "private") {
                    setLocations(prev => prev.filter(loc => ["Angeles", "San Fernando"].includes(loc)))
                  }
                }}
                className="w-4 h-4 sm:w-5 sm:h-5 opacity-0 cursor-pointer"
              />
              <div>
                <span className="font-semibold font-poppins">{label}</span>
                <p className="text-xs sm:text-sm text-blue-100 font-poppins">{desc}</p>
              </div>
            </label>
        ))}
      </div>
    </div>

    {/* Tuition Budget (Only for private) */}
    {schoolType === "private" && (
      <div className="bg-blue-800/20 backdrop-blur-md border border-white/20 
                      rounded-lg sm:rounded-xl shadow-lg 
                      p-5 sm:p-6 md:p-8 max-w-3xl mx-auto mt-4 sm:mt-5">
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

    {/* Buttons */}
    <div className="flex justify-between mt-4 sm:mt-5 pb-5 sm:pb-6 max-w-3xl mx-auto">
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
        onClick={() => setStep(3)}
      >
        Next
      </button>
    </div>
  </>
)}



{/* Step 3 */}
{step === 3 && (
  <>
    <div className="bg-blue-800/20 backdrop-blur-md border border-white/20 
                    rounded-xl sm:rounded-2xl shadow-lg 
                    p-6 sm:p-8 md:p-10">
      {/* Title */}
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

      {/* Location pills */}
      <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
        {filteredLocations.map((loc) => {
          const isSelected = locations.includes(loc);
          return (
            <div
              key={loc}
              onClick={() => {
                setLocations((prev) =>
                  isSelected ? prev.filter((l) => l !== loc) : [...prev, loc]
                );
              }}
              className={`
                px-3 py-1.5 sm:px-5 sm:py-2 md:px-6 md:py-3
                rounded-full 
                text-sm sm:text-base md:text-lg 
                font-medium font-poppins cursor-pointer transition
                ${isSelected
                  ? "border-2 sm:border-4 border-white"
                  : "border border-blue-400 opacity-80 hover:opacity-100"}
                bg-white/10 backdrop-blur-sm
                text-white
              `}
            >
              {loc}
            </div>
          );
        })}
      </div>
    </div>

    {/* Buttons */}
    <div className="flex justify-between mt-4 sm:mt-6 mb-10 sm:mb-12">
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
  )
}

export default UniFinder
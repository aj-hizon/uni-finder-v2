import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, GraduationCap, MapPin, Check } from "lucide-react";
import Navbar from "../components/Navbar";

function Home() {
  const navigate = useNavigate();

  // refs
  const howItWorksRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const NAVBAR_HEIGHT = 80; // px

  const handleScrollToHowItWorks = () => {
    const container = scrollContainerRef.current;
    const element = howItWorksRef.current;

    if (container && element) {
      const containerRect = container.getBoundingClientRect();
      const elemRect = element.getBoundingClientRect();
      const offsetTop =
        elemRect.top - containerRect.top + container.scrollTop - NAVBAR_HEIGHT;
      container.scrollTo({ top: offsetTop, behavior: "smooth" });
      return;
    }

    if (element) {
      const yOffset = -NAVBAR_HEIGHT;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Sticky Navbar */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#020617]/90 to-[#0a0f1f]/90 backdrop-blur-md">
        <Navbar />
      </div>

      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className="h-screen overflow-y-scroll bg-cover bg-center bg-no-repeat text-white font-Poppins"
        style={{
          backgroundImage: "url('/images/main.jpg')", 
        }}
      >
        {/* Hero Section */}
        <section className="h-screen flex flex-col justify-center px-3 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-poppins font-extrabold leading-snug mb-4 sm:mb-6 text-white drop-shadow-lg">
              Ready to Find Your Future?
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed">
              Find the Right Path for Your Future. With UniFinder, explore
              schools and programs designed around your passions, budget, and
              location.
            </p>

            <div className="flex justify-center gap-4 mb-8">
              <button
                type="button"
                onClick={() => navigate("/unifinder")}
                className="w-40 sm:w-44 md:w-48 lg:w-52 py-3 sm:py-3.5 md:py-4 rounded-lg !bg-blue-900/40 backdrop-blur-md !border !border-blue-300/40 !text-white text-sm sm:text-base md:text-lg lg:text-xl font-Poppins font-medium shadow-lg hover:!bg-blue-600/50 hover:shadow-xl transition duration-300 ease-in-out"
              >
                Find My Program
              </button>

              <button
                type="button"
                onClick={handleScrollToHowItWorks}
                className="w-40 sm:w-44 md:w-48 lg:w-52 py-3 sm:py-3.5 md:py-4 rounded-lg !bg-blue-500/30 backdrop-blur-md !border !border-blue-200/40 !text-white text-sm sm:text-base md:text-lg lg:text-xl font-Poppins font-medium shadow-lg hover:!bg-blue-400/40 hover:shadow-xl transition duration-300 ease-in-out"
              >
                Learn More
              </button>
            </div>

            {/* Quick Stats */}
            <div
              className="absolute bottom-10 left-1/2 -translate-x-1/2 
             w-full max-w-5xl flex flex-wrap justify-center 
             gap-8 sm:gap-16 md:gap-32 text-center px-4
             max-[400px]:gap-6 max-[350px]:gap-4"
            >
              {/* Programs */}
              <div
                className="flex flex-col items-center flex-1 
               max-w-[110px] sm:max-w-none 
               scale-100 max-[400px]:scale-90 max-[350px]:scale-75"
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full 
                 bg-blue-900/40 backdrop-blur-md flex items-center justify-center 
                 mb-2 sm:mb-3"
                >
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold font-poppins text-yellow-400">
                  50+
                </h3>
                <span className="text-white/80 text-xs sm:text-sm max-[350px]:text-[10px]">
                  Programs Listed
                </span>
              </div>

              {/* Schools */}
              <div
                className="flex flex-col items-center flex-1 
               max-w-[140px] sm:max-w-none 
               scale-100 max-[400px]:scale-90 max-[350px]:scale-75"
              >
                <div
                  className="w-16 h-16 rounded-full bg-blue-900/40 backdrop-blur-md 
                 flex items-center justify-center mb-3"
                >
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-3xl font-extrabold font-poppins text-blue-400">
                  Pampanga
                </h3>
                <span className="text-white/80 text-sm sm:text-base max-[350px]:text-[11px]">
                  Leading Schools
                </span>
              </div>

              {/* Time */}
              <div
                className="flex flex-col items-center flex-1 
               max-w-[110px] sm:max-w-none 
               scale-100 max-[400px]:scale-90 max-[350px]:scale-75"
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full 
                 bg-blue-900/40 backdrop-blur-md flex items-center justify-center 
                 mb-2 sm:mb-3"
                >
                  <Check className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-poppins font-extrabold text-green-400">
                  1 min
                </h3>
                <span className="text-white/80 text-xs sm:text-sm max-[350px]:text-[10px]">
                  Avg Completion
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          ref={howItWorksRef}
          className="flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 md:py-20 relative z-10"
        >
          <div className="container mx-auto px-2 sm:px-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-poppins tracking-wide font-bold text-center mb-12 sm:mb-16">
              Step Into Your Future with Uni-Finder
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-16 max-w-7xl mx-auto">
              {/* Step 1 */}
              <div className="bg-blue-900/40 backdrop-blur-md border border-blue-300/40 rounded-2xl shadow-lg flex flex-col items-center text-center aspect-auto sm:aspect-square min-h-[250px] sm:min-h-[320px] transition-all duration-300 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.8)] p-6 sm:p-10">
                <div className="flex flex-col items-center mb-4 sm:mb-6">
                  <div className="bg-blue-500/20 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-poppins font-semibold mt-2 sm:mt-4">
                    1. Answer Questions
                  </h3>
                </div>
                <p className="text-white/70 text-xs sm:text-sm md:text-base">
                  Share your preferences in five categories: Academics, Fields,
                  Activities, Goals, and Work Environment.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-blue-900/40 backdrop-blur-md border border-blue-300/40 rounded-2xl shadow-lg flex flex-col items-center text-center aspect-auto sm:aspect-square min-h-[250px] sm:min-h-[320px] transition-all duration-300 hover:border-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.8)] p-6 sm:p-10">
                <div className="flex flex-col items-center mb-4 sm:mb-6">
                  <div className="bg-green-500/20 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mt-2 sm:mt-4 font-poppins">
                    2. Choose School Type
                  </h3>
                </div>
                <p className="text-white/70 text-xs sm:text-sm md:text-base">
                  Select if you prefer public or private institutions to narrow
                  down your choices.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-blue-900/40 backdrop-blur-md border border-blue-300/40 rounded-2xl shadow-lg flex flex-col items-center text-center aspect-auto sm:aspect-square min-h-[250px] sm:min-h-[320px] transition-all duration-300 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.8)] p-6 sm:p-10">
                <div className="flex flex-col items-center mb-4 sm:mb-6">
                  <div className="bg-purple-500/20 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mt-2 sm:mt-4 font-poppins">
                    3. Pick Location
                  </h3>
                </div>
                <p className="text-white/70 text-xs sm:text-sm md:text-base">
                  Decide where you’d like to study by selecting your preferred
                  area.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-blue-900/40 backdrop-blur-md border border-blue-300/40 rounded-2xl shadow-lg flex flex-col items-center text-center aspect-auto sm:aspect-square min-h-[250px] sm:min-h-[320px] transition-all duration-300 hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(250,204,21,0.8)] p-6 sm:p-10">
                <div className="flex flex-col items-center mb-4 sm:mb-6">
                  <div className="bg-yellow-500/20 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mt-2 sm:mt-4 font-poppins">
                    4. See Your Results
                  </h3>
                </div>
                <p className="text-white/70 text-xs sm:text-sm md:text-base">
                  Get instant school and program recommendations tailored to
                  your preferences.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="flex items-center justify-center px-6 py-12 sm:py-16 md:py-20 relative z-10">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-poppins font-bold text-center mb-8 sm:mb-10 md:mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4 sm:space-y-5">
              {[
                {
                  question: "What is UniFinder?",
                  answer:
                    "UniFinder is a smart recommendation platform that helps students discover ideal programs and schools based on their preferences like academics, fields, activities, goals, work environment, school type, and location.",
                },
                {
                  question: "Is UniFinder free to use?",
                  answer:
                    "Yes! UniFinder is completely free for students to explore and use.",
                },
                {
                  question: "How accurate are the recommendations?",
                  answer:
                    "Our recommendations are generated using smart filters and similarity matching. The more precise your answers to the 5 preference categories, the better your results.",
                },
                {
                  question: "Can I use UniFinder without creating an account?",
                  answer:
                    "Yes. You can try UniFinder without an account, but creating one lets you save your preferences, revisit your choices, and get more personalized suggestions.",
                },
                {
                  question: "How long does it take to get results?",
                  answer:
                    "It’s almost instant! After answering the 5 questions and selecting your school type and location, UniFinder generates recommendations immediately.",
                },
              ].map((faq, index) => (
                <details
                  key={index}
                  className="bg-blue-900/40 backdrop-blur-md border border-blue-300/40 rounded-2xl shadow-lg p-4 sm:p-5 md:p-6 hover:bg-blue-500/50 transition-all duration-300"
                >
                  <summary className="font-semibold text-sm sm:text-base md:text-lg cursor-pointer flex justify-between items text-white group-open:text-blue-400">
                    {faq.question}
                    <span className="ml-2 transform transition-transform group-open:rotate-180 ">
                      ⌄
                    </span>
                  </summary>
                  <p className="mt-2 sm:mt-3 text-white/70 text-sm sm:text-base md:text-base">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default Home;
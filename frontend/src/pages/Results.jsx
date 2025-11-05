import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ResultsSection from "../components/ResultsSection";

function Results() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  console.log(API_BASE_URL)

  useEffect(() => {
    const storedResults = JSON.parse(localStorage.getItem("results"));
    const storedMessage = localStorage.getItem("message");

    if (!storedResults || storedResults.length === 0) {
      navigate("/unifinder");
    } else {
      setResults(storedResults);
      setMessage(storedMessage);
    }
  }, [navigate]);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white font-Poppins"
      style={{
        backgroundImage: "url('/images/main.jpg')",
      }}
    >
      <ResultsSection results={results} message={message} />
    </div>
  );
}

export default Results;
import { useState, useEffect } from "react";
import axios from "axios";
import { X, Eye, EyeOff } from "lucide-react";
import PopupMessage from "./PopupMessage";

export default function AuthModal({ isOpen, onClose, defaultIsLogin = true }) {
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    setIsLogin(defaultIsLogin);
    setEmail("");
    setPassword("");
    setFullName("");
  }, [defaultIsLogin]);

  if (!isOpen)
    return (
      <>
        {popup && (
          <PopupMessage
            type={popup.type}
            message={popup.message}
            onClose={() => setPopup(null)}
          />
        )}
      </>
    );

  // ✅ Password strength validator
  const isPasswordStrong = (password) => {
    const pattern =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;
    return pattern.test(password);
  };

  // ✅ Email validator
  const isEmailValid = (email) => {
    return email.includes("@") && email.endsWith(".com");
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Check email format for both login and register
      if (!isEmailValid(email)) {
        setPopup({
          type: "error",
          message: "Please enter a valid email with '@' and ending in '.com'.",
        });
        setLoading(false);
        return;
      }

      if (isLogin) {
        // ✅ LOGIN
        const res = await axios.post("http://127.0.0.1:8000/login", {
          email,
          password,
        });

        const { access_token, user } = res.data;
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(user));

        setPopup({ type: "success", message: "Login successful!" });
        setTimeout(onClose, 300);
      } else {
        // ✅ REGISTER
        if (!isPasswordStrong(password)) {
          setPopup({
            type: "error",
            message:
              "Password must be at least 8 characters long and include 1 uppercase letter, 1 number, and 1 symbol.",
          });
          setLoading(false);
          return;
        }

        await axios.post("http://127.0.0.1:8000/register", {
          email,
          password,
          full_name: fullName,
        });

        setPopup({
          type: "success",
          message: "Registration successful! You can now log in.",
        });
      }
    } catch (err) {
      console.error(err);
      setPopup({
        type: "error",
        message: err.response?.data?.detail || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center 
                   min-h-screen bg-black/80 backdrop-blur-sm font-[Poppins] px-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg rounded-3xl shadow-2xl 
                      bg-[#002766] backdrop-blur-md
                      text-white p-10 flex flex-col items-center font-Poppins"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
          >
            <X size={24} />
          </button>

          <h1 className="text-base font-semibold leading-tight mb-4 tracking-wide text-white font-poppins">
            {isLogin ? "Login" : "Register"}
          </h1>

          <form onSubmit={handleAuth} className="w-full space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-300 
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-300 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-300 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium bg-blue-700 hover:bg-blue-800 
                         transition-all shadow-md shadow-blue-900/40"
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Register"}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-white">
            {isLogin ? (
              <p>
                Don’t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-blue-400 hover:underline"
                >
                  Register
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-white hover:underline"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {popup && (
        <PopupMessage
          type={popup.type}
          message={popup.message}
          onClose={() => setPopup(null)}
        />
      )}
    </>
  );
}

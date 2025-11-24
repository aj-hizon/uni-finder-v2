import { useState, useEffect } from "react";
import axios from "axios";
import { X, Eye, EyeOff } from "lucide-react";
import PopupMessage from "./PopupMessage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AuthModal({
  isOpen,
  onClose,
  defaultIsLogin = true,
  setIsLoggedIn,
  setIsAdmin,
}) {
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);

  // Reset all fields when modal opens/closes or defaultIsLogin changes
  useEffect(() => {
    setIsLogin(defaultIsLogin);
    clearFields();
  }, [isOpen, defaultIsLogin]);

  const clearFields = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("user");
    setShowPassword(false);
  };

  if (!isOpen)
    return (
      popup && (
        <PopupMessage
          type={popup.type}
          message={popup.message}
          onClose={() => setPopup(null)}
        />
      )
    );

  const isPasswordStrong = (pwd) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/.test(
      pwd
    );

  const isEmailValid = (email) => email.includes("@") && email.endsWith(".com");

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isEmailValid(email)) {
        setPopup({
          type: "error",
          message: "Please enter a valid email with '@' and ending in '.com'.",
        });
        return;
      }

      if (isLogin) {
        // Determine endpoint based on role
        const endpoint =
          role === "admin"
            ? `${API_BASE_URL}/admin/login`
            : `${API_BASE_URL}/login`;
        const res = await axios.post(endpoint, { email, password });
        const { access_token, user, admin } = res.data;

        if (!access_token)
          throw new Error("No access token received from server");

        // Save token and user/admin info
        const storageKey = role === "admin" ? "adminToken" : "token";
        const infoKey = role === "admin" ? "admin" : "user";
        const infoData = role === "admin" ? admin : user;

        localStorage.setItem(storageKey, access_token);
        localStorage.setItem(infoKey, JSON.stringify(infoData));

        setPopup({ type: "success", message: "Login successful!" });
        setTimeout(() => {
          onClose();
          clearFields();
        }, 300);
      } else {
        // Registration
        if (!isPasswordStrong(password)) {
          setPopup({
            type: "error",
            message:
              "Password must be at least 8 characters long and include 1 uppercase letter, 1 number, and 1 symbol.",
          });
          return;
        }

        await axios.post(`${API_BASE_URL}/register`, {
          email,
          password,
          full_name: fullName,
        });

        setPopup({
          type: "success",
          message: "Registration successful! You can now log in.",
        });
        clearFields();
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setPopup({
          type: "error",
          message: "Network error. Check your connection.",
        });
      } else {
        setPopup({
          type: "error",
          message: err.response.data?.detail || "Something went wrong.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen bg-black/80 backdrop-blur-sm font-[Poppins] px-4"
        onClick={() => {
          onClose();
          clearFields();
        }}
      >
        {/* Modal Content */}
        <div
          className="relative w-full max-w-lg rounded-3xl shadow-2xl bg-blue-800/50 backdrop-blur-md text-white p-10 flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onClose();
              clearFields();
            }}
            className="absolute top-4 right-4 text-blue-300 hover:text-red-400 transition-colors duration-200"
          >
            <X size={24} style={{ fill: "none", strokeWidth: 1.8 }} />
          </button>

          <h1 className="text-lg font-semibold mb-6 text-blue-200 font-poppins">
            {isLogin ? "Login" : "Register"}
          </h1>

          {isLogin && (
            <div className="flex space-x-4 mb-4 w-full">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-blue-200 hover:bg-white/20"
                }`}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  role === "admin"
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-blue-200 hover:bg-white/20"
                }`}
              >
                Admin
              </button>
            </div>
          )}

          <form onSubmit={handleAuth} className="w-full space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-100 transition-colors duration-200"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-blue-100 bg-blue-700/80 hover:bg-blue-600/80 border border-blue-500/30 shadow-md shadow-blue-900/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Register"}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-300">
            {isLogin ? (
              <p>
                Don’t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    clearFields();
                  }}
                  className="font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200"
                >
                  Register
                </button>
              </p>
            ) : (
              role === "user" && (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      clearFields();
                    }}
                    className="font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200"
                  >
                    Login
                  </button>
                </p>
              )
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

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
  const [role, setRole] = useState("user");

  useEffect(() => {
    setIsLogin(defaultIsLogin);
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("user");
  }, [defaultIsLogin]);

  if (!isOpen)
    return popup && (
      <PopupMessage type={popup.type} message={popup.message} onClose={() => setPopup(null)} />
    );

  const isPasswordStrong = (password) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/.test(password);

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
        setLoading(false);
        return;
      }

      if (isLogin) {
        const endpoint =
          role === "admin"
            ? "http://127.0.0.1:8000/admin/login"
            : "http://127.0.0.1:8000/login";

        const res = await axios.post(endpoint, { email, password });
        const { access_token, user, admin } = res.data;

        if (role === "admin") {
          localStorage.setItem("admin_token", access_token);
          localStorage.setItem("admin", JSON.stringify(admin));
        } else {
          localStorage.setItem("token", access_token);
          localStorage.setItem("user", JSON.stringify(user));
        }

        setPopup({ type: "success", message: "Login successful!" });
        setTimeout(onClose, 300);
      } else {
        if (!isPasswordStrong(password)) {
          setPopup({
            type: "error",
            message:
              "Password must be at least 8 characters long and include 1 uppercase letter, 1 number, and 1 symbol.",
          });
          setLoading(false);
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
        className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen bg-black/80 backdrop-blur-sm font-[Poppins] px-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg rounded-3xl shadow-2xl bg-blue-800/50 backdrop-blur-md text-white p-10 flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-blue-300 hover:text-red-400 transition-colors duration-200"
          >
            <X size={24} style={{ fill: "none", strokeWidth: 1.8 }} />
          </button>

          <h1 className="text-lg font-semibold mb-6 text-blue-200">{isLogin ? "Login" : "Register"}</h1>

          {isLogin && (
            <div className="flex space-x-4 mb-4 w-full">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  role === "user" ? "bg-blue-600 text-white" : "bg-white/10 text-blue-200 hover:bg-white/20"
                }`}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  role === "admin" ? "bg-blue-600 text-white" : "bg-white/10 text-blue-200 hover:bg-white/20"
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
                  onClick={() => setIsLogin(false)}
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
                    onClick={() => setIsLogin(true)}
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

      {popup && <PopupMessage type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
    </>
  );
}

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Home,
  Search,
  User,
  LogIn,
  UserPlus,
  History,
  FileText,
  LogOut,
  Trash2,
  X,
} from "lucide-react";

import AuthModal from "./AuthModal";
import HistoryLogModal from "./HistoryLogModal";
import PreviousResultsModal from "./PreviousResultsModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Safe JSON parse function
const safeParse = (key) => {
  try {
    const item = localStorage.getItem(key);

    // Handle bad values like "undefined" or "null"
    if (!item || item === "undefined" || item === "null") {
      return null;
    }

    return JSON.parse(item);
  } catch (err) {
    console.error(`Failed to parse ${key}:`, err);
    return null;
  }
};


function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPreviousResultsModal, setShowPreviousResultsModal] =
    useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);

  // Determine login & role
  const user = safeParse("user");
  const admin = safeParse("admin");
  const isLoggedIn = !!user || !!admin;
  const isAdmin = !!admin;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Popup
  const showPopup = (msg) => {
    setPopupMessage(msg);
    setPopupVisible(true);
    setTimeout(() => setPopupVisible(false), 2500);
  };

  // Logout
  const handleLogout = async () => {
    const token = isAdmin
      ? localStorage.getItem("adminToken")
      : localStorage.getItem("token");
    const endpoint = isAdmin
      ? `${API_BASE_URL}/admin/logout`
      : `${API_BASE_URL}/logout`;
    if (!token) return;

    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.clear();
      setShowLogoutConfirm(false);
      showPopup("Logged out successfully!");
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      showPopup("Logout failed.");
    }
  };

  // Delete Account (users only)
  const handleDeleteAccount = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/delete-account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.clear();
      setShowDeleteConfirm(false);
      showPopup("Account deleted successfully!");
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      showPopup("Failed to delete account.");
    }
  };

  const links = [
    { to: "/", icon: Home, text: "Home" },
    { to: "/unifinder", icon: Search, text: "Find Programs" },
  ];

  // Dark theme styles
  const navbarStyle = {
    backgroundColor: "rgba(0,39,102,0.95)",
    color: "#ffffff",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  };

  const dropdownContainerStyle = {
    backgroundColor: "rgba(0,60,143,0.9)",
    color: "#ffffff",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };

  const modalContainerStyle = {
    backgroundColor: "rgba(0,60,143,0.9)",
    color: "#ffffff",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  };

  return (
    <>
      {/* Top popup */}
      {createPortal(
        <AnimatePresence>
          {popupVisible && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999]
                         bg-blue-500/20 backdrop-blur-md border border-blue-400/30
                         text-white px-6 py-3 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)]
                         font-medium"
            >
              {popupMessage}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Navbar */}
      <div className="w-full flex justify-center absolute top-3 xs:top-4 sm:top-5 md:top-6 left-0 z-50">
        <nav
          style={navbarStyle}
          className="flex items-center justify-between w-[95%] xs:w-[90%] sm:w-[85%] md:w-[80%] lg:w-[70%] xl:w-[60%] 
                     px-3 sm:px-5 py-2 sm:py-3 rounded-full shadow-lg border border-blue-800/40"
        >
          <Link to="/" className="flex items-center space-x-2 text-white">
            <GraduationCap className="w-6 xs:w-7 h-6 xs:h-7 text-white drop-shadow-lg" />
            <span className="text-sm xs:text-base sm:text-lg md:text-2xl font-bold text-white tracking-wide">
              Uni-Finder
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-4 md:space-x-6 relative">
            {links.map(({ to, icon: Icon, text }) => {
              const isActive = location.pathname === to;
              return (
                <motion.div
                  key={to}
                  className="relative flex flex-col items-center"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tracker"
                      className="absolute inset-0 rounded-full bg-blue-500/40"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                    />
                  )}
                  <Link
                    to={to}
                    className="relative flex items-center sm:space-x-2 px-2 sm:px-3 py-1 text-xs xs:text-sm sm:text-base md:text-lg font-semibold text-white z-10"
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="hidden sm:inline text-white">{text}</span>
                  </Link>
                </motion.div>
              );
            })}

            {/* Account Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAccountMenu((prev) => !prev)}
                type="button"
                className="flex items-center space-x-2 px-2 sm:px-3 py-1 rounded-full 
                           font-semibold text-sm sm:text-base 
                           transition-all duration-300
                           bg-transparent hover:bg-blue-400/10 text-blue-100 border border-transparent focus:outline-none"
              >
                <User
                  className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none"
                  style={{ color: "#bfdbfe" }}
                />
              </motion.button>
              <AnimatePresence>
                {showAccountMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 12 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    style={dropdownContainerStyle}
                    className="absolute right-0 mt-4 w-60 rounded-2xl shadow-lg border border-blue-800/40 overflow-hidden z-50"
                  >
                    {!isLoggedIn ? (
                      <>
                        <button
                          type="button"
                          className="flex items-center gap-3 w-full text-left px-5 py-3 text-white hover:bg-blue-800/60 transition"
                          onClick={() => {
                            setAuthMode(true);
                            setShowAuthModal(true);
                            setShowAccountMenu(false);
                          }}
                          style={{
                            color: "#fff",
                            backgroundColor: "transparent",
                          }}
                        >
                          <LogIn className="w-5 h-5" /> Login
                        </button>

                        <button
                          type="button"
                          className="flex items-center gap-3 w-full text-left px-5 py-3 text-white hover:bg-blue-800/60 transition"
                          onClick={() => {
                            setAuthMode(false);
                            setShowAuthModal(true);
                            setShowAccountMenu(false);
                          }}
                          style={{
                            color: "#fff",
                            backgroundColor: "transparent",
                          }}
                        >
                          <UserPlus className="w-5 h-5" /> Register
                        </button>
                      </>
                    ) : isAdmin ? (
                      <>
                        <button
                          type="button"
                          className="flex items-center gap-3 w-full text-left px-5 py-3 text-white hover:bg-blue-800/60 transition"
                          onClick={() => {
                            navigate("/dashboard");
                            setShowAccountMenu(false);
                          }}
                        >
                          <FileText className="w-5 h-5" /> Management Page
                        </button>

                        <button
                          type="button"
                          className="flex items-center gap-3 w-full text-left px-5 py-3 text-white hover:bg-blue-800/60 transition"
                          onClick={() => {
                            setShowLogoutConfirm(true);
                            setShowAccountMenu(false);
                          }}
                        >
                          <LogOut className="w-5 h-5" /> Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="flex items-center gap-3 w-full text-left px-5 py-3 text-white hover:bg-blue-800/60 transition"
                          onClick={() => {
                            setShowHistoryModal(true);
                            setShowAccountMenu(false);
                          }}
                          style={{
                            color: "#fff",
                            backgroundColor: "transparent",
                          }}
                        >
                          <History className="w-5 h-5" /> History Log
                        </button>

                        <button
                          type="button"
                          className="flex items-center gap-3 w-full text-left px-5 py-3 text-white hover:bg-blue-800/60 transition"
                          onClick={() => {
                            setShowPreviousResultsModal(true);
                            setShowAccountMenu(false);
                          }}
                          style={{
                            color: "#fff",
                            backgroundColor: "transparent",
                          }}
                        >
                          <FileText className="w-5 h-5" /> View Previous Results
                        </button>

                        <button
                          type="button"
                          className="flex items-center gap-3 w-full text-left px-5 py-3 text-white hover:bg-blue-800/60 transition"
                          onClick={() => {
                            setShowLogoutConfirm(true);
                            setShowAccountMenu(false);
                          }}
                          style={{
                            color: "#fff",
                            backgroundColor: "transparent",
                          }}
                        >
                          <LogOut className="w-5 h-5" /> Logout
                        </button>

                        <button
                          type="button"
                          className="flex items-center gap-3 w-full text-left px-5 py-3 text-white bg-red-600 hover:bg-red-700 transition"
                          onClick={() => {
                            setShowDeleteConfirm(true);
                            setShowAccountMenu(false);
                          }}
                          style={{
                            color: "#fff",
                            backgroundColor: "transparent",
                          }}
                        >
                          <Trash2 className="w-5 h-5" /> Delete Account
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>
      </div>

      {/* Confirmation Modals */}
      {createPortal(
        <AnimatePresence>
          {(showLogoutConfirm || showDeleteConfirm) && (
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[9998]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                style={modalContainerStyle}
                className="relative backdrop-blur-lg border border-blue-800/40 p-8 rounded-3xl shadow-2xl text-center w-[90%] max-w-sm"
              >
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    setShowDeleteConfirm(false);
                  }}
                  className="absolute top-4 right-4 text-white hover:text-red-400 p-1 rounded-full bg-transparent border-none outline-none shadow-none"
                >
                  <X size={22} />
                </button>

                <h2 className="text-lg font-semibold mb-4 font-poppins text-white">
                  {showLogoutConfirm
                    ? "Are you sure you want to logout?"
                    : "Are you sure you want to delete your account?"}
                </h2>

                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={() => {
                      showLogoutConfirm
                        ? handleLogout()
                        : handleDeleteAccount();
                    }}
                    type="button"
                    className="px-5 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 border border-red-600 transition-colors duration-200"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      setShowDeleteConfirm(false);
                    }}
                    type="button"
                    className="px-5 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Other Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultIsLogin={authMode}
      />
      <HistoryLogModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
      <PreviousResultsModal
        isOpen={showPreviousResultsModal}
        onClose={() => setShowPreviousResultsModal(false)}
      />
    </>
  );
}

export default Navbar;

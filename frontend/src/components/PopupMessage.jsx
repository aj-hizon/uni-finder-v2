import { useEffect, useState } from "react";

export default function PopupMessage({ type = "info", message, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), 2500);
    const removeTimer = setTimeout(onClose, 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onClose]);

  const baseStyle = `
    fixed top-6 left-1/2 transform -translate-x-1/2 
    px-6 py-3 rounded-2xl shadow-lg 
    text-white font-[Poppins] text-sm 
    z-[99999] transition-all duration-500 ease-in-out 
    backdrop-blur-2xl bg-opacity-40 
    border border-white/30
  `;

  const typeStyles = {
    success:
      "bg-gradient-to-br from-green-400/40 via-green-500/30 to-green-600/40 text-white shadow-green-800/20",
    error:
      "bg-gradient-to-br from-red-400/40 via-red-500/30 to-red-600/40 text-white shadow-red-800/20",
    info:
      "bg-gradient-to-br from-blue-400/40 via-blue-500/30 to-blue-600/40 text-white shadow-blue-800/20",
  };

  return (
    <div
      className={`${baseStyle} ${typeStyles[type]} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}

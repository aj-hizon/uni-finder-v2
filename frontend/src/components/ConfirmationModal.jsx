import ReactDOM from "react-dom";
import { X } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0a1733]/90 border border-blue-400/20 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-red-400 transition"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold mb-3 text-center">{title}</h3>
        <p className="text-center text-white/80 mb-6">{message}</p>

        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-blue-800/40 bg-blue-600/30 hover:bg-blue-600/50 text-white font-semibold transition"
          >
            {cancelText}
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-lg border border-red-500/40 bg-red-600/40 hover:bg-red-600/60 text-white font-semibold transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

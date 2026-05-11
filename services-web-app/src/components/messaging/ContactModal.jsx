import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredAuthSession } from "../../utils/auth.js";
import "../../styles/messaging/contactModal.css";

const ContactModal = ({ isOpen, onClose, recipientId, serviceId, bookingId }) => {
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message, threadId? }

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!body.trim()) return;

    const session = getStoredAuthSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setSending(true);
    setToast(null);

    try {
      const res = await fetch("http://localhost:3000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ recipientId, body: body.trim(), serviceId, bookingId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ type: "error", message: data.message || "Failed to send message" });
        return;
      }

      setBody("");
      setToast({ type: "success", message: "Message sent!", threadId: data.threadId });
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setBody("");
    setToast(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Send a message</h2>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        {toast && (
          <div className={`modal-toast ${toast.type}`}>
            <span>{toast.message}</span>
            {toast.type === "success" && toast.threadId && (
              <button
                className="modal-toast-link"
                onClick={() => {
                  handleClose();
                  navigate(`/messages?thread=${toast.threadId}`);
                }}
              >
                View conversation →
              </button>
            )}
          </div>
        )}

        {toast?.type !== "success" && (
          <>
            <textarea
              className="modal-textarea"
              placeholder="Write your message here…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={sending}
            />

            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={handleClose} disabled={sending}>
                Cancel
              </button>
              <button
                className="modal-btn-send"
                onClick={handleSend}
                disabled={sending || !body.trim()}
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContactModal;

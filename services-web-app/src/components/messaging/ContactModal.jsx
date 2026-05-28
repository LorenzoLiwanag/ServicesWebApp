import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredAuthSession } from "../../utils/auth.js";
import { startConversation } from "../../api/conversations.js";
import "../../styles/messaging/contactModal.css";

const ContactModal = ({ isOpen, onClose, serviceId }) => {
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

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
      const data = await startConversation(session.token, serviceId, body.trim());
      setBody("");
      setToast({ type: "success", message: "Message sent successfully.", conversationId: data.conversationId });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to send message. Please try again." });
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
          <h2 className="modal-title">Contact Provider</h2>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        {toast && (
          <div className={`modal-toast ${toast.type}`}>
            <span>{toast.message}</span>
            {toast.type === "success" && toast.conversationId && (
              <button
                className="modal-toast-link"
                onClick={() => {
                  handleClose();
                  navigate(`/messages?conversation=${toast.conversationId}`);
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

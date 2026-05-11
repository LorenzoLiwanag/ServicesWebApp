import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import { getStoredAuthSession } from "../utils/auth.js";
import "../styles/messaging/messagesPage.css";

const API = "http://localhost:3000";

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessagesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const session = getStoredAuthSession();
  const myUserId = session?.user?.id;

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState("");

  const [activeThreadId, setActiveThreadId] = useState(null);
  const [conversation, setConversation] = useState(null); // { thread, messages }
  const [convLoading, setConvLoading] = useState(false);

  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const authHeader = session ? { Authorization: `Bearer ${session.token}` } : {};

  // Load thread list on mount
  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }

    const fetchThreads = async () => {
      try {
        const res = await fetch(`${API}/api/messages/threads`, { headers: authHeader });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setThreads(data.threads || []);
      } catch (err) {
        setThreadsError(err.message || "Failed to load conversations");
      } finally {
        setThreadsLoading(false);
      }
    };

    fetchThreads();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Open thread from ?thread= query param
  useEffect(() => {
    const qThread = Number(searchParams.get("thread"));
    if (qThread && qThread !== activeThreadId) {
      openThread(qThread);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const openThread = async (threadId) => {
    setActiveThreadId(threadId);
    setSearchParams({ thread: threadId });
    setConvLoading(true);
    setConversation(null);

    try {
      const res = await fetch(`${API}/api/messages?thread=${threadId}`, {
        headers: authHeader,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setConversation(data);
    } catch {
      setConversation(null);
    } finally {
      setConvLoading(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSendReply = async () => {
    if (!replyBody.trim() || !conversation) return;

    const { thread } = conversation;
    const recipientId =
      thread.participant_a === myUserId ? thread.participant_b : thread.participant_a;

    setSending(true);
    try {
      const res = await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          recipientId,
          body: replyBody.trim(),
          serviceId: thread.service_id ?? undefined,
          bookingId: thread.booking_id ?? undefined,
        }),
      });
      if (!res.ok) return;
      setReplyBody("");
      // Refresh the conversation
      await openThread(activeThreadId);
      // Refresh thread list preview
      const tRes = await fetch(`${API}/api/messages/threads`, { headers: authHeader });
      const tData = await tRes.json();
      if (tRes.ok) setThreads(tData.threads || []);
    } finally {
      setSending(false);
    }
  };

  const activeThread = threads.find((t) => t.threadId === activeThreadId);

  return (
    <div className="messages-page">
      <DashboardNavbar />

      <div className="messages-container">
        {/* ── Left: thread list ── */}
        <div className="threads-panel">
          <div className="threads-panel-header">
            <h2 className="threads-panel-title">Messages</h2>
          </div>

          <div className="threads-list">
            {threadsLoading && (
              <p className="messages-loading">Loading conversations…</p>
            )}
            {threadsError && (
              <p className="messages-error">{threadsError}</p>
            )}
            {!threadsLoading && !threadsError && threads.length === 0 && (
              <p className="threads-empty">No conversations yet.</p>
            )}
            {threads.map((t) => (
              <div
                key={t.threadId}
                className={`thread-item ${t.threadId === activeThreadId ? "active" : ""}`}
                onClick={() => openThread(t.threadId)}
              >
                <p className="thread-name">{t.otherUserName}</p>
                <p className="thread-preview">
                  {t.lastSenderId === myUserId ? "You: " : ""}
                  {t.lastMessage}
                </p>
                <p className="thread-time">{formatTime(t.lastMessageAt)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: conversation ── */}
        <div className="conversation-panel">
          {!activeThreadId && (
            <div className="no-thread-selected">
              <span className="no-thread-icon">💬</span>
              <span>Select a conversation to read messages</span>
            </div>
          )}

          {activeThreadId && (
            <>
              <div className="conversation-header">
                {activeThread?.otherUserName ?? "Conversation"}
              </div>

              {convLoading && (
                <p className="messages-loading">Loading messages…</p>
              )}

              {!convLoading && conversation && (
                <div className="messages-list">
                  {conversation.messages.map((m) => {
                    const mine = m.senderId === myUserId;
                    return (
                      <div key={m.messageId}>
                        <div className={`message-bubble-wrap ${mine ? "mine" : ""}`}>
                          <div className={`message-bubble ${mine ? "mine" : "theirs"}`}>
                            {m.body}
                          </div>
                        </div>
                        <div
                          className="bubble-meta"
                          style={{ textAlign: mine ? "right" : "left" }}
                        >
                          {formatTime(m.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}

              <div className="reply-box">
                <textarea
                  className="reply-textarea"
                  placeholder="Type a reply…"
                  value={replyBody}
                  rows={1}
                  onChange={(e) => setReplyBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  disabled={sending}
                />
                <button
                  className="reply-send-btn"
                  onClick={handleSendReply}
                  disabled={sending || !replyBody.trim()}
                >
                  {sending ? "…" : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;

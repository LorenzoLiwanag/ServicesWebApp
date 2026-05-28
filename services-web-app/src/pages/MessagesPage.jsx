import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import { getStoredAuthSession } from "../utils/auth.js";
import {
  fetchConversations,
  fetchConversationMessages,
  sendReply,
  markConversationRead,
} from "../api/conversations.js";
import "../styles/messaging/messagesPage.css";

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
  const token = session?.token;
  const myUserId = session?.user?.id;

  const [conversations, setConversations] = useState([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [convsError, setConvsError] = useState("");

  const [activeId, setActiveId] = useState(null);
  const [convData, setConvData] = useState(null); // { conversation, messages }
  const [convLoading, setConvLoading] = useState(false);

  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!session) { navigate("/login"); return; }
    loadConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const qId = Number(searchParams.get("conversation"));
    if (qId && qId !== activeId) openConversation(qId);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convData?.messages]);

  const loadConversations = async () => {
    try {
      const data = await fetchConversations(token);
      setConversations(data);
    } catch (err) {
      setConvsError(err.message || "Failed to load conversations");
    } finally {
      setConvsLoading(false);
    }
  };

  const openConversation = async (id) => {
    setActiveId(id);
    setSearchParams({ conversation: id });
    setConvLoading(true);
    setConvData(null);
    try {
      const data = await fetchConversationMessages(token, id);
      setConvData(data);
      await markConversationRead(token, id);
      setConversations((prev) =>
        prev.map((c) => (c.conversationId === id ? { ...c, unreadCount: 0 } : c))
      );
    } catch {
      setConvData(null);
    } finally {
      setConvLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyBody.trim() || !convData) return;
    setSending(true);
    try {
      await sendReply(token, activeId, replyBody.trim());
      setReplyBody("");
      const data = await fetchConversationMessages(token, activeId);
      setConvData(data);
      const convs = await fetchConversations(token);
      setConversations(convs);
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find((c) => c.conversationId === activeId);

  return (
    <div className="messages-page">
      <DashboardNavbar />

      <div className="messages-container">
        {/* Left: conversation list */}
        <div className="threads-panel">
          <div className="threads-panel-header">
            <h2 className="threads-panel-title">Messages</h2>
          </div>

          <div className="threads-list">
            {convsLoading && <p className="messages-loading">Loading conversations…</p>}
            {convsError && <p className="messages-error">{convsError}</p>}
            {!convsLoading && !convsError && conversations.length === 0 && (
              <p className="threads-empty">No conversations yet.</p>
            )}
            {conversations.map((c) => (
              <div
                key={c.conversationId}
                className={`thread-item ${c.conversationId === activeId ? "active" : ""}`}
                onClick={() => openConversation(c.conversationId)}
              >
                <div className="thread-item-row">
                  <p className="thread-name">{c.otherUserName}</p>
                  {Number(c.unreadCount) > 0 && (
                    <span className="thread-unread-badge">{c.unreadCount}</span>
                  )}
                </div>
                {c.serviceTitle && (
                  <p className="thread-service">{c.serviceTitle}</p>
                )}
                <p className="thread-preview">
                  {c.lastSenderId === myUserId ? "You: " : ""}
                  {c.lastMessage ?? "No messages yet"}
                </p>
                <p className="thread-time">{formatTime(c.lastMessageAt ?? c.updatedAt)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: conversation view */}
        <div className="conversation-panel">
          {!activeId && (
            <div className="no-thread-selected">
              <span className="no-thread-icon">💬</span>
              <span>Select a conversation to read messages</span>
            </div>
          )}

          {activeId && (
            <>
              <div className="conversation-header">
                <span className="conversation-header-name">
                  {activeConv?.otherUserName ?? convData?.conversation?.clientName ?? "Conversation"}
                </span>
                {(activeConv?.serviceTitle ?? convData?.conversation?.serviceTitle) && (
                  <span className="conversation-header-service">
                    Re: {activeConv?.serviceTitle ?? convData?.conversation?.serviceTitle}
                  </span>
                )}
              </div>

              {convLoading && <p className="messages-loading">Loading messages…</p>}

              {!convLoading && convData && (
                <div className="messages-list">
                  {convData.messages.length === 0 && (
                    <p className="threads-empty" style={{ padding: "20px" }}>No messages yet.</p>
                  )}
                  {convData.messages.map((m) => {
                    const mine = m.senderId === myUserId;
                    return (
                      <div key={m.messageId}>
                        <div className={`message-bubble-wrap ${mine ? "mine" : ""}`}>
                          <div className={`message-bubble ${mine ? "mine" : "theirs"}`}>
                            {m.body}
                          </div>
                        </div>
                        <div className="bubble-meta" style={{ textAlign: mine ? "right" : "left" }}>
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

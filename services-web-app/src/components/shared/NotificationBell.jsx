import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredAuthSession } from "../../utils/auth.js";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/conversations.js";
import "../../styles/shared/notificationBell.css";

const POLL_INTERVAL = 30000;

const NotificationBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const session = getStoredAuthSession();
  const token = session?.token;

  useEffect(() => {
    if (!token) return;
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await fetchUnreadCount(token);
      setUnreadCount(count);
    } catch {
      // silently ignore
    }
  };

  const handleBellClick = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      const data = await fetchNotifications(token);
      setNotifications(data.slice(0, 10));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      await markNotificationRead(token, n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.relatedEntityType === "conversation" && n.relatedEntityId) {
      navigate(`/messages?conversation=${n.relatedEntityId}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(token);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  if (!token) return null;

  return (
    <div className="notif-bell-wrapper" ref={dropdownRef}>
      <button
        className="notif-bell-btn"
        onClick={handleBellClick}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg className="notif-bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notif-bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all-btn" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {loading && <p className="notif-empty">Loading…</p>}
            {!loading && notifications.length === 0 && (
              <p className="notif-empty">No notifications yet.</p>
            )}
            {!loading &&
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${n.isRead ? "" : "unread"}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="notif-item-content">
                    <p className="notif-item-title">{n.title}</p>
                    <p className="notif-item-message">{n.message}</p>
                    <p className="notif-item-time">{formatTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="notif-unread-dot" />}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

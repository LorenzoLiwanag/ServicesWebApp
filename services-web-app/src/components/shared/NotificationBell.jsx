import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredAuthSession } from "../../utils/auth.js";
import {
  fetchNotifications,
  fetchDeletedNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  permanentlyDeleteNotification,
  permanentlyDeleteAllNotifications,
} from "../../api/conversations.js";
import "../../styles/shared/notificationBell.css";

const POLL_INTERVAL = 30000;

const NotificationBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [deletedNotifications, setDeletedNotifications] = useState([]);
  const [view, setView] = useState("active");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
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

  const loadActiveNotifications = async () => {
    setView("active");
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await fetchNotifications(token);
      setNotifications(data.slice(0, 10));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDeletedNotifications = async () => {
    setView("deleted");
    setLoading(true);
    setExpandedNotificationId(null);
    setErrorMessage("");
    try {
      const data = await fetchDeletedNotifications(token);
      setDeletedNotifications(data.slice(0, 50));
    } catch {
      setDeletedNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    await loadActiveNotifications();
  };

  const handleNotificationClick = async (n) => {
    setErrorMessage("");
    setExpandedNotificationId((currentId) => (currentId === n.id ? null : n.id));

    if (n.isRead) return;

    try {
      await markNotificationRead(token, n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      setErrorMessage("Couldn't mark that notification as read.");
    }
  };

  const handleOpenRelatedMessage = (e, n) => {
    e.stopPropagation();
    setOpen(false);
    if (n.relatedEntityType === "conversation" && n.relatedEntityId) {
      navigate(`/messages?conversation=${n.relatedEntityId}`);
    }
  };

  const handleMarkAllRead = async () => {
    setErrorMessage("");
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      setErrorMessage("Couldn't mark notifications as read.");
    }
  };

  const handleDeleteNotification = async (e, n) => {
    e.stopPropagation();
    setErrorMessage("");
    try {
      await deleteNotification(token, n.id);
      const deletedAt = new Date().toISOString();
      setNotifications((prev) => prev.filter((x) => x.id !== n.id));
      setDeletedNotifications((prev) => [
        { ...n, isRead: true, deletedAt },
        ...prev.filter((x) => x.id !== n.id),
      ]);
      setExpandedNotificationId((currentId) => (currentId === n.id ? null : currentId));
      if (!n.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      setErrorMessage("Couldn't move that notification to Recently Deleted.");
    }
  };

  const handleDeleteAllNotifications = async () => {
    setErrorMessage("");
    try {
      const deletedAt = new Date().toISOString();
      const movedNotifications = notifications.map((n) => ({
        ...n,
        isRead: true,
        deletedAt,
      }));
      await deleteAllNotifications(token);
      setDeletedNotifications((prev) => [
        ...movedNotifications,
        ...prev.filter((deleted) => !movedNotifications.some((n) => n.id === deleted.id)),
      ]);
      setNotifications([]);
      setExpandedNotificationId(null);
      setUnreadCount(0);
    } catch {
      setErrorMessage("Couldn't move notifications to Recently Deleted.");
    }
  };

  const handlePermanentDelete = async (notificationId) => {
    setErrorMessage("");
    try {
      await permanentlyDeleteNotification(token, notificationId);
      setDeletedNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch {
      setErrorMessage("Couldn't permanently delete that notification.");
    }
  };

  const handlePermanentDeleteAll = async () => {
    setErrorMessage("");
    try {
      await permanentlyDeleteAllNotifications(token);
      setDeletedNotifications([]);
    } catch {
      setErrorMessage("Couldn't permanently delete notifications.");
    }
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
            <span className="notif-dropdown-title">
              {view === "deleted" ? "Recently Deleted" : "Notifications"}
            </span>
            {view === "active" ? (
              <div className="notif-header-actions">
                {unreadCount > 0 && (
                  <button className="notif-action-link" onClick={handleMarkAllRead} type="button">
                    Mark all read
                  </button>
                )}
                <button className="notif-action-link" onClick={loadDeletedNotifications} type="button">
                  Recently Deleted
                </button>
              </div>
            ) : (
              <button className="notif-action-link" onClick={loadActiveNotifications} type="button">
                Back
              </button>
            )}
          </div>

          {view === "active" && notifications.length > 0 && !loading && (
            <div className="notif-toolbar">
              <button className="notif-danger-link" onClick={handleDeleteAllNotifications} type="button">
                Clear all
              </button>
            </div>
          )}

          {view === "deleted" && deletedNotifications.length > 0 && !loading && (
            <div className="notif-toolbar">
              <span className="notif-retention-note">Auto-deletes after 30 days.</span>
              <button className="notif-danger-link" onClick={handlePermanentDeleteAll} type="button">
                Delete all forever
              </button>
            </div>
          )}

          {errorMessage && <p className="notif-error">{errorMessage}</p>}

          <div className="notif-list">
            {loading && <p className="notif-empty">Loading...</p>}
            {!loading && view === "active" && notifications.length === 0 && (
              <p className="notif-empty">No notifications yet.</p>
            )}
            {!loading && view === "deleted" && deletedNotifications.length === 0 && (
              <p className="notif-empty">No recently deleted notifications.</p>
            )}

            {!loading && view === "active" &&
              notifications.map((n) => {
                const isExpanded = expandedNotificationId === n.id;

                return (
                  <div
                    key={n.id}
                    className={`notif-item ${n.isRead ? "" : "unread"} ${isExpanded ? "expanded" : ""}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="notif-item-content">
                      <p className="notif-item-title">{n.title}</p>
                      <p className={`notif-item-message ${isExpanded ? "expanded" : ""}`}>
                        {n.message}
                      </p>
                      {isExpanded && n.relatedEntityType === "conversation" && n.relatedEntityId && (
                        <button
                          className="notif-open-link"
                          onClick={(e) => handleOpenRelatedMessage(e, n)}
                          type="button"
                        >
                          Open message
                        </button>
                      )}
                      <p className="notif-item-time">{formatTime(n.createdAt)}</p>
                    </div>
                    <div className="notif-item-side">
                      {!n.isRead && <span className="notif-unread-dot" />}
                      <button
                        className="notif-delete-btn"
                        onClick={(e) => handleDeleteNotification(e, n)}
                        aria-label={`Delete notification: ${n.title}`}
                        title="Delete"
                        type="button"
                      >
                        x
                      </button>
                    </div>
                  </div>
                );
              })}

            {!loading && view === "deleted" &&
              deletedNotifications.map((n) => (
                <div key={n.id} className="notif-item deleted">
                  <div className="notif-item-content">
                    <p className="notif-item-title">{n.title}</p>
                    <p className="notif-item-message expanded">{n.message}</p>
                    <p className="notif-item-time">Deleted {formatTime(n.deletedAt)}</p>
                  </div>
                  <button
                    className="notif-delete-btn danger"
                    onClick={() => handlePermanentDelete(n.id)}
                    aria-label={`Permanently delete notification: ${n.title}`}
                    title="Delete forever"
                    type="button"
                  >
                    x
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

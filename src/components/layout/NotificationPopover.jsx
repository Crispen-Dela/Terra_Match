import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

export default function NotificationPopover() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8082';
      const response = await fetch(`${baseUrl}/api/notifications/${user.id}`, {
        // Passing user id in params as per our route. If we added full JWT auth, we'd add Headers here.
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` 
        }
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8082';
      const response = await fetch(`${baseUrl}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Failed to mark as read');
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const togglePopover = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative flex items-center" ref={popoverRef}>
      <button 
        onClick={togglePopover}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-mist-100"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" aria-hidden="true">
          <path
            d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13.7 21a2 2 0 01-3.4 0" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[120%] mt-1 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-ink-900/10 z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-ink-900/5 bg-mist-50 flex justify-between items-center">
            <h3 className="font-semibold text-ink-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-forest-600 font-medium">{unreadCount} unread</span>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 max-h-96">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-ink-500 text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-ink-500 text-sm">You're all caught up!</div>
            ) : (
              <ul className="divide-y divide-ink-900/5">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                    className={cn(
                      "p-4 transition-colors cursor-pointer flex items-start gap-3",
                      !notification.isRead ? "bg-forest-50/30 hover:bg-forest-50/50" : "bg-white hover:bg-mist-50"
                    )}
                  >
                    <div className="mt-1.5 flex-shrink-0">
                      {!notification.isRead ? (
                        <div className="w-2.5 h-2.5 bg-forest-600 rounded-full"></div>
                      ) : (
                        <div className="w-2.5 h-2.5 bg-ink-300 rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm text-ink-900",
                        !notification.isRead ? "font-semibold" : "font-normal"
                      )}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-ink-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

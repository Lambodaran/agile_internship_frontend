// src/components/Header/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Menu, LogOut, User, Bell } from 'lucide-react';

interface HeaderProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
}

// Mock notifications (unchanged)
const MOCK_NOTIFICATIONS = [
  { id: 'n1', message: 'Nirojan attended the Frontend Quiz', time: '10 min ago', read: false },
  { id: 'n2', message: 'Kavindi attended the Python Exam', time: '2 hours ago', read: false },
  { id: 'n3', message: 'Sathursan was marked as Selected', time: 'Yesterday', read: true },
];

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, setSidebarOpen, onLogout }) => {
  // ─── Try to get real username from login response ───────────────────────
  const getDisplayUsername = () => {
    // Most common storage patterns after login:
    const stored = localStorage.getItem('user') ||          // {username, role, ...}
                   localStorage.getItem('auth_user') ||
                   localStorage.getItem('user_info');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.username || parsed.user?.username || 'User';
      } catch {}
    }

    // Fallback 1: direct key (sometimes people store just the username)
    const directUsername = localStorage.getItem('username');
    if (directUsername) return directUsername;

    // Fallback 2: the mock value you were using before
    return localStorage.getItem('mock_username') || 'interviewer';
  };

  const [username, setUsername] = useState(getDisplayUsername());

  const [profilePreview, setProfilePreview] = useState<string | null>(
    localStorage.getItem('mock_profile_preview')
  );

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  // Re-check username when storage changes (useful during development)
  useEffect(() => {
    const handleStorage = () => {
      setUsername(getDisplayUsername());
    };

    window.addEventListener('storage', handleStorage);
    // Also check once after mount (in case login happened just before)
    handleStorage();

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Keep profile preview in sync (from profile page)
  useEffect(() => {
    const interval = setInterval(() => {
      const savedPhoto = localStorage.getItem('mock_profile_preview');
      if (savedPhoto !== profilePreview) setProfilePreview(savedPhoto);
    }, 3000);
    return () => clearInterval(interval);
  }, [profilePreview]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = username.charAt(0).toUpperCase() || '?';

  // Rest of your header code remains the same...
  // (avatar display, notification dropdown, desktop/mobile layouts, etc.)

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-30">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - toggle + title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-600">InternTrack</span>
              <span className="ml-2 text-sm text-gray-500 hidden sm:block">
                Interviewer Panel
              </span>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Notification bell – unchanged */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border rounded-lg shadow-xl z-50 max-h-[70vh] overflow-y-auto">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                  </div>
                  {MOCK_NOTIFICATIONS.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No notifications</div>
                  ) : (
                    <div className="divide-y">
                      {MOCK_NOTIFICATIONS.map(n => (
                        <div
                          key={n.id}
                          className={`p-4 hover:bg-gray-50 ${!n.read ? 'bg-blue-50/40' : ''}`}
                        >
                          <p className="text-sm font-medium">{n.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop profile + logout */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200">
                  {profilePreview ? (
                    <img src={profilePreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg">
                      {initials}
                    </div>
                  )}
                </div>
                <span className="font-medium">Hi, {username}</span>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>

            {/* Mobile menu – unchanged, just using same username & avatar */}
            {/* ... your mobile dropdown code here ... */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
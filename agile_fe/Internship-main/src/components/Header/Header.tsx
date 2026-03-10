import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
}

const MOCK_NOTIFICATIONS = [
  { id: 'n1', message: 'Nirojan attended the Frontend Quiz', time: '10 min ago', read: false },
  { id: 'n2', message: 'Kavindi attended the Python Exam', time: '2 hours ago', read: false },
  { id: 'n3', message: 'Sathursan was marked as Selected', time: 'Yesterday', read: true },
];

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, setSidebarOpen, onLogout }) => {
  const navigate = useNavigate();
  const getDisplayUsername = () => {
    const stored =
      localStorage.getItem('user') ||
      localStorage.getItem('auth_user') ||
      localStorage.getItem('user_info');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.username || parsed.user?.username || 'User';
      } catch {
        // ignore parsing issues
      }
    }

    const directUsername = localStorage.getItem('username');
    if (directUsername) return directUsername;

    return localStorage.getItem('mock_username') || 'interviewer';
  };

  const [username, setUsername] = useState(getDisplayUsername());
  const [profilePreview, setProfilePreview] = useState<string | null>(
    localStorage.getItem('mock_profile_preview')
  );
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  const initials = username.charAt(0).toUpperCase() || '?';

  useEffect(() => {
    const handleStorage = () => setUsername(getDisplayUsername());

    window.addEventListener('storage', handleStorage);
    handleStorage();

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const savedPhoto = localStorage.getItem('mock_profile_preview');
      if (savedPhoto !== profilePreview) setProfilePreview(savedPhoto);
    }, 3000);

    return () => clearInterval(interval);
  }, [profilePreview]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_30%)]" />

      <div className="relative max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              onClick={toggleSidebar}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-xl transition-all duration-200 hover:bg-white/15 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-400/30"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">
                Skyro
              </h1>
              <p className="hidden truncate text-xs text-slate-300 sm:block sm:text-sm">
                Interviewer Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-xl transition-all duration-200 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-blue-400/30"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-white stroke-[2.2]" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-slate-950">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-[320px] overflow-hidden rounded-[28px] border border-slate-200/20 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.22)] backdrop-blur-2xl sm:w-[380px]">
                  <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-4 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">Notifications</h3>
                        <p className="mt-1 text-xs text-slate-300">
                          {unreadCount} unread update{unreadCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {MOCK_NOTIFICATIONS.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-slate-500">
                      No notifications available.
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                      {MOCK_NOTIFICATIONS.map((n) => (
                        <div
                          key={n.id}
                          className={`border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50 ${
                            !n.read ? 'bg-blue-50/60' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                                !n.read ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-800">{n.message}</p>
                              <p className="mt-1 text-xs text-slate-500">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden sm:block" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-left text-white backdrop-blur-xl transition-all duration-200 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-blue-400/30"
              >
                <div className="h-10 w-10 overflow-hidden rounded-2xl ring-2 ring-white/15 shadow-md">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="hidden md:block">
                  <p className="max-w-[150px] truncate text-sm font-semibold">{username}</p>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-slate-300 transition-transform duration-200 ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-64 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.22)] mx-3">
                  

                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => navigate('/interviewer-profile')}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      <User className="h-4 w-4 text-slate-500" />
                      Profile
                    </button>

                    <button
                      onClick={onLogout}
                      className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative sm:hidden" ref={mobileMenuRef}>
              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-xl focus:outline-none focus:ring-4 focus:ring-blue-400/30"
                aria-label="User menu"
              >
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">{initials}</span>
                )}
              </button>

              {isMobileMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-72 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.22)]">
                  <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-4 py-5 text-white">
                    <p className="truncate text-sm font-semibold">Hi, {username}</p>
                    <p className="mt-1 text-xs text-slate-300">Interviewer Dashboard</p>
                  </div>

                  <div className="space-y-2 p-3">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <User className="h-4 w-4 text-slate-500" />
                      Profile
                    </button>

                    <button
                      onClick={onLogout}
                      className="flex w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
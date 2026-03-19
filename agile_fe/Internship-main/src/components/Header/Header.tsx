import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface HeaderProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
}

interface UserData {
  username: string;
  role: string;
  profile_photo?: string | null;
}

interface NotificationItem {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  application_id?: number | null;
  interview_id?: number | null;
  action_path?: string;
}

const baseApi = import.meta.env.VITE_BASE_API;

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, setSidebarOpen, onLogout }) => {
  const navigate = useNavigate();
  
  // Function to get logged in user details from localStorage
  const getStoredUser = (): UserData => {
    // Check for auth_user (login response)
    const authUser = localStorage.getItem('auth_user');
    if (authUser) {
      try {
        const parsed = JSON.parse(authUser);
        if (parsed && parsed.role && parsed.username) {
          return {
            username: parsed.username,
            role: parsed.role
          };
        }
      } catch (e) {
        console.log('Error parsing auth_user:', e);
      }
    }

    // Check for individual keys
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    
    if (role && username) {
      return {
        username: username,
        role: role
      };
    }

    // Default fallback
    return {
      username: 'interviewer',
      role: 'interviewer'
    };
  };

  const [user, setUser] = useState<UserData>(getStoredUser());
  const [profilePhoto, setProfilePhoto] = useState<string | null>(
    localStorage.getItem('profile_photo_url') || localStorage.getItem('mock_profile_preview')
  );
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const initials = user.username.charAt(0).toUpperCase() || '?';

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const scope = user.role === 'candidate' ? 'candidate' : 'interviewer';

      const response = await axios.get(`${baseApi}/notifications/${scope}/notifications/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      setNotifications(Array.isArray(response.data?.notifications) ? response.data.notifications : []);
      setUnreadCount(Number(response.data?.unread_count || 0));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const formatRelativeTime = (isoTime: string) => {
    const date = new Date(isoTime);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const markNotificationAsRead = async (notificationId: number, alreadyRead: boolean) => {
    if (alreadyRead) return;
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const scope = user.role === 'candidate' ? 'candidate' : 'interviewer';
      await axios.patch(
        `${baseApi}/notifications/${scope}/notifications/${notificationId}/read/`,
        {},
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationAction = async (notification: NotificationItem) => {
    await markNotificationAsRead(notification.id, notification.is_read);
    setIsNotificationOpen(false);
    navigate(notification.action_path || '/interviewer-dashboard');
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const scope = user.role === 'candidate' ? 'candidate' : 'interviewer';

      await axios.patch(
        `${baseApi}/notifications/${scope}/notifications/mark-all-read/`,
        {},
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Fetch latest user profile from API
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // Determine which endpoint to call based on user role
      const endpoint = user.role === 'candidate' 
        ? `${baseApi}/profiles/candidate/`
        : `${baseApi}/profiles/`;

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const data = response.data;
      
      // Update username if it changed
      if (data.username || data.full_name) {
        const newUsername = data.username || data.full_name || user.username;
        if (newUsername !== user.username) {
          setUser(prev => ({ ...prev, username: newUsername }));
          // Update localStorage
          localStorage.setItem('username', newUsername);
          
          // Update auth_user if exists
          const authUser = localStorage.getItem('auth_user');
          if (authUser) {
            try {
              const parsed = JSON.parse(authUser);
              parsed.username = newUsername;
              localStorage.setItem('auth_user', JSON.stringify(parsed));
            } catch (e) {
              console.error('Error updating auth_user:', e);
            }
          }
        }
      }

      // Update profile photo
      if (data.profile_photo_url) {
        setProfilePhoto(data.profile_photo_url);
        localStorage.setItem('profile_photo_url', data.profile_photo_url);
      } else if (data.profile_photo) {
        setProfilePhoto(data.profile_photo);
        localStorage.setItem('profile_photo_url', data.profile_photo);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Listen for storage changes and fetch profile
  useEffect(() => {
    // Initial fetch
    fetchUserProfile();
    fetchNotifications();

    // Listen for storage events (when profile is updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'auth_user' || e.key === 'username' || e.key === 'role') {
        const updatedUser = getStoredUser();
        setUser(updatedUser);
      }
      
      if (e.key === 'profile_photo_url' || e.key === 'mock_profile_preview') {
        const newPhoto = localStorage.getItem(e.key);
        if (newPhoto) setProfilePhoto(newPhoto);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event listener for profile updates (for same-tab updates)
    const handleProfileUpdate = () => {
      fetchUserProfile();
      fetchNotifications();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);

    // Poll for changes every 2 seconds as a fallback
    const interval = setInterval(() => {
      const storedPhoto = localStorage.getItem('profile_photo_url') || localStorage.getItem('mock_profile_preview');
      if (storedPhoto !== profilePhoto) {
        setProfilePhoto(storedPhoto);
      }

      const storedUser = getStoredUser();
      if (storedUser.username !== user.username || storedUser.role !== user.role) {
        setUser(storedUser);
      }
    }, 2000);

    const notificationInterval = setInterval(() => {
      fetchNotifications();
    }, 20000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profile-updated', handleProfileUpdate);
      clearInterval(interval);
      clearInterval(notificationInterval);
    };
  }, [user.username, user.role, profilePhoto]);

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

  const handleProfileClick = () => {
    if (user.role === 'candidate') {
      navigate('/candidate-profile');
    } else {
      navigate('/interviewer-profile');
    }
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

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
                {user.role === 'candidate' ? 'Candidate Dashboard' : 'Interviewer Dashboard'}
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
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-xs font-medium text-blue-200 hover:text-white"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-slate-500">
                      No notifications available.
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50 ${
                            !n.is_read ? 'bg-blue-50/60' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                                !n.is_read ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-800">{n.message}</p>
                              <p className="mt-1 text-xs text-slate-500">{formatRelativeTime(n.created_at)}</p>
                              <button
                                type="button"
                                onClick={() => handleNotificationAction(n)}
                                className="mt-2 inline-flex items-center rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                View
                              </button>
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
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="hidden md:block">
                  <p className="max-w-[150px] truncate text-sm font-semibold">{user.username}</p>
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
                      onClick={handleProfileClick}
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
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">{initials}</span>
                )}
              </button>

              {isMobileMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-72 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.22)]">
                  <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-4 py-5 text-white">
                    <p className="truncate text-sm font-semibold">Hi, {user.username}</p>
                    <p className="mt-1 text-xs text-slate-300">{user.role === 'candidate' ? 'Candidate Dashboard' : 'Interviewer Dashboard'}</p>
                  </div>

                  <div className="space-y-2 p-3">
                    <button
                      type="button"
                      onClick={handleProfileClick}
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
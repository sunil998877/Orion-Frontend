import React, { useEffect, useState } from "react";
import { Search, Bell, Menu, X, LogOut, Camera, User, Home, BookOpen, BarChart, ArrowUp, Shield, Lock, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import AvatarCropModal from "../components/AvatarCropModal";
import Logo from "../components/Logo";
import { API_BASE } from '../utils/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ username: string; email: string } | null>(() => {
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    return username && email ? { username, email } : null;
  });
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Change Password States
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changePasswordIsLoading, setChangePasswordIsLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const avatarDropdownRef = React.useRef<HTMLDivElement>(null);
  const notifDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target as Node)) {
        setAvatarDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await fetch(`${API_BASE}/notifications/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) { console.error(e); }
  };

  const removeAllNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await fetch(`${API_BASE}/notifications`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const triggerSearch = () => {
    const q = searchTerm.trim();
    if (!q) return;
    navigate(`/course-dashboard?q=${encodeURIComponent(q)}`);
  };
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const user = await res.json();
          setUserInfo({ username: user.username, email: user.email });
          if (user.avatar) {
            setAvatarUrl(user.avatar);
            localStorage.setItem('avatar', user.avatar);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    fetchUserProfile();
    // Fallback to localStorage initially to prevent flicker
    const localAvatar = localStorage.getItem('avatar');
    if (localAvatar) setAvatarUrl(localAvatar);
  }, []);
  const handleAvatarCropped = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('avatar', data.avatar);
        setAvatarUrl(data.avatar);
        setAvatarModalOpen(false);
        fetchNotifications(); // Refresh notifications immediately
      }
    } catch (error) {
      console.error("Avatar upload failed", error);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = changePasswordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangePasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError('New passwords do not match');
      return;
    }

    setChangePasswordIsLoading(true);
    setChangePasswordError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Password updated successfully!');
        setChangePasswordModalOpen(false);
        setChangePasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setChangePasswordError(data.message || 'Failed to update password');
      }
    } catch (error) {
      setChangePasswordError('An error occurred. Please try again later.');
    } finally {
      setChangePasswordIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('courseStatus');
    localStorage.removeItem('avatar');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0a0f1a] to-black text-white">
      <header className="sticky top-0 z-40 h-16 bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="h-full px-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Link to="/course-creator">
              <Logo className="h-14 w-auto" />
            </Link>
          </div>
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search courses"
                className="w-full h-10 rounded-full bg-white/5 border border-white/10 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') triggerSearch();
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="relative" ref={notifDropdownRef}>
                <button
                  className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition relative"
                  onClick={() => { setNotifOpen(v => !v); if (!notifOpen) fetchNotifications(); }}
                >
                  <Bell className="w-5 h-5 text-white/70" />
                  {notifications.some(n => !n.isRead) && (
                    <span className="absolute top-1 right-2 w-2 h-2 bg-lime-500 rounded-full animate-pulse" />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute top-full right-0 mt-2 z-50 w-80 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <span className="text-sm text-white/80">Notifications</span>
                      <div className="flex gap-2">
                        <button
                          className="text-xs px-2 py-1 rounded bg-lime-500/20 text-lime-300 hover:bg-lime-500/30 transition"
                          onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                        >
                          Mark all read
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                          onClick={(e) => { e.stopPropagation(); removeAllNotifications(); }}
                        >
                          Remove all
                        </button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-white/60 text-sm">No notifications</div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition flex items-start gap-3 ${!n.isRead ? 'bg-white/[0.02]' : ''}`}>
                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-lime-500' : 'bg-transparent'
                              }`} />
                            <div className="flex-1">
                              <div className="text-sm text-white font-medium">{n.title}</div>
                              <div className="text-xs text-white/60 mt-0.5 line-clamp-2">{n.message}</div>
                              <div className="text-[10px] text-white/40 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            <div className="relative" ref={avatarDropdownRef}>
              <button
                className="rounded-full focus:outline-none transition-transform active:scale-95"
                onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                    <User className="w-6 h-6 text-white/70" />
                  </div>
                )}
              </button>

              {avatarDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 z-50 w-64 bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fadeInUp">
                  <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-white truncate">{userInfo?.username || 'User'}</span>
                      <span className="text-[10px] text-white/40 font-medium truncate uppercase tracking-widest">{userInfo?.email || 'email@example.com'}</span>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setAvatarModalOpen(true); setAvatarDropdownOpen(false); }}
                      className="w-full px-4 py-3 text-sm text-left text-white/70 hover:bg-white/10 flex items-center gap-3 transition-all font-bold"
                    >
                      <Camera className="w-4 h-4 text-lime-400" />
                      Change Avatar
                    </button>
                    <div className="h-px bg-white/5 mx-2 my-1"></div>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setChangePasswordError('');
                        setChangePasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setChangePasswordModalOpen(true); 
                        setAvatarDropdownOpen(false); 
                      }}
                      className="w-full px-4 py-3 text-sm text-left text-white/70 hover:bg-white/10 flex items-center gap-3 transition-all font-bold"
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Reset Password
                    </button>
                    <div className="h-px bg-white/5 mx-2 my-1"></div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                      className="w-full px-4 py-3 text-sm text-left text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-all font-bold"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white/5 backdrop-blur-md border-r border-white/10">
          <div className="w-full">
            <div className="px-6 py-5 border-b border-white/10">
              <h1 className="text-lg font-semibold text-lime-400">Course Creator</h1>
            </div>
            <nav className="px-3 py-4 space-y-1 text-sm">
              <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition" to="/course-creator">
                <Home className="w-5 h-5" />
                Home
              </Link>
              <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition" to="/course-dashboard">
                <BookOpen className="w-5 h-5" />
                Course
              </Link>
              <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition" to="/analytics">
                <BarChart className="w-5 h-5" />
                Analytics
              </Link>
            </nav>
          </div>
        </aside>
        <main className="flex-1 p-6">
          <div className="w-full space-y-8">{children}</div>
        </main>
      </div>
      <AvatarCropModal
        open={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onCropped={handleAvatarCropped}
      />

      {/* Change Password Modal */}
      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0e1320] border border-white/10 shadow-2xl p-6 md:p-8 animate-scale-in">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setChangePasswordModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">Update Password</h3>
                <p className="text-xs text-white/70">Verify your current password to secure your account and set a new password.</p>
              </div>

              {changePasswordError && (
                <div className="rounded-md bg-red-500/10 p-3 border border-red-500/30 text-sm text-red-200">
                  {changePasswordError}
                </div>
              )}

              <div>
                <label htmlFor="current-password" className="mb-1 block text-xs font-medium text-white/80">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Lock size={16} />
                  </div>
                  <input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={changePasswordData.currentPassword}
                    onChange={(e) => setChangePasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="block w-full rounded-lg border border-white/10 bg-black px-3 py-2 pl-10 pr-10 text-white placeholder:text-gray-700 focus:border-lime-500/50 focus:outline-none focus:ring-1 focus:ring-lime-500/30"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new-password" className="mb-1 block text-xs font-medium text-white/80">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Lock size={16} />
                  </div>
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={changePasswordData.newPassword}
                    onChange={(e) => setChangePasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="block w-full rounded-lg border border-white/10 bg-black px-3 py-2 pl-10 pr-10 text-white placeholder:text-gray-700 focus:border-lime-500/50 focus:outline-none focus:ring-1 focus:ring-lime-500/30"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-new-password" className="mb-1 block text-xs font-medium text-white/80">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Lock size={16} />
                  </div>
                  <input
                    id="confirm-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={changePasswordData.confirmPassword}
                    onChange={(e) => setChangePasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="block w-full rounded-lg border border-white/10 bg-black px-3 py-2 pl-10 pr-10 text-white placeholder:text-gray-700 focus:border-lime-500/50 focus:outline-none focus:ring-1 focus:ring-lime-500/30"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setChangePasswordModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changePasswordIsLoading}
                  className="flex-1 rounded-lg bg-gradient-to-r from-lime-400 to-emerald-500 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-lime-300 hover:to-emerald-400 disabled:opacity-50"
                >
                  {changePasswordIsLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 bottom-0 left-0 w-72 bg-white/5 border-r border-white/10 backdrop-blur-md transform transition-transform duration-300 translate-x-0">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <h1 className="text-lg font-semibold text-lime-400">Course Creator</h1>
              <button
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
                onClick={() => setMobileOpen(false)}
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>
            <nav className="px-3 py-4 space-y-1 text-sm">
              <Link
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
                to="/course-creator"
                onClick={() => setMobileOpen(false)}
              >
                <Home className="w-5 h-5" />
                Home
              </Link>
              <Link
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
                to="/course-dashboard"
                onClick={() => setMobileOpen(false)}
              >
                <BookOpen className="w-5 h-5" />
                Course
              </Link>
              <Link
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
                to="/analytics"
                onClick={() => setMobileOpen(false)}
              >
                <BarChart className="w-5 h-5" />
                Analytics
              </Link>
            </nav>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-lime-500/20 text-lime-400 border border-lime-500/30 hover:bg-lime-500/30 hover:border-lime-500/50 backdrop-blur-md shadow-[0_0_15px_rgba(132,204,22,0.2)] hover:shadow-[0_0_25px_rgba(132,204,22,0.4)] transition-all duration-300 transform hover:-translate-y-1"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

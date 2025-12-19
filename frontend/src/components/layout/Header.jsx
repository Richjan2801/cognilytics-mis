import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Search, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import clsx from 'clsx';

/**
 * Header Component
 * 
 * Top header bar dengan:
 * - Search bar
 * - Notifications
 * - User profile dropdown
 * 
 * @example
 * <Header />
 */

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
    // TODO: Implement search functionality
  };

  return (
    <header className="bg-primary-600 border-b border-primary-700 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-white/60" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent backdrop-blur-sm"
                placeholder="Search students, topics..."
              />
            </div>
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-4 ml-6">
            {/* Notifications */}
            <button className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {/* Notification Badge */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-white/70 capitalize">{user?.role}</p>
                </div>
                <ChevronDown
                  className={clsx(
                    'w-4 h-4 text-white/80 transition-transform',
                    isProfileOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileOpen(false)}
                  ></div>

                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 capitalize mt-2">
                        {user?.role}
                      </span>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-4 h-4 text-gray-500" />
                        <span>My Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate('/settings');
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span>Settings</span>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-200 pt-1">
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

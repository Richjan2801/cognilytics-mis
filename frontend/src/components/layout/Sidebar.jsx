import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Flame,
  Users,
  Lightbulb,
  FileEdit,
  Settings,
  LogOut,
  User,
  Bell,
} from 'lucide-react';
import clsx from 'clsx';

/**
 * Sidebar Navigation Component
 * 
 * Left sidebar dengan logo dan navigation menu
 * Menu items berubah based on user role
 * 
 * @example
 * <Sidebar />
 */

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Navigation items based on role
  const getNavigationItems = () => {
    // Admin-specific items
    if (user?.role === 'admin') {
      return [
        {
          name: 'Dashboard',
          href: '/admin-dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'Teachers',
          href: '/teachers',
          icon: Users,
        },
        {
          name: 'Heatmap',
          href: '/heatmap',
          icon: Flame,
        },
        {
          name: 'Recommendations',
          href: '/recommendations',
          icon: Lightbulb,
        },
      ];
    }

    // Teacher-specific items
    if (user?.role === 'teacher') {
      return [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'Heatmap',
          href: '/heatmap',
          icon: Flame,
        },
        {
          name: 'Teachers',
          href: '/teachers',
          icon: Users,
        },
        {
          name: 'Recommendations',
          href: '/recommendations',
          icon: Lightbulb,
        },
        {
          name: 'Data Entry',
          href: '/data-entry',
          icon: FileEdit,
        },
      ];
    }

    // Student-specific items
    if (user?.role === 'student') {
      return [
        {
          name: 'Dashboard',
          href: '/student-dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'My Sessions',
          href: '/my-sessions',
          icon: FileEdit,
        },
        {
          name: 'My Progress',
          href: '/my-progress',
          icon: Flame,
        },
      ];
    }

    return [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">CL</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">CogniLytics</h1>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={clsx(
                      'w-5 h-5',
                      isActive ? 'text-primary-600' : 'text-gray-500'
                    )}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-100'
            )
          }
        >
          {({ isActive }) => (
            <>
              <User
                className={clsx(
                  'w-5 h-5',
                  isActive ? 'text-primary-600' : 'text-gray-500'
                )}
              />
              <span>Profile</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-100'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Bell
                className={clsx(
                  'w-5 h-5',
                  isActive ? 'text-primary-600' : 'text-gray-500'
                )}
              />
              <span>Notifications</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-100'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings
                className={clsx(
                  'w-5 h-5',
                  isActive ? 'text-primary-600' : 'text-gray-500'
                )}
              />
              <span>Settings</span>
            </>
          )}
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-5 h-5 text-gray-500" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Dashboard Layout Component
 * 
 * Main layout wrapper untuk authenticated pages
 * Includes: Sidebar + Header + Content Area
 * 
 * Uses <Outlet /> from React Router untuk render child routes
 * 
 * @example
 * // In router.jsx:
 * {
 *   path: '/dashboard',
 *   element: <DashboardLayout />,
 *   children: [
 *     { path: '', element: <DashboardPage /> },
 *     { path: 'heatmap', element: <HeatmapPage /> }
 *   ]
 * }
 */

const DashboardLayout = () => {
  const { isLoading, user } = useAuth();
  
  console.log('📐 DashboardLayout render:', { isLoading, userRole: user?.role });
  
  // Show loading while auth is being initialized
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Fixed width */}
      <aside className="w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Fixed at top */}
        <Header />

        {/* Content - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

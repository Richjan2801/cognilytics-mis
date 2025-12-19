import { Outlet } from 'react-router-dom';
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

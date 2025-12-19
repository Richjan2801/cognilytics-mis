import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MySessionsPage from './pages/MySessionsPage';
import MyProgressPage from './pages/MyProgressPage';
import HeatmapPage from './pages/HeatmapPage';
import TeachersPage from './pages/TeachersPage';
import RecommendationsPage from './pages/RecommendationsPage';
import DataEntryPage from './pages/DataEntryPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

/**
 * Application Router Configuration
 * 
 * Menggunakan React Router v6+ dengan createBrowserRouter
 * Layout hierarki: DashboardLayout membungkus semua protected routes
 */

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <TeacherDashboard />,
      },
      {
        path: 'student-dashboard',
        element: <StudentDashboard />,
      },
      {
        path: 'admin-dashboard',
        element: <AdminDashboard />,
      },
      {
        path: 'my-sessions',
        element: <MySessionsPage />,
      },
      {
        path: 'my-progress',
        element: <MyProgressPage />,
      },
      {
        path: 'heatmap',
        element: <HeatmapPage />,
      },
      {
        path: 'teachers',
        element: <TeachersPage />,
      },
      {
        path: 'recommendations',
        element: <RecommendationsPage />,
      },
      {
        path: 'data-entry',
        element: <DataEntryPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
    ],
  },
]);

export default router;

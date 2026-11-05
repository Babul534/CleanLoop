import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import WorkspacePage from './pages/WorkspacePage';
import CitizenDashboardPage from './pages/dashboard/CitizenDashboardPage';
import ReportIssuePage from './pages/dashboard/ReportIssuePage';
import MyReportsPage from './pages/dashboard/MyReportsPage';
import ComplaintDetailPage from './pages/dashboard/ComplaintDetailPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import CitizenRewardsPage from './pages/dashboard/CitizenRewardsPage';
import CitizenLeaderboardPage from './pages/dashboard/CitizenLeaderboardPage';
import CitizenHistoryPage from './pages/dashboard/CitizenHistoryPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage';
import AdminCollectorsPage from './pages/admin/AdminCollectorsPage';
import AdminAssignmentsPage from './pages/admin/AdminAssignmentsPage';
import AdminActivityPage from './pages/admin/AdminActivityPage';
import AdminMapAnalyticsPage from './pages/admin/AdminMapAnalyticsPage';
import AdminRewardsPage from './pages/admin/AdminRewardsPage';
import CollectorDashboardPage from './pages/collector/CollectorDashboardPage';
import CollectorTasksPage from './pages/collector/CollectorTasksPage';
import CollectorTaskDetailPage from './pages/collector/CollectorTaskDetailPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';
import { AuthProvider } from './context/AuthContext';

// Import design system and stylesheet architecture
import './styles/tokens.css';
import './styles/global.css';
import './styles/components.css';
import './styles/home.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/rewards.css';

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Citizen Dedicated Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['user']}>
                  <CitizenDashboardPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/report-issue"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['user']}>
                  <ReportIssuePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['user']}>
                  <MyReportsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaint/:id"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['user']}>
                  <ComplaintDetailPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['user']}>
                  <NotificationsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rewards"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['user']}>
                  <CitizenRewardsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rewards/history"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['user']}>
                  <CitizenHistoryPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <CitizenLeaderboardPage />
              </ProtectedRoute>
            }
          />

          {/* Municipal Administrator Dedicated Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/map"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminMapAnalyticsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminComplaintsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/collectors"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminCollectorsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assignments"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminAssignmentsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activity"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminActivityPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rewards"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminRewardsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Waste Collector Dedicated Routes */}
          <Route
            path="/collector/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['collector']}>
                  <CollectorDashboardPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/collector/tasks"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['collector']}>
                  <CollectorTasksPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/collector/tasks/:id"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['collector']}>
                  <CollectorTaskDetailPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Staff & Administrator Placeholder Workspace */}
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <WorkspacePage />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

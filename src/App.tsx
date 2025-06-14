
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { Toaster } from '@/components/ui/sonner';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import LoginPage from '@/pages/LoginPage';
import Index from '@/pages/Index';
import StudentsPage from '@/pages/StudentsPage';
import AddStudentPage from '@/pages/AddStudentPage';
import PaymentsPage from '@/pages/PaymentsPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import UsersPage from '@/pages/UsersPage';
import PGManagementPage from '@/pages/PGManagement';
import RoomManagement from '@/pages/RoomManagement';
import BackupLogsPage from '@/pages/BackupLogsPage';
import AdminDashboard from '@/pages/AdminDashboard';
import ManagerDashboard from '@/pages/ManagerDashboard';
import AccountantDashboard from '@/pages/AccountantDashboard';
import ProfilePage from '@/pages/ProfilePage';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

// Wrapper component to ensure DataProvider is available for protected routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <DataProvider>
      <AuthGuard>
        <AppLayout>
          {children}
        </AppLayout>
      </AuthGuard>
    </DataProvider>
  );
};

// Wrapper for routes that require specific roles
const ProtectedRoleRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole: string }) => {
  return (
    <DataProvider>
      <AuthGuard requiredRole={requiredRole}>
        <AppLayout>
          {children}
        </AppLayout>
      </AuthGuard>
    </DataProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background w-full">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin" element={
                <ProtectedRoleRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoleRoute>
              } />
              <Route path="/dashboard/manager" element={
                <ProtectedRoleRoute requiredRole="manager">
                  <ManagerDashboard />
                </ProtectedRoleRoute>
              } />
              <Route path="/dashboard/accountant" element={
                <ProtectedRoleRoute requiredRole="accountant">
                  <AccountantDashboard />
                </ProtectedRoleRoute>
              } />
              <Route path="/students" element={
                <ProtectedRoute>
                  <StudentsPage />
                </ProtectedRoute>
              } />
              <Route path="/students/add" element={
                <ProtectedRoute>
                  <AddStudentPage />
                </ProtectedRoute>
              } />
              <Route path="/add-student" element={
                <ProtectedRoute>
                  <AddStudentPage />
                </ProtectedRoute>
              } />
              <Route path="/edit-student/:id" element={
                <ProtectedRoute>
                  <AddStudentPage />
                </ProtectedRoute>
              } />
              <Route path="/payments" element={
                <ProtectedRoute>
                  <PaymentsPage />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoleRoute requiredRole="admin">
                  <UsersPage />
                </ProtectedRoleRoute>
              } />
              <Route path="/pg-management" element={
                <ProtectedRoute>
                  <PGManagementPage />
                </ProtectedRoute>
              } />
              <Route path="/room-management" element={
                <ProtectedRoute>
                  <RoomManagement />
                </ProtectedRoute>
              } />
              <Route path="/backup-logs" element={
                <ProtectedRoleRoute requiredRole="admin">
                  <BackupLogsPage />
                </ProtectedRoleRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

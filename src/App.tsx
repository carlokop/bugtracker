import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/store/useAuthStore";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ViewerPage } from "@/pages/ViewerPage";
import { FeedbackBoardPage } from "@/pages/FeedbackBoardPage";
import { FeedbackHubPage } from "@/pages/FeedbackHubPage";
import { FeedbackDetailPage } from "@/pages/FeedbackDetailPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuthStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const { currentUser } = useAuthStore();

  return (
    <AppShell>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <Navigate to="viewer" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/viewer"
          element={
            <ProtectedRoute>
              <ViewerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <FeedbackHubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/feedback"
          element={
            <ProtectedRoute>
              <FeedbackBoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback/:feedbackId"
          element={
            <ProtectedRoute>
              <FeedbackDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <Navigate to={currentUser ? "/dashboard" : "/login"} replace />
          }
        />
      </Routes>
    </AppShell>
  );
}

export default App;

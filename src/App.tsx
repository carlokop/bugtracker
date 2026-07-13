import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/store/useAuthStore";
import { useProjectContextStore } from "@/store/useProjectContextStore";
import { useProjectStore } from "@/store/useProjectStore";
import { LoginPage } from "@/pages/LoginPage";
import { ProjectSelectPage } from "@/pages/ProjectSelectPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ViewerPage } from "@/pages/ViewerPage";
import { FeedbackBoardPage } from "@/pages/FeedbackBoardPage";
import { FeedbackDetailPage } from "@/pages/FeedbackDetailPage";
import { ProjectUsersPage } from "@/pages/ProjectUsersPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuthStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ProjectRoute({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentUser } = useAuthStore();
  const { selectedProjectId, selectProject } = useProjectContextStore();
  const { getProjectsForUser } = useProjectStore();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!currentUser || !projectId) return;
    getProjectsForUser(currentUser.id, currentUser.role).then((projects) => {
      const hasAccess = projects.some((p) => p.id === projectId);
      setAllowed(hasAccess);
      if (hasAccess && selectedProjectId !== projectId) {
        selectProject(projectId);
      }
    });
  }, [
    currentUser,
    projectId,
    getProjectsForUser,
    selectProject,
    selectedProjectId,
  ]);

  if (!currentUser) return <Navigate to="/login" replace />;
  if (allowed === null) {
    return <p className="text-sm text-muted-foreground">Laden...</p>;
  }
  if (!allowed) return <Navigate to="/select-project" replace />;
  return <>{children}</>;
}

function App() {
  const { currentUser, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Laden...
      </div>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/select-project"
          element={
            <ProtectedRoute>
              <ProjectSelectPage />
            </ProtectedRoute>
          }
        />
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
              <ProjectRoute>
                <Navigate to="viewer" replace />
              </ProjectRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/viewer"
          element={
            <ProtectedRoute>
              <ProjectRoute>
                <ViewerPage />
              </ProjectRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/feedback"
          element={
            <ProtectedRoute>
              <ProjectRoute>
                <FeedbackBoardPage />
              </ProjectRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/users"
          element={
            <ProtectedRoute>
              <ProjectRoute>
                <ProjectUsersPage />
              </ProjectRoute>
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
          path="/feedback"
          element={
            <ProtectedRoute>
              <Navigate to="/select-project" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to={currentUser ? "/select-project" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </AppShell>
  );
}

export default App;

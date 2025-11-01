import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ActivityProvider } from "@/contexts/ActivityContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { MentalHealthAssistant } from "@/components/MentalHealthAssistant";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Sessions from "./pages/dashboard/Sessions";
import Notes from "./pages/dashboard/Notes";
import NoteEditor from "./pages/dashboard/NoteEditor";
import CalendarView from "./pages/dashboard/CalendarView";
import Groups from "./pages/dashboard/Groups";
import CourseGenerator from "./pages/dashboard/CourseGenerator";
import SmartInterviews from "./pages/dashboard/SmartInterviews";
import Settings from "./pages/dashboard/Settings";
import Assignments from "./pages/dashboard/Assignments";
import Analytics from "./pages/dashboard/Analytics";
import SessionRoom from "./pages/dashboard/SessionRoom";
import Assessment from "./pages/dashboard/Assessment";
import Submissions from "./pages/dashboard/Submissions";
import LearningPaths from "./pages/dashboard/LearningPaths";
import LearningPathDetails from "./pages/dashboard/LearningPathDetails";
import Progress from "./pages/dashboard/Progress";
import NotFound from "./pages/NotFound";
// import BackendTest from "./components/BackendTest";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MentalHealthAssistant />
      {/* <div className="fixed bottom-4 right-4 z-50">
        <BackendTest />
      </div> */}
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <ActivityProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicRoute>
                      <Signup />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardHome />} />
                  <Route path="sessions" element={<Sessions />} />
                  <Route path="notes" element={<Notes />} />
                  <Route path="notes/:id" element={<NoteEditor />} />
                  <Route path="calendar" element={<CalendarView />} />
                  <Route path="groups" element={<Groups />} />
                  <Route
                    path="course-generator"
                    element={<CourseGenerator />}
                  />
                  <Route path="learning-paths" element={<LearningPaths />} />
                  <Route
                    path="learning-paths/:id"
                    element={<LearningPathDetails />}
                  />
                  <Route
                    path="smart-interviews"
                    element={<SmartInterviews />}
                  />
                  <Route path="assignments" element={<Assignments />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="progress" element={<Progress />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route
                  path="/session/:id"
                  element={
                    <ProtectedRoute>
                      <SessionRoom />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assessment/:sessionId"
                  element={
                    <ProtectedRoute>
                      <Assessment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/submissions/:sessionId"
                  element={
                    <ProtectedRoute>
                      <Submissions />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ActivityProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

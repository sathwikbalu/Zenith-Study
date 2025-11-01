import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Users, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sessionsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CreateSessionForm } from "@/components/CreateSessionForm";

interface Session {
  _id: string;
  id: string;
  title: string;
  subject: string;
  description: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  participants: string[];
  status: "scheduled" | "active" | "completed" | "cancelled";
  maxParticipants: number;
  createdAt: string;
  updatedAt: string;
}

interface FetchedSession {
  _id: string;
  title: string;
  subject: string;
  description: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  participants: string[];
  status: "scheduled" | "active" | "completed" | "cancelled";
  maxParticipants: number;
  createdAt: string;
  updatedAt: string;
}

const Sessions = () => {
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchSessions();

    // Track activity when student views sessions
    if (user?.role === "student") {
      addActivity();
    }
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const fetchedSessions = await sessionsAPI.getAll();
      // Map _id to id for frontend compatibility
      const sessionsWithId = fetchedSessions.map((session: FetchedSession) => ({
        ...session,
        id: session._id,
      }));
      setSessions(sessionsWithId);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = () => {
    setShowCreateForm(true);
  };

  const formatDuration = (start: string, end: string) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      const updatedSession = await sessionsAPI.join(sessionId);
      // Update the session in the list
      setSessions(
        sessions.map((session) =>
          session.id === sessionId
            ? { ...session, participants: updatedSession.participants }
            : session
        )
      );
      toast({ title: "Success", description: "Joined session successfully" });
    } catch (error) {
      console.error("Error joining session:", error);
      toast({
        title: "Error",
        description: "Failed to join session",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">
            Study Sessions
          </h2>
          <p className="text-muted-foreground">
            Manage and join collaborative study sessions
          </p>
        </div>
        {user?.role === "tutor" && (
          <Button className="gap-2" onClick={handleCreateSession}>
            <Plus className="w-4 h-4" />
            Create Session
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{session.title}</CardTitle>
                  <CardDescription>{session.subject}</CardDescription>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.status === "active"
                      ? "bg-primary/10 text-primary"
                      : session.status === "scheduled"
                      ? "bg-secondary/10 text-secondary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {session.status.charAt(0).toUpperCase() +
                    session.status.slice(1)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatDuration(session.startTime, session.endTime)}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {session.participants.length} participants
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => navigate(`/session/${session.id}`)}
                  disabled={
                    session.status !== "scheduled" &&
                    session.status !== "active"
                  }
                >
                  <Video className="w-4 h-4" />
                  {session.status === "active"
                    ? "Join Session"
                    : "View Details"}
                </Button>
                {session.status === "completed" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/assessment/${session.id}`)}
                    >
                      Take Assessment
                    </Button>
                    {user?.role === "tutor" && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/submissions/${session.id}`)}
                      >
                        View Submissions
                      </Button>
                    )}
                  </>
                )}
                <Button variant="outline">Share</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateSessionForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSessionCreated={fetchSessions}
      />
    </div>
  );
};

export default Sessions;

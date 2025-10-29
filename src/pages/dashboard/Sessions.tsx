import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useEffect } from 'react';

const sessions = [
  { id: 1, title: 'Advanced Mathematics', subject: 'Math', duration: '2h 30m', participants: 5, status: 'active' },
  { id: 2, title: 'Physics Study Group', subject: 'Physics', duration: '1h 45m', participants: 8, status: 'scheduled' },
  { id: 3, title: 'Programming Fundamentals', subject: 'Computer Science', duration: '3h', participants: 12, status: 'completed' },
  { id: 4, title: 'Chemistry Lab Review', subject: 'Chemistry', duration: '2h', participants: 6, status: 'scheduled' },
];

const Sessions = () => {
  const { user } = useAuth();
  const { addActivity } = useActivity();

  useEffect(() => {
    // Track activity when student views sessions
    if (user?.role === 'student') {
      addActivity();
    }
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Study Sessions</h2>
          <p className="text-muted-foreground">Manage and join collaborative study sessions</p>
        </div>
        {user?.role === 'tutor' && (
          <Button className="gap-2">
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
                    session.status === 'active'
                      ? 'bg-primary/10 text-primary'
                      : session.status === 'scheduled'
                      ? 'bg-secondary/10 text-secondary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {session.duration}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {session.participants} participants
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">
                  {session.status === 'active' ? 'Join Now' : 'View Details'}
                </Button>
                <Button variant="outline">Share</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Sessions;

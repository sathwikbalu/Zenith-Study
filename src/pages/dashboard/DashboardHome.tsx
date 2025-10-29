import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActivity } from '@/contexts/ActivityContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const stats = [
  {
    title: 'Study Hours',
    value: '24.5',
    change: '+12%',
    icon: BookOpen,
    color: 'text-primary',
  },
  {
    title: 'Active Groups',
    value: '8',
    change: '+2',
    icon: Users,
    color: 'text-secondary',
  },
  {
    title: 'Upcoming Events',
    value: '5',
    change: 'This week',
    icon: Calendar,
    color: 'text-accent',
  },
  {
    title: 'Progress',
    value: '78%',
    change: '+5%',
    icon: TrendingUp,
    color: 'text-primary',
  },
];

const recentSessions = [
  { id: 1, title: 'Advanced Mathematics', time: '2 hours ago', members: 5 },
  { id: 2, title: 'Physics Study Group', time: '5 hours ago', members: 8 },
  { id: 3, title: 'Programming Fundamentals', time: '1 day ago', members: 12 },
];

const DashboardHome = () => {
  const { addActivity } = useActivity();
  const { user } = useAuth();

  useEffect(() => {
    // Track activity when student visits dashboard
    if (user?.role === 'student') {
      addActivity();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Welcome back!</h2>
        <p className="text-muted-foreground">Here's what's happening with your studies today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change} from last week</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Study Sessions</CardTitle>
            <CardDescription>Your latest collaborative sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{session.title}</p>
                    <p className="text-sm text-muted-foreground">{session.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{session.members}</span>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">View All Sessions</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your study tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start h-auto py-4" variant="outline">
              <BookOpen className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Start Study Session</div>
                <div className="text-xs text-muted-foreground">Begin a new collaborative session</div>
              </div>
            </Button>
            <Button className="w-full justify-start h-auto py-4" variant="outline">
              <Users className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Join Study Group</div>
                <div className="text-xs text-muted-foreground">Connect with other learners</div>
              </div>
            </Button>
            <Button className="w-full justify-start h-auto py-4" variant="outline">
              <Calendar className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Schedule Event</div>
                <div className="text-xs text-muted-foreground">Plan your study time</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, TrendingUp, Award } from 'lucide-react';

const stats = [
  {
    title: 'Total Students',
    value: '87',
    change: '+12%',
    icon: Users,
    color: 'text-blue-500',
  },
  {
    title: 'Active Sessions',
    value: '24',
    change: '+8%',
    icon: BookOpen,
    color: 'text-green-500',
  },
  {
    title: 'Avg. Performance',
    value: '85%',
    change: '+5%',
    icon: TrendingUp,
    color: 'text-purple-500',
  },
  {
    title: 'Completed Courses',
    value: '42',
    change: '+18%',
    icon: Award,
    color: 'text-orange-500',
  },
];

const topPerformers = [
  { name: 'Emma Wilson', score: 98, group: 'Advanced Mathematics' },
  { name: 'Liam Chen', score: 96, group: 'Physics Study Group' },
  { name: 'Sophia Davis', score: 95, group: 'Computer Science Club' },
  { name: 'Noah Anderson', score: 94, group: 'Chemistry Lab Partners' },
  { name: 'Olivia Martinez', score: 93, group: 'Advanced Mathematics' },
];

const Analytics = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Analytics</h2>
        <p className="text-muted-foreground">Track student performance and engagement</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500 font-medium">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Students with highest scores this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((student, index) => (
                <div key={student.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.group}</p>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-primary">{student.score}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Overview</CardTitle>
            <CardDescription>Student activity this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Session Attendance</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Assignment Completion</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Group Participation</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Resource Access</span>
                <span className="font-medium">67%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '67%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;

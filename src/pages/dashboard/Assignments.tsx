import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const assignments = [
  {
    id: 1,
    title: 'Calculus Problem Set',
    group: 'Advanced Mathematics',
    dueDate: '2025-11-05',
    submitted: 12,
    total: 15,
    status: 'active',
  },
  {
    id: 2,
    title: 'Physics Lab Report',
    group: 'Physics Study Group',
    dueDate: '2025-11-08',
    submitted: 8,
    total: 10,
    status: 'active',
  },
  {
    id: 3,
    title: 'Chemistry Quiz',
    group: 'Chemistry Lab Partners',
    dueDate: '2025-11-02',
    submitted: 12,
    total: 12,
    status: 'completed',
  },
  {
    id: 4,
    title: 'Algorithm Analysis',
    group: 'Computer Science Club',
    dueDate: '2025-11-10',
    submitted: 5,
    total: 20,
    status: 'active',
  },
];

const Assignments = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Assignments</h2>
          <p className="text-muted-foreground">Create and manage student assignments</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Assignment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{assignment.title}</CardTitle>
                  <CardDescription>{assignment.group}</CardDescription>
                </div>
                <Badge variant={assignment.status === 'completed' ? 'default' : 'secondary'}>
                  {assignment.status === 'completed' ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : (
                    <Clock className="w-3 h-3 mr-1" />
                  )}
                  {assignment.status === 'completed' ? 'Completed' : 'Active'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </div>
                <span className="font-medium">
                  {assignment.submitted}/{assignment.total} submitted
                </span>
              </div>
              
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(assignment.submitted / assignment.total) * 100}%` }}
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">View Submissions</Button>
                <Button variant="outline">Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Assignments;

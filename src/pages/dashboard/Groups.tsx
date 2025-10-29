import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

const groups = [
  {
    id: 1,
    name: 'Advanced Mathematics',
    members: 24,
    description: 'Preparing for calculus and linear algebra',
    active: true,
  },
  {
    id: 2,
    name: 'Physics Study Group',
    members: 18,
    description: 'Quantum mechanics and thermodynamics',
    active: true,
  },
  {
    id: 3,
    name: 'Computer Science Club',
    members: 45,
    description: 'Algorithms, data structures, and more',
    active: false,
  },
  {
    id: 4,
    name: 'Chemistry Lab Partners',
    members: 12,
    description: 'Organic and inorganic chemistry',
    active: true,
  },
];

const Groups = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Study Groups</h2>
          <p className="text-muted-foreground">Connect and collaborate with your peers</p>
        </div>
        {user?.role === 'tutor' && (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {group.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3" />
                      {group.members} members
                    </CardDescription>
                  </div>
                </div>
                {group.active && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    Active
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{group.description}</p>
              <div className="flex gap-2">
                <Button className="flex-1 gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Open Chat
                </Button>
                <Button variant="outline">View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Groups;

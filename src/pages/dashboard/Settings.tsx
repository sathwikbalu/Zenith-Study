import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import CalendarHeatmap from '@/components/CalendarHeatmap';
import { Flame, Trophy } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { activities, currentStreak, longestStreak } = useActivity();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      {user?.role === 'student' && (
        <Card>
          <CardHeader>
            <CardTitle>Activity & Streaks</CardTitle>
            <CardDescription>Track your learning journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-muted-foreground">Current Streak</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{currentStreak}</span>
                  <span className="text-muted-foreground">days</span>
                </div>
              </div>
              
              <div className="flex-1 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary-glow/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Longest Streak</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{longestStreak}</span>
                  <span className="text-muted-foreground">days</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Activity Overview</h4>
              <CalendarHeatmap activities={activities} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue={user?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email} />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email updates about your activities</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Study Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded about scheduled study sessions</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Group Messages</Label>
              <p className="text-sm text-muted-foreground">Notifications for new group messages</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>Control your privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">Make your profile visible to other students</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Study Statistics</Label>
              <p className="text-sm text-muted-foreground">Display your study hours and progress</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

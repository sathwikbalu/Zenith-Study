import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrainCircuit, Play, Clock, Target } from 'lucide-react';

const SmartInterviews = () => {
  const [jobRole, setJobRole] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartInterview = () => {
    setIsStarting(true);
    // Placeholder for interview logic
    setTimeout(() => {
      setIsStarting(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <BrainCircuit className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Smart Interviews</h1>
          <p className="text-muted-foreground">Practice interviews with AI-powered feedback</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start Your Interview Practice</CardTitle>
          <CardDescription>
            Configure your interview session and get real-time AI feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Job Role / Subject</Label>
            <Input
              id="role"
              placeholder="e.g., Frontend Developer, Data Science, etc."
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleStartInterview} 
            disabled={!jobRole || !difficulty || isStarting}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isStarting ? 'Starting Interview...' : 'Start Interview'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No sessions yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Complete a session to see your score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0h</div>
            <p className="text-xs text-muted-foreground">
              Practice time tracked
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SmartInterviews;

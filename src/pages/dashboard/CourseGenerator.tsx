import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GraduationCap, Sparkles } from 'lucide-react';

const CourseGenerator = () => {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Placeholder for course generation logic
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <GraduationCap className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Course Generator</h1>
          <p className="text-muted-foreground">Generate personalized courses with AI</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Your Course</CardTitle>
          <CardDescription>
            Enter a topic and let AI generate a comprehensive course outline for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Course Topic</Label>
            <Input
              id="topic"
              placeholder="e.g., Advanced React Patterns"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your learning goals, current knowledge level, or specific areas you want to focus on..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={!topic || isGenerating}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating Course...' : 'Generate Course'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Preview</CardTitle>
          <CardDescription>
            Your generated course will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Generate a course to see the outline here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseGenerator;

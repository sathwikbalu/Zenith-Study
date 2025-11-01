import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Sparkles, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { learningPathsAPI } from '@/lib/api';

const CourseGenerator = () => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [duration, setDuration] = useState('');
  const [goal, setGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [learningPath, setLearningPath] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic || !duration || !goal) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Send request to AI backend
      const response = await fetch('http://localhost:5001/api/generate-learning-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          level,
          duration,
          goal,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate learning path');
      }

      const data = await response.json();
      
      if (data.success) {
        setLearningPath(data.content);
        toast({
          title: "Success",
          description: "Learning path generated successfully!",
        });
      } else {
        throw new Error(data.error || 'Failed to generate learning path');
      }
    } catch (error) {
      console.error("Error generating learning path:", error);
      toast({
        title: "Error",
        description: "Failed to generate learning path. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!learningPath) {
      toast({
        title: "Nothing to Save",
        description: "Please generate a learning path first",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await learningPathsAPI.create({
        topic,
        skillLevel: level,
        duration,
        goal,
        content: learningPath,
      });

      toast({
        title: "Success",
        description: "Learning path saved successfully!",
      });
      
      // Navigate to learning paths page
      navigate("/dashboard/learning-paths");
    } catch (error) {
      console.error("Error saving learning path:", error);
      toast({
        title: "Error",
        description: "Failed to save learning path. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Your Learning Path</CardTitle>
            <CardDescription>
              Enter the details below to generate a personalized learning path
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., Machine Learning, Web Development, Data Science"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="level">Skill Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Learning Duration *</Label>
              <Input
                id="duration"
                placeholder="e.g., 4 weeks, 3 months, 6 months"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goal">Goal or Outcome *</Label>
              <Textarea
                id="goal"
                placeholder="e.g., Get job-ready for backend development, Build a machine learning project"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleGenerate} 
                disabled={!topic || !duration || !goal || isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Path
                  </>
                )}
              </Button>
              
              {learningPath && (
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Path
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Path Preview</CardTitle>
            <CardDescription>
              Your generated learning path will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {learningPath ? (
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{learningPath}</div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Fill in the details and generate a learning path to see it here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourseGenerator;
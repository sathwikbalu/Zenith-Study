import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { forumsAPI } from '@/lib/api';

const CreateForum = () => {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!topic || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await forumsAPI.create({ topic, description });
      toast({
        title: "Success",
        description: "Forum created successfully!",
      });
      navigate("/dashboard/forums");
    } catch (error: any) {
      console.error("Error creating forum:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create forum",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <MessageCircle className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Create Forum</h1>
          <p className="text-muted-foreground">Start a new discussion forum</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forum Details</CardTitle>
          <CardDescription>
            Enter the topic and description for your new forum
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
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what this forum is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/forums")}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!topic || !description || loading}
              className="gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Forum
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateForum;
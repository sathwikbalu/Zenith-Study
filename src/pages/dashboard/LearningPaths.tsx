import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Calendar, Target, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { learningPathsAPI } from '@/lib/api';

interface LearningPath {
  _id: string;
  id: string;
  topic: string;
  skillLevel: string;
  duration: string;
  goal: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const LearningPaths = () => {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  const fetchLearningPaths = async () => {
    try {
      setLoading(true);
      const fetchedPaths = await learningPathsAPI.getAll();
      // Map _id to id for frontend compatibility
      const pathsWithId = fetchedPaths.map((path: any) => ({
        ...path,
        id: path._id,
      }));
      setLearningPaths(pathsWithId);
    } catch (error) {
      console.error("Error fetching learning paths:", error);
      toast({
        title: "Error",
        description: "Failed to fetch learning paths",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await learningPathsAPI.delete(id);
      setLearningPaths(learningPaths.filter((path) => path.id !== id));
      toast({ title: "Success", description: "Learning path deleted successfully" });
    } catch (error) {
      console.error("Error deleting learning path:", error);
      toast({
        title: "Error",
        description: "Failed to delete learning path",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Learning Paths</h2>
          <p className="text-muted-foreground">
            Your personalized learning paths
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => navigate("/dashboard/course-generator")}
        >
          <GraduationCap className="w-4 h-4" />
          Create New Path
        </Button>
      </div>

      {learningPaths.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No learning paths yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first learning path to get started
            </p>
            <Button onClick={() => navigate("/dashboard/course-generator")}>
              Generate Learning Path
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {learningPaths.map((path) => (
            <Card key={path.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{path.topic}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    {path.skillLevel}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Target className="w-4 h-4 mr-2" />
                  {path.goal}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2" />
                  {path.duration}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  Created {formatDate(path.createdAt)}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1"
                    onClick={() => navigate(`/dashboard/learning-paths/${path.id}`)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(path.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningPaths;
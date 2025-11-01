import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowLeft, Calendar, Target, Clock } from 'lucide-react';
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

const LearningPathDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLearningPath(id);
    }
  }, [id]);

  const fetchLearningPath = async (pathId: string) => {
    try {
      setLoading(true);
      const path = await learningPathsAPI.getById(pathId);
      setLearningPath({
        ...path,
        id: path._id,
      });
    } catch (error) {
      console.error("Error fetching learning path:", error);
      toast({
        title: "Error",
        description: "Failed to fetch learning path",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  if (!learningPath) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Learning Path Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The learning path you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate("/dashboard/learning-paths")}>
            Back to Learning Paths
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/learning-paths")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Learning Paths
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            Export as PDF
          </Button>
          <Button>
            Save to Notes
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">{learningPath.topic}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {learningPath.skillLevel}
              </span>
              <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
                {learningPath.duration}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center text-muted-foreground">
            <Target className="w-5 h-5 mr-2" />
            <span>{learningPath.goal}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="w-5 h-5 mr-2" />
            <span>Created {formatDate(learningPath.createdAt)}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="w-5 h-5 mr-2" />
            <span>Last updated {formatDate(learningPath.updatedAt)}</span>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none mt-8">
          <div className="whitespace-pre-wrap">{learningPath.content}</div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathDetails;
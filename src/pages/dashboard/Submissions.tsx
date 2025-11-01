import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { assessmentsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, BarChart3 } from "lucide-react";

interface Submission {
  _id: string;
  assessmentId: string;
  sessionId: string;
  userId: string;
  userName: string;
  answers: Array<{
    questionId: string;
    selectedOption: string;
    isCorrect: boolean;
  }>;
  score: number;
  totalQuestions: number;
  submittedAt: string;
}

const Submissions = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    if (!sessionId || user?.role !== "tutor") {
      navigate("/dashboard");
      return;
    }

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const data = await assessmentsAPI.getSubmissions(sessionId);
        setSubmissions(data);

        // Calculate average score
        if (data.length > 0) {
          const totalScore = data.reduce(
            (sum, submission) => sum + submission.score,
            0
          );
          setAverageScore(totalScore / data.length);
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
        toast({
          title: "Error",
          description: "Failed to fetch submissions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [sessionId, user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-3xl font-bold">Assessment Submissions</h2>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <BarChart3 className="w-12 h-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No Submissions Yet</h3>
            <p className="text-muted-foreground text-center">
              Students haven't submitted their assessments for this session yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Submissions
                    </p>
                    <p className="text-2xl font-bold">{submissions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-full">
                    <BarChart3 className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Average Score
                    </p>
                    <p className="text-2xl font-bold">
                      {averageScore.toFixed(1)}/
                      {submissions[0]?.totalQuestions || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pass Rate</p>
                    <p className="text-2xl font-bold">
                      {submissions.length > 0
                        ? `${Math.round(
                            (submissions.filter(
                              (s) => s.score >= s.totalQuestions / 2
                            ).length /
                              submissions.length) *
                              100
                          )}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">{submission.userName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted on{" "}
                        {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          submission.score >= submission.totalQuestions / 2
                            ? "default"
                            : "destructive"
                        }
                      >
                        {submission.score}/{submission.totalQuestions}
                      </Badge>
                      <span className="text-sm font-medium">
                        {Math.round(
                          (submission.score / submission.totalQuestions) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Submissions;

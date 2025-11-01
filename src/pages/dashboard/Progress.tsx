import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { assessmentsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Submission {
  _id: string;
  assessmentId: {
    title: string;
    subject: string;
    createdBy: {
      name: string;
    };
  };
  score: number;
  totalQuestions: number;
  submittedAt: string;
}

interface ChartDataPoint {
  id: string;
  name: string;
  date: Date;
  score: number;
  total: number;
  percentage: number;
  subject: string;
  title: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
  label?: string;
}

const Progress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const data = await assessmentsAPI.getUserSubmissions();
        setSubmissions(data);
      } catch (error) {
        console.error("Error fetching submissions:", error);
        toast({
          title: "Error",
          description: "Failed to fetch assessment submissions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [toast]);

  // Prepare data for the chart
  const chartData = submissions
    .map((submission) => ({
      id: submission._id,
      name: new Date(submission.submittedAt).toLocaleDateString(),
      date: new Date(submission.submittedAt),
      score: submission.score,
      total: submission.totalQuestions,
      percentage: Math.round(
        (submission.score / submission.totalQuestions) * 100
      ),
      subject: submission.assessmentId?.subject || "Unknown Subject",
      title: submission.assessmentId?.title || "Unknown Assessment",
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
          <p className="font-bold">{data.title}</p>
          <p className="text-sm text-gray-600">{data.title}</p>
          <p className="text-sm">Date: {label}</p>
          <p className="text-sm">
            Score: {data.score}/{data.total} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const handlePointClick = (data: ChartDataPoint) => {
    const submission = submissions.find((s) => s._id === data.id);
    if (submission) {
      setSelectedSubmission(submission);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Progress Tracking</h1>
        <p className="text-muted-foreground">
          Track your assessment performance over time
        </p>
      </div>

      {chartData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <h3 className="text-xl font-semibold mb-2">No Assessment Data</h3>
            <p className="text-muted-foreground text-center">
              You haven't completed any assessments yet. Complete assessments to
              see your progress here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Assessment Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      label={{
                        value: "Date",
                        position: "insideBottom",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      label={{
                        value: "Score (%)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      name="Percentage Score"
                      stroke="#8884d8"
                      activeDot={{
                        r: 8,
                        onClick: (data) => handlePointClick(data),
                        cursor: "pointer",
                      }}
                      strokeWidth={2}
                      dot={{
                        r: 6,
                        stroke: "#8884d8",
                        strokeWidth: 2,
                        fill: "#fff",
                        cursor: "pointer",
                      }}
                      connectNulls={true}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {selectedSubmission && (
            <Card>
              <CardHeader>
                <CardTitle>Assessment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Assessment</h3>
                    <p>
                      {selectedSubmission.assessmentId?.title ||
                        "Unknown Assessment"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Subject</h3>
                    <p>
                      {selectedSubmission.assessmentId?.subject ||
                        "Unknown Subject"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Score</h3>
                    <p>
                      {selectedSubmission.score} /{" "}
                      {selectedSubmission.totalQuestions}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Percentage</h3>
                    <p>
                      {Math.round(
                        (selectedSubmission.score /
                          selectedSubmission.totalQuestions) *
                          100
                      )}
                      %
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Date</h3>
                    <p>
                      {new Date(
                        selectedSubmission.submittedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Tutor</h3>
                    <p>
                      {selectedSubmission.assessmentId?.createdBy?.name ||
                        "Unknown Tutor"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold">{chartData.length}</div>
                  <div className="text-muted-foreground">Total Assessments</div>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold">
                    {chartData.length > 0
                      ? Math.round(
                          chartData.reduce(
                            (sum, item) => sum + item.percentage,
                            0
                          ) / chartData.length
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-muted-foreground">Average Score</div>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold">
                    {chartData.length > 0
                      ? Math.max(...chartData.map((item) => item.percentage))
                      : 0}
                    %
                  </div>
                  <div className="text-muted-foreground">Best Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Progress;

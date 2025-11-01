import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { assessmentsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Assessment {
  _id: string;
  sessionId: string;
  title: string;
  subject: string;
  questions: Question[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Answer {
  questionId: string;
  selectedOption: string;
}

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

const Assessment = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchAssessment = async () => {
      try {
        setLoading(true);

        // First check if session is completed
        try {
          const sessionResponse = await fetch(
            `http://localhost:5000/api/sessions/${sessionId}`,
            {
              headers: {
                Authorization: `Bearer ${user?.token}`,
              },
            }
          );

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            setSessionStatus(sessionData.status);

            // If session is not completed, show appropriate message
            if (sessionData.status !== "completed") {
              setAssessment(null);
              setLoading(false);
              return;
            }
          }
        } catch (sessionError) {
          console.error("Error fetching session:", sessionError);
        }

        const data = await assessmentsAPI.getBySession(sessionId);
        setAssessment(data);

        // Check if user has already submitted
        try {
          const userSubmission = await assessmentsAPI.getUserSubmission(
            data._id
          );
          setSubmission(userSubmission);
          setShowResults(true);
        } catch (error) {
          // No submission found, which is expected for new assessments
          console.log("No previous submission found");
        }
      } catch (error: unknown) {
        console.error("Error fetching assessment:", error);

        // Check if it's a 404 error (assessment not found)
        if (
          error instanceof Error &&
          error.message.includes("Assessment not found")
        ) {
          // Assessment doesn't exist yet, but that's okay
          setAssessment(null);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch assessment",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [sessionId]);

  const handleAnswerChange = (questionId: string, selectedOption: string) => {
    setAnswers((prev) => {
      const existingAnswerIndex = prev.findIndex(
        (a) => a.questionId === questionId
      );

      if (existingAnswerIndex >= 0) {
        const updated = [...prev];
        updated[existingAnswerIndex] = { questionId, selectedOption };
        return updated;
      }

      return [...prev, { questionId, selectedOption }];
    });
  };

  const handleSubmit = async () => {
    if (!assessment) return;

    // Check if all questions are answered
    if (answers.length !== assessment.questions.length) {
      toast({
        title: "Incomplete Assessment",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const submissionData = {
        assessmentId: assessment._id,
        answers,
      };

      const response = await assessmentsAPI.submit(submissionData);
      setSubmission(response.submission);
      setShowResults(true);

      toast({
        title: "Assessment Submitted",
        description: `Your score: ${response.submission.score}/${response.submission.totalQuestions}`,
      });
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to submit assessment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!assessment) {
    if (sessionStatus && sessionStatus !== "completed") {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Clock className="w-12 h-12 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Session Not Completed</h2>
          <p className="text-muted-foreground text-center">
            This session is currently {sessionStatus}. Assessments are only
            available after sessions are completed by the tutor.
          </p>
          <Button onClick={() => navigate("/dashboard/sessions")}>
            Back to Sessions
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <XCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-2xl font-bold">Assessment Not Found</h2>
        <p className="text-muted-foreground text-center">
          No assessment available for this session yet. This could be because:
          <ul className="list-disc list-inside mt-2 text-left">
            <li>The tutor hasn't completed the session yet</li>
            <li>The assessment is still being generated</li>
            <li>
              The session was recently completed and the assessment is being
              processed
            </li>
          </ul>
        </p>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/dashboard/sessions")}>
            Back to Sessions
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  if (showResults && submission) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Assessment Results</CardTitle>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{assessment.title}</h3>
                <p className="text-muted-foreground">{assessment.subject}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {submission.score}/{submission.totalQuestions}
                </div>
                <div className="text-muted-foreground">
                  {Math.round(
                    (submission.score / submission.totalQuestions) * 100
                  )}
                  % Score
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {assessment.questions.map((question, index) => {
                const userAnswer = submission.answers.find(
                  (a) => a.questionId === question._id
                );

                return (
                  <div key={question._id} className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 p-1 rounded-full ${
                          userAnswer?.isCorrect ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {userAnswer?.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {index + 1}. {question.question}
                        </h4>
                        <div className="mt-2 space-y-2">
                          {question.options.map((option, optionIndex) => {
                            const isCorrect = option === question.correctAnswer;
                            const isSelected =
                              option === userAnswer?.selectedOption;

                            return (
                              <div
                                key={optionIndex}
                                className={`p-3 rounded-lg border ${
                                  isCorrect
                                    ? "border-green-500 bg-green-50"
                                    : isSelected
                                    ? "border-red-500 bg-red-50"
                                    : "border-muted"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  <span>{option}</span>
                                  {isCorrect && (
                                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      Correct Answer
                                    </span>
                                  )}
                                  {isSelected && !isCorrect && (
                                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                      Your Answer
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            <span className="font-semibold">Explanation:</span>{" "}
                            {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex justify-center">
              <Button onClick={() => navigate("/dashboard/sessions")}>
                Back to Sessions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Assessment</CardTitle>
          <div>
            <h3 className="text-xl font-semibold">{assessment.title}</h3>
            <p className="text-muted-foreground">{assessment.subject}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {assessment.questions.map((question, index) => (
              <div key={question._id} className="space-y-4">
                <h4 className="font-medium">
                  {index + 1}. {question.question}
                </h4>
                <RadioGroup
                  onValueChange={(value) =>
                    handleAnswerChange(question._id, value)
                  }
                  className="space-y-2"
                >
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className="flex items-center space-x-3"
                    >
                      <RadioGroupItem
                        value={option}
                        id={`${question._id}-${optionIndex}`}
                      />
                      <Label
                        htmlFor={`${question._id}-${optionIndex}`}
                        className="flex-1 p-3 rounded-lg border hover:bg-muted cursor-pointer"
                      >
                        <span className="font-mono mr-2">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={
                submitting || answers.length !== assessment.questions.length
              }
              className="gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assessment;

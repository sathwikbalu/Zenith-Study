import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { BrainCircuit, Upload, Camera, Mic, MicOff, Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: number;
  question: string;
  type: string;
  expectedPoints: string[];
}

interface Evaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

const SmartInterviews = () => {
  const [jobRole, setJobRole] = useState('');
  const [resume, setResume] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [stage, setStage] = useState<'setup' | 'interview' | 'results'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopCamera();
      stopRecording();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsCameraOn(true);
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOn(false);
  };

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setCurrentAnswer(prev => {
        if (prev && !prev.endsWith(' ')) {
          return prev + ' ' + transcript;
        }
        return prev + transcript;
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast({
        title: "Recording Error",
        description: "Failed to record audio. Please try again.",
        variant: "destructive",
      });
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setResume(text);
      };
      reader.readAsText(file);
    }
  };

  const handleStartInterview = async () => {
    if (!jobRole || !resume) {
      toast({
        title: "Missing Information",
        description: "Please provide both job role and resume.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/generate-interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobRole, resume }),
      });

      if (!response.ok) throw new Error('Failed to generate questions');

      const data = await response.json();
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(''));
      setStage('interview');
      await startCamera();
      
      toast({
        title: "Interview Started",
        description: "Answer each question. You can type or use voice recording.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start interview. Make sure AI backend is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = currentAnswer;
    setAnswers(updatedAnswers);
    setCurrentAnswer('');
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleFinishInterview(updatedAnswers);
    }
  };

  const handleFinishInterview = async (finalAnswers: string[]) => {
    setIsLoading(true);
    stopCamera();
    
    try {
      const evaluationPromises = questions.map((question, index) =>
        fetch('http://localhost:5001/api/evaluate-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question.question,
            answer: finalAnswers[index],
            expectedPoints: question.expectedPoints,
            jobRole,
          }),
        }).then(res => res.json())
      );

      const results = await Promise.all(evaluationPromises);
      setEvaluations(results);
      setStage('results');
      
      toast({
        title: "Interview Complete",
        description: "Your interview has been evaluated. Check your results below.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to evaluate answers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setStage('setup');
    setJobRole('');
    setResume('');
    setResumeFile(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer('');
    setEvaluations([]);
  };

  const averageScore = evaluations.length > 0
    ? evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <BrainCircuit className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Smart Interviews</h1>
          <p className="text-muted-foreground">AI-powered interview practice with live camera and voice transcription</p>
        </div>
      </div>

      {stage === 'setup' && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Your Interview</CardTitle>
            <CardDescription>
              Upload your resume and specify the job role to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Job Role / Position</Label>
              <Input
                id="role"
                placeholder="e.g., Frontend Developer, Data Scientist, Product Manager"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resume">Resume / CV</Label>
              <div className="flex gap-2">
                <Input
                  id="resume"
                  type="file"
                  accept=".txt"
                  onChange={handleResumeUpload}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Upload a .txt file or paste your resume below</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume-text">Resume Text</Label>
              <Textarea
                id="resume-text"
                placeholder="Paste your resume content here..."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                rows={8}
              />
            </div>

            <Button 
              onClick={handleStartInterview} 
              disabled={!jobRole || !resume || isLoading}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isLoading ? 'Generating Questions...' : 'Start Interview'}
            </Button>
          </CardContent>
        </Card>
      )}

      {stage === 'interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
                  <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-24" />
                </div>
                <CardDescription>
                  {questions[currentQuestionIndex]?.type} question
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-lg font-medium">{questions[currentQuestionIndex]?.question}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="answer">Your Answer</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="answer"
                    placeholder="Type your answer or use voice recording..."
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    rows={6}
                  />
                  {isRecording && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Recording in progress...
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleNextQuestion}
                  disabled={!currentAnswer.trim() || isLoading}
                  className="w-full"
                >
                  {currentQuestionIndex < questions.length - 1 ? (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Next Question
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finish Interview
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Camera</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  {isCameraOn ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Camera initializing...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        idx < currentQuestionIndex ? 'bg-green-500' :
                        idx === currentQuestionIndex ? 'bg-primary' :
                        'bg-muted'
                      }`} />
                      <span className="text-xs text-muted-foreground">Question {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {stage === 'results' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interview Results</CardTitle>
              <CardDescription>
                Average Score: {averageScore.toFixed(1)}/10
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {questions.map((question, idx) => (
                  <div key={question.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">Question {idx + 1}</h3>
                      <span className="text-lg font-bold text-primary">
                        {evaluations[idx]?.score}/10
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{question.question}</p>
                    <p className="text-sm mb-3"><strong>Your Answer:</strong> {answers[idx]}</p>
                    
                    {evaluations[idx] && (
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong className="text-green-600">Strengths:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {evaluations[idx].strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong className="text-orange-600">Areas for Improvement:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {evaluations[idx].improvements.map((imp, i) => (
                              <li key={i}>{imp}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong>Feedback:</strong>
                          <p className="ml-2">{evaluations[idx].feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={handleRestart} className="w-full mt-6">
                Start New Interview
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SmartInterviews;

import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Hourglass,
  XCircle,
  FileText,
  ArrowLeft,
  AlertCircle,
  PartyPopper,
  AlertTriangle,
  AlarmClock,
  Building2,
  Trophy,
  TimerReset,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  CircleDashed,
  ClipboardCheck,
  Target,
} from 'lucide-react';
import CandidateDashboardSkeleton from '../skeleton/CandidateDashboardSkeleton';
import axios from 'axios';

const baseApi = import.meta.env.VITE_BASE_API;

type Internship = {
  id: number;
  title: string;
  company: string;
  location: string;
  duration: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedDate: string;
  test_scheduled?: {
    quiz_set_id: number;
    quiz_title: string;
    date: string;
    time: string;
    duration: number;
    pass_percentage: number;
    total_questions?: number;
  };
  testCompleted?: boolean;
  testScore?: number;
  testPassed?: boolean;
  totalQuestions?: number;
  answeredQuestions?: number;
};

type Question = {
  id: number;
  text: string;
  options: { id: number; text: string }[];
};

const AppliedInternship: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'test'>('dashboard');
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: number]: number | null }>({});
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [testTimeRemaining, setTestTimeRemaining] = useState<number | null>(null);
  const [isTimeExpired, setIsTimeExpired] = useState(false);

  const [testStats, setTestStats] = useState<{
    totalQuestions: number;
    answeredQuestions: number;
  }>({ totalQuestions: 0, answeredQuestions: 0 });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<'all' | 'accepted' | 'pending' | 'rejected'>('all');

  const selectedAnswersRef = useRef<{ [key: number]: number }>({});
  const questionsRef = useRef<Question[]>([]);
  const testTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedInternship, showResult, testSubmitted]);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const response = await axios.get(`${baseApi}/candidates/list-applications/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        const formattedInternships = response.data.map((app: any) => {
          return {
            id: app.id,
            title: app.internship.internship_role,
            company: app.internship.company_name,
            location: app.internship.district
              ? app.internship.district
              : `${app.district}, ${app.state}, ${app.country}`,
            duration: app.internship.duration_months
              ? `${app.internship.duration_months} Months`
              : 'N/A',
            status: app.status,
            appliedDate: app.applied_at,
            test_scheduled: app.test_scheduled
              ? {
                  ...app.test_scheduled,
                  total_questions:
                    app.test_scheduled.total_questions ||
                    app.test_scheduled.question_count ||
                    0,
                }
              : undefined,
            testCompleted: app.test_completed,
            testScore: app.test_score,
            testPassed: app.test_passed,
            totalQuestions:
              app.total_questions ||
              app.question_count ||
              app.test_questions ||
              (app.test_scheduled
                ? app.test_scheduled.total_questions ||
                  app.test_scheduled.question_count
                : 0) ||
              0,
            answeredQuestions:
              app.answered_questions ||
              app.questions_answered ||
              app.attempted_questions ||
              0,
          };
        });

        setInternships(formattedInternships);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch applications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const fetchQuestions = async (quizSetId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${baseApi}/candidates/quiz/${quizSetId}/questions/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setQuestions(response.data);
      return response.data;
    } catch (error) {
      setError('Failed to load test questions. Please try again.');
      return [];
    }
  };

  const getFormattedTimes = (startTime: string, duration: number, date: string) => {
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);

    const formatTime = (dateObj: Date) =>
      dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    return {
      startTime: formatTime(startDateTime),
      endTime: formatTime(endDateTime),
      startDateTime,
      endDateTime,
    };
  };

  const handleAutoSubmit = async (internship: Internship, isTestPageTimer = false) => {
    if (internship.testCompleted || testSubmitted || isAutoSubmitting) {
      return;
    }

    setIsAutoSubmitting(true);
    setIsTimeExpired(true);

    const answersToSubmit = selectedAnswersRef.current;
    const currentQuestions = questionsRef.current;

    if (selectedInternship?.id === internship.id || isTestPageTimer) {
      setError(
        'Time expired! Your test time has ended. We will auto-submit the questions you have attempted.'
      );
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${baseApi}/candidates/submit-test-results/`,
        {
          internship_id: internship.id,
          answers: answersToSubmit,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      const { score, test_completed, test_score, test_passed } = response.data;

      const totalQuestions = currentQuestions.length || 0;
      const answeredQuestions = Object.keys(answersToSubmit).length;

      try {
        localStorage.setItem(
          `test_stats_${internship.id}`,
          JSON.stringify({
            totalQuestions,
            answeredQuestions,
            score,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.warn('Failed to cache test stats:', e);
      }

      setInternships((prev) =>
        prev.map((i) =>
          i.id === internship.id
            ? {
                ...i,
                testCompleted: test_completed,
                testScore: test_score,
                testPassed: test_passed,
                totalQuestions,
                answeredQuestions,
              }
            : i
        )
      );

      if (selectedInternship?.id === internship.id || isTestPageTimer) {
        setScore(score);
        setTestSubmitted(true);
        setShowResult(true);
        setTestStats({ totalQuestions, answeredQuestions });

        setTimeout(() => {
          setError(null);
        }, 2000);
      }

      localStorage.removeItem(`test_progress_${internship.id}`);
    } catch (error) {
      console.error('Auto-submit failed:', error);
      if (selectedInternship?.id === internship.id || isTestPageTimer) {
        setError('Failed to auto-submit test results. Please try again.');
      }
    } finally {
      setIsAutoSubmitting(false);
    }
  };

  useEffect(() => {
    if (currentView === 'test' && selectedInternship && !testSubmitted && !isAutoSubmitting) {
      const testScheduled = selectedInternship.test_scheduled;
      if (!testScheduled) return;

      const { endDateTime } = getFormattedTimes(
        testScheduled.time,
        testScheduled.duration,
        testScheduled.date
      );

      const updateTestTimer = () => {
        const now = new Date();
        const remainingMs = endDateTime.getTime() - now.getTime();

        if (remainingMs <= 0) {
          setTestTimeRemaining(0);
          setIsTimeExpired(true);
          if (testTimerRef.current) {
            clearInterval(testTimerRef.current);
          }
          handleAutoSubmit(selectedInternship, true);
        } else {
          setTestTimeRemaining(Math.floor(remainingMs / 1000));

          if (remainingMs <= 60000 && remainingMs > 59000) {
            alert('Only 1 minute remaining!');
          }
        }
      };

      testTimerRef.current = setInterval(updateTestTimer, 1000);
      updateTestTimer();

      return () => {
        if (testTimerRef.current) {
          clearInterval(testTimerRef.current);
        }
      };
    }
  }, [currentView, selectedInternship, testSubmitted, isAutoSubmitting]);

  useEffect(() => {
    const acceptedInternships = internships.filter(
      (internship) =>
        internship.status === 'accepted' &&
        internship.test_scheduled &&
        !internship.testCompleted
    );

    const cleanupTimers: (() => void)[] = [];

    acceptedInternships.forEach((internship) => {
      const { startDateTime, endDateTime } = getFormattedTimes(
        internship.test_scheduled!.time,
        internship.test_scheduled!.duration,
        internship.test_scheduled!.date
      );

      if (currentTime < startDateTime) {
        setTimeRemaining((prev) => ({ ...prev, [internship.id]: null }));
        return;
      }

      const updateTimer = () => {
        const now = new Date();
        const remainingMs = endDateTime.getTime() - now.getTime();

        if (remainingMs <= 0) {
          clearInterval(timer);
          setTimeRemaining((prev) => ({ ...prev, [internship.id]: 0 }));

          if (
            !internship.testCompleted &&
            !testSubmitted &&
            !isAutoSubmitting &&
            currentView !== 'test'
          ) {
            handleAutoSubmit(internship);
          }
        } else {
          setTimeRemaining((prev) => ({
            ...prev,
            [internship.id]: Math.floor(remainingMs / 1000),
          }));
        }
      };

      const timer = setInterval(updateTimer, 1000);
      updateTimer();

      cleanupTimers.push(() => clearInterval(timer));
    });

    return () => {
      cleanupTimers.forEach((cleanup) => cleanup());
    };
  }, [internships, testSubmitted, isAutoSubmitting, currentView, currentTime]);

  useEffect(() => {
    if (currentView === 'test' && selectedInternship && Object.keys(selectedAnswers).length > 0) {
      const interval = setInterval(() => {
        try {
          localStorage.setItem(
            `test_progress_${selectedInternship.id}`,
            JSON.stringify({
              answers: selectedAnswers,
              timestamp: Date.now(),
              questionIndex: currentQuestionIndex,
            })
          );
        } catch (saveError) {
          console.warn('Failed to save test progress:', saveError);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [selectedAnswers, currentView, selectedInternship, currentQuestionIndex]);

  const loadSavedProgress = (internshipId: number) => {
    try {
      const saved = localStorage.getItem(`test_progress_${internshipId}`);
      if (saved) {
        const { answers, timestamp, questionIndex } = JSON.parse(saved);
        if (Date.now() - timestamp < 3600000) {
          setSelectedAnswers(answers);
          setCurrentQuestionIndex(questionIndex);
          localStorage.removeItem(`test_progress_${internshipId}`);
          return true;
        }
      }
    } catch (loadError) {
      console.warn('Failed to load saved progress:', loadError);
    }
    return false;
  };

  const resetToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedInternship(null);
    setQuestions([]);
    setSelectedAnswers({});
    setTestSubmitted(false);
    setIsAutoSubmitting(false);
    setShowResult(false);
    setError(null);
    setIsTimeExpired(false);
    setTestTimeRemaining(null);
    setTestStats({ totalQuestions: 0, answeredQuestions: 0 });
    if (testTimerRef.current) {
      clearInterval(testTimerRef.current);
    }
  };

  const handleAttendTest = async (internship: Internship) => {
    if (!internship.test_scheduled) return;

    if (internship.testCompleted && internship.testScore !== undefined) {
      setSelectedInternship(internship);
      setCurrentView('test');
      setScore(internship.testScore);
      setTestSubmitted(true);
      setShowResult(true);
      setError(null);

      let totalQuestions = 0;
      let answeredQuestions = 0;

      if (internship.totalQuestions && internship.totalQuestions > 0) {
        totalQuestions = internship.totalQuestions;
      } else if (
        internship.test_scheduled?.total_questions &&
        internship.test_scheduled.total_questions > 0
      ) {
        totalQuestions = internship.test_scheduled.total_questions;
      }

      if (internship.answeredQuestions && internship.answeredQuestions > 0) {
        answeredQuestions = internship.answeredQuestions;
      }

      if (totalQuestions === 0) {
        try {
          const cachedData = localStorage.getItem(`test_stats_${internship.id}`);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            totalQuestions = parsed.totalQuestions || 0;
            answeredQuestions = parsed.answeredQuestions || 0;
          }
        } catch (e) {
          console.warn('Failed to load cached test stats:', e);
        }

        if (totalQuestions === 0 && internship.test_scheduled?.quiz_set_id) {
          try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(
              `${baseApi}/candidates/quiz/${internship.test_scheduled.quiz_set_id}/questions/`,
              {
                headers: {
                  Authorization: `Token ${token}`,
                },
              }
            );

            if (response.data && Array.isArray(response.data)) {
              totalQuestions = response.data.length;

              if (internship.testScore !== undefined && totalQuestions > 0) {
                const estimatedCorrect = Math.round(
                  (internship.testScore / 100) * totalQuestions
                );
                answeredQuestions = Math.min(
                  totalQuestions,
                  Math.max(estimatedCorrect, Math.round(estimatedCorrect * 1.2))
                );
              } else {
                answeredQuestions = totalQuestions;
              }

              try {
                localStorage.setItem(
                  `test_stats_${internship.id}`,
                  JSON.stringify({
                    totalQuestions,
                    answeredQuestions,
                    score: internship.testScore,
                    timestamp: Date.now(),
                    source: 'fetched_post_completion',
                  })
                );
              } catch (e) {
                console.warn('Failed to cache fetched stats:', e);
              }
            }
          } catch (fetchError) {
            console.warn('Failed to fetch question count for completed test:', fetchError);
            totalQuestions = 1;
            answeredQuestions = 1;
          }
        }

        if (totalQuestions === 0) {
          totalQuestions = 1;
          answeredQuestions = 1;
        }
      }

      setTestStats({ totalQuestions, answeredQuestions });
      return;
    }

    const { startDateTime } = getFormattedTimes(
      internship.test_scheduled.time,
      internship.test_scheduled.duration,
      internship.test_scheduled.date
    );
    const currentDate = new Date();

    if (currentDate < startDateTime) {
      alert(
        `Test is scheduled for ${startDateTime.toLocaleDateString()} at ${startDateTime.toLocaleTimeString(
          'en-US',
          { hour: 'numeric', minute: '2-digit', hour12: true }
        )}. Please wait until the scheduled time.`
      );
      return;
    }

    setSelectedInternship(internship);
    setCurrentView('test');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTestSubmitted(false);
    setIsAutoSubmitting(false);
    setShowResult(false);
    setError(null);
    setIsTimeExpired(false);
    setTestTimeRemaining(null);
    setTestStats({ totalQuestions: 0, answeredQuestions: 0 });

    await fetchQuestions(internship.test_scheduled.quiz_set_id);

    const progressLoaded = loadSavedProgress(internship.id);
    if (progressLoaded) {
      setError('Restored your previous progress!');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    if (testSubmitted || isAutoSubmitting || isTimeExpired) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (
      currentQuestionIndex < questions.length - 1 &&
      !testSubmitted &&
      !isAutoSubmitting &&
      !isTimeExpired
    ) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (
      currentQuestionIndex > 0 &&
      !testSubmitted &&
      !isAutoSubmitting &&
      !isTimeExpired
    ) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (testSubmitted || isAutoSubmitting) return;

    setIsAutoSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${baseApi}/candidates/submit-test-results/`,
        {
          internship_id: selectedInternship?.id,
          answers: selectedAnswers,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      const { score, test_completed, test_score, test_passed } = response.data;

      const totalQuestions = questions.length;
      const answeredQuestions = Object.keys(selectedAnswers).length;

      setScore(score);
      setTestSubmitted(true);
      setShowResult(true);
      setTestStats({ totalQuestions, answeredQuestions });

      try {
        localStorage.setItem(
          `test_stats_${selectedInternship?.id}`,
          JSON.stringify({
            totalQuestions,
            answeredQuestions,
            score,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.warn('Failed to cache test stats:', e);
      }

      setInternships((prev) =>
        prev.map((internship) =>
          internship.id === selectedInternship?.id
            ? {
                ...internship,
                testCompleted: test_completed,
                testScore: test_score,
                testPassed: test_passed,
                totalQuestions,
                answeredQuestions,
              }
            : internship
        )
      );

      if (selectedInternship) {
        localStorage.removeItem(`test_progress_${selectedInternship.id}`);
      }

      if (testTimerRef.current) {
        clearInterval(testTimerRef.current);
      }
    } catch (submitError) {
      setError('Failed to submit test results. Please try again.');
      console.error('Submit test error:', submitError);
    } finally {
      setIsAutoSubmitting(false);
    }
  };

  const isTestAvailable = (internship: Internship) => {
    if (
      !internship.test_scheduled ||
      internship.status !== 'accepted' ||
      internship.testCompleted
    ) {
      return false;
    }

    const { startDateTime } = getFormattedTimes(
      internship.test_scheduled.time,
      internship.test_scheduled.duration,
      internship.test_scheduled.date
    );
    return currentTime >= startDateTime;
  };

  const isQuizClosed = (internship: Internship) => {
    if (!internship.test_scheduled || internship.testCompleted) return false;

    const { endDateTime } = getFormattedTimes(
      internship.test_scheduled.time,
      internship.test_scheduled.duration,
      internship.test_scheduled.date
    );
    return currentTime > endDateTime;
  };

  const formatTimeRemaining = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (currentView === 'test' && selectedInternship) {
    if (testSubmitted && showResult) {
      const answeredQuestions =
        testStats.answeredQuestions || Object.keys(selectedAnswers).length;
      const totalQuestions = testStats.totalQuestions || questions.length;
      const passed =
        score >= (selectedInternship.test_scheduled?.pass_percentage || 60);

      return (
        <CandidateDashboardSkeleton>
          <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div
  className={`relative overflow-hidden px-8 py-16 md:px-12 ${
    passed
      ? 'bg-gradient-to-r from-slate-950 via-emerald-900 to-teal-700'
      : 'bg-gradient-to-r from-slate-950 via-red-900 to-rose-400'
  }`}
>
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_24%)]" />

  <div className="relative flex flex-col items-center text-center text-white">
    <div
      className={`mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/15 shadow-lg ${
        passed ? 'bg-white/10' : 'bg-white/10'
      } backdrop-blur-md`}
    >
      {passed ? <CheckCircle size={42} /> : <XCircle size={42} />}
    </div>

    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
      {passed ? 'Assessment Result' : 'Assessment Review'}
    </div>

    <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-5xl">
      {passed ? 'Assessment Completed' : 'Assessment Finished'}
    </h1>

    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 md:text-lg">
      <span className="font-semibold text-white">{selectedInternship.title}</span>
      <span className="mx-2 text-white/60">•</span>
      <span className="font-medium text-white/90">{selectedInternship.company}</span>
    </p>
  </div>
</div>

              <div className="p-10">
                {isTimeExpired && (
                  <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shrink-0">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-amber-800">Time expired</h3>
                        <p className="mt-1 text-sm text-amber-700">
                          Your assessment was auto-submitted using the answers you attempted.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                  <ResultMetricCard
                    icon={<Trophy />}
                    label="Your Score"
                    value={`${score}%`}
                    accent={passed ? 'green' : 'red'}
                  />

                  <ResultMetricCard
                    icon={<ClipboardCheck />}
                    label="Answered"
                    value={`${answeredQuestions}/${totalQuestions}`}
                    accent="blue"
                  />

                  <ResultMetricCard
                    icon={<Target />}
                    label="Status"
                    value={passed ? 'Passed' : 'Failed'}
                    accent={passed ? 'green' : 'red'}
                  />
                </div>

                <div
                  className={`mt-8 rounded-2xl p-6 border ${
                    passed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        passed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {passed ? <PartyPopper /> : <AlertCircle />}
                    </div>

                    <div>
                      <h3
                        className={`text-xl font-semibold ${
                          passed ? 'text-green-800' : 'text-red-800'
                        }`}
                      >
                        {passed
                          ? 'Congratulations! You passed the assessment'
                          : 'You did not meet the passing criteria'}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        {passed
                          ? 'You are eligible for the next round of the interview process.'
                          : `Minimum passing score is ${
                              selectedInternship.test_scheduled?.pass_percentage || 60
                            }%`}
                      </p>
                    </div>
                  </div>
                </div>

                {answeredQuestions < totalQuestions && totalQuestions > 0 && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shrink-0">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-amber-800">Unanswered questions</h3>
                        <p className="mt-1 text-sm text-amber-700">
                          {totalQuestions - answeredQuestions} question(s) were left unanswered due to time constraints.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center mt-10">
                  <button
                    onClick={resetToDashboard}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CandidateDashboardSkeleton>
      );
    }

    if (questions.length === 0 && !selectedInternship.testCompleted) {
      return (
        <CandidateDashboardSkeleton>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-6">
            <div className="flex min-h-[70vh] items-center justify-center">
              <div className="rounded-[32px] border border-slate-200/70 bg-white px-10 py-12 text-center shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <CircleDashed className="h-8 w-8 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">
                  Loading assessment
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Please wait while we prepare your questions...
                </p>
              </div>
            </div>
          </div>
        </CandidateDashboardSkeleton>
      );
    }

    if (!testSubmitted && !selectedInternship.testCompleted) {
      const currentQuestion = questions[currentQuestionIndex];
      const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
      const timeLeft = testTimeRemaining;
      const isTimeUp = timeLeft === 0 || isTimeExpired;

      return (
        <CandidateDashboardSkeleton>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="space-y-6">
                  <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
                    <button
                      onClick={() => {
                        setCurrentView('dashboard');
                        setQuestions([]);
                        setSelectedAnswers({});
                        setTestSubmitted(false);
                        setIsAutoSubmitting(false);
                        setError(null);
                        setIsTimeExpired(false);
                        setTestTimeRemaining(null);
                        setTestStats({ totalQuestions: 0, answeredQuestions: 0 });
                        if (testTimerRef.current) {
                          clearInterval(testTimerRef.current);
                        }
                      }}
                      className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      disabled={isAutoSubmitting}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Dashboard
                    </button>

                    <div className="rounded-[24px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Live Assessment
                      </p>
                      <h2 className="mt-2 text-xl font-bold">{selectedInternship.title}</h2>
                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                        <Building2 className="h-4 w-4" />
                        {selectedInternship.company}
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <SidebarInfoRow
                        icon={<FileText className="h-4 w-4" />}
                        label="Assessment"
                        value={selectedInternship.test_scheduled?.quiz_title || 'Technical Assessment'}
                      />
                      <SidebarInfoRow
                        icon={<Clock className="h-4 w-4" />}
                        label="Duration"
                        value={`${selectedInternship.test_scheduled?.duration || 0} Minutes`}
                      />
                      <SidebarInfoRow
                        icon={<CheckCircle className="h-4 w-4" />}
                        label="Passing Score"
                        value={`${selectedInternship.test_scheduled?.pass_percentage || 60}%`}
                      />
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Progress</p>
                        <h3 className="mt-1 text-lg font-bold text-slate-800">
                          Question {currentQuestionIndex + 1} of {questions.length}
                        </h3>
                      </div>
                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                        {Math.round(progress)}%
                      </div>
                    </div>

                    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-6">
                      <div
                        className={`rounded-[24px] border px-4 py-4 ${
                          timeLeft && timeLeft <= 120
                            ? 'border-red-200 bg-red-50'
                            : 'border-blue-200 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`rounded-2xl p-2 ${
                              timeLeft && timeLeft <= 120
                                ? 'bg-red-100 text-red-600'
                                : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            {isTimeUp ? (
                              <AlarmClock className="h-5 w-5" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">
                              Time Remaining
                            </p>
                            <p
                              className={`mt-1 text-2xl font-bold ${
                                timeLeft && timeLeft <= 120
                                  ? 'text-red-600 animate-pulse'
                                  : 'text-blue-700'
                              }`}
                            >
                              {formatTimeRemaining(timeLeft)}
                            </p>
                            {timeLeft && timeLeft <= 120 && timeLeft > 0 && (
                              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                Hurry up, only a little time left.
                              </p>
                            )}
                            {isTimeUp && (
                              <p className="mt-1 text-sm font-semibold text-red-600">
                                Time’s up. Submitting now...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-5 gap-2">
                      {questions.map((q, index) => {
                        const isAnswered = selectedAnswers[q.id] !== undefined;
                        const isActive = index === currentQuestionIndex;

                        return (
                          <button
                            key={q.id}
                            onClick={() =>
                              !isTimeUp && !isAutoSubmitting && setCurrentQuestionIndex(index)
                            }
                            disabled={isTimeUp || isAutoSubmitting}
                            className={`h-11 rounded-xl text-sm font-semibold transition ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-md'
                                : isAnswered
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)] md:p-8">
                  {error && (
                    <div className="mb-6 rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shrink-0">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-amber-800">Notice</h3>
                          <p className="mt-1 text-sm text-amber-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isAutoSubmitting && (
                    <div className="mb-6 rounded-[24px] border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 shrink-0">
                          <CircleDashed className="h-5 w-5 animate-spin" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-800">Submitting</h3>
                          <p className="mt-1 text-sm text-blue-700">
                            Please wait while we submit your answers...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                      <Sparkles className="h-4 w-4" />
                      Current Question
                    </div>

                    <h1 className="mt-5 text-2xl font-bold leading-relaxed text-slate-900 md:text-3xl">
                      {currentQuestion.text}
                    </h1>
                  </div>

                  <div className="space-y-4">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedAnswers[currentQuestion.id] === index;

                      return (
                        <label
                          key={index}
                          className={`group flex cursor-pointer items-start gap-4 rounded-[24px] border p-5 transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          } ${(isTimeUp || isAutoSubmitting) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={index}
                            checked={isSelected}
                            onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                            className="sr-only"
                            disabled={isTimeUp || isAutoSubmitting}
                          />

                          <div
                            className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                          </div>

                          <div className="flex-1">
                            <p className="text-base font-medium text-slate-800">
                              {option.text}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0 || isTimeUp || isAutoSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>

                    {currentQuestionIndex === questions.length - 1 ? (
                      <button
                        onClick={handleSubmitTest}
                        disabled={isTimeUp || isAutoSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAutoSubmitting ? (
                          <CircleDashed className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Submit Test
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        disabled={isTimeUp || isAutoSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CandidateDashboardSkeleton>
      );
    }
  }

  const acceptedCount = internships.filter((i) => i.status === 'accepted').length;
  const pendingCount = internships.filter((i) => i.status === 'pending').length;
  const rejectedCount = internships.filter((i) => i.status === 'rejected').length;
  const completedTests = internships.filter((i) => i.testCompleted).length;
  const passedCount = internships.filter(
  (i) => i.testCompleted && i.testPassed === true
).length;

const failedCount = internships.filter(
  (i) => i.testCompleted && i.testPassed === false
).length
const filteredInternships =
  statusFilter === 'all'
    ? internships
    : internships.filter((i) => i.status === statusFilter);

  return (
    <CandidateDashboardSkeleton>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />
            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200">
                  <Sparkles className="w-4 h-4" />
                  Application workspace
                </div>
                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  My Applied Internships
                </h1>
                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Track your applications, view assessment schedules, and monitor your interview progress.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-full xl:min-w-[720px]">
                <HeroStatCard label="Applied" value={internships.length} />
                <HeroStatCard label="Passed" value={passedCount} />
                <HeroStatCard label="Failed" value={failedCount} />
                <HeroStatCard label="Tests Done" value={completedTests} />
              </div>
            </div>
          </div>

          {error && currentView === 'dashboard' && (
            <div className="rounded-[28px] border border-red-200 bg-red-50 p-4 sm:p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-5">
                <CircleDashed className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                Loading applications
              </h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Please wait while we fetch your internship applications.
              </p>
            </div>
          ) : internships.length === 0 ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-5">
                <Briefcase className="h-10 w-10 text-slate-400" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                No applications found
              </h2>
              <p className="text-slate-500 max-w-md mx-auto">
                You haven&apos;t applied to any internships yet.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <SummaryMiniCard
                  icon={<CheckCircle className="h-5 w-5" />}
                  label="Accepted Applications"
                  value={acceptedCount}
                  accent="green"
                />
                <SummaryMiniCard
                  icon={<Hourglass className="h-5 w-5" />}
                  label="Pending Applications"
                  value={pendingCount}
                  accent="yellow"
                />
                <SummaryMiniCard
                  icon={<XCircle className="h-5 w-5" />}
                  label="Rejected Applications"
                  value={rejectedCount}
                  accent="red"
                />
                <SummaryMiniCard
                  icon={<FileText className="h-5 w-5" />}
                  label="Assessments Completed"
                  value={completedTests}
                  accent="blue"
                />
              </div>
              <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
  <div className="flex flex-wrap gap-3">
    <button
      onClick={() => setStatusFilter('all')}
      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
        statusFilter === 'all'
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      All ({internships.length})
    </button>

    <button
      onClick={() => setStatusFilter('accepted')}
      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
        statusFilter === 'accepted'
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
      }`}
    >
      Accepted ({acceptedCount})
    </button>

    <button
      onClick={() => setStatusFilter('pending')}
      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
        statusFilter === 'pending'
          ? 'bg-amber-500 text-white shadow-sm'
          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
      }`}
    >
      Pending ({pendingCount})
    </button>

    <button
      onClick={() => setStatusFilter('rejected')}
      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
        statusFilter === 'rejected'
          ? 'bg-red-600 text-white shadow-sm'
          : 'bg-red-50 text-red-700 hover:bg-red-100'
      }`}
    >
      Rejected ({rejectedCount})
    </button>
  </div>
</div>
              <div className="grid gap-6 xl:grid-cols-2">
                {filteredInternships.map((internship) => {
                  const testScheduled = internship.test_scheduled;
                  const times = testScheduled
                    ? getFormattedTimes(
                        testScheduled.time,
                        testScheduled.duration,
                        testScheduled.date
                      )
                    : null;

                  return (
                    <div
                      key={internship.id}
                     className="group overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)]"
                    >
                      <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-6 py-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700 shrink-0">
                              <Briefcase className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xl font-bold text-slate-900 truncate">
                                {internship.title}
                              </h3>
                              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                <Building2 className="h-4 w-4 shrink-0" />
                                <span className="truncate">{internship.company}</span>
                              </div>
                            </div>
                          </div>

                          <StatusBadge status={internship.status} />
                        </div>
                      </div>

                      <div className="px-6 py-6">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InfoPill
                            icon={<MapPin className="h-4 w-4" />}
                            text={internship.location}
                            tone="blue"
                          />
                          <InfoPill
                            icon={<TimerReset className="h-4 w-4" />}
                            text={`Duration: ${internship.duration}`}
                            tone="orange"
                          />
                          <InfoPill
                            icon={<Calendar className="h-4 w-4" />}
                            text={`Applied on: ${new Date(internship.appliedDate).toLocaleDateString()}`}
                            tone="purple"
                          />
                          <InfoPill
                            icon={<FileText className="h-4 w-4" />}
                            text={
                              testScheduled
                                ? 'Assessment Scheduled'
                                : internship.status === 'accepted'
                                ? 'Assessment Pending'
                                : 'No Assessment Available'
                            }
                            tone="teal"
                          />
                        </div>

                        {internship.status === 'accepted' && testScheduled && (
                          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                            <div className="flex items-center gap-3">
                              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-slate-900">
                                  Technical Assessment
                                </h4>
                                <p className="text-sm text-slate-600">
                                  {testScheduled.quiz_title}
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                              <AssessmentInfoCard
                                icon={<Calendar className="h-4 w-4" />}
                                label="Date"
                                value={new Date(testScheduled.date).toLocaleDateString()}
                              />
                              <AssessmentInfoCard
                                icon={<Clock className="h-4 w-4" />}
                                label="Time"
                                value={`${times?.startTime} - ${times?.endTime}`}
                              />
                              <AssessmentInfoCard
                                icon={<TimerReset className="h-4 w-4" />}
                                label="Duration"
                                value={`${testScheduled.duration} Minutes`}
                              />
                              <AssessmentInfoCard
                                icon={<Trophy className="h-4 w-4" />}
                                label="Pass Mark"
                                value={`${testScheduled.pass_percentage}%`}
                              />
                            </div>

                            {isTestAvailable(internship) && !isQuizClosed(internship) && (
                              <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                                    <Clock className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                      Active Now
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-emerald-800">
                                      {formatTimeRemaining(timeRemaining[internship.id])}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {internship.testCompleted ? (
                              <div className="mt-5 space-y-4">
                                <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                                      <CheckCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-800">
                                        Test Completed
                                      </p>
                                      <p className="text-sm text-slate-500">
                                        Your assessment has been submitted successfully.
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {typeof internship.testScore === 'number' && (
                                  <div
                                    className={`rounded-[22px] p-4 ${
                                      internship.testPassed
                                        ? 'border border-emerald-200 bg-emerald-50'
                                        : 'border border-red-200 bg-red-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <div>
                                        <p
                                          className={`text-sm font-medium ${
                                            internship.testPassed
                                              ? 'text-emerald-700'
                                              : 'text-red-700'
                                          }`}
                                        >
                                          Final Score
                                        </p>
                                        <p
                                          className={`mt-1 text-3xl font-bold ${
                                            internship.testPassed
                                              ? 'text-emerald-800'
                                              : 'text-red-800'
                                          }`}
                                        >
                                          {internship.testScore}%
                                        </p>
                                      </div>

                                      <span
                                        className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                                          internship.testPassed
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}
                                      >
                                        {internship.testPassed ? 'Passed' : 'Failed'}
                                      </span>
                                    </div>

                                    <p
                                      className={`mt-3 text-sm ${
                                        internship.testPassed
                                          ? 'text-emerald-700'
                                          : 'text-red-700'
                                      }`}
                                    >
                                      {internship.testPassed
                                        ? 'Congratulations! You are eligible for the next round.'
                                        : 'Unfortunately, you did not meet the minimum passing criteria.'}
                                    </p>
                                  </div>
                                )}

                                <button
                                  onClick={() => handleAttendTest(internship)}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-900"
                                >
                                  <FileText className="h-4 w-4" />
                                  View Results
                                </button>
                              </div>
                            ) : isQuizClosed(internship) ? (
                              <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-4 text-red-700">
                                <div className="flex items-start gap-3">
                                  <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                  <div>
                                    <p className="font-semibold">Quiz Closed</p>
                                    <p className="text-sm">
                                      The assessment time has expired.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : isTestAvailable(internship) ? (
                              <button
                                onClick={() => handleAttendTest(internship)}
                                disabled={isAutoSubmitting}
                                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FileText className="h-4 w-4" />
                                {isAutoSubmitting ? 'Processing...' : 'Attend Test'}
                              </button>
                            ) : (
                              <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-amber-700">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                  <div>
                                    <p className="font-semibold">
                                      Assessment Not Started Yet
                                    </p>
                                    <p className="text-sm">
                                      Quiz will start on{' '}
                                      {new Date(testScheduled.date).toLocaleDateString()} at{' '}
                                      {times?.startTime}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

const HeroStatCard = ({ label, value }: { label: string; value: number }) => {
  return (
    <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
      <p className="text-slate-300 text-sm">{label}</p>
      <h3 className="text-3xl font-bold mt-2">{value}</h3>
    </div>
  );
};

const SummaryMiniCard = ({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: 'green' | 'yellow' | 'red' | 'blue';
}) => {
  const styles = {
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    yellow: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-sm ${styles[accent]}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="rounded-2xl bg-white/70 p-3">{icon}</div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

const InfoPill = ({
  icon,
  text,
  tone,
}: {
  icon: React.ReactNode;
  text: string;
  tone: 'blue' | 'purple' | 'orange' | 'teal';
}) => {
  const styles = {
    blue: {
      wrap: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-600',
    },
    purple: {
      wrap: 'bg-purple-50',
      icon: 'bg-purple-100 text-purple-600',
    },
    orange: {
      wrap: 'bg-orange-50',
      icon: 'bg-orange-100 text-orange-600',
    },
    teal: {
      wrap: 'bg-teal-50',
      icon: 'bg-teal-100 text-teal-600',
    },
  };

  return (
    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700 ${styles[tone].wrap}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${styles[tone].icon}`}>
        {icon}
      </div>
      {text}
    </div>
  );
};

const AssessmentInfoCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => {
  const styles: Record<
    string,
    { bg: string; icon: string; label: string }
  > = {
    Date: {
      bg: 'bg-indigo-50',
      icon: 'bg-indigo-100 text-indigo-600',
      label: 'text-indigo-600',
    },
    Time: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-100 text-purple-600',
      label: 'text-purple-600',
    },
    Duration: {
      bg: 'bg-orange-50',
      icon: 'bg-orange-100 text-orange-600',
      label: 'text-orange-600',
    },
    'Pass Mark': {
      bg: 'bg-green-50',
      icon: 'bg-green-100 text-green-600',
      label: 'text-green-600',
    },
  };

  const tone = styles[label] || styles.Date;

  return (
    <div className={`rounded-2xl border border-slate-100 p-4 ${tone.bg}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${tone.icon}`}>{icon}</div>

        <div>
          <p className={`text-xs font-semibold uppercase ${tone.label}`}>
            {label}
          </p>

          <p className="text-sm font-semibold text-black mt-1">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

const SidebarInfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => {
  const getTone = (labelText: string) => {
    switch (labelText) {
      case 'Assessment':
        return {
          row: 'bg-blue-50',
          icon: 'bg-blue-100 text-blue-600',
          label: 'text-blue-600',
        };
      case 'Duration':
        return {
          row: 'bg-rose-50',
          icon: 'bg-rose-100 text-rose-600',
          label: 'text-rose-600',
        };
      case 'Passing Score':
        return {
          row: 'bg-emerald-50',
          icon: 'bg-emerald-100 text-emerald-600',
          label: 'text-emerald-600',
        };
      default:
        return {
          row: 'bg-slate-50',
          icon: 'bg-white text-slate-600',
          label: 'text-slate-500',
        };
    }
  };

  const tone = getTone(label);

  return (
    <div className={`flex items-start gap-3 rounded-2xl px-4 py-4 ${tone.row}`}>
      <div className={`rounded-xl p-2 shadow-sm ${tone.icon}`}>{icon}</div>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${tone.label}`}>
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
};

const ResultMetricCard = ({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: 'green' | 'red' | 'blue';
}) => {
  const styles = {
    green: {
      card: 'bg-green-50 border-green-200',
      icon: 'bg-green-100 text-green-600',
      label: 'text-green-700',
      value: 'text-green-800',
    },
    red: {
      card: 'bg-red-50 border-red-200',
      icon: 'bg-red-100 text-red-600',
      label: 'text-red-700',
      value: 'text-red-800',
    },
    blue: {
      card: 'bg-blue-50 border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      label: 'text-blue-700',
      value: 'text-blue-800',
    },
  };

  return (
    <div className={`border rounded-2xl p-6 ${styles[accent].card}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${styles[accent].icon}`}>
        {icon}
      </div>

      <p className={`text-sm font-medium ${styles[accent].label}`}>
        {label}
      </p>

      <p className={`text-3xl font-bold mt-2 ${styles[accent].value}`}>
        {value}
      </p>
    </div>
  );
};

const StatusBadge = ({ status }: { status: Internship['status'] }) => {
  const baseClass =
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]';

  switch (status) {
    case 'accepted':
      return (
        <span className={`${baseClass} bg-emerald-100 text-emerald-700`}>
          <CheckCircle className="h-4 w-4" />
          Accepted
        </span>
      );
    case 'pending':
      return (
        <span className={`${baseClass} bg-amber-100 text-amber-700`}>
          <Hourglass className="h-4 w-4" />
          Pending
        </span>
      );
    case 'rejected':
      return (
        <span className={`${baseClass} bg-red-100 text-red-700`}>
          <XCircle className="h-4 w-4" />
          Rejected
        </span>
      );
    default:
      return null;
  }
};

export default AppliedInternship;
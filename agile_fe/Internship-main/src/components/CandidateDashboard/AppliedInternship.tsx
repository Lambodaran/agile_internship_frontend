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
    total_questions?: number; // Add this field to store total questions count
  };
  testCompleted?: boolean;
  testScore?: number;
  testPassed?: boolean;
  totalQuestions?: number; // Add this to store the total questions answered
  answeredQuestions?: number; // Add this to store answered questions count
};

type Question = {
  id: number;
  text: string;
  options: { id: number; text: string }[];
};

const AppliedInternship = () => {
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
  
  // Add state to track test statistics for result display
  const [testStats, setTestStats] = useState<{
    totalQuestions: number;
    answeredQuestions: number;
  }>({ totalQuestions: 0, answeredQuestions: 0 });
  
  // Add state to force re-renders when test availability changes
  const [currentTime, setCurrentTime] = useState(new Date());

  // Use ref to store the latest selectedAnswers for auto-submit
  const selectedAnswersRef = useRef<{ [key: number]: number }>({});
  const questionsRef = useRef<Question[]>([]);
  const testTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs whenever state changes
  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // Add timer to update current time every second for test availability
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch applied internships
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

        console.log('API Response:', response.data); // Debug log

        const formattedInternships = response.data.map((app: any) => {
          console.log('Processing app:', app); // Debug log
          
          return {
            id: app.id,
            title: app.internship.internship_role,
            company: app.internship.company_name,
            location: app.internship.district ? app.internship.district : `${app.district}, ${app.state}, ${app.country}`,
            duration: app.internship.duration_months ? `${app.internship.duration_months} Months` : 'N/A',
            status: app.status,
            appliedDate: app.applied_at,
            test_scheduled: app.test_scheduled ? {
              ...app.test_scheduled,
              total_questions: app.test_scheduled.total_questions || app.test_scheduled.question_count || 0
            } : undefined,
            testCompleted: app.test_completed,
            testScore: app.test_score,
            testPassed: app.test_passed,
            // Try multiple possible field names from the API response
            totalQuestions: app.total_questions || app.question_count || app.test_questions || 
                           (app.test_scheduled ? app.test_scheduled.total_questions || app.test_scheduled.question_count : 0) || 0,
            answeredQuestions: app.answered_questions || app.questions_answered || app.attempted_questions || 0,
          };
        });

        console.log('Formatted internships:', formattedInternships); // Debug log
        setInternships(formattedInternships);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch applications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Fetch quiz questions
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

  // Calculate start and end times in 12-hour format
  const getFormattedTimes = (startTime: string, duration: number, date: string) => {
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);
    const formatTime = (date: Date) =>
      date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return {
      startTime: formatTime(startDateTime),
      endTime: formatTime(endDateTime),
      startDateTime,
      endDateTime,
    };
  };

  // Auto-submit test when time expires
  const handleAutoSubmit = async (internship: Internship, isTestPageTimer = false) => {
    if (internship.testCompleted || testSubmitted || isAutoSubmitting) {
      return;
    }

    setIsAutoSubmitting(true);
    setIsTimeExpired(true);

    // Get the latest answers and questions from refs
    const answersToSubmit = selectedAnswersRef.current;
    const currentQuestions = questionsRef.current;

    // Show auto-submit message
    if (selectedInternship?.id === internship.id || isTestPageTimer) {
      setError('Time expired! Your test time has ended. We will auto-submit the questions you have attempted.');
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

      const { score, passed, test_completed, test_score, test_passed } = response.data;

      // Calculate test statistics
      const totalQuestions = currentQuestions.length || 0;
      const answeredQuestions = Object.keys(answersToSubmit).length;

      console.log('Auto-submitting with stats:', { totalQuestions, answeredQuestions, score }); // Debug log

      // Cache the test statistics
      try {
        localStorage.setItem(`test_stats_${internship.id}`, JSON.stringify({
          totalQuestions,
          answeredQuestions,
          score,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to cache test stats:', e);
      }

      // Update internship data in list
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

      // If this is the currently active test, update UI state and show results
      if (selectedInternship?.id === internship.id || isTestPageTimer) {
        setScore(score);
        setTestSubmitted(true);
        setShowResult(true);
        setTestStats({ totalQuestions, answeredQuestions });
        // Keep the time expired message for a moment, then clear
        setTimeout(() => {
          setError(null);
        }, 2000);
      }

      // Remove saved progress from localStorage
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

  // Test page timer - runs when user is actively taking the test
  useEffect(() => {
    if (currentView === 'test' && selectedInternship && !testSubmitted && !isAutoSubmitting) {
      const testScheduled = selectedInternship.test_scheduled;
      if (!testScheduled) return;

      const { startDateTime, endDateTime } = getFormattedTimes(
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
          // Auto-submit when time expires
          handleAutoSubmit(selectedInternship, true);
        } else {
          setTestTimeRemaining(Math.floor(remainingMs / 1000));

          // 1 minute warning alert
          if (remainingMs <= 60000 && remainingMs > 59000) {
            alert('Only 1 minute remaining!');
          }
        }
      };

      testTimerRef.current = setInterval(updateTestTimer, 1000);
      updateTestTimer(); // Run once immediately

      return () => {
        if (testTimerRef.current) {
          clearInterval(testTimerRef.current);
        }
      };
    }
  }, [currentView, selectedInternship, testSubmitted, isAutoSubmitting]);

  // Dashboard timer management - Updated to use currentTime dependency
  useEffect(() => {
    const acceptedInternships = internships.filter(
      (internship) =>
        internship.status === 'accepted' &&
        internship.test_scheduled &&
        !internship.testCompleted
    );

    // Array of timer cleanup functions
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

          // Only auto-submit if test hasn't been completed and we're not already submitting
          // and this is not the currently active test (test page has its own timer)
          if (!internship.testCompleted && !testSubmitted && !isAutoSubmitting &&
            currentView !== 'test') {
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
      updateTimer(); // Run once immediately

      cleanupTimers.push(() => clearInterval(timer));
    });

    return () => {
      cleanupTimers.forEach((cleanup) => cleanup());
    };
  }, [internships, testSubmitted, isAutoSubmitting, currentView, currentTime]); // Added currentTime dependency

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (currentView === 'test' && selectedInternship && Object.keys(selectedAnswers).length > 0) {
      const interval = setInterval(() => {
        try {
          localStorage.setItem(
            `test_progress_${selectedInternship.id}`,
            JSON.stringify({
              answers: selectedAnswers,
              timestamp: Date.now(),
              questionIndex: currentQuestionIndex
            })
          );
        } catch (error) {
          console.warn('Failed to save test progress:', error);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [selectedAnswers, currentView, selectedInternship, currentQuestionIndex]);

  // Load saved progress when starting test
  const loadSavedProgress = (internshipId: number) => {
    try {
      const saved = localStorage.getItem(`test_progress_${internshipId}`);
      if (saved) {
        const { answers, timestamp, questionIndex } = JSON.parse(saved);
        // Only load if saved within last hour
        if (Date.now() - timestamp < 3600000) {
          setSelectedAnswers(answers);
          setCurrentQuestionIndex(questionIndex);
          localStorage.removeItem(`test_progress_${internshipId}`);
          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to load saved progress:', error);
    }
    return false;
  };

  const handleAttendTest = async (internship: Internship) => {
    if (!internship.test_scheduled) return;

    // If test is completed, show results using stored data
    if (internship.testCompleted && internship.testScore !== undefined) {
      setSelectedInternship(internship);
      setCurrentView('test');
      setScore(internship.testScore);
      setTestSubmitted(true);
      setShowResult(true);
      setError(null);
      
      // Enhanced fallback logic for test statistics
      let totalQuestions = 0;
      let answeredQuestions = 0;

      // Try to get from internship data first
      if (internship.totalQuestions && internship.totalQuestions > 0) {
        totalQuestions = internship.totalQuestions;
      } else if (internship.test_scheduled?.total_questions && internship.test_scheduled.total_questions > 0) {
        totalQuestions = internship.test_scheduled.total_questions;
      }

      if (internship.answeredQuestions && internship.answeredQuestions > 0) {
        answeredQuestions = internship.answeredQuestions;
      }

      // If we still don't have valid data, try to fetch from localStorage
      if (totalQuestions === 0) {
        // Check if we have cached test data
        try {
          const cachedData = localStorage.getItem(`test_stats_${internship.id}`);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            totalQuestions = parsed.totalQuestions || 0;
            answeredQuestions = parsed.answeredQuestions || 0;
            console.log('Loaded from cache:', { totalQuestions, answeredQuestions });
          }
        } catch (e) {
          console.warn('Failed to load cached test stats:', e);
        }

        // If still no data, try to fetch the actual questions to get the real count
        if (totalQuestions === 0 && internship.test_scheduled?.quiz_set_id) {
          try {
            console.log('Attempting to fetch actual question count...');
            const token = localStorage.getItem('access_token');
            const response = await axios.get(`${baseApi}/candidates/quiz/${internship.test_scheduled.quiz_set_id}/questions/`, {
              headers: {
                Authorization: `Token ${token}`,
              },
            });
            
            if (response.data && Array.isArray(response.data)) {
              totalQuestions = response.data.length;
              console.log('Fetched actual question count:', totalQuestions);
              
              // For answered questions, we need to make a reasonable estimate
              // Since we don't have the original answers, estimate based on score
              if (internship.testScore !== undefined && totalQuestions > 0) {
                // Estimate answered questions based on score
                // This assumes each question contributes equally to the score
                const estimatedCorrect = Math.round((internship.testScore / 100) * totalQuestions);
                // Assume the candidate answered at least as many questions as they got correct
                // But probably answered more (including wrong answers)
                answeredQuestions = Math.min(totalQuestions, Math.max(estimatedCorrect, Math.round(estimatedCorrect * 1.2)));
              } else {
                answeredQuestions = totalQuestions; // Assume all were answered if no better info
              }
              
              // Cache this information for future use
              try {
                localStorage.setItem(`test_stats_${internship.id}`, JSON.stringify({
                  totalQuestions,
                  answeredQuestions,
                  score: internship.testScore,
                  timestamp: Date.now(),
                  source: 'fetched_post_completion'
                }));
              } catch (e) {
                console.warn('Failed to cache fetched stats:', e);
              }
            }
          } catch (error) {
            console.warn('Failed to fetch question count for completed test:', error);
            // Last resort: use a minimal fallback
            totalQuestions = 1; // At least 1 question must have existed
            answeredQuestions = 1; // Assume at least 1 was answered since there's a score
          }
        }

        // Final fallback if everything else fails
        if (totalQuestions === 0) {
          console.warn('Using final fallback values for test stats');
          totalQuestions = 1; // Minimum fallback
          answeredQuestions = 1;
        }
      }

      console.log('Test stats for completed test:', { totalQuestions, answeredQuestions, internship }); // Debug log
      
      setTestStats({ totalQuestions, answeredQuestions });
      
      // Don't fetch questions for completed tests, just show results
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

    // Only fetch questions if test is not completed
    const fetchedQuestions = await fetchQuestions(internship.test_scheduled.quiz_set_id);
    
    // Try to load any saved progress
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
    if (currentQuestionIndex < questions.length - 1 && !testSubmitted && !isAutoSubmitting && !isTimeExpired) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0 && !testSubmitted && !isAutoSubmitting && !isTimeExpired) {
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

      const { score, passed, test_completed, test_score, test_passed } = response.data;
      
      // Calculate and store test statistics
      const totalQuestions = questions.length;
      const answeredQuestions = Object.keys(selectedAnswers).length;
      
      console.log('Submitting test with stats:', { totalQuestions, answeredQuestions, score }); // Debug log
      
      setScore(score);
      setTestSubmitted(true);
      setShowResult(true);
      setTestStats({ totalQuestions, answeredQuestions });

      // Cache the test statistics for future reference
      try {
        localStorage.setItem(`test_stats_${selectedInternship?.id}`, JSON.stringify({
          totalQuestions,
          answeredQuestions,
          score,
          timestamp: Date.now()
        }));
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

      // Remove saved progress
      if (selectedInternship) {
        localStorage.removeItem(`test_progress_${selectedInternship.id}`);
      }

      // Clear test timer
      if (testTimerRef.current) {
        clearInterval(testTimerRef.current);
      }
    } catch (error) {
      setError('Failed to submit test results. Please try again.');
      console.error('Submit test error:', error); // Debug log
    } finally {
      setIsAutoSubmitting(false);
    }
  };

  // Updated to use currentTime instead of creating new Date
  const isTestAvailable = (internship: Internship) => {
    if (!internship.test_scheduled || internship.status !== 'accepted' || internship.testCompleted) return false;
    const { startDateTime } = getFormattedTimes(
      internship.test_scheduled.time,
      internship.test_scheduled.duration,
      internship.test_scheduled.date
    );
    return currentTime >= startDateTime;
  };

  // Updated to use currentTime instead of creating new Date
  const isQuizClosed = (internship: Internship) => {
    if (!internship.test_scheduled || internship.testCompleted) return false;
    const { endDateTime } = getFormattedTimes(
      internship.test_scheduled.time,
      internship.test_scheduled.duration,
      internship.test_scheduled.date
    );
    return currentTime > endDateTime;
  };

  // Format time remaining as MM:SS
  const formatTimeRemaining = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Test Results View
  if (currentView === 'test' && selectedInternship) {
    if (testSubmitted && showResult) {
      // Use testStats for display, with fallback to current session data
      const answeredQuestions = testStats.answeredQuestions || Object.keys(selectedAnswers).length;
      const totalQuestions = testStats.totalQuestions || questions.length;
      const passed = score >= (selectedInternship.test_scheduled?.pass_percentage || 60);

      return (
        <CandidateDashboardSkeleton>
          <div className="p-6">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
              <div className={`w-16 h-16 mx-auto mb-4 ${passed ? 'text-green-500' : 'text-red-500'}`}>
                {passed ? <CheckCircle className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Test Completed!</h2>

              {/* Time expired message */}
              {isTimeExpired && (
                <div className="mb-4 p-3 bg-orange-100 border border-orange-200 rounded-lg flex items-center justify-center text-orange-800 font-medium">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Your test time has ended. We have auto-submitted the questions you attempted.
                </div>
              )}

              <p className="text-lg text-gray-600 mb-6">
                Thank you for taking the test for <strong>{selectedInternship.title}</strong> at{' '}
                <strong>{selectedInternship.company}</strong>
              </p>

              <div className={`rounded-lg p-6 mb-6 ${passed ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`text-xl font-semibold mb-2 ${passed ? 'text-green-800' : 'text-red-800'}`}>
                  Your Score
                </h3>
                <p className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {score}%
                </p>
                <p className={`text-sm mt-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  You answered {answeredQuestions} out of {totalQuestions} questions
                </p>

                <div className={`mt-4 p-3 rounded-lg flex items-center ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
                  {passed ? (
                    <div className="w-full flex justify-center">
                      <div className="flex items-center gap-2 bg-green-100 text-green-800 text-sm px-4 py-3 rounded-md">
                        <PartyPopper className="w-5 h-5" />
                        <div>
                          <p className="font-semibold">Congratulations! You passed the assessment!</p>
                          <p className="text-xs">You are eligible for the next round of interviews.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex justify-center">
                      <div className="flex items-center gap-2 bg-red-100 text-red-800 text-sm px-4 py-3 rounded-md">
                        <XCircle className="w-5 h-5" />
                        <div>
                          <p className="font-semibold">Unfortunately, you did not pass the assessment.</p>
                          <p className="text-xs mt-1 text-red-700">
                            Minimum passing score is {selectedInternship.test_scheduled?.pass_percentage || 60}%.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {answeredQuestions < totalQuestions && totalQuestions > 0 && (
                  <div className="mt-3 p-2 bg-orange-100 rounded-lg flex items-center text-orange-700 text-xs">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Note: {totalQuestions - answeredQuestions} questions were not answered due to time constraints.
                  </div>
                )}
              </div>

              <button
                onClick={() => {
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
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </CandidateDashboardSkeleton>
      );
    }

    // Loading questions (only show for active tests, not completed ones)
    if (questions.length === 0 && !selectedInternship.testCompleted) {
      return (
        <CandidateDashboardSkeleton>
          <div className="p-6">
            <div className="flex items-center justify-center min-h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading questions...</p>
              </div>
            </div>
          </div>
        </CandidateDashboardSkeleton>
      );
    }

    // Test interface (only for active tests)
    if (!testSubmitted && !selectedInternship.testCompleted) {
      const currentQuestion = questions[currentQuestionIndex];
      const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
      const timeLeft = testTimeRemaining; // Use test-specific timer
      const isTimeUp = timeLeft === 0 || isTimeExpired;

      return (
        <CandidateDashboardSkeleton>
          <div className="p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
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
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                  disabled={isAutoSubmitting}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </button>
                <div className="text-right">
                  <h3 className="font-semibold">{selectedInternship.title}</h3>
                  <p className="text-sm text-gray-600">{selectedInternship.company}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-sm text-gray-500">Progress: {Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Timer Display */}
              <div className="mb-4 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className={timeLeft && timeLeft <= 120 ? 'text-red-500 font-medium animate-pulse' : 'text-blue-600'}>
                  Time Remaining: {formatTimeRemaining(timeLeft)}
                  {timeLeft && timeLeft <= 120 && timeLeft > 0 && (
                    <span className="ml-2 flex items-center text-yellow-500">
                      <AlertTriangle className="w-5 h-5 mr-1" />
                      Hurry up!
                    </span>
                  )}
                  {isTimeUp && (
                    <span className="ml-2 text-red-500 font-bold flex items-center">
                      <AlarmClock className="w-5 h-5 mr-1" />
                      TIME'S UP!
                    </span>
                  )}
                </span>
              </div>

              {/* Error/Info Messages */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-center gap-2 text-orange-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {isAutoSubmitting && (
                <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Submitting your answers...</span>
                  </div>
                </div>
              )}

              {/* Question */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-6">{currentQuestion.text}</h2>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition duration-200 ${selectedAnswers[currentQuestion.id] === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } ${(isTimeUp || isAutoSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={index}
                        checked={selectedAnswers[currentQuestion.id] === index}
                        onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                        className="sr-only"
                        disabled={isTimeUp || isAutoSubmitting}
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${selectedAnswers[currentQuestion.id] === index
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                          }`}
                      >
                        {selectedAnswers[currentQuestion.id] === index && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="text-gray-700">{option.text}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0 || isTimeUp || isAutoSubmitting}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {currentQuestionIndex === questions.length - 1 ? (
                  <button
                    onClick={handleSubmitTest}
                    disabled={isTimeUp || isAutoSubmitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isAutoSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                    Submit Test
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    disabled={isTimeUp || isAutoSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </CandidateDashboardSkeleton>
      );
    }
  }

  // Dashboard View
  return (
    <CandidateDashboardSkeleton>
      <div className="p-6 pb-20 bg-gray-50">
        <h2 className="text-2xl font-bold mb-4">My Applied Internships</h2>
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}
        {loading && (
          <div className="mb-4 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        )}
        {internships.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">You haven't applied to any internships yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {internships.map((internship) => {
              const testScheduled = internship.test_scheduled;
              const times = testScheduled
                ? getFormattedTimes(testScheduled.time, testScheduled.duration, testScheduled.date)
                : null;

              return (
                <div
                  key={internship.id}
                  className="p-4 border rounded-lg shadow-sm hover:shadow-md transition duration-200 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xl font-semibold">
                      <Briefcase className="w-5 h-5 text-blue-500" />
                      {internship.title}
                    </div>
                    <StatusBadge status={internship.status} />
                  </div>
                  <p className="text-gray-700 mt-1">{internship.company}</p>
                  <div className="mt-3 text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {internship.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Duration: {internship.duration}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Applied on: {new Date(internship.appliedDate).toLocaleDateString()}
                    </div>
                    {internship.status === 'accepted' && testScheduled && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
                          <FileText className="w-4 h-4" />
                          Technical Assessment
                        </div>
                        <div className="text-sm text-blue-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            Title: {testScheduled.quiz_title}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            Date: {new Date(testScheduled.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Time: {times?.startTime} - {times?.endTime} ({testScheduled.duration} minutes)
                          </div>
                          {isTestAvailable(internship) && !isQuizClosed(internship) && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              Time Remaining: {formatTimeRemaining(timeRemaining[internship.id])}
                            </div>
                          )}
                        </div>
                        {internship.testCompleted ? (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Test Completed</span>
                            </div>
                            {typeof internship.testScore === 'number' && (
                              <div
                                className={`p-3 rounded-lg ${internship.testPassed ? 'bg-green-100' : 'bg-red-100'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-sm font-medium ${internship.testPassed ? 'text-green-800' : 'text-red-800'
                                      }`}
                                  >
                                    Score: {internship.testScore}%
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${internship.testPassed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                      }`}
                                  >
                                    {internship.testPassed ? 'PASSED' : 'FAILED'}
                                  </span>
                                </div>
                                <p
                                  className={`text-xs text-center mt-1 ${internship.testPassed ? 'text-green-700' : 'text-red-700'
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
                              className="mt-2 px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition duration-200 flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              View Results
                            </button>
                          </div>
                        ) : isQuizClosed(internship) ? (
                          <div className="mt-3 flex items-center gap-2 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">Quiz Closed - Time Expired</span>
                          </div>
                        ) : isTestAvailable(internship) ? (
                          <button
                            onClick={() => handleAttendTest(internship)}
                            disabled={isAutoSubmitting}
                            className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FileText className="w-4 h-4" />
                            {isAutoSubmitting ? 'Processing...' : 'Attend Test'}
                          </button>
                        ) : (
                          <div className="mt-3 flex items-center gap-2 text-orange-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">
                              Quiz will start on {new Date(testScheduled.date).toLocaleDateString()} at{' '}
                              {times?.startTime}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CandidateDashboardSkeleton>
  );
};

const StatusBadge = ({ status }: { status: Internship['status'] }) => {
  const baseClass = 'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1';

  switch (status) {
    case 'accepted':
      return (
        <span className={`${baseClass} bg-green-100 text-green-700`}>
          <CheckCircle className="w-4 h-4" />
          Accepted
        </span>
      );
    case 'pending':
      return (
        <span className={`${baseClass} bg-yellow-100 text-yellow-700`}>
          <Hourglass className="w-4 h-4" />
          Pending
        </span>
      );
    case 'rejected':
      return (
        <span className={`${baseClass} bg-red-100 text-red-700`}>
          <XCircle className="w-4 h-4" />
          Rejected
        </span>
      );
    default:
      return null;
  }
};

export default AppliedInternship;
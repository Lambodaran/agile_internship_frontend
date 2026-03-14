// src/pages/candidate/ApplicationHistory.tsx
import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CandidateDashboardSkeleton from '../../components/skeleton/CandidateDashboardSkeleton';

const baseApi = import.meta.env.VITE_BASE_API;

interface TimelineEvent {
  id: string;
  eventType:
    | 'applied'
    | 'application_accepted'
    | 'quiz_completed'
    | 'shortlisted'
    | 'interview_scheduled'
    | 'interview_completed'
    | 'offer_extended'
    | 'offer_accepted'
    | 'offer_rejected'
    | 'withdrawn'
    | 'rejected'
    | 'feedback_received';
  title: string;
  description?: string;
  timestamp?: string;
  status: 'completed' | 'pending' | 'failed';
}

interface Application {
  id: string;
  company: string;
  role: string;
  appliedAt: string;
  currentStatus: string;
  finalOutcome?: 'accepted' | 'rejected' | 'withdrawn' | null;
  timeline: TimelineEvent[];
  feedback?: string | null;
}

type StepDefinition = {
  key: TimelineEvent['eventType'];
  title: string;
};

const DEFAULT_STEPS: StepDefinition[] = [
  { key: 'applied', title: 'Application Submitted' },
  { key: 'application_accepted', title: 'Application Accepted' },
  { key: 'quiz_completed', title: 'Quiz Completed' },
  { key: 'shortlisted', title: 'Shortlisted for Interview' },
  { key: 'interview_scheduled', title: 'Interview Scheduled' },
  { key: 'interview_completed', title: 'Face-to-Face Interview' },
  { key: 'offer_extended', title: 'Selected for Internship' },
];

const ApplicationHistory = () => {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<Application[]>([]);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicationHistory = async () => {
      try {
        const token =
          localStorage.getItem('access_token') ||
          localStorage.getItem('access') ||
          localStorage.getItem('token');

        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const response = await fetch(`${baseApi}/candidates/application-history/`, {
          method: 'GET',
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Application history API error:', errorText);
          throw new Error(`Failed to fetch application history: ${response.status}`);
        }

        const data = await response.json();
        setApplications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching application history:', error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationHistory();
  }, []);

  const filteredApps = applications.filter(
    (app) =>
      filterStatus === 'all' ||
      (filterStatus === 'accepted' && app.finalOutcome === 'accepted') ||
      (filterStatus === 'rejected' && app.finalOutcome === 'rejected') ||
      (filterStatus === 'withdrawn' && app.finalOutcome === 'withdrawn') ||
      (!app.finalOutcome && filterStatus === 'active')
  );

  const toggleExpand = (appId: string) => {
    setExpandedApp(expandedApp === appId ? null : appId);
  };

  const getStatusColor = (outcome?: string | null) => {
    if (!outcome) return 'text-blue-600';
    if (outcome === 'accepted') return 'text-green-600';
    if (outcome === 'rejected') return 'text-red-600';
    if (outcome === 'withdrawn') return 'text-orange-600';
    return 'text-gray-600';
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Pending';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateOnly = (value?: string | null) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const buildFullTimeline = (app: Application): TimelineEvent[] => {
    const actualMap = new Map(app.timeline.map((event) => [event.eventType, event]));
    const hasRejectedEvent = app.timeline.some((event) => event.eventType === 'rejected');

    let failedStepKey: TimelineEvent['eventType'] | null = null;

    if (hasRejectedEvent) {
      const hasSelected = app.timeline.some((event) => event.eventType === 'offer_extended');
      const hasInterviewCompleted = app.timeline.some(
        (event) => event.eventType === 'interview_completed'
      );
      const hasInterviewScheduled = app.timeline.some(
        (event) => event.eventType === 'interview_scheduled'
      );
      const hasShortlisted = app.timeline.some((event) => event.eventType === 'shortlisted');
      const hasQuizCompleted = app.timeline.some((event) => event.eventType === 'quiz_completed');
      const hasApplicationAccepted = app.timeline.some(
        (event) => event.eventType === 'application_accepted'
      );

      if (hasSelected) {
        failedStepKey = null;
      } else if (hasInterviewCompleted || hasInterviewScheduled) {
        failedStepKey = 'offer_extended';
      } else if (hasShortlisted || hasQuizCompleted) {
        failedStepKey = 'shortlisted';
      } else if (hasApplicationAccepted) {
        failedStepKey = 'quiz_completed';
      } else {
        failedStepKey = 'application_accepted';
      }
    }

    return DEFAULT_STEPS.map((step) => {
      const existing = actualMap.get(step.key);

      if (existing) {
        return {
          ...existing,
          title: existing.title || step.title,
        };
      }

      if (failedStepKey === step.key) {
        return {
          id: `${app.id}-${step.key}-failed`,
          eventType: step.key,
          title: step.title,
          description: 'This stage was not successfully completed.',
          timestamp: '',
          status: 'failed',
        };
      }

      return {
        id: `${app.id}-${step.key}-pending`,
        eventType: step.key,
        title: step.title,
        description: 'This step has not been reached yet.',
        timestamp: '',
        status: 'pending',
      };
    });
  };

  if (loading) {
    return (
      <CandidateDashboardSkeleton>
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your application history...</p>
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  return (
    <CandidateDashboardSkeleton>
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Application History</h1>
              <p className="text-gray-600 mt-1">
                Track every step of your internship applications
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Filter by:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter applications by status"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none bg-white"
              >
                <option value="all">All Applications</option>
                <option value="active">Active</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="space-y-5">
            {filteredApps.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500 border border-gray-200">
                <Briefcase size={48} className="mx-auto mb-4 opacity-40" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  No applications found
                </h2>
                <p>Start applying to internships to see your history here.</p>
              </div>
            ) : (
              filteredApps.map((app) => {
                const fullTimeline = buildFullTimeline(app);

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div
                      onClick={() => toggleExpand(app.id)}
                      className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {app.company?.charAt(0)?.toUpperCase() || 'A'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 truncate">{app.role}</h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Building2 size={14} />
                                {app.company}
                              </p>
                            </div>
                            <div className={`text-sm font-medium ${getStatusColor(app.finalOutcome)}`}>
                              {app.currentStatus}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Applied on {formatDateOnly(app.appliedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="ml-4">
                        {expandedApp === app.id ? (
                          <ChevronDown size={20} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-500" />
                        )}
                      </div>
                    </div>

                    {expandedApp === app.id && (
                      <div className="px-6 pb-6 border-t bg-gray-50">
                        <div className="relative mt-6 ml-2 sm:ml-6">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                          <div className="space-y-8">
                            {fullTimeline.map((event, index) => (
                              <div key={event.id} className="relative flex items-start">
                                <div
                                  className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 ${
                                    event.status === 'completed'
                                      ? 'bg-green-100 border-green-500'
                                      : event.status === 'failed'
                                      ? 'bg-red-100 border-red-500'
                                      : 'bg-gray-100 border-gray-400'
                                  }`}
                                >
                                  {event.status === 'completed' ? (
                                    <CheckCircle size={16} className="text-green-600" />
                                  ) : event.status === 'failed' ? (
                                    <XCircle size={16} className="text-red-600" />
                                  ) : (
                                    <Clock size={16} className="text-gray-500" />
                                  )}
                                </div>

                                <div className="ml-12 w-full">
                                  <div
                                    className={`rounded-xl border px-4 py-3 ${
                                      event.status === 'completed'
                                        ? 'bg-green-50 border-green-100'
                                        : event.status === 'failed'
                                        ? 'bg-red-50 border-red-100'
                                        : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                      <div>
                                        <h4 className="font-medium text-gray-900">
                                          {index + 1}. {event.title}
                                        </h4>

                                        {event.description && (
                                          <p className="text-sm text-gray-600 mt-0.5">
                                            {event.description}
                                          </p>
                                        )}

                                      </div>

                                      <span
                                        className={`inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-medium ${
                                          event.status === 'completed'
                                            ? 'bg-green-100 text-green-700'
                                            : event.status === 'failed'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                      >
                                        {event.status === 'completed'
                                          ? 'Completed'
                                          : event.status === 'failed'
                                          ? 'Failed'
                                          : 'Pending'}
                                      </span>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-2">
                                      {event.status === 'pending'
                                        ? 'Waiting for this stage'
                                        : formatDateTime(event.timestamp)}
                                    </p>

                                    {event.status === 'failed' &&
                                      app.feedback &&
                                      index === fullTimeline.length - 1 && (
                                        <div className="mt-3 p-4 bg-red-50 border border-red-100 rounded-lg">
                                          <p className="text-sm font-medium text-red-800 mb-1">
                                            Feedback from recruiter:
                                          </p>
                                          <p className="text-sm text-gray-700">{app.feedback}</p>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default ApplicationHistory;
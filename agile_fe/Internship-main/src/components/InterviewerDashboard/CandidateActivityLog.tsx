import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Briefcase,
  CheckCircle2,
  Clock3,
  XCircle,
  ChevronDown,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  AlertCircle,
  FolderOpen,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../../components/skeleton/InterviewerDashboardSkeleton';

const baseApi = import.meta.env.VITE_BASE_API;

const api = axios.create({
  baseURL: baseApi,
  headers: { 'Content-Type': 'application/json' },
});

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
    | 'rejected';
  title: string;
  description?: string;
  timestamp?: string;
  status: 'completed' | 'pending' | 'failed';
}

interface CandidateApplication {
  id: string;
  company: string;
  role: string;
  appliedAt: string;
  currentStatus: string;
  finalOutcome?: 'accepted' | 'rejected' | null;
  timeline: TimelineEvent[];
}

interface CandidateGroup {
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  applications: CandidateApplication[];
}

type StepDefinition = {
  key: TimelineEvent['eventType'];
  title: string;
};

const DEFAULT_STEPS: StepDefinition[] = [
  { key: 'applied', title: 'Application Submitted' },
  { key: 'application_accepted', title: 'Application Accepted' },
  { key: 'quiz_completed', title: 'Quiz Result' },
  { key: 'shortlisted', title: 'Shortlisted for Interview' },
  { key: 'interview_scheduled', title: 'Interview Scheduled' },
  { key: 'interview_completed', title: 'Face-to-Face Interview' },
  { key: 'offer_extended', title: 'Selected for Internship' },
];

const avatarThemes = [
  {
    avatar: 'from-blue-500 to-indigo-600',
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
    soft: 'bg-blue-50',
  },
  {
    avatar: 'from-violet-500 to-fuchsia-600',
    chip: 'bg-violet-50 text-violet-700 border-violet-200',
    soft: 'bg-violet-50',
  },
  {
    avatar: 'from-emerald-500 to-teal-600',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    soft: 'bg-emerald-50',
  },
  {
    avatar: 'from-amber-500 to-orange-500',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    soft: 'bg-amber-50',
  },
  {
    avatar: 'from-pink-500 to-rose-500',
    chip: 'bg-pink-50 text-pink-700 border-pink-200',
    soft: 'bg-pink-50',
  },
  {
    avatar: 'from-cyan-500 to-sky-600',
    chip: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    soft: 'bg-cyan-50',
  },
];

const CandidateActivityLog: React.FC = () => {
  const [candidates, setCandidates] = useState<CandidateGroup[]>([]);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [expandedApplication, setExpandedApplication] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityLogs = async () => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('access') ||
      localStorage.getItem('token');

    if (!token) {
      setError('No authentication token found. Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<CandidateGroup[]>('/interviewer/candidate-activity-log/', {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      setCandidates(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Error fetching candidate activity logs:', err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          'Failed to load candidate activity log.'
      );
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const toggleCandidate = (candidateId: string) => {
    if (expandedCandidate === candidateId) {
      setExpandedCandidate(null);
      setExpandedApplication(null);
    } else {
      setExpandedCandidate(candidateId);
      setExpandedApplication(null);
    }
  };

  const toggleApplication = (applicationId: string) => {
    setExpandedApplication(expandedApplication === applicationId ? null : applicationId);
  };

  const statusPillClass = (outcome?: string | null) => {
    if (!outcome) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (outcome === 'accepted') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (outcome === 'rejected') return 'text-red-700 bg-red-50 border-red-200';
    return 'text-slate-700 bg-slate-50 border-slate-200';
  };

  const timelineBadgeClass = (status: TimelineEvent['status']) => {
    if (status === 'completed') return 'bg-green-100 text-green-700';
    if (status === 'failed') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
  };

  const timelineCardClass = (status: TimelineEvent['status']) => {
    if (status === 'completed') return 'bg-green-50 border-green-100';
    if (status === 'failed') return 'bg-red-50 border-red-100';
    return 'bg-white border-slate-200';
  };

  const timelineDotClass = (status: TimelineEvent['status']) => {
    if (status === 'completed') return 'bg-green-100 border-green-500';
    if (status === 'failed') return 'bg-red-100 border-red-500';
    return 'bg-slate-100 border-slate-400';
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'N/A';
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

  const buildFullTimeline = (app: CandidateApplication): TimelineEvent[] => {
    const actualMap = new Map(app.timeline.map((event) => [event.eventType, event]));
    const hasRejectedEvent = app.timeline.some((event) => event.eventType === 'rejected');

    let failedStepKey: TimelineEvent['eventType'] | null = null;

    if (hasRejectedEvent) {
      const quizEvent = app.timeline.find((event) => event.eventType === 'quiz_completed');
      const failedAtQuiz = quizEvent?.status === 'failed';

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

      if (failedAtQuiz) {
        failedStepKey = 'quiz_completed';
      } else if (hasSelected) {
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

  const filteredCandidates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return candidates
      .map((candidate) => {
        const matchesCandidateName =
          !query || candidate.candidate_name.toLowerCase().includes(query);

        return {
          ...candidate,
          applications: matchesCandidateName ? candidate.applications : [],
        };
      })
      .filter((candidate) => candidate.applications.length > 0);
  }, [candidates, searchTerm]);

  const totalCandidates = filteredCandidates.length;
  const totalApplications = filteredCandidates.reduce(
    (sum, candidate) => sum + candidate.applications.length,
    0
  );
  const activeApplications = filteredCandidates.reduce(
    (sum, candidate) =>
      sum +
      candidate.applications.filter(
        (app) =>
          !app.finalOutcome && app.currentStatus.toLowerCase() !== 'quiz failed'
      ).length,
    0
  );
  const acceptedApplications = filteredCandidates.reduce(
    (sum, candidate) =>
      sum + candidate.applications.filter((app) => app.finalOutcome === 'accepted').length,
    0
  );
  const rejectedApplications = filteredCandidates.reduce(
  (sum, candidate) =>
    sum + candidate.applications.filter((app) => app.finalOutcome === 'rejected').length,
  0
);

  if (loading) {
    return (
      <InterviewerDashboardSkeleton>
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading candidate activity log...</p>
        </div>
      </InterviewerDashboardSkeleton>
    );
  }

  if (error) {
    return (
      <InterviewerDashboardSkeleton>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white border border-red-200 rounded-3xl p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={40} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load candidate activity log
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </InterviewerDashboardSkeleton>
    );
  }

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(to_bottom_right,_#f8fafc,_#ffffff,_#eff6ff)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          <div className="relative overflow-hidden rounded-[34px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-slate-200">
                  <Sparkles className="w-4 h-4" />
                  Activity Overview
                </div>
                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold">
                  Candidate Activity Log
                </h1>
                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Review every candidate, their applications, and each hiring stage in one place.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 min-w-full lg:min-w-[420px]">
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Candidates</p>
                  <h3 className="text-3xl font-bold mt-2">{totalCandidates}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Applications</p>
                  <h3 className="text-3xl font-bold mt-2">{totalApplications}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Active</p>
                  <h3 className="text-3xl font-bold mt-2">{activeApplications}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Accepted</p>
                  <h3 className="text-3xl font-bold mt-2">{acceptedApplications}</h3>
                </div>
                 <div className="rounded-3xl bg-red-500/20 border border-red-400/30 p-4">
    <p className="text-red-200 text-sm">Rejected</p>
    <h3 className="text-3xl font-bold mt-2 text-white">{rejectedApplications}</h3>
  </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Search candidates</h2>
                  <p className="text-sm text-slate-500">Search by candidate name only</p>
                </div>
              </div>

              <div className="relative w-full xl:w-[420px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search candidate name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>
            </div>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="rounded-[30px] border border-slate-200/70 bg-white p-12 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 mb-5">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No matching candidates found</h3>
              <p className="text-sm text-slate-500">
                Try another candidate name.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredCandidates.map((candidate, index) => {
                const theme = avatarThemes[index % avatarThemes.length];

                return (
                  <div
                    key={candidate.candidate_id}
                    className="rounded-[30px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] overflow-hidden"
                  >
                    <div
                      onClick={() => toggleCandidate(candidate.candidate_id)}
                      className="cursor-pointer px-5 sm:px-6 py-5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.avatar} flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md`}
                          >
                            {candidate.candidate_name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-slate-900 truncate">
                              {candidate.candidate_name}
                            </h3>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 border border-slate-200">
                                <Mail size={14} />
                                {candidate.candidate_email || 'No email'}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 border border-slate-200">
                                <Phone size={14} />
                                {candidate.candidate_phone || 'No phone'}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border ${theme.chip}`}
                              >
                                <FolderOpen size={14} />
                                {candidate.applications.length} application
                                {candidate.applications.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 mt-1">
                          {expandedCandidate === candidate.candidate_id ? (
                            <ChevronDown size={22} className="text-slate-500" />
                          ) : (
                            <ChevronRight size={22} className="text-slate-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedCandidate === candidate.candidate_id && (
                      <div className={`border-t border-slate-200 ${theme.soft} px-4 sm:px-6 py-5 space-y-4`}>
                        {candidate.applications.map((app) => {
                          const fullTimeline = buildFullTimeline(app);

                          return (
                            <div
                              key={app.id}
                              className="rounded-[24px] border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div
                                onClick={() => toggleApplication(app.id)}
                                className="cursor-pointer px-5 py-4 hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                                      <div className="min-w-0">
                                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 truncate">
                                          <Briefcase size={16} className="text-blue-600 shrink-0" />
                                          <span className="truncate">{app.role}</span>
                                        </h4>

                                        <div className="mt-2 flex flex-wrap gap-2">
                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 border border-slate-200">
                                            <Building2 size={14} />
                                            {app.company}
                                          </span>
                                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 border border-slate-200">
                                            Applied on {formatDateOnly(app.appliedAt)}
                                          </span>
                                        </div>
                                      </div>

                                      <span
                                        className={`inline-flex items-center w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusPillClass(
                                          app.finalOutcome
                                        )}`}
                                      >
                                        {app.currentStatus}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="shrink-0 mt-1">
                                    {expandedApplication === app.id ? (
                                      <ChevronDown size={18} className="text-slate-500" />
                                    ) : (
                                      <ChevronRight size={18} className="text-slate-500" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {expandedApplication === app.id && (
                                <div className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 sm:px-5 py-5">
                                  <div className="relative ml-1 sm:ml-4">
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

                                    <div className="space-y-7">
                                      {fullTimeline.map((event, stepIndex) => (
                                        <div key={event.id} className="relative flex items-start">
                                          <div
                                            className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 shadow-sm ${timelineDotClass(
                                              event.status
                                            )}`}
                                          >
                                            {event.status === 'completed' ? (
                                              <CheckCircle2 size={16} className="text-green-600" />
                                            ) : event.status === 'failed' ? (
                                              <XCircle size={16} className="text-red-600" />
                                            ) : (
                                              <Clock3 size={16} className="text-slate-500" />
                                            )}
                                          </div>

                                          <div className="ml-12 w-full">
                                            <div
                                              className={`rounded-2xl border px-4 py-4 ${timelineCardClass(
                                                event.status
                                              )}`}
                                            >
                                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                <div className="min-w-0">
                                                  <h4 className="font-semibold text-slate-900">
                                                    {stepIndex + 1}. {event.title}
                                                  </h4>

                                                  {event.description && (
                                                    <p className="text-sm text-slate-600 mt-1">
                                                      {event.description}
                                                    </p>
                                                  )}
                                                </div>

                                                <span
                                                  className={`inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${timelineBadgeClass(
                                                    event.status
                                                  )}`}
                                                >
                                                  {event.status === 'completed'
                                                    ? 'Completed'
                                                    : event.status === 'failed'
                                                    ? 'Failed'
                                                    : 'Pending'}
                                                </span>
                                              </div>

                                              <p className="text-xs text-slate-500 mt-3">
                                                {event.status === 'pending'
                                                  ? 'Waiting for this stage'
                                                  : event.status === 'failed'
                                                  ? 'This stage was not completed successfully'
                                                  : formatDateTime(event.timestamp)}
                                              </p>
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
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default CandidateActivityLog;
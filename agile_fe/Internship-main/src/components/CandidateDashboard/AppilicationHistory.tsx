import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock3,
  XCircle,
  ChevronDown,
  ChevronRight,
  Building2,
  Search,
  Sparkles,
  Layers3,
  Trophy,
  CircleDashed,
  CalendarDays,
} from 'lucide-react';
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

const ApplicationHistory: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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

  const toggleExpand = (appId: string) => {
    setExpandedApp((prev) => (prev === appId ? null : appId));
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Waiting for this stage';
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

  const statusPillClass = (outcome?: string | null) => {
    if (!outcome) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (outcome === 'accepted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (outcome === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    if (outcome === 'withdrawn') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const timelineBadgeClass = (status: TimelineEvent['status']) => {
    if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
    if (status === 'failed') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
  };

  const timelineCardClass = (status: TimelineEvent['status']) => {
    if (status === 'completed') return 'border-emerald-100 bg-emerald-50';
    if (status === 'failed') return 'border-red-100 bg-red-50';
    return 'border-slate-200 bg-white';
  };

  const timelineDotClass = (status: TimelineEvent['status']) => {
    if (status === 'completed') return 'bg-emerald-100 border-emerald-500';
    if (status === 'failed') return 'bg-red-100 border-red-500';
    return 'bg-slate-100 border-slate-400';
  };

  const getTimelineIcon = (status: TimelineEvent['status']) => {
    if (status === 'completed') {
      return <CheckCircle2 size={16} className="text-emerald-600" />;
    }
    if (status === 'failed') {
      return <XCircle size={16} className="text-red-600" />;
    }
    return <Clock3 size={16} className="text-slate-500" />;
  };

  const filteredApps = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return applications.filter((app) => {
      const matchesFilter =
        filterStatus === 'all' ||
        (filterStatus === 'accepted' && app.finalOutcome === 'accepted') ||
        (filterStatus === 'rejected' && app.finalOutcome === 'rejected') ||
        (filterStatus === 'withdrawn' && app.finalOutcome === 'withdrawn') ||
        (!app.finalOutcome && filterStatus === 'active');

      const searchable = [
        app.company,
        app.role,
        app.currentStatus,
        app.finalOutcome || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [applications, filterStatus, searchTerm]);

  const summary = useMemo(() => {
    return {
      total: filteredApps.length,
      active: filteredApps.filter((app) => !app.finalOutcome).length,
      accepted: filteredApps.filter((app) => app.finalOutcome === 'accepted').length,
      rejected: filteredApps.filter((app) => app.finalOutcome === 'rejected').length,
    };
  }, [filteredApps]);

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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(to_bottom_right,_#f8fafc,_#ffffff,_#eff6ff)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          <div className="relative overflow-hidden rounded-[34px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-slate-200">
                  <Sparkles className="w-4 h-4" />
                  My Internship Journey
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold">
                  Application History
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Track every application, quiz result, interview stage, and final outcome in one place.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 min-w-full lg:min-w-[420px]">
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Applications</p>
                  <h3 className="text-3xl font-bold mt-2">{summary.total}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Active</p>
                  <h3 className="text-3xl font-bold mt-2">{summary.active}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Accepted</p>
                  <h3 className="text-3xl font-bold mt-2">{summary.accepted}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Rejected</p>
                  <h3 className="text-3xl font-bold mt-2">{summary.rejected}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Find your application</h2>
                  <p className="text-sm text-slate-500">Search and filter your applications</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <div className="relative w-full sm:w-[320px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search role, company, status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  aria-label="Filter applications by status"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                >
                  <option value="all">All Applications</option>
                  <option value="active">Active</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>
          </div>

          {filteredApps.length === 0 ? (
            <div className="rounded-[30px] border border-slate-200/70 bg-white p-12 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 mb-5">
                <Briefcase className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No applications found</h3>
              <p className="text-sm text-slate-500">
                Try another search or filter, or start applying to internships.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredApps.map((app, index) => {
                const appInitial = app.company?.charAt(0)?.toUpperCase() || 'A';

                return (
                  <div
                    key={app.id}
                    className="rounded-[30px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] overflow-hidden"
                  >
                    <div
                      onClick={() => toggleExpand(app.id)}
                      className="cursor-pointer px-5 sm:px-6 py-5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md">
                            {appInitial}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="text-lg font-bold text-slate-900 truncate">
                                  {app.role}
                                </h3>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 border border-slate-200">
                                    <Building2 size={14} />
                                    {app.company}
                                  </span>

                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 border border-slate-200">
                                    <CalendarDays size={14} />
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
                        </div>

                        <div className="shrink-0 mt-1">
                          {expandedApp === app.id ? (
                            <ChevronDown size={22} className="text-slate-500" />
                          ) : (
                            <ChevronRight size={22} className="text-slate-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedApp === app.id && (
                      <div className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 sm:px-6 py-5">
                        <div className="relative ml-1 sm:ml-4">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

                          <div className="space-y-7">
                            {app.timeline.map((event, stepIndex) => (
                              <div key={event.id} className="relative flex items-start">
                                <div
                                  className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 shadow-sm ${timelineDotClass(
                                    event.status
                                  )}`}
                                >
                                  {getTimelineIcon(event.status)}
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

                                    {event.status === 'failed' && app.feedback && (
                                      <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                                        <p className="text-sm font-semibold text-red-800 mb-1">
                                          Feedback from recruiter
                                        </p>
                                        <p className="text-sm text-slate-700">{app.feedback}</p>
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
              })}
            </div>
          )}
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default ApplicationHistory;
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Calendar,
  Video,
  Users,
  Award,
  Save,
  Pencil,
  Trash2,
  Send,
  AlertCircle,
  Loader2,
  User,
  Clock,
  Sparkles,
  CheckCircle2,
  Link as LinkIcon,
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../skeleton/InterviewerDashboardSkeleton';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const baseApi = import.meta.env.VITE_BASE_API;

const api = axios.create({
  baseURL: baseApi,
  headers: { 'Content-Type': 'application/json' },
});

interface Internship {
  id: number;
  candidate_name: string;
  internship_role: string;
  test_score?: number;
  test_passed?: boolean;
  test_completed?: boolean;
  interview_date?: string;
  interview_time?: string;
  interview_zoom?: string;
  interview_id?: number;
}

interface EditStateItem {
  date: string;
  time: string;
  zoom: string;
  isEditing: boolean;
  interviewId?: number;
}

const InterviewerF2F: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [internships, setInternships] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<number, EditStateItem>>({});
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Please log in to access this page.');
      navigate('/login');
      return null;
    }
    return { Authorization: `Token ${token}` };
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);

    const headers = getAuthHeaders();
    if (!headers) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/interviewer/passed-candidates/', { headers });
      const data = response.data;

      if (Array.isArray(data)) {
        setInternships(data);

        const newEditState: Record<number, EditStateItem> = {};
        data.forEach((app: Internship) => {
          newEditState[app.id] = {
            date: app.interview_date || '',
            time: app.interview_time || '',
            zoom: app.interview_zoom || '',
            isEditing: false,
            interviewId: app.interview_id || undefined,
          };
        });
        setEditState(newEditState);
      } else {
        setInternships([]);
        console.error('Unexpected API structure:', data);
      }
    } catch (err: any) {
      console.error('API Error:', err.response || err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('access_token');
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Unauthorized: Only employees can view interviews.');
        navigate('/login');
      } else {
        setError('Failed to load qualified candidates. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDateChange = (id: number, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        date: value,
      },
    }));
  };

  const handleTimeChange = (id: number, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        time: value,
      },
    }));
  };

  const handleZoomChange = (id: number, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        zoom: value,
      },
    }));
  };

  const updateInterviewById = async (id: number) => {
    if (loadingIds.has(id)) return;

    setLoadingIds((prev) => new Set([...prev, id]));

    const data = editState[id];
    if (!data?.interviewId) {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    if (!data.date || !data.zoom) {
      alert('Date and Zoom URL are required.');
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    try {
      await api.put(
        `/interviewer/interview/update/${data.interviewId}/`,
        {
          date: data.date,
          time: data.time,
          zoom: data.zoom,
        },
        { headers }
      );
      alert('Interview updated successfully.');
      await fetchApplications();
    } catch (e: any) {
      console.error(e);
      alert('Failed to update interview.');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const toggleEdit = async (id: number) => {
    const isEditing = editState[id]?.isEditing || false;

    if (isEditing) {
      await updateInterviewById(id);
    }

    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isEditing: !isEditing,
      },
    }));
  };

  const sendInterview = async (app: Internship) => {
    if (loadingIds.has(app.id)) return;

    setLoadingIds((prev) => new Set([...prev, app.id]));

    const data = editState[app.id];
    if (!data?.date || !data?.zoom) {
      alert('Please provide both date and Zoom URL before sending.');
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(app.id);
        return next;
      });
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(app.id);
        return next;
      });
      return;
    }

    try {
      if (data.interviewId) {
        await api.put(
          `/interviewer/interview/update/${data.interviewId}/`,
          {
            date: data.date,
            time: data.time,
            zoom: data.zoom,
          },
          { headers }
        );
        alert('Interview updated successfully.');
      } else {
        await api.post(
          '/interviewer/interview/create/',
          {
            application_id: app.id,
            date: data.date,
            time: data.time,
            zoom: data.zoom,
          },
          { headers }
        );
        alert('Interview scheduled successfully.');
      }

      await fetchApplications();
    } catch (e: any) {
      console.error(e);
      alert('Failed to schedule/update interview. Please try again.');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(app.id);
        return next;
      });
    }
  };

  const deleteInterview = async (app: Internship) => {
    const id = app.id;
    if (loadingIds.has(id)) return;

    setLoadingIds((prev) => new Set([...prev, id]));

    const interviewId = editState[id]?.interviewId;
    if (!interviewId) {
      alert('Cannot delete interview before it is scheduled.');
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    try {
      await api.delete(`/interviewer/interview/delete/${interviewId}/`, { headers });
      alert('Interview deleted successfully.');
      await fetchApplications();
    } catch (e: any) {
      console.error(e);
      alert('Failed to delete interview.');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const filteredInternships = useMemo(() => {
    return [...internships]
      .filter((internship) => {
        const candidateName = internship.candidate_name ?? '';
        const internshipRole = internship.internship_role ?? '';

        return (
          candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          internshipRole.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
      .sort((a, b) => b.id - a.id);
  }, [internships, searchTerm]);

  const formatTo12Hour = (time24?: string): string => {
    if (!time24) return '—';
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const stats = {
    total: filteredInternships.length,
    scheduled: filteredInternships.filter((i) => !!editState[i.id]?.interviewId).length,
    unscheduled: filteredInternships.filter((i) => !editState[i.id]?.interviewId).length,
    outstanding: filteredInternships.filter((i) => (i.test_score || 0) >= 90).length,
  };
const getScoreBadge = (score?: number) => {
  const safeScore = Math.round(score || 0);

  let colorClass = 'bg-amber-100 text-amber-700 border-amber-200';

  if (safeScore >= 90) {
    colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
  } else if (safeScore >= 80) {
    colorClass = 'bg-blue-100 text-blue-700 border-blue-200';
  }

  return (
   <span className={`inline-flex items-center justify-start gap-1.5 min-w-[70px] rounded-full px-2 py-1 text-xs font-semibold border whitespace-nowrap ${colorClass}`}>
      <Award className="w-3.5 h-3.5" />
      {safeScore}%
    </span>
  );
};

  const getScheduleBadge = (id: number) => {
    const hasInterview = !!editState[id]?.interviewId;

    if (hasInterview) {
      return (
      <span className="inline-flex items-center justify-start gap-1.5 min-w-[130px] rounded-full bg-green-100 text-green-700 px-2 py-1 text-xs font-semibold border border-green-200 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Scheduled
        </span>
      );
    }

    return (
     <span className="inline-flex items-center justify-start gap-1.5 min-w-[130px] rounded-full bg-amber-100 text-amber-700 px-2 py-1 text-xs font-semibold border border-amber-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5" />
        Not Scheduled
      </span>
    );
  };

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.18),transparent_32%)]" />

            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200">
                  <Sparkles className="w-4 h-4" />
                  Face-to-face interview scheduling
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Interviewer F2F Workspace
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Schedule, edit, and manage face-to-face interviews for candidates who passed their assessments.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-full xl:min-w-[720px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Qualified</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
                  <p className="text-xs text-slate-300 mt-1">Passed candidates</p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Scheduled</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.scheduled}</h3>
                  <p className="text-xs text-slate-300 mt-1">Interview created</p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Pending</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.unscheduled}</h3>
                  <p className="text-xs text-slate-300 mt-1">Need scheduling</p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Outstanding</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.outstanding}</h3>
                  <p className="text-xs text-slate-300 mt-1">Score 90% and above</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
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

          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Qualified Candidate List</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Search candidates and manage face-to-face interview scheduling.
                </p>
              </div>

              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by candidate or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm sm:text-base outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">
            {isLoading ? (
              <div className="p-10 sm:p-14 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="text-slate-600">Loading qualified candidates...</p>
              </div>
            ) : filteredInternships.length === 0 ? (
              <div className="p-10 sm:p-14 text-center">
                <Users className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No qualified candidates found
                </h3>
                <p className="text-slate-500 text-sm sm:text-base">
                  {searchTerm
                    ? 'No candidates match your search criteria.'
                    : 'There are no candidates who have passed their assessments at the moment.'}
                </p>
              </div>
            ) : (
              <>
                <div className="block lg:hidden bg-slate-50/70 p-3 sm:p-4">
                  <div className="space-y-4">
                    {filteredInternships.map((internship) => {
                      const rowState = editState[internship.id];
                      const isEditing = rowState?.isEditing || false;
                      const isBusy = loadingIds.has(internship.id);

                      return (
                        <div
                          key={internship.id}
                          className="rounded-[28px] border border-slate-200 bg-white shadow-sm p-4 sm:p-5 space-y-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-11 w-11 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                                <User className="h-5 w-5 text-indigo-600" />
                              </div>

                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-indigo-700 truncate">
                                  {internship.candidate_name}
                                </div>
                                <div className="text-xs text-violet-600 truncate mt-1 font-medium">
                                  {internship.internship_role}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {getScoreBadge(internship.test_score)}
                            {getScheduleBadge(internship.id)}
                          </div>

                          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Interview Date
                              </label>
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={rowState?.date || ''}
                                  onChange={(e) => handleDateChange(internship.id, e.target.value)}
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                                />
                              ) : (
                                <div className="inline-flex items-center gap-2 text-sm text-cyan-700">
                                  <Calendar className="w-4 h-4 text-cyan-500 shrink-0" />
                                  <span className="font-medium">
                                    {rowState?.date ? formatDate(rowState.date) : 'Select a date'}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Interview Time
                              </label>
                              {isEditing ? (
                                <input
                                  type="time"
                                  value={rowState?.time || ''}
                                  onChange={(e) => handleTimeChange(internship.id, e.target.value)}
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                                />
                              ) : (
                                <div className="inline-flex items-center gap-2 text-sm text-amber-700 whitespace-nowrap">
                                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                  <span className="font-medium">
                                    {rowState?.time ? formatTo12Hour(rowState.time) : 'Select a time'}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Zoom Link
                              </label>
                              {isEditing ? (
                                <input
                                  type="url"
                                  value={rowState?.zoom || ''}
                                  onChange={(e) => handleZoomChange(internship.id, e.target.value)}
                                  placeholder="Paste Zoom meeting URL"
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                                />
                              ) : rowState?.zoom ? (
                                <a
                                  href={rowState.zoom}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline break-all"
                                >
                                  <LinkIcon className="w-4 h-4 shrink-0" />
                                  {rowState.zoom}
                                </a>
                              ) : (
                                <span className="text-sm text-slate-400 italic">Add Zoom link</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            {!rowState?.interviewId && (
                              <button
                                onClick={() => sendInterview(internship)}
                                disabled={isBusy || !rowState?.date || !rowState?.zoom}
                                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white h-11 w-11 transition shrink-0"
                                title="Send"
                              >
                                {isBusy ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            <button
                              onClick={() => toggleEdit(internship.id)}
                              disabled={isBusy}
                              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white h-11 w-11 transition shrink-0"
                              title={isEditing ? 'Save' : 'Edit'}
                            >
                              {isBusy ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : isEditing ? (
                                <Save className="w-4 h-4" />
                              ) : (
                                <Pencil className="w-4 h-4" />
                              )}
                            </button>

                            {rowState?.interviewId && (
                              <button
                                onClick={() => deleteInterview(internship)}
                                disabled={isBusy}
                                className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white h-11 w-11 transition shrink-0"
                                title="Delete"
                              >
                                {isBusy ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full table-fixed">
                   <thead className="bg-slate-50 border-b border-slate-200">
  <tr>
    <th className="w-[18%] px-3 py-3 text-left text-xs font-bold text-slate-600">Candidate</th>
    <th className="w-[14%] px-3 py-3 text-left text-xs font-bold text-slate-600">Role</th>
    <th className="w-[10%] px-3 py-3 text-left text-xs font-bold text-slate-600">Score</th>
    <th className="w-[12%] px-3 py-3 text-left text-xs font-bold text-slate-600">Status</th>
    <th className="w-[14%] px-3 py-3 text-left text-xs font-bold text-slate-600">Date</th>
    <th className="w-[12%] px-3 py-3 text-left text-xs font-bold text-slate-600">Time</th>
    <th className="w-[10%] px-3 py-3 text-left text-xs font-bold text-slate-600">Zoom</th>
    <th className="w-[10%] px-3 py-3 text-left text-xs font-bold text-slate-600">Actions</th>
  </tr>
</thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredInternships.map((internship) => {
                        const rowState = editState[internship.id];
                        const isEditing = rowState?.isEditing || false;
                        const isBusy = loadingIds.has(internship.id);

                        return (
                          <tr
                            key={internship.id}
                            className="hover:bg-indigo-50/40 transition-colors align-middle"
                          >
                            <td className="px-3 py-3 align-middle">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                                  <User className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-indigo-700 truncate">
                                    {internship.candidate_name}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-3 align-middle">
                              <div className="text-sm font-medium text-violet-700 whitespace-nowrap truncate">
                                {internship.internship_role}
                              </div>
                            </td>

                            <td className="px-3 py-3 align-middle overflow-hidden">
                              <div className="max-w-full overflow-hidden">{getScoreBadge(internship.test_score)}</div>
                            </td>

                           <td className="px-3 py-3 align-middle whitespace-nowrap">
  {getScheduleBadge(internship.id)}
</td>

                            <td className="px-3 py-3 align-middle">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={rowState?.date || ''}
                                  onChange={(e) => handleDateChange(internship.id, e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                                />
                              ) : (
                                <div className="inline-flex items-center gap-2 text-sm text-cyan-700 whitespace-nowrap max-w-full">
                                  <Calendar className="w-4 h-4 text-cyan-500 shrink-0" />
                                  <span className="font-medium truncate">
                                    {rowState?.date ? formatDate(rowState.date) : 'Select a date'}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="px-3 py-3 align-middle">
                              {isEditing ? (
                                <input
                                  type="time"
                                  value={rowState?.time || ''}
                                  onChange={(e) => handleTimeChange(internship.id, e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                                />
                              ) : (
                                <div className="inline-flex items-center gap-2 text-sm text-amber-700 whitespace-nowrap max-w-full">
                                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                  <span className="font-medium truncate">
                                    {rowState?.time ? formatTo12Hour(rowState.time) : 'Select a time'}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="px-3 py-3 align-middle">
                              {isEditing ? (
                                <input
                                  type="url"
                                  value={rowState?.zoom || ''}
                                  onChange={(e) => handleZoomChange(internship.id, e.target.value)}
                                  placeholder="Zoom URL"
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                                />
                              ) : rowState?.zoom ? (
                                <a
                                  href={rowState.zoom}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline truncate max-w-full"
                                  title={rowState.zoom}
                                >
                                  <Video className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{rowState.zoom}</span>
                                </a>
                              ) : (
                                <span className="text-sm text-slate-400 italic">Add Zoom link</span>
                              )}
                            </td>

                            <td className="px-3 py-3 align-middle">
                              <div className="flex items-center gap-1 whitespace-nowrap">
                                {!rowState?.interviewId && (
                                  <button
                                    onClick={() => sendInterview(internship)}
                                    disabled={isBusy || !rowState?.date || !rowState?.zoom}
                                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white h-10 w-10 transition shrink-0"
                                    title="Send"
                                  >
                                    {isBusy ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                  </button>
                                )}

                                <button
                                  onClick={() => toggleEdit(internship.id)}
                                  disabled={isBusy}
                                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white h-10 w-10 transition shrink-0"
                                  title={isEditing ? 'Save' : 'Edit'}
                                >
                                  {isBusy ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : isEditing ? (
                                    <Save className="w-4 h-4" />
                                  ) : (
                                    <Pencil className="w-4 h-4" />
                                  )}
                                </button>

                                {rowState?.interviewId && (
                                  <button
                                    onClick={() => deleteInterview(internship)}
                                    disabled={isBusy}
                                    className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white h-10 w-10 transition shrink-0"
                                    title="Delete"
                                  >
                                    {isBusy ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {!isLoading && filteredInternships.length > 0 && (
            <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">Candidate Summary</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Quick overview of the current qualified candidate pool.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{filteredInternships.length}</p>
                  <p className="text-sm text-slate-600 mt-1">Total Qualified</p>
                </div>

                <div className="rounded-3xl bg-blue-50 border border-blue-100 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredInternships.filter((i) => (i.test_score || 0) >= 90).length}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Outstanding (≥90%)</p>
                </div>

                <div className="rounded-3xl bg-violet-50 border border-violet-100 p-4 text-center">
                  <p className="text-2xl font-bold text-violet-600">
                    {filteredInternships.filter((i) => (i.test_score || 0) >= 80 && (i.test_score || 0) < 90).length}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Excellent (80–89%)</p>
                </div>

                <div className="rounded-3xl bg-amber-50 border border-amber-100 p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {filteredInternships.filter((i) => (i.test_score || 0) >= 65 && (i.test_score || 0) < 80).length}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Good (65–79%)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default InterviewerF2F;
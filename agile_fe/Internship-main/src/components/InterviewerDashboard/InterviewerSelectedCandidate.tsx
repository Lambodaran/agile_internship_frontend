import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Award,
  AlertCircle,
  Check,
  X,
  Sparkles,
  Loader2,
  ChevronDown,
  PencilLine,
  User,
  Briefcase,
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../skeleton/InterviewerDashboardSkeleton';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const baseApi = import.meta.env.VITE_BASE_API;

const api = axios.create({
  baseURL: baseApi,
  headers: { 'Content-Type': 'application/json' },
});

interface Candidate {
  id: number;
  candidate_name: string;
  internship_role: string;
  test_score?: number;
  interview_id?: number;
  interview_date?: string;
  interview_time?: string;
  interview_zoom?: string;
  attended_meeting?: boolean | null;
  is_selected?: boolean | null;
}

type ConfirmModalState =
  | {
      open: false;
    }
  | {
      open: true;
      type: 'attendance' | 'selection';
      candidate: Candidate;
      field: 'attended_meeting' | 'is_selected';
      value: boolean;
      title: string;
      description: string;
      confirmText: string;
      tone: 'green' | 'red' | 'blue';
    };

const InterviewerSelectedCandidate: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({ open: false });

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

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return '—';
    try {
      const [hourStr, minute] = timeStr.split(':');
      const hour = parseInt(hourStr, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minute.padStart(2, '0')} ${ampm}`;
    } catch {
      return '—';
    }
  };

  const fetchCandidates = async () => {
    setIsLoading(true);
    setError(null);

    const headers = getAuthHeaders();
    if (!headers) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get('/interviewer/post-interview-decisions/', { headers });
      if (Array.isArray(res.data)) {
        setCandidates(res.data);
      } else {
        setCandidates([]);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load candidates. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const updateStatus = async (
    candidate: Candidate,
    field: 'attended_meeting' | 'is_selected',
    value: boolean | null
  ) => {
    if (!candidate.interview_id) return;
    if (savingIds.has(candidate.id)) return;

    const tempId = candidate.id;
    const oldValue = candidate[field];

    setSavingIds((prev) => new Set([...prev, tempId]));

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidate.id ? { ...c, [field]: value } : c
      )
    );

    const headers = getAuthHeaders();
    if (!headers) {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      return;
    }

    try {
      await api.patch(
        `/interviewer/interview/update-status/${candidate.interview_id}/`,
        { [field]: value },
        { headers }
      );
    } catch (err) {
      console.error(err);
      setError('Failed to save status. Reverting...');
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidate.id ? { ...c, [field]: oldValue } : c
        )
      );
      fetchCandidates();
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  };

  const openAttendanceConfirm = (candidate: Candidate, value: boolean) => {
    if (!candidate.interview_id) return;
    if (candidate.attended_meeting !== null) return;
    if (savingIds.has(candidate.id)) return;

    setConfirmModal({
      open: true,
      type: 'attendance',
      candidate,
      field: 'attended_meeting',
      value,
      title: value ? 'Confirm Attendance' : 'Confirm Absence',
      description: value
        ? `Are you sure ${candidate.candidate_name} attended the interview?`
        : `Are you sure ${candidate.candidate_name} was absent for the interview?`,
      confirmText: value ? 'Yes, Mark Attended' : 'Yes, Mark Absent',
      tone: value ? 'green' : 'red',
    });
  };

  const openSelectionConfirm = (candidate: Candidate, value: boolean) => {
    if (!candidate.interview_id) return;
    if (savingIds.has(candidate.id)) return;
    if (candidate.attended_meeting !== true) return;

    setConfirmModal({
      open: true,
      type: 'selection',
      candidate,
      field: 'is_selected',
      value,
      title: value ? 'Confirm Selection' : 'Confirm Rejection',
      description: value
        ? `Do you want to mark ${candidate.candidate_name} as selected?`
        : `Do you want to mark ${candidate.candidate_name} as not selected?`,
      confirmText: value ? 'Save as Selected' : 'Save as Rejected',
      tone: value ? 'green' : 'red',
    });
  };

  const handleConfirmModal = async () => {
    if (!confirmModal.open) return;
    await updateStatus(confirmModal.candidate, confirmModal.field, confirmModal.value);
    setConfirmModal({ open: false });
  };

  const closeConfirmModal = () => {
    if (confirmModal.open && savingIds.has(confirmModal.candidate.id)) return;
    setConfirmModal({ open: false });
  };

  const filteredCandidates = useMemo(() => {
  return [...candidates]
    .filter((c) =>
      c.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.internship_role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.id - a.id);
}, [candidates, searchTerm]);

  const stats = {
    total: candidates.length,
    pendingAttendance: candidates.filter((c) => c.attended_meeting == null).length,
    attended: candidates.filter((c) => c.attended_meeting === true).length,
    selected: candidates.filter((c) => c.is_selected === true).length,
  };

  const getAttendanceBadge = (value: boolean | null | undefined) => {
    if (value === true) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 px-3 py-1.5 text-xs font-semibold border border-green-200">
          <CheckCircle className="w-3.5 h-3.5" />
          Attended
        </span>
      );
    }
    if (value === false) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 px-3 py-1.5 text-xs font-semibold border border-red-200">
          <XCircle className="w-3.5 h-3.5" />
          Absent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1.5 text-xs font-semibold border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        Pending
      </span>
    );
  };

  const getSelectionBadge = (value: boolean | null | undefined) => {
    if (value === true) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 px-3 py-1.5 text-xs font-semibold border border-green-200">
          <CheckCircle className="w-3.5 h-3.5" />
          Selected
        </span>
      );
    }
    if (value === false) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 px-3 py-1.5 text-xs font-semibold border border-red-200">
          <XCircle className="w-3.5 h-3.5" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 px-3 py-1.5 text-xs font-semibold border border-slate-200">
        <Clock className="w-3.5 h-3.5" />
        Pending
      </span>
    );
  };

  const confirmButtonClass = (tone: 'green' | 'red' | 'blue') => {
    if (tone === 'green') return 'bg-green-600 hover:bg-green-700';
    if (tone === 'red') return 'bg-red-600 hover:bg-red-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />

            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200">
                  <Sparkles className="w-4 h-4" />
                  Candidate decision workspace
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Post-Interview Decisions
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Review attendance and finalize candidate decisions in one place.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-full xl:min-w-[720px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Total</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
                  <p className="text-xs text-slate-300 mt-1">All candidates</p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Pending Attendance</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.pendingAttendance}</h3>
                  <p className="text-xs text-slate-300 mt-1">Awaiting confirmation</p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Attended</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.attended}</h3>
                  <p className="text-xs text-slate-300 mt-1">Confirmed present</p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Selected</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.selected}</h3>
                  <p className="text-xs text-slate-300 mt-1">Approved candidates</p>
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
                <h2 className="text-lg font-bold text-slate-900">Candidate Table</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Confirm attendance, then finalize selection decisions.
                </p>
              </div>

              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by candidate or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm sm:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">
            {isLoading ? (
              <div className="p-10 sm:p-14 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600">Loading candidates...</p>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="p-10 sm:p-14 text-center">
                <User className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No candidates found
                </h3>
                <p className="text-slate-500 text-sm sm:text-base">
                  Try adjusting your search or wait for interview entries to appear.
                </p>
              </div>
            ) : (
              <>
                <div className="block lg:hidden divide-y divide-slate-100">
                  {filteredCandidates.map((c) => {
                    const isSaving = savingIds.has(c.id);
                    const selectionEditable = c.attended_meeting === true;

                    return (
                      <div key={c.id} className="p-4 sm:p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-11 w-11 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>

                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-blue-700 truncate">
                                {c.candidate_name}
                              </div>
                              <div className="text-xs text-violet-600 truncate mt-1 font-medium">
                                {c.internship_role}
                              </div>
                            </div>
                          </div>

                          {typeof c.test_score === 'number' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-700 px-3 py-1.5 text-xs font-semibold border border-blue-200">
                              <Award className="w-3.5 h-3.5" />
                              {Math.round(c.test_score)}%
                            </span>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                              Interview Schedule
                            </p>
                            <div className="flex flex-col gap-2 text-sm">
                              <div className="inline-flex items-center gap-2 text-cyan-700">
                                <Calendar className="w-4 h-4 text-cyan-500 shrink-0" />
                                <span className="font-medium">{formatDate(c.interview_date)}</span>
                              </div>
                              <div className="inline-flex items-center gap-2 text-amber-700">
                                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                <span className="font-medium">{formatTime(c.interview_time)}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                              Attendance
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                              {getAttendanceBadge(c.attended_meeting)}
                              {c.attended_meeting == null && (
                                <div className="relative">
                                  <select
                                    value="pending"
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === 'attended') openAttendanceConfirm(c, true);
                                      if (value === 'absent') openAttendanceConfirm(c, false);
                                    }}
                                    disabled={isSaving || !c.interview_id}
                                    className="appearance-none min-w-[170px] rounded-2xl px-4 pr-10 py-2.5 text-sm font-medium outline-none transition border border-amber-200 bg-amber-50 text-amber-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="attended">Attended</option>
                                    <option value="absent">Absent</option>
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                              Final Decision
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>{getSelectionBadge(c.is_selected)}</div>

                              {!selectionEditable ? (
                                <div className="text-sm text-slate-400">
                                  {c.attended_meeting === false ? 'Candidate absent' : 'Awaiting attendance'}
                                </div>
                              ) : c.is_selected == null ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openSelectionConfirm(c, true)}
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-4 py-2.5 text-sm font-semibold transition"
                                  >
                                    <Check className="w-4 h-4" />
                                    Select
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openSelectionConfirm(c, false)}
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white px-4 py-2.5 text-sm font-semibold transition"
                                  >
                                    <X className="w-4 h-4" />
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openSelectionConfirm(c, c.is_selected === true ? false : true)
                                  }
                                  disabled={isSaving}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 text-sm font-semibold transition"
                                >
                                  <PencilLine className="w-4 h-4" />
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Candidate
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Interview Schedule
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Attendance
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Final Decision
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredCandidates.map((c) => {
                        const isSaving = savingIds.has(c.id);
                        const selectionEditable = c.attended_meeting === true;

                        return (
                          <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-blue-700">
                                    {c.candidate_name}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="inline-flex items-center gap-2 text-sm font-medium text-violet-700">
                                <Briefcase className="w-4 h-4 text-violet-500" />
                                {c.internship_role}
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              {typeof c.test_score === 'number' ? (
                                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1.5 text-xs font-semibold border border-blue-200">
                                  <Award className="w-3.5 h-3.5" />
                                  {Math.round(c.test_score)}%
                                </span>
                              ) : (
                                <span className="text-slate-500 text-sm">—</span>
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-3 text-sm">
                                <div className="inline-flex items-center gap-2 text-cyan-700">
                                  <Calendar className="w-4 h-4 text-cyan-500 shrink-0" />
                                  <span className="font-medium">{formatDate(c.interview_date)}</span>
                                </div>
                                <div className="inline-flex items-center gap-2 text-amber-700">
                                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                  <span className="font-medium">{formatTime(c.interview_time)}</span>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex flex-col items-start gap-3">
                                {getAttendanceBadge(c.attended_meeting)}

                                {c.attended_meeting == null && (
                                  <div className="relative">
                                    <select
                                      value="pending"
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === 'attended') {
                                          openAttendanceConfirm(c, true);
                                        } else if (value === 'absent') {
                                          openAttendanceConfirm(c, false);
                                        }
                                      }}
                                      disabled={isSaving || !c.interview_id}
                                      className="appearance-none min-w-[170px] rounded-2xl px-4 pr-10 py-2.5 text-sm font-medium outline-none transition border border-amber-200 bg-amber-50 text-amber-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="attended">Attended</option>
                                      <option value="absent">Absent</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center justify-between gap-3">
                                <div>{getSelectionBadge(c.is_selected)}</div>

                                {!selectionEditable ? (
                                  <div className="text-sm text-slate-400">
                                    {c.attended_meeting === false
                                      ? 'Candidate absent'
                                      : 'Awaiting attendance'}
                                  </div>
                                ) : c.is_selected == null ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openSelectionConfirm(c, true)}
                                      disabled={isSaving}
                                      className="inline-flex items-center gap-2 rounded-2xl bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-4 py-2.5 text-sm font-semibold transition"
                                    >
                                      <Check className="w-4 h-4" />
                                      Select
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openSelectionConfirm(c, false)}
                                      disabled={isSaving}
                                      className="inline-flex items-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white px-4 py-2.5 text-sm font-semibold transition"
                                    >
                                      <X className="w-4 h-4" />
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openSelectionConfirm(c, c.is_selected === true ? false : true)
                                    }
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 text-sm font-semibold transition"
                                  >
                                    <PencilLine className="w-4 h-4" />
                                    Edit
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

          {confirmModal.open && (
            <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm p-4">
              <div className="min-h-full flex items-center justify-center">
                <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-4">
                    <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-3 mb-5">
                      <div
                        className={`p-2 rounded-2xl ${
                          confirmModal.tone === 'green'
                            ? 'bg-green-100 text-green-600'
                            : confirmModal.tone === 'red'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {confirmModal.tone === 'green' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : confirmModal.tone === 'red' ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          <AlertCircle className="w-5 h-5" />
                        )}
                      </div>

                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                        {confirmModal.description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                      <button
                        onClick={closeConfirmModal}
                        className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleConfirmModal}
                        className={`px-4 py-3 rounded-2xl text-white font-medium transition ${confirmButtonClass(
                          confirmModal.tone
                        )}`}
                      >
                        {savingIds.has(confirmModal.candidate.id) ? 'Saving...' : confirmModal.confirmText}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default InterviewerSelectedCandidate;
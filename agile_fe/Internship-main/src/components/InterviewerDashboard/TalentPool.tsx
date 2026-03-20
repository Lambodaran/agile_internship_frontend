// src/pages/interviewer/TalentPool.tsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Search,
  Download,
  User,
  Briefcase,
  Users,
  Award,
  AlertCircle,
  Sparkles,
  Filter,
  ClipboardCheck,
  BadgeCheck,
  MessageSquare,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../../components/skeleton/InterviewerDashboardSkeleton';

const baseApi = import.meta.env.VITE_BASE_API;

const api = axios.create({
  baseURL: baseApi,
  headers: { 'Content-Type': 'application/json' },
});

interface TalentPoolCandidate {
  id: number;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  role: string;
  company_name: string;
  applied_at: string | null;
  resume: string | null;
  status: string;
  test_score: number | null;
  test_completed: boolean;
  test_passed: boolean;
  stage: string;
  stage_label: string;
  interview_id: number | null;
  interview_date: string | null;
  interview_time: string | null;
  attended_meeting: boolean | null;
  is_selected: boolean | null;
  can_message: boolean;
  unread_messages: number;
}

interface TalentPoolResponse {
  filters?: {
    roles?: string[];
    stages?: { value: string; label: string }[];
  };
  summary?: {
    total_candidates: number;
    quiz_passed: number;
    interviews_scheduled: number;
    selected_candidates: number;
    average_score: number;
  };
  results: TalentPoolCandidate[];
}

const getStageClass = (stage: string) => {
  switch (stage) {
    case 'selected':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'interviewed':
    case 'interview_scheduled':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'quiz_passed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'quiz_completed':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'accepted':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  gradient,
  subtle,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  subtle: string;
}) => (
  <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className={`w-12 h-12 rounded-2xl ${subtle} flex items-center justify-center shrink-0`}>
        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  </div>
);

const TalentPool: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState<TalentPoolCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TalentPoolResponse | null>(null);

  const fetchTalentPool = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      setError('No access token found. Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<TalentPoolResponse>('/interviewer/talent-pool/', {
        headers: { Authorization: `Token ${token}` },
      });

      const payload = response.data || { results: [] };
      setData(payload);
      setSelectedCandidate(payload.results?.[0] || null);
    } catch (err) {
      console.error('Error fetching talent pool:', err);
      setError('Failed to load talent pool.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalentPool();
  }, []);

  const allCandidates = data?.results || [];
  const summary = data?.summary;

  const roleOptions = useMemo(() => {
    const rolesFromApi = data?.filters?.roles || [];
    if (rolesFromApi.length > 0) return rolesFromApi;
    return Array.from(new Set(allCandidates.map((c) => c.role).filter(Boolean)));
  }, [data, allCandidates]);

  const stageOptions = useMemo(() => {
    const stagesFromApi = data?.filters?.stages || [];
    if (stagesFromApi.length > 0) return stagesFromApi;

    return Array.from(
      new Map(
        allCandidates.map((c) => [c.stage, { value: c.stage, label: c.stage_label }])
      ).values()
    );
  }, [data, allCandidates]);

  const filteredCandidates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return allCandidates.filter((candidate) => {
      const matchesSearch =
        !query ||
        (candidate.candidate_name || '').toLowerCase().includes(query) ||
        (candidate.candidate_email || '').toLowerCase().includes(query) ||
        (candidate.role || '').toLowerCase().includes(query) ||
        (candidate.company_name || '').toLowerCase().includes(query) ||
        (candidate.stage_label || '').toLowerCase().includes(query);

      const matchesRole = selectedRole === 'all' || candidate.role === selectedRole;
      const matchesStage = selectedStage === 'all' || candidate.stage === selectedStage;

      return matchesSearch && matchesRole && matchesStage;
    });
  }, [allCandidates, searchTerm, selectedRole, selectedStage]);

  useEffect(() => {
    if (loading) return;

    if (filteredCandidates.length === 0) {
      setSelectedCandidate(null);
      return;
    }

    setSelectedCandidate((prev) => {
      if (!prev) return filteredCandidates[0];
      const updated = filteredCandidates.find((item) => item.id === prev.id);
      return updated || filteredCandidates[0];
    });
  }, [filteredCandidates, loading]);

  const acceptedCount = useMemo(
    () => allCandidates.filter((c) => c.status === 'accepted').length,
    [allCandidates]
  );

  const quizCompletedCount = useMemo(
    () => allCandidates.filter((c) => c.test_completed).length,
    [allCandidates]
  );

  const messageEnabledCount = useMemo(
    () => allCandidates.filter((c) => c.can_message).length,
    [allCandidates]
  );

  const safeSummary = {
    total_candidates: summary?.total_candidates ?? 0,
    quiz_passed: summary?.quiz_passed ?? 0,
    interviews_scheduled: summary?.interviews_scheduled ?? 0,
    selected_candidates: summary?.selected_candidates ?? 0,
    average_score: summary?.average_score ?? 0,
  };

  const handleExportList = () => {
    const headers = ['Name', 'Email', 'Role', 'Company', 'Applied Date', 'Score', 'Stage'];
    const rows = filteredCandidates.map((c) => [
      c.candidate_name,
      c.candidate_email,
      c.role,
      c.company_name,
      c.applied_at ? new Date(c.applied_at).toLocaleDateString('en-CA') : '',
      c.test_score ?? '',
      c.stage_label,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `talent-pool-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadResume = async (candidate: TalentPoolCandidate) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Please login again.');
      return;
    }

    if (!candidate.resume) {
      alert('Resume not available for this candidate');
      return;
    }

    try {
      const response = await api.get(candidate.resume, {
        headers: { Authorization: `Token ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const safeName = (candidate.candidate_name || 'candidate').replace(/\s+/g, '_');
      const extension =
        candidate.resume.split('.').pop()?.split('?')[0]?.toLowerCase() || 'pdf';

      link.setAttribute('download', `${safeName}_resume.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading resume:', err);
      alert('Failed to download resume.');
    }
  };

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-slate-200">
                  <Sparkles className="w-4 h-4" />
                  Talent Pool
                </div>
                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold">
                  Candidate Talent Pool
                </h1>
                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Review promising candidates, track their current stage, and identify profiles that are message enabled.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 min-w-full lg:min-w-[420px]">
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Candidates</p>
                  <h3 className="text-3xl font-bold mt-2">{safeSummary.total_candidates}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Quiz Passed</p>
                  <h3 className="text-3xl font-bold mt-2">{safeSummary.quiz_passed}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Interviews</p>
                  <h3 className="text-3xl font-bold mt-2">{safeSummary.interviews_scheduled}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Selected</p>
                  <h3 className="text-3xl font-bold mt-2">{safeSummary.selected_candidates}</h3>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title="Application Accepted"
              value={acceptedCount}
              icon={BadgeCheck}
              gradient="from-indigo-500 to-blue-600"
              subtle="bg-indigo-50"
            />
            <StatCard
              title="Quiz Completed"
              value={quizCompletedCount}
              icon={ClipboardCheck}
              gradient="from-violet-500 to-fuchsia-600"
              subtle="bg-violet-50"
            />
            <StatCard
              title="Average Score"
              value={`${safeSummary.average_score}%`}
              icon={Award}
              gradient="from-amber-500 to-orange-500"
              subtle="bg-amber-50"
            />
            <StatCard
              title="Message Enabled"
              value={messageEnabledCount}
              icon={MessageSquare}
              gradient="from-emerald-500 to-teal-600"
              subtle="bg-emerald-50"
            />
          </div>

          <div className="rounded-[32px] border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Filter candidates</span>
              </div>

              <div className="flex flex-wrap gap-3 flex-1 justify-end items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, role, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-11 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="appearance-none min-w-[170px] rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 px-4 pr-10 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  >
                    <option value="all">All Roles</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="appearance-none min-w-[170px] rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 px-4 pr-10 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  >
                    <option value="all">All Stages</option>
                    {stageOptions.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>

                <button
                  onClick={handleExportList}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                >
                  <Download size={16} />
                  Export List
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-5">
            <div className="rounded-[32px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
                <h2 className="text-lg font-bold text-slate-900">Candidate List</h2>
                <p className="text-sm text-slate-500 mt-1">{filteredCandidates.length} candidates found</p>
              </div>

              <div className="overflow-y-auto max-h-[calc(100vh-340px)]">
                {loading ? (
                  <div className="p-10 sm:p-14 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading candidates...</p>
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">No candidates found</h3>
                    <p className="text-sm text-slate-500">Try changing your search or filters</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {filteredCandidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        onClick={() => setSelectedCandidate(candidate)}
                        className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${
                          selectedCandidate?.id === candidate.id
                            ? 'border-blue-200 bg-blue-50 shadow-sm'
                            : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                            {candidate.candidate_name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{candidate.candidate_name}</p>
                                <p className="text-sm text-slate-600 truncate">
                                  {candidate.candidate_email || 'No email available'}
                                </p>
                              </div>

                              <div className="text-right">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold ${
                                    (candidate.test_score ?? 0) >= 80
                                      ? 'bg-green-100 text-green-700'
                                      : (candidate.test_score ?? 0) >= 60
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {candidate.test_score ?? 0}%
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStageClass(
                                  candidate.stage
                                )}`}
                              >
                                {candidate.stage_label}
                              </span>
                              {candidate.can_message && (
                                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                                  Message Enabled
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Briefcase size={12} />
                                <span>{candidate.role}</span>
                              </div>
                              <span className="text-xs text-slate-400 whitespace-nowrap">
                                {candidate.applied_at
                                  ? new Date(candidate.applied_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })
                                  : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:sticky lg:top-24 h-fit">
              {selectedCandidate ? (
                <div className="rounded-[32px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] overflow-hidden">
                  <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 text-white border-b border-white/10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%)]" />
                    <div className="relative flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold shrink-0 border border-white/20">
                        {selectedCandidate.candidate_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold truncate">{selectedCandidate.candidate_name}</h2>
                        <p className="text-sm text-slate-300 truncate">
                          {selectedCandidate.candidate_email || 'No email available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <Award className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-green-600 font-medium">Assessment Score</p>
                            <p className="text-2xl font-bold text-green-700">
                              {selectedCandidate.test_score ?? 0}%
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getStageClass(
                            selectedCandidate.stage
                          )}`}
                        >
                          {selectedCandidate.stage_label}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                        <p className="text-xs text-slate-500">Applied Role</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">
                          {selectedCandidate.role || '-'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                        <p className="text-xs text-slate-500">Company</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">
                          {selectedCandidate.company_name || '-'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                        <p className="text-xs text-slate-500">Applied Date</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">
                          {selectedCandidate.applied_at
                            ? new Date(selectedCandidate.applied_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '-'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">
                          {selectedCandidate.candidate_phone || '-'}
                        </p>
                      </div>
                    </div>

                    {selectedCandidate.interview_date && (
                      <div className="rounded-xl bg-blue-50 p-3 border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium">Interview Information</p>
                        <p className="text-sm text-blue-700 mt-1">
                          {new Date(selectedCandidate.interview_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {selectedCandidate.interview_time ? ` at ${selectedCandidate.interview_time}` : ''}
                        </p>
                      </div>
                    )}

                    <div className="pt-3 space-y-3">
                      {selectedCandidate.can_message && (
                        <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-200">
                          <MessageSquare size={16} />
                          Message Enabled
                          {selectedCandidate.unread_messages > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-indigo-600 text-white px-1.5 text-xs">
                              {selectedCandidate.unread_messages}
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => handleDownloadResume(selectedCandidate)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Download size={16} />
                        Download Resume
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[32px] border border-slate-200/70 bg-white p-10 text-center h-[500px] flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 mb-5">
                    <User className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Candidate Selected</h3>
                  <p className="text-sm text-slate-500 max-w-[220px]">
                    Select a candidate from the list to view profile details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default TalentPool;
// src/pages/interviewer/TalentPool.tsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Mail,
  Download,
  Tag,
  Star,
  Clock,
  User,
  Briefcase,
  MessageSquare,
  ChevronRight,
  Users,
  Award,
  PlusCircle,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../../components/skeleton/InterviewerDashboardSkeleton';
import axios from 'axios';

const baseApi = import.meta.env.VITE_BASE_API;

const api = axios.create({
  baseURL: baseApi,
  headers: { "Content-Type": "application/json" },
});

// ─── Types ────────────────────────────────────────────────
interface Application {
  id: number;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  internship_role: string;
  applied_at: string;
  resume: string | null;
  status: string;
  test_score: number | null;
  test_passed: boolean;
  test_completed: boolean;
  user: number;
  internship: {
    id: number;
    company_name: string;
    internship_role: string;
  };
}

interface PassedCandidate {
  id: number;
  candidate_name: string;
  internship_role: string;
  test_score: number;
  interview_id: number;
  interview_date: string;
  interview_time: string;
  attended_meeting?: boolean;
  is_selected?: boolean;
}

interface InterviewDecision {
  id: number;
  candidate_name: string;
  internship_role: string;
  test_score: number;
  interview_id: number;
  interview_date: string;
  interview_time: string;
  attended_meeting: boolean;
  is_selected: boolean;
}

interface TalentCandidate {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  profilePic?: string;
  appliedRole: string;
  appliedDate: string;
  highestScore: number;
  skills: string[];
  tags: { label: string; color: string }[];
  notes?: string;
  lastContact?: string;
  availability?: string;
  status: 'passed' | 'hired' | 'rejected' | 'pending';
  resume?: string | null;
  interviewDate?: string;
  interviewTime?: string;
}

// ─── Helper Components ─────────────────────────────────────
const getTagColorClasses = (color: string) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    amber: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return colorMap[color] || 'bg-slate-100 text-slate-700 border-slate-200';
};

const getStatusTag = (status: string) => {
  switch(status) {
    case 'passed':
      return { label: 'Passed Quiz', color: 'green' };
    case 'hired':
      return { label: 'Hired', color: 'emerald' };
    case 'rejected':
      return { label: 'Rejected', color: 'red' };
    case 'pending':
      return { label: 'Pending', color: 'amber' };
    default:
      return { label: status, color: 'blue' };
  }
};

// ─── Component ─────────────────────────────────────────────
const TalentPool: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<TalentCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for real data
  const [applications, setApplications] = useState<Application[]>([]);
  const [passedCandidates, setPassedCandidates] = useState<PassedCandidate[]>([]);
  const [interviewDecisions, setInterviewDecisions] = useState<InterviewDecision[]>([]);
  const [talentCandidates, setTalentCandidates] = useState<TalentCandidate[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("No access token found. Please login again.");
      setLoading(false);
      return;
    }

    const fetchTalentData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [
          applicationsResponse,
          passedCandidatesResponse,
          decisionsResponse
        ] = await Promise.all([
          api.get('/interviewer/applications/', {
            headers: { Authorization: `Token ${token}` }
          }),
          api.get('/interviewer/passed-candidates/', {
            headers: { Authorization: `Token ${token}` }
          }),
          api.get('/interviewer/post-interview-decisions/', {
            headers: { Authorization: `Token ${token}` }
          })
        ]);

        setApplications(applicationsResponse.data || []);
        setPassedCandidates(passedCandidatesResponse.data || []);
        setInterviewDecisions(decisionsResponse.data || []);

      } catch (err) {
        console.error('Error fetching talent data:', err);
        setError('Failed to load talent pool. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTalentData();
  }, []);

  // Transform API data into TalentCandidate format
  useEffect(() => {
    const candidates: TalentCandidate[] = [];
    const processedIds = new Set();

    // Add passed candidates (quiz passers)
    passedCandidates.forEach(passed => {
      if (!processedIds.has(passed.id)) {
        processedIds.add(passed.id);
        
        // Find corresponding application for more details
        const app = applications.find(a => a.id === passed.id);
        
        candidates.push({
          id: passed.id,
          name: passed.candidate_name,
          email: app?.candidate_email || `${passed.candidate_name.toLowerCase().replace(' ', '.')}@example.com`,
          phone: app?.candidate_phone,
          appliedRole: passed.internship_role,
          appliedDate: app?.applied_at ? new Date(app.applied_at).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
          highestScore: passed.test_score,
          skills: [], // Skills data not available from current endpoints
          tags: [
            { label: 'Passed Quiz', color: 'green' },
            ...(passed.interview_id ? [{ label: 'Interview Scheduled', color: 'blue' }] : [])
          ],
          status: 'passed',
          resume: app?.resume,
          interviewDate: passed.interview_date,
          interviewTime: passed.interview_time,
          notes: `Test Score: ${passed.test_score}%. ${passed.interview_id ? 'Interview scheduled.' : 'Awaiting interview scheduling.'}`
        });
      }
    });

    // Add hired candidates from interview decisions
    interviewDecisions.forEach(decision => {
      if (decision.is_selected && !processedIds.has(decision.id)) {
        processedIds.add(decision.id);
        
        candidates.push({
          id: decision.id,
          name: decision.candidate_name,
          email: `${decision.candidate_name.toLowerCase().replace(' ', '.')}@example.com`, // Email not in decisions endpoint
          appliedRole: decision.internship_role,
          appliedDate: new Date(decision.interview_date).toLocaleDateString('en-CA'),
          highestScore: decision.test_score,
          skills: [],
          tags: [
            { label: 'Hired', color: 'emerald' },
            { label: 'Interview Completed', color: 'purple' }
          ],
          status: 'hired',
          interviewDate: decision.interview_date,
          interviewTime: decision.interview_time,
          notes: `Selected after interview. Test score: ${decision.test_score}%. Attended meeting: ${decision.attended_meeting ? 'Yes' : 'No'}`
        });
      }
    });

    // Add other applications (not in passed or hired)
    applications.forEach(app => {
      if (!processedIds.has(app.id)) {
        processedIds.add(app.id);
        
        let status: 'passed' | 'hired' | 'rejected' | 'pending' = 'pending';
        let tags = [];
        
        if (app.status === 'rejected') {
          status = 'rejected';
          tags.push({ label: 'Rejected', color: 'red' });
        } else if (app.test_passed) {
          status = 'passed';
          tags.push({ label: 'Passed Quiz', color: 'green' });
        } else if (app.test_completed) {
          tags.push({ label: 'Quiz Completed', color: 'amber' });
        } else {
          tags.push({ label: 'Applied', color: 'blue' });
        }
        
        candidates.push({
          id: app.id,
          name: app.candidate_name,
          email: app.candidate_email,
          phone: app.candidate_phone,
          appliedRole: app.internship_role,
          appliedDate: new Date(app.applied_at).toLocaleDateString('en-CA'),
          highestScore: app.test_score || 0,
          skills: [], // Skills data not available
          tags: tags,
          status: status,
          resume: app.resume,
          notes: app.test_score ? `Test score: ${app.test_score}%` : 'Quiz not yet completed'
        });
      }
    });

    // Sort by applied date (newest first)
    candidates.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
    
    setTalentCandidates(candidates);
  }, [applications, passedCandidates, interviewDecisions]);

  const filteredCandidates = talentCandidates.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.appliedRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tags.some((t) => t.label.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalCandidates = talentCandidates.length;
  const passedCount = talentCandidates.filter(c => c.status === 'passed').length;
  const hiredCount = talentCandidates.filter(c => c.status === 'hired').length;
  const averageScore = talentCandidates.length > 0
    ? Math.round(talentCandidates.reduce((acc, c) => acc + c.highestScore, 0) / talentCandidates.length)
    : 0;

  const handleExportList = () => {
    try {
      const headers = ['Name', 'Email', 'Role', 'Applied Date', 'Score', 'Status', 'Tags'];
      const rows = filteredCandidates.map(c => [
        c.name,
        c.email,
        c.appliedRole,
        c.appliedDate,
        `${c.highestScore}%`,
        c.status,
        c.tags.map(t => t.label).join('; ')
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `talent-pool-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleMessageCandidate = (candidate: TalentCandidate) => {
    // Navigate to messages with this candidate
    window.location.href = `/interviewer/messages?candidate=${candidate.id}`;
  };

  const handleDownloadResume = (candidate: TalentCandidate) => {
    if (candidate.resume) {
      window.open(`${baseApi}${candidate.resume}`, '_blank');
    } else {
      alert('Resume not available for this candidate');
    }
  };

  const handleSendEmail = (candidate: TalentCandidate) => {
    window.location.href = `mailto:${candidate.email}?subject=Interview%20Opportunity&body=Dear%20${candidate.name}%2C%0A%0A`;
  };

  if (loading) {
    return (
      <InterviewerDashboardSkeleton>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-xl px-8 py-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Building talent pool
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Gathering candidate information...
            </p>
          </div>
        </div>
      </InterviewerDashboardSkeleton>
    );
  }

  if (error) {
    return (
      <InterviewerDashboardSkeleton>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-xl px-8 py-10 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">Error loading data</h3>
            <p className="text-sm text-slate-500 mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </InterviewerDashboardSkeleton>
    );
  }

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />

            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200 whitespace-nowrap">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Talent pipeline management</span>
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Talent Pool
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                  Manage and nurture promising candidates, track interactions, and build your future hiring pipeline.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 min-w-full xl:min-w-[620px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Total Candidates</p>
                  <h3 className="text-3xl font-bold mt-2">{totalCandidates}</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Passed Quiz</p>
                  <h3 className="text-3xl font-bold mt-2">{passedCount}</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Hired</p>
                  <h3 className="text-3xl font-bold mt-2">{hiredCount}</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Avg. Score</p>
                  <h3 className="text-3xl font-bold mt-2">{averageScore}%</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Filter talent:</span>
              </div>

              <div className="flex flex-wrap gap-3 flex-1 justify-end">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, role, or tag..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-11 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  />
                </div>

                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
                  <Filter size={16} />
                  Advanced Filters
                </button>

                <button 
                  onClick={handleExportList}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                >
                  <Download size={16} />
                  Export List
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-5">
            {/* Left Column - Candidate List */}
            <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
                <h2 className="text-lg font-bold text-slate-900">
                  Candidate Pipeline
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {filteredCandidates.length} candidates match your criteria
                </p>
              </div>

              <div className="overflow-y-auto max-h-[calc(100vh-340px)]">
                {filteredCandidates.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">
                      No candidates found
                    </h3>
                    <p className="text-sm text-slate-500">
                      Try adjusting your search or filters
                    </p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {filteredCandidates.map((candidate) => {
                      const statusTag = getStatusTag(candidate.status);
                      
                      return (
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
                              {candidate.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">
                                    {candidate.name}
                                  </p>
                                  <p className="text-sm text-slate-600 truncate">
                                    {candidate.email}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold ${
                                    candidate.highestScore >= 80 ? 'bg-green-100 text-green-700' :
                                    candidate.highestScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {candidate.highestScore}%
                                  </span>
                                </div>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <span
                                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getTagColorClasses(statusTag.color)}`}
                                >
                                  {statusTag.label}
                                </span>
                                {candidate.tags.map((tag, i) => (
                                  <span
                                    key={i}
                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getTagColorClasses(tag.color)}`}
                                  >
                                    {tag.label}
                                  </span>
                                ))}
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  <Briefcase size={12} />
                                  <span>{candidate.appliedRole}</span>
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                  {new Date(candidate.appliedDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Candidate Details */}
            <div className="lg:sticky lg:top-24 h-fit">
              {selectedCandidate ? (
                <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">
                  {/* Header with gradient */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 text-white border-b border-white/10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%)]" />
                    
                    <div className="relative flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold shrink-0 border border-white/20">
                        {selectedCandidate.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold truncate">{selectedCandidate.name}</h2>
                        <p className="text-sm text-slate-300 truncate">{selectedCandidate.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Score Card */}
                    <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <Award className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-green-600 font-medium">Best Assessment Score</p>
                            <p className="text-2xl font-bold text-green-700">{selectedCandidate.highestScore}%</p>
                          </div>
                        </div>
                        {selectedCandidate.interviewDate && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Interview: {new Date(selectedCandidate.interviewDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1">
                        <Tag size={14} />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {getStatusTag(selectedCandidate.status) && (
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getTagColorClasses(getStatusTag(selectedCandidate.status).color)}`}
                          >
                            {getStatusTag(selectedCandidate.status).label}
                          </span>
                        )}
                        {selectedCandidate.tags.map((tag, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getTagColorClasses(tag.color)}`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Application Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                        <p className="text-xs text-slate-500">Applied Role</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">{selectedCandidate.appliedRole}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                        <p className="text-xs text-slate-500">Applied Date</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">
                          {new Date(selectedCandidate.appliedDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Interview Info */}
                    {selectedCandidate.interviewDate && (
                      <div className="rounded-xl bg-blue-50 p-3 border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium">Interview Scheduled</p>
                        <p className="text-sm text-blue-700 mt-1">
                          {new Date(selectedCandidate.interviewDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {selectedCandidate.interviewTime && ` at ${selectedCandidate.interviewTime}`}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedCandidate.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-2">Internal Notes</h4>
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-200">
                          {selectedCandidate.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-3 space-y-3">
                      <button 
                        onClick={() => handleMessageCandidate(selectedCandidate)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                      >
                        <MessageSquare size={16} />
                        Message Candidate
                      </button>

                      <button 
                        onClick={() => handleDownloadResume(selectedCandidate)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
                      >
                        <Download size={16} />
                        Download Resume
                      </button>

                      <button 
                        onClick={() => handleSendEmail(selectedCandidate)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
                      >
                        <Mail size={16} />
                        Send Email
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] p-10 text-center h-[500px] flex flex-col items-center justify-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 mb-5">
                    <User className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No Candidate Selected
                  </h3>
                  <p className="text-sm text-slate-500 max-w-[200px]">
                    Select a candidate from the list to view their detailed profile
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl px-6 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock size={16} />
                Talent pool updated: {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users size={16} />
                  {passedCount} passed • {hiredCount} hired
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Tag size={16} />
                  {talentCandidates.length} total
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default TalentPool;
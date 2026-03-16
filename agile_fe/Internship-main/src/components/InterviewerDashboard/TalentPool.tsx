// src/pages/interviewer/TalentPool.tsx
import React, { useState } from 'react';
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
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../../components/skeleton/InterviewerDashboardSkeleton';

// ─── Types ────────────────────────────────────────────────
interface TalentCandidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profilePic?: string;
  appliedRole: string;
  appliedDate: string;
  highestScore: number; // e.g. 88
  skills: string[];
  tags: { label: string; color: string }[];
  notes?: string;
  lastContact?: string;
  availability?: string;
}

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_TALENT_POOL: TalentCandidate[] = [
  {
    id: 'tp1',
    name: 'Nirojan Selvan',
    email: 'nirojan.s@uni.lk',
    appliedRole: 'Frontend Developer Intern',
    appliedDate: '2025-11-15',
    highestScore: 92,
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
    tags: [
      { label: 'Strong Frontend', color: 'blue' },
      { label: 'Summer 2026', color: 'green' },
      { label: 'Great Culture Fit', color: 'purple' },
    ],
    notes: 'Very strong in React hooks & performance optimization. Slightly weak in state management theory.',
    lastContact: '2026-01-10',
  },
  {
    id: 'tp2',
    name: 'Kavindi Sharma',
    email: 'kavindi.sharma@gmail.com',
    appliedRole: 'Python Backend Intern',
    appliedDate: '2025-12-03',
    highestScore: 85,
    skills: ['Python', 'Django', 'PostgreSQL', 'REST API'],
    tags: [
      { label: 'Backend Solid', color: 'indigo' },
      { label: 'Re-contact Q2', color: 'amber' },
    ],
    notes: 'Good problem solving. Needs more experience with async patterns.',
  },
  {
    id: 'tp3',
    name: 'Arjun Kumar',
    email: 'arjun.k@tech.edu',
    appliedRole: 'Full Stack Intern',
    appliedDate: '2026-01-05',
    highestScore: 78,
    skills: ['JavaScript', 'Node.js', 'MongoDB', 'Express'],
    tags: [
      { label: 'MERN Stack', color: 'green' },
      { label: 'Available Now', color: 'blue' },
    ],
    notes: 'Great project portfolio. Needs improvement in database design.',
    lastContact: '2026-02-01',
  },
  {
    id: 'tp4',
    name: 'Priya Varma',
    email: 'priya.v@college.edu',
    appliedRole: 'UI/UX Design Intern',
    appliedDate: '2025-12-20',
    highestScore: 88,
    skills: ['Figma', 'Adobe XD', 'User Research', 'Wireframing'],
    tags: [
      { label: 'Creative', color: 'purple' },
      { label: 'Portfolio Ready', color: 'pink' },
    ],
    notes: 'Excellent design thinking. Strong portfolio presentation.',
    lastContact: '2026-01-28',
  },
];

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
  };
  return colorMap[color] || 'bg-slate-100 text-slate-700 border-slate-200';
};

// ─── Component ─────────────────────────────────────────────
const TalentPool: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<TalentCandidate | null>(null);

  const filteredCandidates = MOCK_TALENT_POOL.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.tags.some((t) => t.label.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalCandidates = MOCK_TALENT_POOL.length;
  const averageScore = Math.round(
    MOCK_TALENT_POOL.reduce((acc, c) => acc + c.highestScore, 0) / totalCandidates
  );

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
                  <p className="text-slate-300 text-sm">Active</p>
                  <h3 className="text-3xl font-bold mt-2">{totalCandidates}</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Avg. Score</p>
                  <h3 className="text-3xl font-bold mt-2">{averageScore}%</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Visible</p>
                  <h3 className="text-3xl font-bold mt-2">{filteredCandidates.length}</h3>
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
                    placeholder="Search by name, skill, or tag..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-11 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  />
                </div>

                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
                  <Filter size={16} />
                  Advanced Filters
                </button>

                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm">
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
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-sm font-semibold">
                                  {candidate.highestScore}%
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {candidate.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getTagColorClasses(tag.color)}`}
                                >
                                  {tag.label}
                                </span>
                              ))}
                            </div>

                            <p className="mt-2 text-sm text-slate-600 truncate">
                              <span className="font-medium">Skills:</span> {candidate.skills.join(' • ')}
                            </p>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Briefcase size={12} />
                                <span>{candidate.appliedRole}</span>
                              </div>
                              <span className="text-xs text-slate-400 whitespace-nowrap">
                                {candidate.appliedDate}
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
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1">
                        <Tag size={14} />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
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

                    {/* Skills */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1">
                        <Briefcase size={14} />
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            {skill}
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
                        <p className="text-sm font-medium text-slate-900 mt-1">{selectedCandidate.appliedDate}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedCandidate.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-2">Internal Notes</h4>
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-200">
                          {selectedCandidate.notes}
                        </p>
                      </div>
                    )}

                    {/* Last Contact */}
                    {selectedCandidate.lastContact && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock size={14} />
                        Last contacted: {selectedCandidate.lastContact}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-3 space-y-3">
                      <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm">
                        <MessageSquare size={16} />
                        Message Candidate
                      </button>

                      <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
                        <Download size={16} />
                        Download Resume
                      </button>

                      <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm">
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
                Talent pool last updated: February 26, 2026
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <PlusCircle size={16} />
                  Add new candidate
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Tag size={16} />
                  Manage tags
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
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
  // ... more entries
];

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

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-white border-b shadow-sm px-4 md:px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Talent Pool</h1>

            <div className="flex flex-1 max-w-2xl gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, skill, tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                />
              </div>

              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter size={18} />
                <span>Filters</span>
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download size={18} />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex gap-6">
          {/* Candidate List */}
          <div className="w-full lg:w-3/5 xl:w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredCandidates.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No candidates match your search
                </div>
              ) : (
                filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`p-5 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-4 ${
                      selectedCandidate?.id === candidate.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-600 font-medium text-xl">
                      {candidate.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                          <p className="text-sm text-gray-600">{candidate.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {candidate.highestScore}%
                          </div>
                          <div className="text-xs text-gray-500">Best Score</div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {candidate.tags.map((tag, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${tag.color}-100 text-${tag.color}-800`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2 text-sm text-gray-600 line-clamp-1">
                        <span className="font-medium">Skills:</span>{' '}
                        {candidate.skills.join(' • ')}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        Applied for {candidate.appliedRole} • {candidate.appliedDate}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 mt-1.5" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Side Panel – Candidate Details */}
          <div className="hidden lg:block w-full lg:w-2/5 xl:w-1/3">
            {selectedCandidate ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                <div className="flex items-center gap-4 pb-5 border-b">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-semibold">
                    {selectedCandidate.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedCandidate.name}</h2>
                    <p className="text-gray-600">{selectedCandidate.email}</p>
                  </div>
                </div>

                <div className="py-5 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Best Score</h4>
                    <p className="text-2xl font-bold text-green-600">{selectedCandidate.highestScore}%</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Tags</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedCandidate.tags.map((tag, i) => (
                        <span
                          key={i}
                          className={`px-3 py-1 rounded-full text-sm bg-${tag.color}-100 text-${tag.color}-800`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Skills</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedCandidate.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Internal Notes</h4>
                      <p className="mt-1 text-gray-700 text-sm">{selectedCandidate.notes}</p>
                    </div>
                  )}

                  {selectedCandidate.lastContact && (
                    <div className="text-sm text-gray-500">
                      Last contacted: {selectedCandidate.lastContact}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t flex flex-col gap-3">
                  <button className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <MessageSquare size={18} />
                    Message Candidate
                  </button>

                  <button className="flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Download size={18} />
                    Download Resume
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-gray-500 h-96 flex items-center justify-center">
                Select a candidate to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default TalentPool;
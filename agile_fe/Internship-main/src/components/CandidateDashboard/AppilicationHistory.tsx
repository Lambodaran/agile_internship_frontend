// src/pages/candidate/ApplicationHistory.tsx
import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Download,
  MessageSquare,
} from 'lucide-react';
import CandidateDashboardSkeleton from '../../components/skeleton/CandidateDashboardSkeleton'; // adjust path

// ─── Types ────────────────────────────────────────────────
interface TimelineEvent {
  id: string;
  eventType:
    | 'applied'
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
  timestamp: string;
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
  feedback?: string;
}

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app-001',
    company: 'TechNova Solutions',
    role: 'Frontend Developer Intern',
    appliedAt: 'Feb 10, 2026',
    currentStatus: 'Offer Accepted',
    finalOutcome: 'accepted',
    timeline: [
      { id: 'e1', eventType: 'applied', title: 'Application Submitted', timestamp: 'Feb 10, 2026 09:45 AM', status: 'completed' },
      { id: 'e2', eventType: 'quiz_completed', title: 'Frontend Quiz Completed (92%)', timestamp: 'Feb 12, 2026 2:30 PM', status: 'completed' },
      { id: 'e3', eventType: 'shortlisted', title: 'Shortlisted for Interview', timestamp: 'Feb 14, 2026 11:20 AM', status: 'completed' },
      { id: 'e4', eventType: 'interview_scheduled', title: 'Interview Scheduled', timestamp: 'Feb 15, 2026 4:00 PM', status: 'completed' },
      { id: 'e5', eventType: 'interview_completed', title: 'Face-to-Face Interview Completed', timestamp: 'Feb 20, 2026 3:45 PM', status: 'completed' },
      { id: 'e6', eventType: 'offer_extended', title: 'Offer Extended', timestamp: 'Feb 22, 2026 10:15 AM', status: 'completed' },
      { id: 'e7', eventType: 'offer_accepted', title: 'Offer Accepted by You', timestamp: 'Feb 23, 2026 08:40 AM', status: 'completed' },
    ],
    feedback: null,
  },
  {
    id: 'app-002',
    company: 'InnoSpark',
    role: 'Python Backend Intern',
    appliedAt: 'Jan 28, 2026',
    currentStatus: 'Rejected',
    finalOutcome: 'rejected',
    timeline: [
      { id: 'e1', eventType: 'applied', title: 'Application Submitted', timestamp: 'Jan 28, 2026 14:20 PM', status: 'completed' },
      { id: 'e2', eventType: 'quiz_completed', title: 'Python Assessment Completed (78%)', timestamp: 'Jan 30, 2026 16:10 PM', status: 'completed' },
      { id: 'e3', eventType: 'rejected', title: 'Application Not Selected', timestamp: 'Feb 5, 2026 09:30 AM', status: 'completed' },
    ],
    feedback: 'Thank you for applying. While your technical score was solid, we had stronger candidates with more experience in scalable backend systems. We encourage you to re-apply in the future.',
  },
  // more entries...
];

const ApplicationHistory = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setApplications(MOCK_APPLICATIONS);
      setLoading(false);
    }, 800);
  }, []);

  const filteredApps = applications.filter(app =>
    filterStatus === 'all' ||
    (filterStatus === 'accepted' && app.finalOutcome === 'accepted') ||
    (filterStatus === 'rejected' && app.finalOutcome === 'rejected') ||
    (filterStatus === 'withdrawn' && app.finalOutcome === 'withdrawn') ||
    (!app.finalOutcome && filterStatus === 'active')
  );

  const toggleExpand = (appId: string) => {
    setExpandedApp(expandedApp === appId ? null : appId);
  };

  const getStatusColor = (outcome?: string) => {
    if (!outcome) return 'text-blue-600';
    if (outcome === 'accepted') return 'text-green-600';
    if (outcome === 'rejected') return 'text-red-600';
    if (outcome === 'withdrawn') return 'text-orange-600';
    return 'text-gray-600';
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

          {/* Header + Filter */}
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
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              >
                <option value="all">All Applications</option>
                <option value="active">Active</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {filteredApps.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
                <Briefcase size={48} className="mx-auto mb-4 opacity-40" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  No applications found
                </h2>
                <p>Start applying to internships to see your history here.</p>
              </div>
            ) : (
              filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Summary row */}
                  <div
                    onClick={() => toggleExpand(app.id)}
                    className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                        {app.company.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 truncate">{app.role}</h3>
                            <p className="text-sm text-gray-600">{app.company}</p>
                          </div>
                          <div className={`text-sm font-medium ${getStatusColor(app.finalOutcome)}`}>
                            {app.currentStatus}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Applied on {app.appliedAt}
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

                  {/* Expanded Timeline */}
                  {expandedApp === app.id && (
                    <div className="px-6 pb-6 border-t bg-gray-50">
                      {/* Timeline */}
                      <div className="relative mt-6 ml-6">
                        {/* Vertical line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                        <div className="space-y-8">
                          {app.timeline.map((event, index) => (
                            <div key={event.id} className="relative flex items-start">
                              {/* Circle */}
                              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 ${
                                event.status === 'completed' ? 'bg-green-100 border-green-500' :
                                event.status === 'pending' ? 'bg-yellow-100 border-yellow-500' :
                                'bg-red-100 border-red-500'
                              }`}>
                                {event.status === 'completed' ? (
                                  <CheckCircle size={16} className="text-green-600" />
                                ) : event.status === 'pending' ? (
                                  <Clock size={16} className="text-yellow-600" />
                                ) : (
                                  <XCircle size={16} className="text-red-600" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="ml-12">
                                <h4 className="font-medium text-gray-900">{event.title}</h4>
                                {event.description && (
                                  <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">{event.timestamp}</p>

                                {/* Feedback (only shown on rejection or after interview) */}
                                {event.eventType === 'rejected' && app.feedback && index === app.timeline.length - 1 && (
                                  <div className="mt-3 p-4 bg-red-50 border border-red-100 rounded-lg">
                                    <p className="text-sm font-medium text-red-800 mb-1">Feedback from recruiter:</p>
                                    <p className="text-sm text-gray-700">{app.feedback}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      {!app.finalOutcome && (
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
                          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                            <XCircle size={18} />
                            Withdraw Application
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default ApplicationHistory;
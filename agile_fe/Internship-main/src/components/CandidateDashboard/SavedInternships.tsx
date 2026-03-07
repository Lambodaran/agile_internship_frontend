// src/pages/candidate/SavedInternships.tsx
import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  Briefcase,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import CandidateDashboardSkeleton from '../skeleton/CandidateDashboardSkeleton'; // adjust path

// ────────────────────────────────────────────────
// Mock data (replace with real API fetch later)
// ────────────────────────────────────────────────
const MOCK_SAVED_INTERNSHIPS = [
  {
    id: 'int-101',
    title: 'Frontend Developer Intern',
    company: 'TechNova Solutions',
    location: 'Remote',
    type: 'Full-time',
    deadline: '2025-03-15',
    savedAt: '2025-02-20',
    applied: false,
    closingSoon: true,
  },
  {
    id: 'int-107',
    title: 'Mobile App Development Intern',
    company: 'InnoSpark',
    location: 'Colombo, Hybrid',
    type: 'Part-time',
    deadline: '2025-04-10',
    savedAt: '2025-02-18',
    applied: true,
    closingSoon: false,
  },
  {
    id: 'int-115',
    title: 'UI/UX Design Intern',
    company: 'CreativeHub LK',
    location: 'Jaffna',
    type: 'Internship',
    deadline: '2025-03-05',
    savedAt: '2025-02-25',
    applied: false,
    closingSoon: true,
  },
];

const SavedInternships = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setSavedJobs(MOCK_SAVED_INTERNSHIPS);
      setLoading(false);
    }, 800);

    // Real version would look like:
    // fetch('/api/candidates/me/saved-jobs')
    //   .then(res => res.json())
    //   .then(data => setSavedJobs(data))
    //   .catch(err => setError('Failed to load saved internships'))
    //   .finally(() => setLoading(false));
  }, []);

  const handleUnsave = (jobId) => {
    // Optimistic update
    const updated = savedJobs.filter((job) => job.id !== jobId);
    setSavedJobs(updated);

    // Real version would call:
    // fetch(`/api/candidates/me/saved-jobs/${jobId}`, { method: 'DELETE' })
    //   .catch(() => {
    //     // rollback on error
    //     setSavedJobs(prev => [...prev, savedJobs.find(j => j.id === jobId)]);
    //     alert('Failed to unsave job');
    //   });
  };

  const daysUntilDeadline = (deadline) => {
    const diff = new Date(deadline) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <CandidateDashboardSkeleton>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your saved internships...</p>
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  if (error) {
    return (
      <CandidateDashboardSkeleton>
        <div className="p-8 text-center text-red-600">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p>{error}</p>
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  return (
    <CandidateDashboardSkeleton>
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Saved Internships</h1>
              <p className="text-gray-600 mt-1">
                {savedJobs.length} opportunity{savedJobs.length !== 1 ? 's' : ''} bookmarked
              </p>
            </div>
          </div>

          {/* Empty state */}
          {savedJobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Bookmark size={40} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                No saved internships yet
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Bookmark interesting opportunities while browsing so you can come back to them later.
              </p>
              <a
                href="/internship"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Briefcase size={18} />
                Explore Available Internships
              </a>
            </div>
          ) : (
            /* Job cards grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedJobs.map((job) => {
                const daysLeft = daysUntilDeadline(job.deadline);
                const isClosingSoon = daysLeft <= 2 && daysLeft > 0;

                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="p-5 border-b bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                        </div>

                        <button
                          onClick={() => handleUnsave(job.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                          title="Remove from saved"
                        >
                          <BookmarkCheck size={24} className="text-blue-600 fill-blue-100" />
                        </button>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5 space-y-4">
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Briefcase size={16} />
                          <span>{job.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Clock size={16} />
                          <span>{job.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar size={16} className={isClosingSoon ? 'text-red-600' : 'text-gray-600'} />
                        <span className={isClosingSoon ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          Deadline: {new Date(job.deadline).toLocaleDateString('en-GB')}
                          {isClosingSoon && ' • Closing Soon!'}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-4 border-t flex gap-3">
                        {job.applied ? (
                          <div className="flex-1 bg-green-100 text-green-800 py-3 px-4 rounded-lg text-center font-medium">
                            Applied
                          </div>
                        ) : (
                          <a
                            href={`/internship/${job.id}/apply`}
                            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg text-center font-medium hover:bg-blue-700 transition"
                          >
                            Apply Now
                          </a>
                        )}

                        <a
                          href={`/internship/${job.id}`}
                          className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                        >
                          View Details
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
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

export default SavedInternships;
import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  HelpCircle,
  Calendar,
  Clock,
  Award,
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

const InterviewerSelectedCandidate: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

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

  // ─── Format Helpers ────────────────────────────────────────────────
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
      const res = await api.get('/interviewer/passed-candidates/', { headers });
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
    setSavingIds((prev) => new Set([...prev, tempId]));

    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidate.id ? { ...c, [field]: value } : c
      )
    );

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      await api.patch(
        `/interviewer/interview/update-status/${candidate.interview_id}/`,
        { [field]: value },
        { headers }
      );
      // If success → keep optimistic update
    } catch (err) {
      console.error(err);
      alert('Failed to save status. Reverting...');
      // Revert on error
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidate.id ? { ...c, [field]: candidate[field] } : c
        )
      );
      fetchCandidates(); // optional full refresh
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  };

  const filteredCandidates = candidates.filter((c) =>
    c.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.internship_role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-900">
              <CheckCircle className="text-green-600" size={28} />
              Post-Interview Decisions
            </h1>
            <p className="mt-2 text-gray-600">
              Mark attendance and final selection for scheduled candidates
            </p>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="mt-5 relative max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>
          </div>

          {/* Loading / Empty / Table */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              Loading candidates...
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <Clock size={48} className="mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                No candidates available yet
              </h2>
              <p className="text-gray-500">
                Schedule interviews from the Face-to-Face page first.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interview
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attended?
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selected?
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCandidates.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {c.candidate_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {c.internship_role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {c.test_score ? (
                            <span className="text-green-600 font-medium">
                              {Math.round(c.test_score)}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {formatDate(c.interview_date)}
                          <br />
                          <span className="text-xs text-gray-500">
                            {formatTime(c.interview_time)}
                          </span>
                        </td>

                        {/* Attended dropdown */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={
                              c.attended_meeting === true
                                ? 'yes'
                                : c.attended_meeting === false
                                ? 'no'
                                : 'pending'
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === 'yes') updateStatus(c, 'attended_meeting', true);
                              else if (v === 'no') updateStatus(c, 'attended_meeting', false);
                              // pending → null / no change
                            }}
                            disabled={savingIds.has(c.id) || !c.interview_id}
                            className={`
                              border rounded-md px-3 py-1.5 text-sm min-w-[130px] focus:ring-2 focus:ring-green-400
                              ${c.attended_meeting === true ? 'bg-green-50 border-green-400 text-green-800' : ''}
                              ${c.attended_meeting === false ? 'bg-red-50 border-red-400 text-red-800' : ''}
                            `}
                          >
                            <option value="pending">Pending</option>
                            <option value="yes">Yes – Attended</option>
                            <option value="no">No – Absent</option>
                          </select>
                        </td>

                        {/* Selected icons */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateStatus(c, 'is_selected', true)}
                              disabled={savingIds.has(c.id) || !c.interview_id}
                              className={`
                                p-2 rounded-full transition-all
                                ${c.is_selected === true
                                  ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                                  : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'}
                              `}
                              title="Mark as Selected"
                            >
                              <CheckCircle size={22} />
                            </button>

                            <button
                              onClick={() => updateStatus(c, 'is_selected', false)}
                              disabled={savingIds.has(c.id) || !c.interview_id}
                              className={`
                                p-2 rounded-full transition-all
                                ${c.is_selected === false
                                  ? 'bg-red-100 text-red-700 ring-2 ring-red-400'
                                  : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600'}
                              `}
                              title="Mark as Not Selected"
                            >
                              <XCircle size={22} />
                            </button>

                            {/* <button
                              onClick={() => updateStatus(c, 'is_selected', null)}
                              disabled={savingIds.has(c.id) || !c.interview_id}
                              className={`
                                p-2 rounded-full transition-all text-gray-500
                                ${c.is_selected == null
                                  ? 'bg-gray-200 ring-2 ring-gray-300'
                                  : 'bg-gray-100 hover:bg-gray-200'}
                              `}
                              title="Reset decision"
                            >
                              <HelpCircle size={22} />
                            </button> */}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default InterviewerSelectedCandidate;
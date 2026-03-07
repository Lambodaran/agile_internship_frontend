import React, { useState, useEffect } from 'react';
import { Search, MoreHorizontal, Calendar, Video, Users, Award, Save, Pencil, Trash, Send } from 'lucide-react';
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
}

const InterviewerF2F: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [internships, setInternships] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editState, setEditState] = useState<{ [key: number]: { date: string; time: string; zoom: string; isEditing: boolean; interviewId?: number } }>({});
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  const navigate = useNavigate();

  // Auth headers helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Please log in to access this page.');
      navigate('/login');
      return null;
    }
    return { Authorization: `Token ${token}` };
  };

  // Fetch accepted applications with passed assessments only
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
        const passedCandidates = data;

        setInternships(passedCandidates);

        // Reset editState for new data
        const newEditState: typeof editState = {};
        passedCandidates.forEach(app => {
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
        console.error("Unexpected API structure:", data);
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

  const updateInterviewById = async (id: number) => {
    if (loadingIds.has(id)) return;
    setLoadingIds(prev => new Set(prev).add(id));

    const data = editState[id];
    if (!data?.interviewId) {
      setLoadingIds(prev => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
      return;
    }
    if (!data.date || !data.zoom) {
      alert("Date and Zoom URL are required.");
      setLoadingIds(prev => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
      return;
    }
    const headers = getAuthHeaders();
    if (!headers) {
      setLoadingIds(prev => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
      return;
    }

    try {
      await api.put(`/interviewer/interview/update/${data.interviewId}/`, {
        date: data.date,
        time: data.time,
        zoom: data.zoom,
      }, { headers });
      alert("Interview updated successfully.");
      fetchApplications();
    } catch (e: any) {
      console.error(e);
      alert("Failed to update interview.");
    } finally {
      setLoadingIds(prev => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }
  };

  // Handlers for editing inputs
  const handleDateChange = (id: number, value: string) => {
    setEditState(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        date: value,
      }
    }));
  };

  const handleTimeChange = (id: number, value: string) => {
    setEditState(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        time: value,
      }
    }));
  };

  const handleZoomChange = (id: number, value: string) => {
    setEditState(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        zoom: value,
      }
    }));
  };

  // Toggle edit mode for a row
  const toggleEdit = async (id: number) => {
    const isEditing = editState[id]?.isEditing || false;

    // If we are toggling *off* editing, save the interview
    if (isEditing) {
      await updateInterviewById(id);
    }

    setEditState(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isEditing: !isEditing,
      }
    }));
  };

  // Send (create) interview
  const sendInterview = async (app: Internship) => {
    if (loadingIds.has(app.id)) return; // prevent double click
    setLoadingIds(prev => new Set(prev).add(app.id));  // mark loading

    const data = editState[app.id];
    if (!data?.date || !data?.zoom) {
      alert("Please provide both date and Zoom URL before sending.");
      setLoadingIds(prev => {
        const copy = new Set(prev);
        copy.delete(app.id);
        return copy;
      });
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      setLoadingIds(prev => {
        const copy = new Set(prev);
        copy.delete(app.id);
        return copy;
      });
      return;
    }

    try {
      if (data.interviewId) {
        await api.put(`/interviewer/interview/update/${data.interviewId}/`, {
          date: data.date,
          time: data.time,
          zoom: data.zoom,
        }, { headers });
        alert("Interview updated successfully.");
      } else {
        await api.post('/interviewer/interview/create/', {
          application_id: app.id,
          date: data.date,
          time: data.time,
          zoom: data.zoom,
        }, { headers });
        alert("Interview scheduled successfully.");
      }

      toggleEdit(app.id);
      fetchApplications();
    } catch (e: any) {
      console.error(e);
      alert("Failed to schedule/update interview. Please try again.");
    } finally {
      // Remove loading state
      setLoadingIds(prev => {
        const copy = new Set(prev);
        copy.delete(app.id);
        return copy;
      });
    }
  };

  const deleteInterview = async (app: Internship) => {
    const id = app.id;
    if (loadingIds.has(id)) return;
    setLoadingIds(prev => new Set(prev).add(id));

    const interviewId = editState[id]?.interviewId;
    if (!interviewId) {
      alert("Cannot delete interview before it is scheduled.");
      setLoadingIds(prev => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      setLoadingIds(prev => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
      return;
    }

    try {
      await api.delete(`/interviewer/interview/delete/${interviewId}/`, { headers });
      alert("Interview deleted successfully.");
      fetchApplications();
    } catch (e: any) {
      console.error(e);
      alert("Failed to delete interview.");
    } finally {
      setLoadingIds(prev => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }
  };

  // Update interview (PUT)
  const updateInterview = async (app: Internship) => {
    const data = editState[app.id];
    const interviewId = data?.interviewId;

    if (!interviewId) {
      alert("No interview to update.");
      return;
    }
    if (!data?.date || !data?.zoom) {
      alert("Date and Zoom URL are required.");
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      await api.put(`/interviewer/interview/update/${interviewId}/`, {
        date: data.date,
        time: data.time,
        zoom: data.zoom,
      }, { headers });

      alert("Interview updated successfully.");
      toggleEdit(app.id);
      fetchApplications();

    } catch (e: any) {
      console.error(e);
      alert("Failed to update interview.");
    }
  };

  // Filter internships by search
  const filteredInternships = internships.filter((internship) => {
    const candidateName = internship.candidate_name ?? '';
    const internshipRole = internship.internship_role ?? '';

    return (
      candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internshipRole.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatTo12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              Face to Face Internships
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 flex items-center gap-2">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              Showing only candidates who have passed their assessments
            </p>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 sm:mb-6 text-sm">
                {error}
              </div>
            )}

            {/* Search Bar */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search by Name or Role"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 pr-4 py-2 sm:py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Mobile Card View (hidden on lg+) */}
          <div className="lg:hidden">
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-500 text-base font-medium">Loading qualified candidates...</p>
              </div>
            ) : filteredInternships.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <Award className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-base font-medium">No qualified candidates found</p>
                  <p className="text-sm mt-1 text-center">
                    {searchTerm
                      ? "No candidates match your search criteria."
                      : "There are no candidates who have passed their assessments at the moment."
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInternships.map((internship, index) => {
                  const isEditing = editState[internship.id]?.isEditing || false;
                  const dateValue = editState[internship.id]?.date || '';
                  const timeValue = editState[internship.id]?.time || '';
                  const zoomValue = editState[internship.id]?.zoom || '';

                  return (
                    <div key={internship.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900 text-base">{internship.candidate_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{internship.internship_role}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-green-600">
                            {Math.round(internship.test_score || 0)}%
                          </span>
                          <div className="mt-1">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Passed
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Date */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                          {isEditing ? (
                            <input
                              type="date"
                              value={dateValue}
                              onChange={(e) => handleDateChange(internship.id, e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          ) : (
                            <p className="text-sm text-gray-900">
                              {dateValue || <span className="text-gray-400 italic">Select a date</span>}
                            </p>
                          )}
                        </div>

                        {/* Time */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                          {isEditing ? (
                            <input
                              type="time"
                              value={timeValue}
                              onChange={(e) => handleTimeChange(internship.id, e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          ) : (
                            <p className="text-sm text-gray-900">
                              {timeValue ? formatTo12Hour(timeValue) : <span className="text-gray-400 italic">Select a time</span>}
                            </p>
                          )}
                        </div>

                        {/* Zoom */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Zoom Link</label>
                          {isEditing ? (
                            <input
                              type="url"
                              value={zoomValue}
                              onChange={(e) => handleZoomChange(internship.id, e.target.value)}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                              placeholder="Zoom URL"
                            />
                          ) : (
                            <div className="text-sm">
                              {zoomValue ? (
                                <a
                                  href={zoomValue}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline break-all"
                                >
                                  {zoomValue}
                                </a>
                              ) : (
                                <span className="text-gray-400 italic">Add Zoom link</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 justify-end">
                        {!editState[internship.id]?.interviewId && (
                          <button
                            onClick={() => sendInterview(internship)}
                            disabled={
                              loadingIds.has(internship.id) ||
                              !editState[internship.id]?.date ||
                              !editState[internship.id]?.zoom
                            }
                            className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => toggleEdit(internship.id)}
                          disabled={loadingIds.has(internship.id)}
                          className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                        >
                          {isEditing ? <Save className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                        </button>

                        {editState[internship.id]?.interviewId && (
                          <button
                            onClick={() => deleteInterview(internship)}
                            disabled={loadingIds.has(internship.id)}
                            className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Table View (hidden on mobile/tablet) */}
          <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider w-20">
                      S.No
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Internship Role
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        Test Score
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Date
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        Zoom
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <p className="text-gray-500 text-lg font-medium">Loading qualified candidates...</p>
                      </td>
                    </tr>
                  ) : filteredInternships.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Award className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-lg font-medium">No qualified candidates found</p>
                          <p className="text-sm mt-1">
                            {searchTerm
                              ? "No candidates match your search criteria."
                              : "There are no candidates who have passed their assessments at the moment."
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInternships.map((internship, index) => {
                      const isEditing = editState[internship.id]?.isEditing || false;
                      const dateValue = editState[internship.id]?.date || '';
                      const zoomValue = editState[internship.id]?.zoom || '';

                      return (
                        <tr key={internship.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{internship.candidate_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{internship.internship_role}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold ${Math.round(internship.test_score || 0) >= 80
                                    ? 'text-green-600'
                                    : Math.round(internship.test_score || 0) >= 70
                                      ? 'text-blue-600'
                                      : 'text-yellow-600'
                                  }`}
                              >
                                {Math.round(internship.test_score || 0)}%
                              </span>
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                Passed
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="date"
                                value={dateValue}
                                onChange={(e) => handleDateChange(internship.id, e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                              />
                            ) : (
                              dateValue ? dateValue : <span className="text-gray-400 italic">Select a date</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="time"
                                value={editState[internship.id]?.time || ''}
                                onChange={(e) => handleTimeChange(internship.id, e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                placeholder="HH:MM"
                              />
                            ) : (
                              editState[internship.id]?.time
                                ? formatTo12Hour(editState[internship.id]?.time)
                                : <span className="text-gray-400 italic">Select a time</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="url"
                                value={zoomValue}
                                onChange={(e) => handleZoomChange(internship.id, e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                placeholder="Zoom URL"
                              />
                            ) : (
                              zoomValue ? (
                                <a
                                  href={zoomValue}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline truncate block max-w-xs"
                                >
                                  {zoomValue}
                                </a>
                              ) : (
                                <span className="text-gray-400 italic">Add Zoom link</span>
                              )
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                            {!editState[internship.id]?.interviewId && (
                              <button
                                onClick={() => sendInterview(internship)}
                                disabled={
                                  loadingIds.has(internship.id) ||
                                  !editState[internship.id]?.date ||
                                  !editState[internship.id]?.zoom
                                }
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => toggleEdit(internship.id)}
                              disabled={loadingIds.has(internship.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              {editState[internship.id]?.isEditing ? (
                                <Save className="w-4 h-4" />
                              ) : (
                                <Pencil className="w-4 h-4" />
                              )}
                            </button>

                            {editState[internship.id]?.interviewId && (
                              <button
                                onClick={() => deleteInterview(internship)}
                                disabled={loadingIds.has(internship.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Statistics */}
          {!isLoading && filteredInternships.length > 0 && (
            <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Qualified Candidates Summary</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{filteredInternships.length}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Qualified</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {filteredInternships.filter(i => (i.test_score || 0) >= 90).length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Outstanding (≥90%)</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                    {filteredInternships.filter(i => (i.test_score || 0) >= 80 && (i.test_score || 0) < 90).length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Excellent (80-99%)</p>
                </div>
                <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {filteredInternships.filter(i => (i.test_score || 0) >= 65 && (i.test_score || 0) < 80).length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Good (65-79%)</p>
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
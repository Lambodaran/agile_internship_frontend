import React, { useState, useEffect } from 'react';
import { Search, Eye, Download, FileText, CheckCircle, XCircle, Filter, Calendar, Mail, Phone, Building, User, Clock, AlertCircle, Check, X } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import InterviewerDashboardSkeleton from '../skeleton/InterviewerDashboardSkeleton';

// Axios instance with base URL and default headers
const baseApi = import.meta.env.VITE_BASE_API;

// Create Axios instance
const api = axios.create({
  baseURL: baseApi,
});

// Interface for Application (aligned with InternshipApplication model)
interface Application {
  candidate_name: string;
  application_date: any;
  status: string;
  id: number;
  company_name: string;
  internship_role: string;
  internship_type: string;
  internship_field: string;
  internship_nature: string;
  internship_description: string;
  required_skills: string;
  duration_months: number;
  application_start_date: string;
  application_end_date: string;
  stipend: string;
  eligibility_criteria: string;
  degrees_preferred: string;
  contact_email: string | null;
  contact_mobile_number: string | null;
  company_information: string;
  internship_responsibilities: string;
  total_vacancies: number;
  country: string;
  state: string;
  district: string;
  applied_at: string;
  resume: string;
  user: number;
  candidate_email: string;
  candidate_phone: string;
}

const InternshipApplications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('applied_at');
  const [statusFilter, setStatusFilter] = useState('all');
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ show: boolean, action: 'accept' | 'reject' | null, application: Application | null }>({
    show: false,
    action: null,
    application: null
  });
  const navigate = useNavigate();

  // Add Authorization header with token for authenticated requests
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Please log in to access this page.');
      setTimeout(() => navigate('/login'), 0);
      return null;
    }
    return { Authorization: `Token ${token}` };
  };

  // Fetch applications from API
  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      setError(null);

      const headers = getAuthHeaders();
      if (!headers) return;

      try {
        const response = await api.get('/interviewer/applications/', { headers });

        setApplications(response.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('access_token');
          setTimeout(() => navigate('/login'), 0);
        } else {
          setError('Failed to load applications. Please try again later.');
        }
        console.error('Error fetching applications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [navigate]);

  // Accept API call
  const acceptApplication = async (applicationId: number) => {
    const headers = getAuthHeaders();
    if (!headers) return false;

    try {
      setUpdatingStatus(applicationId);
      const response = await api.patch(`/interviewer/applications/${applicationId}/accept/`, {}, { headers });
      alert(response.data.message);
      return true;
    } catch (err: any) {
      console.error('Error accepting application:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('access_token');
        setTimeout(() => navigate('/login'), 0);
      }
      return { success: false, message: 'Failed to accept application. Please try again.' };
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Reject API call
  const rejectApplication = async (applicationId: number) => {
    const headers = getAuthHeaders();
    if (!headers) return false;

    try {
      setUpdatingStatus(applicationId);
      const response = await api.patch(`/interviewer/applications/${applicationId}/reject/`, {}, { headers });
      alert(response.data.message);
      return true;
    } catch (err: any) {
      console.error('Error rejecting application:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('access_token');
        setTimeout(() => navigate('/login'), 0);
      }
      return { success: false, message: 'Failed to reject application. Please try again.' };
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleStatusChange = (application: Application, action: 'accept' | 'reject') => {
    setShowConfirmDialog({
      show: true,
      action,
      application
    });
  };

  const confirmStatusChange = async () => {
    if (!showConfirmDialog.application || !showConfirmDialog.action) return;

    const { application, action } = showConfirmDialog;
    const result = action === 'accept'
      ? await acceptApplication(application.id)
      : await rejectApplication(application.id);
    if (result ) {
      setApplications(prev =>
        prev.map(app =>
          app.id === application.id ? { ...app, status: action === 'accept' ? 'accepted' : 'rejected' } : app
        )
      );
    }

    setShowConfirmDialog({ show: false, action: null, application: null });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
            <CheckCircle className="w-3 h-3" />
            <span className="hidden sm:inline">Accepted</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            <span className="hidden sm:inline">Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span className="hidden sm:inline">Pending</span>
          </span>
        );
    }
  };

  const safeLowerIncludes = (value: string | null | undefined, search: string) =>
  (value ?? '').toLowerCase().includes(search.toLowerCase());

  // Enhanced filtering
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
  safeLowerIncludes(app.candidate_name, searchTerm) ||
  safeLowerIncludes(app.internship_role, searchTerm) ||
  safeLowerIncludes(app.company_name, searchTerm) ||
  safeLowerIncludes(app.candidate_email, searchTerm);

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle sorting
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (sortBy === 'applied_at') return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
    if (sortBy === 'candidate_name') return a.candidate_name.localeCompare(b.candidate_name);
    if (sortBy === 'company_name') return a.company_name.localeCompare(b.company_name);
    if (sortBy === 'internship_role') return a.internship_role.localeCompare(b.internship_role);
    return 0;
  });

  // Handle resume viewing
  const handleViewResume = (resumeUrl: string) => {
    window.open(`${baseApi}${resumeUrl}`, '_blank');
  };

  // Handle resume downloading
  const handleDownloadResume = async (resumeUrl: string, candidateName: string) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await api.get(resumeUrl, {
        headers,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${candidateName}_resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading resume:', err);
      alert('Failed to download resume.');
    }
  };

  // Get application statistics
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  return (
    <InterviewerDashboardSkeleton>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
        {/* Header with Statistics */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Internship Applications
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Manage and review candidate applications
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-blue-600">Total</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 sm:p-4 border border-amber-200">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-amber-600">Pending</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-green-600">Accepted</p>
                  <p className="text-lg sm:text-xl font-bold text-green-900">{stats.accepted}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm font-medium text-red-600">Rejected</p>
                  <p className="text-lg sm:text-xl font-bold text-red-900">{stats.rejected}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Enhanced Controls */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
            {/* Search */}
            <div className="flex-1 max-w-full lg:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, role, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 sm:py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 hidden sm:block" />
                <label className="text-xs sm:text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="applied_at">Date</option>
                  <option value="candidate_name">Name</option>
                  <option value="company_name">Company</option>
                  <option value="internship_role">Role</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4 text-sm sm:text-base">Loading applications...</p>
            </div>
          ) : sortedApplications.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-500 text-sm sm:text-base">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Applications will appear here once candidates start applying'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden divide-y divide-gray-200">
                {sortedApplications.map((application) => (
                  <div key={application.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {application.candidate_name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {application.internship_role}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(application.status)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Building className="w-3 h-3" />
                        <span className="truncate">{application.company_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{application.candidate_email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(application.applied_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }).replace(/ /g, '-')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewResume(application.resume)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownloadResume(application.resume, application.candidate_name)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>

                      {application.status === 'pending' && (
                        <select
                          value={application.status}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'accepted') {
                              handleStatusChange(application, 'accept');
                            } else if (value === 'rejected') {
                              handleStatusChange(application, 'reject');
                            }
                          }}
                          disabled={updatingStatus === application.id}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="pending">Action</option>
                          <option value="accepted">Accept</option>
                          <option value="rejected">Reject</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Position & Company
                      </th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                        Contact Info
                      </th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Applied Date
                      </th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Resume
                      </th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedApplications.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 lg:h-10 lg:w-10">
                              <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-3 lg:ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {application.candidate_name || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {application.internship_role}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            <span className="truncate">{application.company_name}</span>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                          <div className="text-sm text-gray-900 space-y-1">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="truncate">{application.candidate_email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{application.candidate_phone || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-xs lg:text-sm">
                              {new Date(application.applied_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              }).replace(/ /g, '-')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center gap-1 lg:gap-2">
                            <button
                              onClick={() => handleViewResume(application.resume)}
                              className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span className="hidden lg:inline">View</span>
                            </button>
                            <button
                              onClick={() => handleDownloadResume(application.resume, application.candidate_name)}
                              className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span className="hidden lg:inline">Download</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          {application.status === 'pending' ? (
                            <select
                              value={application.status}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === 'accepted') {
                                  handleStatusChange(application, 'accept');
                                } else if (value === 'rejected') {
                                  handleStatusChange(application, 'reject');
                                }
                              }}
                              disabled={updatingStatus === application.id}
                              className="w-full px-2 lg:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="pending">Select Action</option>
                              <option value="accepted">Accept</option>
                              <option value="rejected">Reject</option>
                            </select>
                          ) : (
                            getStatusBadge(application.status)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${showConfirmDialog.action === 'accept' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                  {showConfirmDialog.action === 'accept' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Confirm {showConfirmDialog.action === 'accept' ? 'Acceptance' : 'Rejection'}
                </h3>
              </div>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Are you sure you want to {showConfirmDialog.action} the application from{' '}
                <span className="font-medium">{showConfirmDialog.application?.candidate_name}</span> for{' '}
                <span className="font-medium">{showConfirmDialog.application?.internship_role}</span>?
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-end">
                <button
                  onClick={() => setShowConfirmDialog({ show: false, action: null, application: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusChange}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors order-1 sm:order-2 ${showConfirmDialog.action === 'accept'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  Confirm {showConfirmDialog.action === 'accept' ? 'Accept' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default InternshipApplications;
import CandidateDashboardSkeleton from '../skeleton/CandidateDashboardSkeleton';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  Briefcase,
  AlertCircle,
  Search,
  MapPin,
  Building2,
  Loader2,
  CheckCircle,
  ArrowRight,
  X,
  FileText,
  Mail,
  Phone,
  User,
  Clock,
  Sparkles,
  Wallet,
  GraduationCap,
} from 'lucide-react';

const baseApi = import.meta.env.VITE_BASE_API;

interface Internship {
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
  contact_email: string;
  contact_mobile_number: string;
  company_information: string;
  internship_responsibilities: string;
  total_vacancies: number;
  country: string;
  state: string;
  district: string;
  created_at: string;
  created_by: number;
}

interface SavedInternshipItem {
  id: number;
  internship: Internship;
  created_at: string;
}

const SavedInternships: React.FC = () => {
  const [savedJobs, setSavedJobs] = useState<SavedInternshipItem[]>([]);
  const [appliedInternships, setAppliedInternships] = useState<Set<number>>(new Set());
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');

  useEffect(() => {
    const fetchSavedInternships = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        setLoading(false);
        return;
      }

      try {
        const headers = {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        };

        const [savedResponse, appliedResponse] = await Promise.all([
          axios.get(`${baseApi}/candidates/saved-internships/`, { headers }),
          axios.get(`${baseApi}/candidates/list-applications/`, { headers }),
        ]);

        setSavedJobs(Array.isArray(savedResponse.data) ? savedResponse.data : []);

        const appliedIds = new Set<number>(
          (Array.isArray(appliedResponse.data) ? appliedResponse.data : []).map(
            (application: any) => Number(application.internship.id)
          )
        );
        setAppliedInternships(appliedIds);
      } catch (err: any) {
        setError(
          err.response?.data?.detail ||
            err.response?.data?.error ||
            'Failed to load saved internships.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSavedInternships();
  }, []);

  const filteredSavedJobs = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return savedJobs.filter(({ internship }) => {
      return (
        internship.company_name.toLowerCase().includes(q) ||
        internship.internship_role.toLowerCase().includes(q) ||
        internship.internship_field.toLowerCase().includes(q) ||
        internship.required_skills.toLowerCase().includes(q)
      );
    });
  }, [savedJobs, searchQuery]);

  const daysUntilDeadline = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const resetModal = () => {
    setSelectedInternship(null);
    setResumeFile(null);
    setCandidateName('');
    setCandidateEmail('');
    setCandidatePhone('');
    setError(null);
  };

  const handleUnsave = async (internshipId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      return;
    }

    setRemovingIds((prev) => new Set([...prev, internshipId]));
    setError(null);

    try {
      const response = await axios.post(
        `${baseApi}/candidates/saved-internships/toggle/`,
        { internship_id: internshipId },
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSavedJobs((prev) =>
        prev.filter((item) => item.internship.id !== internshipId)
      );

      setSuccessMessage(response.data.message || 'Internship removed from saved list.');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          'Failed to remove saved internship.'
      );
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(internshipId);
        return next;
      });
    }
  };

  const handleApply = async (internship: Internship) => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      if (!resumeFile) {
        throw new Error('Please upload a resume before applying.');
      }

      const formData = new FormData();
      formData.append('internship', internship.id.toString());
      formData.append('company_name', internship.company_name);
      formData.append('internship_role', internship.internship_role);
      formData.append('internship_type', internship.internship_type);
      formData.append('internship_field', internship.internship_field);
      formData.append('internship_nature', internship.internship_nature);
      formData.append('internship_description', internship.internship_description);
      formData.append('required_skills', internship.required_skills);
      formData.append('duration_months', internship.duration_months.toString());
      formData.append('application_start_date', internship.application_start_date);
      formData.append('application_end_date', internship.application_end_date);
      formData.append('stipend', internship.stipend);
      formData.append('eligibility_criteria', internship.eligibility_criteria);
      formData.append('degrees_preferred', internship.degrees_preferred);
      formData.append('contact_email', internship.contact_email);
      formData.append('contact_mobile_number', internship.contact_mobile_number);
      formData.append('company_information', internship.company_information);
      formData.append('internship_responsibilities', internship.internship_responsibilities);
      formData.append('total_vacancies', internship.total_vacancies.toString());
      formData.append('country', internship.country);
      formData.append('state', internship.state);
      formData.append('district', internship.district);
      formData.append('candidate_name', candidateName);
      formData.append('candidate_email', candidateEmail);
      formData.append('candidate_phone', candidatePhone);
      formData.append('resume', resumeFile);

      await axios.post(`${baseApi}/candidates/apply-internship/`, formData, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setAppliedInternships((prev) => new Set([...prev, internship.id]));
      setSuccessMessage('Application submitted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      resetModal();
    } catch (err: any) {
      setError(
        err.message ||
          err.response?.data?.detail ||
          'Failed to apply for internship. Please try again.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <CandidateDashboardSkeleton>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-8 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-slate-600">Loading your saved internships...</p>
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  return (
    <CandidateDashboardSkeleton>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />
            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200">
                  <Sparkles className="w-4 h-4" />
                  Bookmark workspace
                </div>
                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Saved Internships
                </h1>
                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Keep track of opportunities you want to revisit and apply when ready.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-w-full xl:min-w-[560px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Saved</p>
                  <h3 className="text-3xl font-bold mt-2">{savedJobs.length}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Visible Results</p>
                  <h3 className="text-3xl font-bold mt-2">{filteredSavedJobs.length}</h3>
                </div>
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Applied</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {filteredSavedJobs.filter((item) => appliedInternships.has(item.internship.id)).length}
                  </h3>
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

          {successMessage && (
            <div className="rounded-[28px] border border-green-200 bg-green-50 p-4 sm:p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Success</h3>
                  <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="relative w-full lg:max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search saved internships by company, role, field, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm sm:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>
          </div>

          {filteredSavedJobs.length === 0 ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-5">
                <Bookmark className="h-10 w-10 text-slate-400" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                No saved internships yet
              </h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Save interesting opportunities while browsing so you can return to them later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredSavedJobs.map((item) => {
                const internship = item.internship;
                const isApplied = appliedInternships.has(internship.id);
                const isRemoving = removingIds.has(internship.id);
                const daysLeft = daysUntilDeadline(internship.application_end_date);
                const isClosingSoon = daysLeft <= 2 && daysLeft >= 0;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col h-full rounded-[32px] border border-slate-200/70 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden hover:shadow-[0_16px_50px_rgba(15,23,42,0.12)] transition-all duration-300"
                  >
                    <div className="p-5 sm:p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                            {internship.internship_role}
                          </h3>
                          <p className="text-sm sm:text-base text-blue-700 mt-1 truncate font-medium">
                            {internship.company_name}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnsave(internship.id)}
                          disabled={isRemoving}
                          className="inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 shadow-sm hover:bg-blue-100 transition-all duration-200"
                          title="Remove from saved"
                        >
                          {isRemoving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <BookmarkCheck className="w-4 h-4 fill-current" />
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <span className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 text-blue-700 px-3 py-2 text-sm border border-blue-100">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          {internship.district}, {internship.state}
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 text-indigo-700 px-3 py-2 text-sm border border-indigo-100">
                          <Briefcase className="w-4 h-4" />
                          {internship.internship_nature.replace('_', ' ')}
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 text-emerald-700 px-3 py-2 text-sm border border-emerald-100">
                          <Wallet className="w-4 h-4" />
                          {internship.stipend}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-5">
                        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3">
                          <p className="text-xs text-amber-600">Duration</p>
                          <p className="text-sm font-semibold text-slate-900 mt-1">
                            {internship.duration_months} months
                          </p>
                        </div>

                        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3">
                          <p className="text-xs text-rose-600">Vacancies</p>
                          <p className="text-sm font-semibold text-slate-900 mt-1">
                            {internship.total_vacancies} positions
                          </p>
                        </div>

                        <div className="rounded-2xl bg-cyan-50 border border-cyan-100 p-3">
                          <p className="text-xs text-cyan-600">Saved On</p>
                          <p className="text-sm font-semibold text-slate-900 mt-1">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-fuchsia-50 border border-fuchsia-100 p-3">
                          <p className="text-xs text-fuchsia-600">Field</p>
                          <p className="text-sm font-semibold text-slate-900 mt-1 capitalize">
                            {internship.internship_field.replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="text-xs font-semibold text-teal-600 mb-2">Description</p>
                        <p className="text-sm text-slate-700 leading-relaxed min-h-[66px]">
                          {internship.internship_description.slice(0, 150)}
                          {internship.internship_description.length > 150 ? '...' : ''}
                        </p>
                      </div>

                      <div className="mt-auto pt-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-black flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Apply by {new Date(internship.application_end_date).toLocaleDateString()}
                          </span>

                          {isClosingSoon && (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                              Closing Soon
                            </span>
                          )}
                        </div>

                        {isApplied ? (
                          <div className="w-full px-4 py-2.5 bg-green-100 text-green-700 text-sm rounded-2xl font-medium flex items-center justify-center border border-green-200">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Applied
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedInternship(internship)}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold transition"
                          >
                            Apply Now
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedInternship && (
            <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
              <div className="min-h-full flex items-center justify-center">
                <div className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                        Apply for {selectedInternship.internship_role}
                      </h2>
                      <p className="text-slate-300 text-sm mt-1 truncate">
                        {selectedInternship.company_name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={resetModal}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 lg:p-6 max-h-[82vh] overflow-y-auto">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      <div className="space-y-4">
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                          <h3 className="text-base font-bold text-slate-900 mb-3">Internship Details</h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-slate-500">Type & Nature</p>
                              <p className="font-semibold text-slate-900 mt-1">
                                {selectedInternship.internship_type.replace('_', ' ')} •{' '}
                                {selectedInternship.internship_nature.replace('_', ' ')}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Duration</p>
                              <p className="font-semibold text-slate-900 mt-1">
                                {selectedInternship.duration_months} months
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Location</p>
                              <p className="font-semibold text-slate-900 mt-1">
                                {selectedInternship.district}, {selectedInternship.state}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Stipend</p>
                              <p className="font-semibold text-emerald-700 mt-1">
                                {selectedInternship.stipend}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                          <h3 className="text-base font-bold text-slate-900 mb-3">Role Overview</h3>
                          <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                            <div>
                              <p className="font-semibold text-slate-900 mb-1">Description</p>
                              <p>{selectedInternship.internship_description}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 mb-1">Responsibilities</p>
                              <p>{selectedInternship.internship_responsibilities}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 mb-1">Required Skills</p>
                              <p>{selectedInternship.required_skills}</p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                          <h3 className="text-base font-bold text-slate-900 mb-3">Eligibility & Contact</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-blue-600" />
                                Eligibility
                              </p>
                              <p className="text-slate-700">{selectedInternship.eligibility_criteria}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="font-semibold text-slate-900 mb-1">Preferred Degrees</p>
                              <p className="text-slate-700">{selectedInternship.degrees_preferred}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="font-semibold text-slate-900 mb-1">Contact Email</p>
                              <p className="text-slate-700 break-all">{selectedInternship.contact_email}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="font-semibold text-slate-900 mb-1">Contact Number</p>
                              <p className="text-slate-700">{selectedInternship.contact_mobile_number}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="rounded-[22px] border border-slate-200 bg-white p-4 sticky top-4">
                          <h3 className="text-base font-bold text-slate-900 mb-4">Apply for this Position</h3>

                          <div className="space-y-3">
                            <div>
                              <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                                <User className="h-4 w-4 mr-2" />
                                Full Name *
                              </label>
                              <input
                                type="text"
                                value={candidateName}
                                onChange={(e) => setCandidateName(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                              />
                            </div>

                            <div>
                              <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                                <Mail className="h-4 w-4 mr-2" />
                                Email Address *
                              </label>
                              <input
                                type="email"
                                value={candidateEmail}
                                onChange={(e) => setCandidateEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                              />
                            </div>

                            <div>
                              <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                                <Phone className="h-4 w-4 mr-2" />
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                value={candidatePhone}
                                onChange={(e) => setCandidatePhone(e.target.value)}
                                placeholder="Enter your phone number"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                              />
                            </div>

                            <div>
                              <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                                <FileText className="h-4 w-4 mr-2" />
                                Upload Resume *
                              </label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) =>
                                  setResumeFile(e.target.files ? e.target.files[0] : null)
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                              />
                              {resumeFile && (
                                <p className="mt-2 text-sm text-green-600 flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  {resumeFile.name}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-5 flex flex-col gap-3">
                            <button
                              onClick={() => handleApply(selectedInternship)}
                              disabled={
                                actionLoading ||
                                !resumeFile ||
                                !candidateName.trim() ||
                                !candidateEmail.trim() ||
                                !candidatePhone.trim()
                              }
                              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 font-semibold transition inline-flex items-center justify-center gap-2"
                            >
                              {actionLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  Apply Now
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>

                            <button
                              onClick={resetModal}
                              className="w-full rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 font-semibold transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default SavedInternships;
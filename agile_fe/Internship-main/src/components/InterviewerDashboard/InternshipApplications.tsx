import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Filter,
  Calendar,
  Mail,
  Phone,
  Building,
  User,
  Clock,
  AlertCircle,
  Check,
  X,
  Sparkles,
  FolderOpen,
  Loader2,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import InterviewerDashboardSkeleton from "../skeleton/InterviewerDashboardSkeleton";

const baseApi = import.meta.env.VITE_BASE_API;

const api = axios.create({
  baseURL: baseApi,
});

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

const InternshipApplications: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("applied_at");
  const [statusFilter, setStatusFilter] = useState("all");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    show: boolean;
    action: "accept" | "reject" | null;
    application: Application | null;
  }>({
    show: false,
    action: null,
    application: null,
  });

  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Please log in to access this page.");
      setTimeout(() => navigate("/login"), 0);
      return null;
    }
    return { Authorization: `Token ${token}` };
  };

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      setError(null);

      const headers = getAuthHeaders();
      if (!headers) return;

      try {
        const response = await api.get("/interviewer/applications/", { headers });
        setApplications(response.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.removeItem("access_token");
          setTimeout(() => navigate("/login"), 0);
        } else {
          setError("Failed to load applications. Please try again later.");
        }
        console.error("Error fetching applications:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [navigate]);

  const acceptApplication = async (applicationId: number) => {
    const headers = getAuthHeaders();
    if (!headers) return false;

    try {
      setUpdatingStatus(applicationId);
      const response = await api.patch(
        `/interviewer/applications/${applicationId}/accept/`,
        {},
        { headers }
      );
      setSuccess(response.data.message || "Application accepted successfully!");
      return true;
    } catch (err: any) {
      console.error("Error accepting application:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("access_token");
        setTimeout(() => navigate("/login"), 0);
      } else {
        setError("Failed to accept application. Please try again.");
      }
      return false;
    } finally {
      setUpdatingStatus(null);
    }
  };

  const rejectApplication = async (applicationId: number) => {
    const headers = getAuthHeaders();
    if (!headers) return false;

    try {
      setUpdatingStatus(applicationId);
      const response = await api.patch(
        `/interviewer/applications/${applicationId}/reject/`,
        {},
        { headers }
      );
      setSuccess(response.data.message || "Application rejected successfully!");
      return true;
    } catch (err: any) {
      console.error("Error rejecting application:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("access_token");
        setTimeout(() => navigate("/login"), 0);
      } else {
        setError("Failed to reject application. Please try again.");
      }
      return false;
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleStatusChange = (
    application: Application,
    action: "accept" | "reject"
  ) => {
    setShowConfirmDialog({
      show: true,
      action,
      application,
    });
  };

  const confirmStatusChange = async () => {
    if (!showConfirmDialog.application || !showConfirmDialog.action) return;

    const { application, action } = showConfirmDialog;

    const result =
      action === "accept"
        ? await acceptApplication(application.id)
        : await rejectApplication(application.id);

    if (result) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === application.id
            ? {
                ...app,
                status: action === "accept" ? "accepted" : "rejected",
              }
            : app
        )
      );
    }

    setShowConfirmDialog({
      show: false,
      action: null,
      application: null,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 px-3 py-1.5 text-xs font-semibold border border-green-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 px-3 py-1.5 text-xs font-semibold border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1.5 text-xs font-semibold border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  const safeLowerIncludes = (
    value: string | null | undefined,
    search: string
  ) => (value ?? "").toLowerCase().includes(search.toLowerCase());

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        safeLowerIncludes(app.candidate_name, searchTerm) ||
        safeLowerIncludes(app.internship_role, searchTerm) ||
        safeLowerIncludes(app.company_name, searchTerm) ||
        safeLowerIncludes(app.candidate_email, searchTerm);

      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const sortedApplications = useMemo(() => {
    return [...filteredApplications].sort((a, b) => {
      if (sortBy === "applied_at") {
        return (
          new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
        );
      }
      if (sortBy === "candidate_name") {
        return a.candidate_name.localeCompare(b.candidate_name);
      }
      if (sortBy === "company_name") {
        return a.company_name.localeCompare(b.company_name);
      }
      if (sortBy === "internship_role") {
        return a.internship_role.localeCompare(b.internship_role);
      }
      return 0;
    });
  }, [filteredApplications, sortBy]);

  const handleViewResume = (resumeUrl: string) => {
    window.open(`${baseApi}${resumeUrl}`, "_blank");
  };

  const handleDownloadResume = async (
    resumeUrl: string,
    candidateName: string
  ) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await api.get(resumeUrl, {
        headers,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${candidateName}_resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess("Resume downloaded successfully.");
    } catch (err) {
      console.error("Error downloading resume:", err);
      setError("Failed to download resume.");
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((app) => app.status === "pending").length,
    accepted: applications.filter((app) => app.status === "accepted").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
  };

  const formatAppliedDate = (value: string) =>
    new Date(value)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />

            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200">
                  <Sparkles className="w-4 h-4" />
                  Candidate application workspace
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Internship Applications
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Review candidate profiles, view resumes, and update application
                  status.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-full xl:min-w-[720px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Total</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
                  <p className="text-xs text-slate-300 mt-1">All applications</p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Pending</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.pending}</h3>
                  <p className="text-xs text-slate-300 mt-1">Awaiting review</p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Accepted</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.accepted}</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Approved candidates
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Rejected</p>
                  <h3 className="text-3xl font-bold mt-2">{stats.rejected}</h3>
                  <p className="text-xs text-slate-300 mt-1">Declined profiles</p>
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

          {success && (
            <div className="rounded-[28px] border border-green-200 bg-green-50 p-4 sm:p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Success</h3>
                  <p className="text-sm text-green-700 mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
              <div className="flex-1 max-w-full lg:max-w-md">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by candidate, role, company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm sm:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <div
                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                      statusFilter === "pending"
                        ? "text-amber-600"
                        : statusFilter === "accepted"
                        ? "text-green-600"
                        : statusFilter === "rejected"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`appearance-none min-w-[170px] rounded-2xl px-10 pr-10 py-3 text-sm font-medium outline-none transition ${
                      statusFilter === "pending"
                        ? "border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                        : statusFilter === "accepted"
                        ? "border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 focus:border-green-400 focus:ring-4 focus:ring-green-100"
                        : statusFilter === "rejected"
                        ? "border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 text-red-800 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                        : "border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    }`}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <ChevronDown
                    className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                      statusFilter === "pending"
                        ? "text-amber-600"
                        : statusFilter === "accepted"
                        ? "text-green-600"
                        : statusFilter === "rejected"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none min-w-[170px] rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 px-10 pr-10 py-3 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                  >
                    <option value="applied_at">Sort by Date</option>
                    <option value="candidate_name">Sort by Candidate</option>
                    <option value="company_name">Sort by Company</option>
                    <option value="internship_role">Sort by Role</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">
            {isLoading ? (
              <div className="p-10 sm:p-14 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600">Loading applications...</p>
              </div>
            ) : sortedApplications.length === 0 ? (
              <div className="p-10 sm:p-14 text-center">
                <FolderOpen className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No applications found
                </h3>
                <p className="text-slate-500 text-sm sm:text-base">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters."
                    : "Applications will appear here once candidates start applying."}
                </p>
              </div>
            ) : (
              <>
                <div className="block lg:hidden divide-y divide-slate-100">
                  {sortedApplications.map((application) => (
                    <div key={application.id} className="p-4 sm:p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-11 w-11 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>

                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-blue-700 truncate">
                              {application.candidate_name || "N/A"}
                            </div>
                            <div className="text-xs text-violet-600 truncate mt-1 font-medium">
                              {application.internship_role}
                            </div>
                          </div>
                        </div>

                        {getStatusBadge(application.status)}
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <Building className="w-4 h-4 text-emerald-500" />
                          <span className="truncate font-medium">
                            {application.company_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-700">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="truncate">
                            {application.candidate_email || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-amber-700">
                          <Phone className="w-4 h-4 text-amber-500" />
                          <span>{application.candidate_phone || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-cyan-700">
                          <Calendar className="w-4 h-4 text-cyan-500" />
                          <span className="font-medium">
                            {formatAppliedDate(application.applied_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          onClick={() => handleViewResume(application.resume)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2.5 text-sm font-medium transition"
                        >
                          <Eye className="w-4 h-4" />
                          View Resume
                        </button>

                        <button
                          onClick={() =>
                            handleDownloadResume(
                              application.resume,
                              application.candidate_name
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 text-sm font-medium transition"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>

                      {application.status === "pending" && (
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <button
                            onClick={() =>
                              handleStatusChange(application, "accept")
                            }
                            disabled={updatingStatus === application.id}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-4 py-3 text-sm font-semibold transition"
                          >
                            <Check className="w-4 h-4" />
                            Accept
                          </button>

                          <button
                            onClick={() =>
                              handleStatusChange(application, "reject")
                            }
                            disabled={updatingStatus === application.id}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white px-4 py-3 text-sm font-semibold transition"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Candidate
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Position & Company
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Contact Info
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Applied Date
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Resume
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Status / Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {sortedApplications.map((application) => (
                        <tr
                          key={application.id}
                          className="hover:bg-blue-50/40 transition-colors"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>

                              <div>
                                <div className="text-sm font-semibold text-blue-700">
                                  {application.candidate_name || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="text-sm font-semibold text-violet-700">
                              {application.internship_role}
                            </div>
                            <div className="text-sm text-emerald-700 flex items-center gap-2 mt-1">
                              <Building className="w-4 h-4 text-emerald-500" />
                              <span className="font-medium">
                                {application.company_name}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-blue-700">
                                <Mail className="w-4 h-4 text-blue-500" />
                                <span className="truncate">
                                  {application.candidate_email || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-amber-700">
                                <Phone className="w-4 h-4 text-amber-500" />
                                <span>{application.candidate_phone || "N/A"}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="inline-flex items-center gap-2 text-sm text-cyan-700 font-medium">
                              <Calendar className="w-4 h-4 text-cyan-500" />
                              <span>{formatAppliedDate(application.applied_at)}</span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewResume(application.resume)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2.5 text-sm font-medium transition"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>

                              <button
                                onClick={() =>
                                  handleDownloadResume(
                                    application.resume,
                                    application.candidate_name
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 text-sm font-medium transition"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            {application.status === "pending" ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleStatusChange(application, "accept")
                                  }
                                  disabled={updatingStatus === application.id}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-4 py-2.5 text-sm font-semibold transition"
                                >
                                  <Check className="w-4 h-4" />
                                  Accept
                                </button>

                                <button
                                  onClick={() =>
                                    handleStatusChange(application, "reject")
                                  }
                                  disabled={updatingStatus === application.id}
                                  className="inline-flex items-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white px-4 py-2.5 text-sm font-semibold transition"
                                >
                                  <X className="w-4 h-4" />
                                  Reject
                                </button>
                              </div>
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

          {showConfirmDialog.show && (
            <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm p-4">
              <div className="min-h-full flex items-center justify-center">
                <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 py-4">
                    <h3 className="text-lg font-bold text-white">
                      Confirm{" "}
                      {showConfirmDialog.action === "accept"
                        ? "Acceptance"
                        : "Rejection"}
                    </h3>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-3 mb-5">
                      <div
                        className={`p-2 rounded-2xl ${
                          showConfirmDialog.action === "accept"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {showConfirmDialog.action === "accept" ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>

                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                        Are you sure you want to{" "}
                        <span className="font-semibold">
                          {showConfirmDialog.action}
                        </span>{" "}
                        the application from{" "}
                        <span className="font-semibold">
                          {showConfirmDialog.application?.candidate_name}
                        </span>{" "}
                        for{" "}
                        <span className="font-semibold">
                          {showConfirmDialog.application?.internship_role}
                        </span>
                        ?
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                      <button
                        onClick={() =>
                          setShowConfirmDialog({
                            show: false,
                            action: null,
                            application: null,
                          })
                        }
                        className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={confirmStatusChange}
                        className={`px-4 py-3 rounded-2xl text-white font-medium transition ${
                          showConfirmDialog.action === "accept"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        Confirm{" "}
                        {showConfirmDialog.action === "accept"
                          ? "Accept"
                          : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default InternshipApplications;
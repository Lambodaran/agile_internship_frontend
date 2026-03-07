import CandidateDashboardSkeleton from '../skeleton/CandidateDashboardSkeleton'
import { useState, useEffect } from "react";
import axios from "axios";
import { Search, MapPin, Clock, Calendar, Users, Building2, X, FileText, Mail, Phone, User, CheckCircle, AlertCircle } from "lucide-react";

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

const CandidateInternship: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedNature, setSelectedNature] = useState("");
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(false);
  const [appliedDataLoading, setAppliedDataLoading] = useState(true); // New loading state for applied data
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [appliedInternships, setAppliedInternships] = useState<Set<number>>(new Set());

  // Load applied internships from localStorage immediately on component mount
  useEffect(() => {
    const storedApplied = localStorage.getItem('appliedInternships');
    if (storedApplied) {
      try {
        const appliedArray = JSON.parse(storedApplied);
        if (Array.isArray(appliedArray)) {
          setAppliedInternships(new Set<number>(appliedArray.map(id => Number(id))));
        }
      } catch (parseErr) {
        console.log("Could not parse stored applied internships");
        // Clear invalid data
        localStorage.removeItem('appliedInternships');
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setAppliedDataLoading(true);
      setError(null);

      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        setAppliedDataLoading(false);
        return;
      }

      try {
        // Fetch internships and applied data in parallel
        const [internshipsResult, appliedResult] = await Promise.allSettled([
          axios.get(`${baseApi}/internships/all-internships/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }),
          axios.get(`${baseApi}/candidates/list-applications/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          })
        ]);

        // Handle internships response
        if (internshipsResult.status === 'fulfilled') {
          const formattedInternships = internshipsResult.value.data.map((internship: any) => ({
            ...internship,
            internship_field: internship.internship_field || "",
            duration_months: internship.duration_months || 0,
            application_start_date: internship.application_start_date || "",
            eligibility_criteria: internship.eligibility_criteria || "",
            degrees_preferred: internship.degrees_preferred || "",
            contact_email: internship.contact_email || "",
            contact_mobile_number: internship.contact_mobile_number || "",
            company_information: internship.company_information || "",
            internship_responsibilities: internship.internship_responsibilities || "",
          }));
          setInternships(formattedInternships);
        } else {
          throw new Error("Failed to fetch internships");
        }

        // Handle applied internships response
        if (appliedResult.status === 'fulfilled') {
          const appliedIds = new Set<number>(
            appliedResult.value.data.map((application: any) => Number(application.internship.id))
          );
          setAppliedInternships(appliedIds);
          localStorage.setItem('appliedInternships', JSON.stringify(Array.from(appliedIds)));
        } else {
          console.log("Could not fetch applied internships from API, using localStorage data");
        }

      } catch (err: any) {
        setError(
          err.message ||
          err.response?.data?.detail ||
          "Failed to fetch data. Please try again."
        );
      } finally {
        setLoading(false);
        setAppliedDataLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredInternships = internships
    .filter((internship) =>
      (selectedNature ? internship.internship_nature === selectedNature : true) &&
      (internship.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        internship.internship_role.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const daysSincePosted = (date: string) => {
    const postedDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - postedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleApply = async (internship: Internship) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      if (!resumeFile) {
        throw new Error("Please upload a resume before applying.");
      }

      const formData = new FormData();
      formData.append("internship", internship.id.toString());
      formData.append("company_name", internship.company_name);
      formData.append("internship_role", internship.internship_role);
      formData.append("internship_type", internship.internship_type);
      formData.append("internship_field", internship.internship_field);
      formData.append("internship_nature", internship.internship_nature);
      formData.append("internship_description", internship.internship_description);
      formData.append("required_skills", internship.required_skills);
      formData.append("duration_months", internship.duration_months.toString());
      formData.append("application_start_date", internship.application_start_date);
      formData.append("application_end_date", internship.application_end_date);
      formData.append("stipend", internship.stipend);
      formData.append("eligibility_criteria", internship.eligibility_criteria);
      formData.append("degrees_preferred", internship.degrees_preferred);
      formData.append("contact_email", internship.contact_email);
      formData.append("contact_mobile_number", internship.contact_mobile_number);
      formData.append("company_information", internship.company_information);
      formData.append("internship_responsibilities", internship.internship_responsibilities);
      formData.append("total_vacancies", internship.total_vacancies.toString());
      formData.append("country", internship.country);
      formData.append("state", internship.state);
      formData.append("district", internship.district);
      formData.append("candidate_name", candidateName);
      formData.append("candidate_email", candidateEmail);
      formData.append("candidate_phone", candidatePhone);

      if (resumeFile) formData.append("resume", resumeFile);

      const response = await axios.post(`${baseApi}/candidates/apply-internship/`, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMessage("Application submitted successfully!");

      // Add the internship ID to applied internships set
      const newAppliedSet = new Set(appliedInternships).add(internship.id);
      setAppliedInternships(newAppliedSet);

      // Update localStorage
      localStorage.setItem('appliedInternships', JSON.stringify(Array.from(newAppliedSet)));

      setTimeout(() => setSuccessMessage(null), 5000);
      setResumeFile(null);
      setSelectedInternship(null);
      setCandidateName("");
      setCandidateEmail("");
      setCandidatePhone("");
    } catch (err: any) {
      setError(
        err.message ||
        err.response?.data?.detail ||
        "Failed to apply for internship. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setSelectedInternship(null);
    setResumeFile(null);
    setCandidateName("");
    setCandidateEmail("");
    setCandidatePhone("");
    setError(null);
  };

  // Helper function to determine if we should show the apply button
  const shouldShowApplyButton = (internshipId: number) => {
    // If we're still loading applied data, show loading state
    if (appliedDataLoading) return null;

    // If applied, show applied state
    if (appliedInternships.has(internshipId)) return false;

    // Otherwise show apply button
    return true;
  };

  return (
    <CandidateDashboardSkeleton>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Find Your Perfect Internship</h1>
            <p className="text-gray-600 text-base sm:text-lg">Discover amazing opportunities to kickstart your career</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg shadow-sm">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg shadow-sm">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                <p className="text-green-700 text-sm">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by company name or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="w-full md:w-auto flex items-center gap-2">
                <select
                  value={selectedNature}
                  onChange={(e) => setSelectedNature(e.target.value)}
                  className="w-full md:w-48 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">All Types</option>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center text-sm text-gray-600">
              <span className="font-medium mr-1 text-bold">{filteredInternships.length}</span>Internships found
              {appliedDataLoading && (
                <span className="mt-2 sm:mt-0 sm:ml-4 text-blue-600 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                  Loading application status...
                </span>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && !selectedInternship && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4">Loading internships...</p>
            </div>
          )}

          {/* Internships Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInternships.map((internship) => {
              const applyButtonState = shouldShowApplyButton(internship.id);

              return (
                <div
                  key={internship.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200 group"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                    <div className="flex-1 mb-2 sm:mb-0">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {internship.company_name}
                      </h3>
                      <p className="text-gray-600 font-medium">{internship.internship_role}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${internship.internship_nature === 'full_time'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}>
                      {internship.internship_nature.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{internship.district}, {internship.state}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{internship.duration_months} months</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{internship.total_vacancies} positions</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-lg font-semibold text-green-600">
                      {internship.stipend}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="text-sm text-gray-500 flex items-center flex-shrink-0">
                      <Calendar className="h-4 w-4 mr-1" />
                      {`Posted ${daysSincePosted(internship.created_at)} ${daysSincePosted(internship.created_at) === 1 ? "day" : "days"
                        } ago`}
                    </span>

                    {applyButtonState === null ? (
                      <div className="px-4 py-2 bg-gray-100 text-gray-500 text-sm rounded-lg font-medium flex items-center justify-center w-full sm:w-auto">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-500 mr-1"></div>
                        Loading...
                      </div>
                    ) : applyButtonState === false ? (
                      <span className="px-4 py-2 bg-green-100 text-green-700 text-sm rounded-lg font-medium flex items-center justify-center w-full sm:w-auto">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Applied
                      </span>
                    ) : (
                      <button
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium w-full sm:w-auto"
                        onClick={() => setSelectedInternship(internship)}
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {!loading && filteredInternships.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No internships found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or check back later.</p>
            </div>
          )}

          {/* Modal */}
          {selectedInternship && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 md:scale-100">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedInternship.internship_role}</h2>
                      <p className="text-gray-600">{selectedInternship.company_name}</p>
                    </div>
                    <button
                      onClick={resetModal}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="h-6 w-6 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Internship Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Type & Nature</label>
                        <p className="text-gray-900">{selectedInternship.internship_type.replace("_", " ")} • {selectedInternship.internship_nature.replace("_", " ")}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Field</label>
                        <p className="text-gray-900">{selectedInternship.internship_field}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Duration</label>
                        <p className="text-gray-900">{selectedInternship.duration_months} months</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Stipend</label>
                        <p className="text-green-600 font-semibold">{selectedInternship.stipend}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Location</label>
                        <p className="text-gray-900">{selectedInternship.district}, {selectedInternship.state}, {selectedInternship.country}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Vacancies</label>
                        <p className="text-gray-900">{selectedInternship.total_vacancies} positions</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Application Period</label>
                        <p className="text-gray-900 text-sm">
                          {new Date(selectedInternship.application_start_date).toLocaleDateString()} - {new Date(selectedInternship.application_end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <hr className="my-6 border-gray-200" />

                  {/* Description and Details */}
                  <div className="space-y-6 mb-8">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700 leading-relaxed">{selectedInternship.internship_description}</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Responsibilities</h4>
                      <p className="text-gray-700 leading-relaxed">{selectedInternship.internship_responsibilities}</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Required Skills</h4>
                      <p className="text-gray-700">{selectedInternship.required_skills}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Eligibility Criteria</h4>
                        <p className="text-gray-700">{selectedInternship.eligibility_criteria}</p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Preferred Degrees</h4>
                        <p className="text-gray-700">{selectedInternship.degrees_preferred}</p>
                      </div>
                    </div>

                    {selectedInternship.company_information && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">About Company</h4>
                        <p className="text-gray-700 leading-relaxed">{selectedInternship.company_information}</p>
                      </div>
                    )}
                  </div>

                  {/* Application Form */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-6">Apply for this Position</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="candidateName" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                          <User className="h-4 w-4 mr-2" />
                          Full Name *
                        </label>
                        <input
                          id="candidateName"
                          type="text"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <label htmlFor="candidateEmail" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                          <Mail className="h-4 w-4 mr-2" />
                          Email Address *
                        </label>
                        <input
                          id="candidateEmail"
                          type="email"
                          value={candidateEmail}
                          onChange={(e) => setCandidateEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label htmlFor="candidatePhone" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <Phone className="h-4 w-4 mr-2" />
                        Phone Number *
                      </label>
                      <input
                        id="candidatePhone"
                        type="tel"
                        value={candidatePhone}
                        onChange={(e) => setCandidatePhone(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className="mb-6">
                      <label htmlFor="resumeFile" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                        <FileText className="h-4 w-4 mr-2" />
                        Upload Resume *
                      </label>
                      <div className="relative">
                        <input
                          id="resumeFile"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {resumeFile && (
                        <p className="mt-2 text-sm text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {resumeFile.name} selected
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      {appliedInternships.has(selectedInternship.id) ? (
                        <div className="flex-1 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-medium flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Already Applied
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApply(selectedInternship)}
                          disabled={
                            loading ||
                            !resumeFile ||
                            !candidateName.trim() ||
                            !candidateEmail.trim() ||
                            !candidatePhone.trim()
                          }
                          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Submitting...
                            </>
                          ) : (
                            "Apply Now"
                          )}
                        </button>
                      )}
                      <button
                        onClick={resetModal}
                        className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium w-full sm:w-auto"
                      >
                        {appliedInternships.has(selectedInternship.id) ? 'Close' : 'Cancel'}
                      </button>
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

export default CandidateInternship;
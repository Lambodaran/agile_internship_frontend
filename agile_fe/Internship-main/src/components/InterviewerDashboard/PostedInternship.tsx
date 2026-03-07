import { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Trash,
  Building2,
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  GraduationCap,
  Mail,
  Phone,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  HelpCircle,
  Percent,
  X
} from "lucide-react";
import axios from "axios";
import InterviewerDashboardSkeleton from "../skeleton/InterviewerDashboardSkeleton";

const baseApi = import.meta.env.VITE_BASE_API;

interface Internship {
  id: number;
  company_name: string;
  internship_type: string;
  internship_role: string;
  posted_date: string;
  application_end_date: string;
  status: string;
  created_at: string;
  modified_at: string;
  internship_field: string;
  internship_nature: string;
  internship_description: string;
  required_skills: string;
  duration_months: string;
  application_start_date: string;
  stipend: string;
  eligibility_criteria: string;
  degrees_preferred: string;
  contact_email: string;
  contact_mobile_number: string;
  company_information: string;
  internship_responsibilities: string;
  total_vacancies: string;
  country: string;
  state: string;
  district: string;
  quiz_set?: string;
  pass_percentage?: string;
  quiz_open_date?: string;
  quiz_open_time?: string;
}

interface QuizSet {
  id: number;
  name: string;
  title: string;
  // Add other quiz properties as needed
}

const PostedInternship = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [sortBy, setSortBy] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No authentication token found. Please log in.");
        }

        // Fetch internships and quiz sets concurrently
        const [internshipsResponse, quizSetsResponse] = await Promise.all([
          axios.get(`${baseApi}/internships/list/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }),
          axios.get(`${baseApi}/quiz/quiz-titles/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }).catch((error) => {
            console.error("Error fetching quiz sets:", error);
            return { data: [] };
          })
        ]);

        setInternships(internshipsResponse.data);
        setQuizSets(quizSetsResponse.data);

        const internshipsWithQuiz = internshipsResponse.data.filter(internship => internship.quiz_set);

      } catch (err: any) {
        console.error("Error fetching data:", err.response?.data);
        setError(
          err.message ||
          err.response?.data?.detail ||
          "Failed to fetch data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this internship?")) return;

    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      await axios.delete(`${baseApi}/internships/${id}/delete/`, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      setInternships(internships.filter((internship) => internship.id !== id));
      setSuccess("Internship deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting internship:", err.response?.data);
      setError(
        err.message ||
        err.response?.data?.detail ||
        "Failed to delete internship. Please try again."
      );
    }
  };

  const handleEdit = (internship: Internship) => {
    const quizSetId = internship.quiz_set ? internship.quiz_set.toString() : "";
    setEditingInternship({
      ...internship,
      quiz_set: quizSetId,
      application_start_date: internship.application_start_date
        ? internship.application_start_date.split("T")[0]
        : "",
      application_end_date: internship.application_end_date
        ? internship.application_end_date.split("T")[0]
        : "",
      quiz_open_date: internship.quiz_open_date
        ? internship.quiz_open_date.split("T")[0]
        : "",
    });
    setError(null);
    setSuccess(null);
    setSubmitted(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (editingInternship) {
      const { name, value } = e.target;
      setEditingInternship({ ...editingInternship, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!editingInternship) return;

    setError(null);
    setSuccess(null);

    // Step 1: Required field validation
    const requiredFields = [
      "company_name",
      "internship_role",
      "internship_type",
      "internship_field",
      "internship_nature",
      "internship_description",
      "required_skills",
      "internship_responsibilities",
      "duration_months",
      "total_vacancies",
      "application_start_date",
      "application_end_date",
      "stipend",
      "quiz_set",
      "pass_percentage",
      "quiz_open_date",
      "quiz_open_time",
      "eligibility_criteria",
      "degrees_preferred",
      "contact_email",
      "contact_mobile_number",
      "company_information",
      "country",
      "state",
      "district"
    ];

    const missingFields = requiredFields.filter(
      (field) => !editingInternship[field as keyof Internship]
    );

    if (missingFields.length > 0) {
      setError("Please fill in all required fields before updating the internship.");
      const modal = document.querySelector('.fixed.inset-0');
      if (modal) modal.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Step 2: Submit update if valid
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await axios.put(
        `${baseApi}/internships/${editingInternship.id}/edit/`,
        editingInternship,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setInternships(
        internships.map((internship) =>
          internship.id === editingInternship.id ? response.data : internship
        )
      );
      setEditingInternship(null);
      setSuccess("Internship updated successfully!");
      setSubmitted(false);
    } catch (err: any) {
      console.error("Error updating internship:", err.response?.data);
      setError(
        err.message ||
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})
          .flat()
          .join(", ") ||
        "Failed to update internship. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  const handleCancel = () => {
    setEditingInternship(null);
    setError(null);
    setSuccess(null);
    setSubmitted(false);
  };

  const renderField = (
    label: string,
    name: string,
    type = "text",
    placeholder = "",
    isTextarea = false,
    icon: React.ReactNode = null
  ) => {
    const value = editingInternship ? editingInternship[name as keyof Internship] || "" : "";
    const showError = submitted && !value;

    return (
      <div className="space-y-2">
        <label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon && <span className="text-gray-500">{icon}</span>}
          {label}
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          {isTextarea ? (
            <textarea
              id={name}
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className={`w-full border ${showError ? "border-red-300 bg-red-50" : "border-gray-300"
                } rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none`}
              rows={4}
            />
          ) : (
            <input
              type={type}
              id={name}
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className={`w-full border ${showError ? "border-red-300 bg-red-50" : "border-gray-300"
                } rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            />
          )}
          {showError && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            </div>
          )}
        </div>
        {showError && (
          <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            Please enter {label.toLowerCase()}
          </p>
        )}
      </div>
    );
  };

  const renderSelect = (
    label: string,
    name: string,
    options: any[],
    placeholder: string,
    icon: React.ReactNode = null
  ) => {
    const value = editingInternship ? editingInternship[name as keyof Internship]?.toString() || "" : "";
    const showError = submitted && !value;

    return (
      <div className="space-y-2">
        <label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon && <span className="text-gray-500">{icon}</span>}
          {label}
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            className={`w-full border ${showError ? "border-red-300 bg-red-50" : "border-gray-300"
              } rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white`}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value.toString()} value={option.value.toString()}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
          {showError && (
            <div className="absolute inset-y-0 right-8 flex items-center pr-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            </div>
          )}
        </div>
        {showError && (
          <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            Please select {label.toLowerCase()}
          </p>
        )}
      </div>
    );
  };


  // Generate quiz set options from fetched data
  const getQuizSetOptions = () => {
    return quizSets.map(quiz => ({
      value: quiz.id.toString(),
      label: quiz.title || quiz.name
    }));
  };

  //Get quiz titleById
  const getQuizTitleById = (quizId: string | number) => {
    if (!quizId) return "No Quiz Selected";

    const quiz = quizSets.find(quiz =>
      quiz.id.toString() === quizId.toString() ||
      quiz.id === parseInt(quizId.toString())
    );

    return quiz ? (quiz.title || quiz.name) : `Quiz ID: ${quizId}`;
  };

  const formSections = [
    {
      title: "Company & Role Information",
      icon: <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />,
      fields: [
        { component: () => renderField("Company Name", "company_name", "text", "Enter your company name", false, <Building2 className="h-4 w-4" />) },
        { component: () => renderField("Internship Role", "internship_role", "text", "e.g., Frontend Developer, Marketing Intern", false, <Briefcase className="h-4 w-4" />) },
        {
          component: () => renderSelect("Internship Type", "internship_type", [
            { value: "in_office", label: "In-Office" },
            { value: "hybrid", label: "Hybrid" },
            { value: "remote", label: "Remote" }
          ], "Select work arrangement", <MapPin className="h-4 w-4" />)
        },
        {
          component: () => renderSelect("Internship Field", "internship_field", [
            "accounts", "administration", "chemical", "technology", "finance", "banking",
            "healthcare", "human_resource", "education", "engineering", "retail",
            "marketing", "hospitality", "consulting", "manufacturing", "media",
            "transportation", "telecommunications", "nonprofit"
          ].map(field => ({
            value: field,
            label: field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")
          })), "Select industry field", <Briefcase className="h-4 w-4" />)
        },
        {
          component: () => renderSelect("Internship Nature", "internship_nature", [
            { value: "full_time", label: "Full Time" },
            { value: "part_time", label: "Part Time" }
          ], "Select time commitment", <Clock className="h-4 w-4" />)
        },
      ]
    },
    {
      title: "Internship Details",
      icon: <FileText className="h-4 w-4 sm:h-5 sm:w-5" />,
      fields: [
        { component: () => renderField("Internship Description", "internship_description", "text", "Describe what the intern will do and learn", true, <FileText className="h-4 w-4" />) },
        { component: () => renderField("Required Skills", "required_skills", "text", "e.g., HTML, CSS, React, Communication Skills", false, <GraduationCap className="h-4 w-4" />) },
        { component: () => renderField("Internship Responsibilities", "internship_responsibilities", "text", "List key responsibilities and tasks", true, <FileText className="h-4 w-4" />) },
        { component: () => renderField("Duration (in months)", "duration_months", "number", "e.g., 3", false, <Clock className="h-4 w-4" />) },
        { component: () => renderField("Total Vacancies", "total_vacancies", "number", "Number of positions available", false, <Users className="h-4 w-4" />) },
      ]
    },
    {
      title: "Application Timeline & Compensation",
      icon: <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />,
      fields: [
        { component: () => renderField("Application Start Date", "application_start_date", "date", "", false, <Calendar className="h-4 w-4" />) },
        { component: () => renderField("Application End Date", "application_end_date", "date", "", false, <Calendar className="h-4 w-4" />) },
        {
          component: () => renderSelect("Stipend", "stipend", [
            { value: "Unpaid", label: "Unpaid" },
            { value: "Below ₹5000", label: "Below ₹5000" },
            { value: "₹5000 - ₹10000", label: "₹5000 - ₹10000" },
            { value: "Above ₹10000", label: "Above ₹10000" }
          ], "Select compensation range", <DollarSign className="h-4 w-4" />)
        },
      ]
    },
    {
      title: "Assessment Configuration",
      icon: <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
      fields: [
        {
          component: () => renderSelect("Quiz Set", "quiz_set", getQuizSetOptions(), "Select a quiz set for assessment", <HelpCircle className="h-4 w-4" />)
        },
        { component: () => renderField("Pass Percentage", "pass_percentage", "number", "e.g., 75", false, <Percent className="h-4 w-4" />) },
        { component: () => renderField("Quiz Open Date", "quiz_open_date", "date", "", false, <Calendar className="h-4 w-4" />) },
        { component: () => renderField("Quiz Open Time", "quiz_open_time", "time", "", false, <Clock className="h-4 w-4" />) },
      ]
    },
    {
      title: "Eligibility & Requirements",
      icon: <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />,
      fields: [
        {
          component: () => renderSelect("Eligibility Criteria", "eligibility_criteria", [
            { value: "Any Graduate", label: "Any Graduate" },
            { value: "Final Year Students", label: "Final Year Students" },
            { value: "Post Graduates", label: "Post Graduates" }
          ], "Select eligibility level", <GraduationCap className="h-4 w-4" />)
        },
        {
          component: () => renderSelect("Degrees Preferred", "degrees_preferred", [
            { value: "engineering", label: "Engineering" },
            { value: "arts", label: "Arts" }
          ], "Select preferred degree type", <GraduationCap className="h-4 w-4" />)
        },
      ]
    },
    {
      title: "Contact Information",
      icon: <Mail className="h-4 w-4 sm:h-5 sm:w-5" />,
      fields: [
        { component: () => renderField("Contact Email", "contact_email", "email", "recruiting@company.com", false, <Mail className="h-4 w-4" />) },
        { component: () => renderField("Contact Mobile Number", "contact_mobile_number", "text", "+91 9876543210", false, <Phone className="h-4 w-4" />) },
        { component: () => renderField("Company Information", "company_information", "text", "Brief description about your company", true, <Building2 className="h-4 w-4" />) },
      ]
    },
    {
      title: "Location Details",
      icon: <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />,
      fields: [
        { component: () => renderField("Country", "country", "text", "e.g., India", false, <MapPin className="h-4 w-4" />) },
        { component: () => renderField("State", "state", "text", "e.g., Tamil Nadu", false, <MapPin className="h-4 w-4" />) },
        { component: () => renderField("District", "district", "text", "e.g., Coimbatore", false, <MapPin className="h-4 w-4" />) },
      ]
    }
  ];

  const sortedInternships = [...internships].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === "company") {
      return a.company_name.localeCompare(b.company_name);
    }
    return 0;
  });

  const filteredInternships = sortedInternships.filter((internship) =>
    (internship.company_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (internship.internship_role?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const formatInternshipType = (type: string | undefined | null) => {
    if (!type) return "N/A";
    return type.replace("_", " ").toUpperCase();
  };

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
              Posted Internships
            </h2>

            {/* Alert Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base text-green-700">{success}</p>
                </div>
              </div>
            )}

            {/* Edit Form Modal */}
            {editingInternship && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
                <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-6xl my-4 sm:my-8">
                  {/* Header */}
                  <div className="bg-white rounded-t-lg sm:rounded-t-xl shadow-sm border-b border-gray-200 p-3 sm:p-4 lg:p-6 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg">
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Internship</h2>
                          <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Update internship details below</p>
                        </div>
                      </div>
                      <button
                        onClick={handleCancel}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                    {formSections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
                        <div className="bg-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
                          <h3 className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-semibold text-gray-900">
                            <span className="text-blue-600">{section.icon}</span>
                            <span className="truncate">{section.title}</span>
                          </h3>
                        </div>
                        <div className="p-3 sm:p-4 lg:p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {section.fields.map((field, fieldIndex) => (
                              <div key={fieldIndex} className="w-full">
                                {field.component()}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4 sm:pt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            Update Internship
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-sm sm:text-base"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Filter and Search Controls */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort" className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                      Sort by:
                    </label>
                    <div className="relative">
                      <select
                        id="sort"
                        className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2 pr-8 sm:pr-10 text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-0"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="">Default</option>
                        <option value="date">Date Posted</option>
                        <option value="company">Company Name</option>
                      </select>
                      <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {filteredInternships.length} internship{filteredInternships.length !== 1 ? 's' : ''} found
                  </div>
                </div>

                <div className="relative w-full sm:w-64 lg:w-80">
                  <input
                    type="text"
                    placeholder="Search by company or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 pl-8 sm:pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-600">Loading internships...</p>
              </div>
            )}

            {/* Internships Grid/Cards */}
            {!loading && (
              <div className="space-y-3 sm:space-y-4">
                {filteredInternships.length === 0 ? (
                  <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-xl mb-4">
                      <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Internships Found</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                      {searchQuery
                        ? "No internships match your search criteria. Try adjusting your search terms."
                        : "You haven't posted any internships yet. Start by creating your first internship posting."}
                    </p>
                  </div>
                ) : (
                  filteredInternships.map((internship, index) => (
                    <div key={internship.id} className="bg-white shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                      {/* Card Header */}
                      <div className="p-3 sm:p-4 lg:p-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                              {internship.internship_role}
                            </h3>
                            <p className="text-sm sm:text-base text-gray-500 truncate mt-1">
                              {internship.company_name}
                            </p>
                          </div>
                          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                            <button 
                              onClick={() => handleEdit(internship)} 
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              aria-label="Edit internship"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(internship.id)} 
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              aria-label="Delete internship"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Quick Info Tags */}
                        <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4 text-xs sm:text-sm text-gray-700">
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <span className="truncate">{internship.internship_type}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <span className="truncate">{internship.internship_nature}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <span className="truncate">{internship.stipend}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <span>{internship.total_vacancies} positions</span>
                          </div>
                        </div>

                        {/* Detailed Info Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 text-xs sm:text-sm">
                          <div className="space-y-1">
                            <span className="text-gray-500 block">Posted:</span>
                            <span className="font-medium text-gray-900 block truncate">
                              {new Date(internship.application_start_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-500 block">Deadline:</span>
                            <span className="font-medium text-gray-900 block truncate">
                              {new Date(internship.application_end_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-500 block">Duration:</span>
                            <span className="font-medium text-gray-900 block">
                              {internship.duration_months} months
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-gray-500 block">Quiz:</span>
                            <span className="font-medium text-gray-900 block truncate">
                              {getQuizTitleById(internship.quiz_set || "")}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {internship.internship_description && (
                          <div className="mt-4 sm:mt-6">
                            <span className="text-gray-500 text-xs sm:text-sm font-medium block mb-2">Description:</span>
                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                              {internship.internship_description.slice(0, 200)}
                              {internship.internship_description.length > 200 && "..."}
                            </p>
                          </div>
                        )}

                        {/* Bottom Tags */}
                        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-6">
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 border border-gray-300 truncate max-w-32 sm:max-w-none">
                            Skill: {internship.required_skills}
                          </span>
                          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 border border-blue-300">
                            Pass: {internship.pass_percentage}%
                          </span>
                          <div className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 border border-green-300 hidden sm:block">
                            Opens: {internship.quiz_open_date} at {internship.quiz_open_time}
                          </div>
                          <div className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 border border-green-300 block sm:hidden">
                            Opens: {internship.quiz_open_date}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default PostedInternship;
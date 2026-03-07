import React, { useState, useEffect } from "react";

import axios from "axios";
import {
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
  Percent
} from "lucide-react";
import InterviewerDashboardSkeleton from "../skeleton/InterviewerDashboardSkeleton";
import { useNavigate } from 'react-router-dom';

const baseApi = import.meta.env.VITE_BASE_API;

const PostInternship = () => {

  const navigate = useNavigate();
  const [quizSets, setQuizSets] = useState([]);

  const [formData, setFormData] = useState({
    company_name: "",
    internship_role: "",
    internship_type: "",
    internship_field: "",
    internship_nature: "",
    internship_description: "",
    required_skills: "",
    duration_months: "",
    application_start_date: "",
    application_end_date: "",
    stipend: "",
    eligibility_criteria: "",
    degrees_preferred: "",
    contact_email: "",
    contact_mobile_number: "",
    company_information: "",
    internship_responsibilities: "",
    total_vacancies: "",
    country: "",
    state: "",
    district: "",
    // Added new fields:
    quiz_set: "",
    pass_percentage: "",
    quiz_open_date: "",
    quiz_open_time: "",
  });

  useEffect(() => {
    const fetchQuizSets = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(`${baseApi}/quiz/quiz-titles/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setQuizSets(response.data); // assuming data is array of {id, title}
      } catch (error) {
        console.error("Failed to fetch quiz sets", error);
      }
    };
    fetchQuizSets();
  }, []);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Map frontend values to backend-compatible values
    const payload = {
      ...formData,
      internship_type: formData.internship_type,
      internship_nature: formData.internship_nature,
    };

    // Log for debugging
    console.log("Payload:", payload);
    console.log("Request URL:", `${baseApi}/internships/create/`);
    console.log("Token:", localStorage.getItem("access_token"));

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const response = await axios.post(
        `${baseApi}/internships/create/`,
        payload,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setSuccess("Internship posted successfully!");
      setFormData({
        company_name: "",
        internship_role: "",
        internship_type: "",
        internship_field: "",
        internship_nature: "",
        internship_description: "",
        required_skills: "",
        duration_months: "",
        application_start_date: "",
        application_end_date: "",
        stipend: "",
        eligibility_criteria: "",
        degrees_preferred: "",
        contact_email: "",
        contact_mobile_number: "",
        company_information: "",
        internship_responsibilities: "",
        total_vacancies: "",
        country: "",
        state: "",
        district: "",
        // Added new fields:
        quiz_set: "",
        pass_percentage: "",
        quiz_open_date: "",
        quiz_open_time: "",
      });
      navigate("/posted-internship");
    } catch (err: any) {
      console.error("Error response:", err.response?.data);
      setError(
        err.message ||
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})
          .flat()
          .join(", ") ||
        "Failed to post internship. Please check your authentication and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderField = (
    label,
    name,
    type = "text",
    placeholder = "",
    isTextarea = false,
    icon = null,
    fullWidth = false
  ) => {
    const value = formData[name];
    const showError = submitted && !value;

    return (
      <div className={`space-y-2 ${fullWidth ? 'col-span-full' : ''}`}>
        <label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-gray-700 px-1">
          {icon && <span className="text-gray-500 flex-shrink-0">{icon}</span>}
          <span className="break-words">{label}</span>
          <span className="text-red-500 flex-shrink-0">*</span>
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
                } rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none`}
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
                } rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            />
          )}
          {showError && (
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>
        {showError && (
          <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1 px-1">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="break-words">Please enter {label.toLowerCase()}</span>
          </p>
        )}
      </div>
    );
  };

  const renderSelect = (label, name, options, placeholder, icon = null, fullWidth = false) => {
    const value = formData[name];
    const showError = submitted && !value;

    return (
      <div className={`space-y-2 ${fullWidth ? 'col-span-full' : ''}`}>
        <label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-gray-700 px-1">
          {icon && <span className="text-gray-500 flex-shrink-0">{icon}</span>}
          <span className="break-words">{label}</span>
          <span className="text-red-500 flex-shrink-0">*</span>
        </label>
        <div className="relative">
          <select
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            className={`w-full border ${showError ? "border-red-300 bg-red-50" : "border-gray-300"
              } rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white`}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
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
          <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1 px-1">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="break-words">Please select {label.toLowerCase()}</span>
          </p>
        )}
      </div>
    );
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
        { component: () => renderField("Internship Description", "internship_description", "text", "Describe what the intern will do and learn", true, <FileText className="h-4 w-4" />, true) },
        { component: () => renderField("Required Skills", "required_skills", "text", "e.g., HTML, CSS, React, Communication Skills", false, <GraduationCap className="h-4 w-4" />, true) },
        { component: () => renderField("Internship Responsibilities", "internship_responsibilities", "text", "List key responsibilities and tasks", true, <FileText className="h-4 w-4" />, true) },
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
          ], "Select compensation range", <DollarSign className="h-4 w-4" />, true)
        },
      ]
    },
    {
      title: "Assessment Configuration",
      icon: <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
      fields: [
        {
          component: () =>
            renderSelect(
              "Quiz Set",
              "quiz_set", // must match formData key
              quizSets.map((quiz) => ({
                value: quiz.id,
                label: quiz.title,
              })),
              "Select a quiz set for assessment",
              <HelpCircle className="h-4 w-4" />,
              true
            ),
        },
        { component: () => renderField("Pass Percentage", "pass_percentage", "number", "e.g., 75", false, <Percent className="h-4 w-4" />) },
        { component: () => renderField("Quiz Open Date", "quiz_open_date", "date", "", false, <Calendar className="h-4 w-4" />) },
        { component: () => renderField("Quiz Open Time", "quiz_open_time", "time", "", false, <Clock className="h-4 w-4" />) },
      ],
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
        { component: () => renderField("Company Information", "company_information", "text", "Brief description about your company", true, <Building2 className="h-4 w-4" />, true) },
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

  return (
    <InterviewerDashboardSkeleton>
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl mb-3 sm:mb-4">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Post New Internship</h1>
            <p className="text-sm sm:text-base text-gray-600 px-2">Fill out the details below to post your internship opportunity</p>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 mx-1 sm:mx-0">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base text-green-700 break-words">{success}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {formSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mx-1 sm:mx-0">
              <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h3 className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-semibold text-gray-900">
                  <span className="text-blue-600 flex-shrink-0">{section.icon}</span>
                  <span className="break-words">{section.title}</span>
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {section.fields.map((field, fieldIndex) => (
                    <React.Fragment key={fieldIndex}>
                      {field.component()}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Submit Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mx-1 sm:mx-0">
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
                    <span>Posting Internship...</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span>Post Internship</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default PostInternship;
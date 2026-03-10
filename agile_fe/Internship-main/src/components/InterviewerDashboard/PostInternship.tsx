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
  Percent,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import InterviewerDashboardSkeleton from "../skeleton/InterviewerDashboardSkeleton";
import { useNavigate } from "react-router-dom";

const baseApi = import.meta.env.VITE_BASE_API;

interface QuizSet {
  id: number;
  title: string;
}

interface FormDataType {
  company_name: string;
  internship_role: string;
  internship_type: string;
  internship_field: string;
  internship_nature: string;
  internship_description: string;
  required_skills: string;
  duration_months: string;
  application_start_date: string;
  application_end_date: string;
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
  quiz_set: string;
  pass_percentage: string;
  quiz_open_date: string;
  quiz_open_time: string;
}

type SelectOption = {
  value: string | number;
  label: string;
};

const initialFormData: FormDataType = {
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
  quiz_set: "",
  pass_percentage: "",
  quiz_open_date: "",
  quiz_open_time: "",
};

const PostInternship: React.FC = () => {
  const navigate = useNavigate();
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [formData, setFormData] = useState<FormDataType>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const fetchQuizSets = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(`${baseApi}/quiz/quiz-titles/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setQuizSets(response.data);
      } catch (error) {
        console.error("Failed to fetch quiz sets", error);
      }
    };

    fetchQuizSets();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (submitted) {
      setSubmitted(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    setLoading(true);

    const payload = {
      ...formData,
      internship_type: formData.internship_type,
      internship_nature: formData.internship_nature,
    };

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      await axios.post(`${baseApi}/internships/create/`, payload, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      setShowSuccessPopup(true);
      setSubmitted(false);
      setFormData(initialFormData);

      setTimeout(() => {
        setShowSuccessPopup(false);
        navigate("/posted-internship");
      }, 1500);
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
    label: string,
    name: keyof FormDataType,
    type = "text",
    placeholder = "",
    isTextarea = false,
    icon: React.ReactNode = null,
    fullWidth = false
  ) => {
    const value = formData[name];
    const showError = submitted && !value;

    return (
      <div className={`space-y-2 ${fullWidth ? "col-span-full" : ""}`}>
        <label
          htmlFor={name}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 px-1"
        >
          {icon && <span className="text-slate-500 shrink-0">{icon}</span>}
          <span>{label}</span>
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
              rows={4}
              className={`w-full rounded-2xl border ${
                showError
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-slate-50"
              } px-4 py-3 text-sm sm:text-base text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition resize-none`}
            />
          ) : (
            <input
              type={type}
              id={name}
              name={name}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className={`w-full rounded-2xl border ${
                showError
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-slate-50"
              } px-4 py-3 pr-10 text-sm sm:text-base text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition`}
            />
          )}

          {showError && (
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>

        {showError && (
          <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1 px-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Please enter {label.toLowerCase()}
          </p>
        )}
      </div>
    );
  };

  const renderSelect = (
    label: string,
    name: keyof FormDataType,
    options: SelectOption[],
    placeholder: string,
    icon: React.ReactNode = null,
    fullWidth = false
  ) => {
    const value = formData[name];
    const showError = submitted && !value;

    return (
      <div className={`space-y-2 ${fullWidth ? "col-span-full" : ""}`}>
        <label
          htmlFor={name}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 px-1"
        >
          {icon && <span className="text-slate-500 shrink-0">{icon}</span>}
          <span>{label}</span>
          <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <select
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            className={`w-full appearance-none rounded-2xl border ${
              showError
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-slate-50"
            } px-4 py-3 text-sm sm:text-base text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition`}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={String(option.value)} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />

          {showError && (
            <div className="absolute inset-y-0 right-9 flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>

        {showError && (
          <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1 px-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Please select {label.toLowerCase()}
          </p>
        )}
      </div>
    );
  };

  const sectionCompletionGroups: (keyof FormDataType)[][] = [
    [
      "company_name",
      "internship_role",
      "internship_type",
      "internship_field",
      "internship_nature",
    ],
    [
      "internship_description",
      "required_skills",
      "internship_responsibilities",
      "duration_months",
      "total_vacancies",
    ],
    ["application_start_date", "application_end_date", "stipend"],
    ["quiz_set", "pass_percentage", "quiz_open_date", "quiz_open_time"],
    ["eligibility_criteria", "degrees_preferred"],
    ["contact_email", "contact_mobile_number", "company_information"],
    ["country", "state", "district"],
  ];

  const completedSections = sectionCompletionGroups.filter((section) =>
    section.every((field) => String(formData[field]).trim() !== "")
  ).length;

  const formSections = [
    {
      title: "Company & Role Information",
      icon: <Building2 className="h-5 w-5" />,
      fields: [
        {
          component: () =>
            renderField(
              "Company Name",
              "company_name",
              "text",
              "Enter your company name",
              false,
              <Building2 className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderField(
              "Internship Role",
              "internship_role",
              "text",
              "e.g., Frontend Developer, Marketing Intern",
              false,
              <Briefcase className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderSelect(
              "Internship Type",
              "internship_type",
              [
                { value: "in_office", label: "In-Office" },
                { value: "hybrid", label: "Hybrid" },
                { value: "remote", label: "Remote" },
              ],
              "Select work arrangement",
              <MapPin className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderSelect(
              "Internship Field",
              "internship_field",
              [
                "accounts",
                "administration",
                "chemical",
                "technology",
                "finance",
                "banking",
                "healthcare",
                "human_resource",
                "education",
                "engineering",
                "retail",
                "marketing",
                "hospitality",
                "consulting",
                "manufacturing",
                "media",
                "transportation",
                "telecommunications",
                "nonprofit",
              ].map((field) => ({
                value: field,
                label:
                  field.charAt(0).toUpperCase() +
                  field.slice(1).replace("_", " "),
              })),
              "Select industry field",
              <Briefcase className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderSelect(
              "Internship Nature",
              "internship_nature",
              [
                { value: "full_time", label: "Full Time" },
                { value: "part_time", label: "Part Time" },
              ],
              "Select time commitment",
              <Clock className="h-4 w-4" />
            ),
        },
      ],
    },
    {
      title: "Internship Details",
      icon: <FileText className="h-5 w-5" />,
      fields: [
        {
          component: () =>
            renderField(
              "Internship Description",
              "internship_description",
              "text",
              "Describe what the intern will do and learn",
              true,
              <FileText className="h-4 w-4" />,
              true
            ),
        },
        {
          component: () =>
            renderField(
              "Required Skills",
              "required_skills",
              "text",
              "e.g., HTML, CSS, React, Communication Skills",
              false,
              <GraduationCap className="h-4 w-4" />,
              true
            ),
        },
        {
          component: () =>
            renderField(
              "Internship Responsibilities",
              "internship_responsibilities",
              "text",
              "List key responsibilities and tasks",
              true,
              <FileText className="h-4 w-4" />,
              true
            ),
        },
        {
          component: () =>
            renderField(
              "Duration (in months)",
              "duration_months",
              "number",
              "e.g., 3",
              false,
              <Clock className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderField(
              "Total Vacancies",
              "total_vacancies",
              "number",
              "Number of positions available",
              false,
              <Users className="h-4 w-4" />
            ),
        },
      ],
    },
    {
      title: "Application Timeline & Compensation",
      icon: <Calendar className="h-5 w-5" />,
      fields: [
        {
          component: () =>
            renderField(
              "Application Start Date",
              "application_start_date",
              "date",
              "",
              false,
              <Calendar className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderField(
              "Application End Date",
              "application_end_date",
              "date",
              "",
              false,
              <Calendar className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderSelect(
              "Stipend",
              "stipend",
              [
                { value: "Unpaid", label: "Unpaid" },
                { value: "Below ₹5000", label: "Below ₹5000" },
                { value: "₹5000 - ₹10000", label: "₹5000 - ₹10000" },
                { value: "Above ₹10000", label: "Above ₹10000" },
              ],
              "Select compensation range",
              <DollarSign className="h-4 w-4" />,
              true
            ),
        },
      ],
    },
    {
      title: "Assessment Configuration",
      icon: <HelpCircle className="h-5 w-5" />,
      fields: [
        {
          component: () =>
            renderSelect(
              "Quiz Set",
              "quiz_set",
              quizSets.map((quiz) => ({
                value: quiz.id,
                label: quiz.title,
              })),
              "Select a quiz set for assessment",
              <HelpCircle className="h-4 w-4" />,
              true
            ),
        },
        {
          component: () =>
            renderField(
              "Pass Percentage",
              "pass_percentage",
              "number",
              "e.g., 75",
              false,
              <Percent className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderField(
              "Quiz Open Date",
              "quiz_open_date",
              "date",
              "",
              false,
              <Calendar className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderField(
              "Quiz Open Time",
              "quiz_open_time",
              "time",
              "",
              false,
              <Clock className="h-4 w-4" />
            ),
        },
      ],
    },
    {
      title: "Eligibility & Requirements",
      icon: <GraduationCap className="h-5 w-5" />,
      fields: [
        {
          component: () =>
            renderSelect(
              "Eligibility Criteria",
              "eligibility_criteria",
              [
                { value: "Any Graduate", label: "Any Graduate" },
                { value: "Final Year Students", label: "Final Year Students" },
                { value: "Post Graduates", label: "Post Graduates" },
              ],
              "Select eligibility level",
              <GraduationCap className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderSelect(
              "Degrees Preferred",
              "degrees_preferred",
              [
                { value: "engineering", label: "Engineering" },
                { value: "arts", label: "Arts" },
              ],
              "Select preferred degree type",
              <GraduationCap className="h-4 w-4" />
            ),
        },
      ],
    },
    {
      title: "Contact Information",
      icon: <Mail className="h-5 w-5" />,
      fields: [
        {
          component: () =>
            renderField(
              "Contact Email",
              "contact_email",
              "email",
              "recruiting@company.com",
              false,
              <Mail className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderField(
              "Contact Mobile Number",
              "contact_mobile_number",
              "text",
              "+91 9876543210",
              false,
              <Phone className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderField(
              "Company Information",
              "company_information",
              "text",
              "Brief description about your company",
              true,
              <Building2 className="h-4 w-4" />,
              true
            ),
        },
      ],
    },
    {
      title: "Location Details",
      icon: <MapPin className="h-5 w-5" />,
      fields: [
        {
          component: () =>
            renderField(
              "Country",
              "country",
              "text",
              "e.g., India",
              false,
              <MapPin className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderField(
              "State",
              "state",
              "text",
              "e.g., Tamil Nadu",
              false,
              <MapPin className="h-4 w-4" />
            ),
        },
        {
          component: () =>
            renderField(
              "District",
              "district",
              "text",
              "e.g., Coimbatore",
              false,
              <MapPin className="h-4 w-4" />
            ),
        },
      ],
    },
  ];

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />

            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200">
                  <Sparkles className="w-4 h-4" />
                  Internship posting workspace
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Post New Internship
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Create an internship with timeline, assessment, and contact
                  details.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 min-w-full xl:min-w-[620px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Quiz Sets</p>
                  <h3 className="text-3xl font-bold mt-2">{quizSets.length}</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Available for assessment
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Completed Sections</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {completedSections}/{sectionCompletionGroups.length}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Sections completed
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Assessment</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {formData.quiz_set ? "On" : "Off"}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Quiz set assignment status
                  </p>
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
                  <p className="text-sm text-red-700 mt-1 break-words">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {formSections.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden"
              >
                <div className="border-b border-slate-200 bg-slate-50 px-5 sm:px-6 py-4">
                  <h3 className="flex items-center gap-3 text-lg sm:text-xl font-bold text-slate-900">
                    <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      {section.icon}
                    </span>
                    <span>{section.title}</span>
                  </h3>
                </div>

                <div className="p-5 sm:p-6 lg:p-7">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                    {section.fields.map((field, fieldIndex) => (
                      <React.Fragment key={fieldIndex}>
                        {field.component()}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div>
              <div className="rounded-[28px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-4 sm:p-5 shadow-[0_10px_40px_rgba(15,23,42,0.12)]">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Ready to post this internship?
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Review all details carefully before publishing.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full lg:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-8 py-4 font-bold text-base shadow-lg transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                        Posting Internship...
                      </>
                    ) : (
                      <>
                        <Briefcase className="h-5 w-5 shrink-0" />
                        Post Internship
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {showSuccessPopup && (
            <div className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-sm flex items-center justify-center px-4">
              <div className="w-full max-w-md rounded-[28px] border border-green-200 bg-white shadow-2xl p-6 sm:p-7 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Internship Posted
                </h3>

                <p className="mt-2 text-sm sm:text-base text-green-700 font-medium">
                  Internship posted successfully!
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Redirecting to posted internships...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default PostInternship;
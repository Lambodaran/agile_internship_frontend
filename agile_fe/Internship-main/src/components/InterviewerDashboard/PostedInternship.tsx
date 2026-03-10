import React, { useEffect, useMemo, useState } from "react";
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
  X,
  Sparkles,
  ShieldCheck,
  LayoutList,
  FolderOpen,
  RefreshCw,
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
}

const PostedInternship: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [sortBy, setSortBy] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingInternship, setEditingInternship] = useState<Internship | null>(
    null
  );
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

        const [internshipsResponse, quizSetsResponse] = await Promise.all([
          axios.get(`${baseApi}/internships/list/`, {
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
          }),
          axios
            .get(`${baseApi}/quiz/quiz-titles/`, {
              headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
              },
            })
            .catch((err) => {
              console.error("Error fetching quiz sets:", err);
              return { data: [] };
            }),
        ]);

        setInternships(internshipsResponse.data);
        setQuizSets(quizSetsResponse.data);
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

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this internship?")) {
      return;
    }

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

      setInternships((prev) => prev.filter((item) => item.id !== id));
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
    if (!editingInternship) return;
    const { name, value } = e.target;
    setEditingInternship({ ...editingInternship, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!editingInternship) return;

    setError(null);
    setSuccess(null);

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
      "district",
    ];

    const missingFields = requiredFields.filter(
      (field) => !editingInternship[field as keyof Internship]
    );

    if (missingFields.length > 0) {
      setError("Please fill in all required fields before updating the internship.");
      return;
    }

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

      setInternships((prev) =>
        prev.map((item) =>
          item.id === editingInternship.id ? response.data : item
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
    icon: React.ReactNode = null,
    fullWidth = false
  ) => {
    const value = editingInternship
      ? editingInternship[name as keyof Internship] || ""
      : "";
    const showError = submitted && !value;

    return (
      <div className={`space-y-2 ${fullWidth ? "col-span-full" : ""}`}>
        <label
          htmlFor={name}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700"
        >
          {icon && <span className="text-slate-500">{icon}</span>}
          {label}
          <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          {isTextarea ? (
            <textarea
              id={name}
              name={name}
              value={String(value)}
              onChange={handleChange}
              placeholder={placeholder}
              rows={4}
              className={`w-full rounded-2xl border ${
                showError
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-slate-50"
              } px-4 py-3 text-sm sm:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition resize-none`}
            />
          ) : (
            <input
              type={type}
              id={name}
              name={name}
              value={String(value)}
              onChange={handleChange}
              placeholder={placeholder}
              className={`w-full rounded-2xl border ${
                showError
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-slate-50"
              } px-4 py-3 pr-10 text-sm sm:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition`}
            />
          )}

          {showError && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>

        {showError && (
          <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Please enter {label.toLowerCase()}
          </p>
        )}
      </div>
    );
  };

  const renderSelect = (
    label: string,
    name: string,
    options: { value: string; label: string }[],
    placeholder: string,
    icon: React.ReactNode = null,
    fullWidth = false
  ) => {
    const value = editingInternship
      ? editingInternship[name as keyof Internship]?.toString() || ""
      : "";
    const showError = submitted && !value;

    return (
      <div className={`space-y-2 ${fullWidth ? "col-span-full" : ""}`}>
        <label
          htmlFor={name}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700"
        >
          {icon && <span className="text-slate-500">{icon}</span>}
          {label}
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
            } px-4 py-3 text-sm sm:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition`}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value.toString()} value={option.value.toString()}>
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
          <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Please select {label.toLowerCase()}
          </p>
        )}
      </div>
    );
  };

  const getQuizSetOptions = () => {
    return quizSets.map((quiz) => ({
      value: quiz.id.toString(),
      label: quiz.title || quiz.name,
    }));
  };

  const getQuizTitleById = (quizId: string | number) => {
    if (!quizId) return "No Quiz Selected";

    const quiz = quizSets.find(
      (item) =>
        item.id.toString() === quizId.toString() ||
        item.id === parseInt(quizId.toString())
    );

    return quiz ? quiz.title || quiz.name : `Quiz ID: ${quizId}`;
  };

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
                  field.charAt(0).toUpperCase() + field.slice(1).replace("_", " "),
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
              getQuizSetOptions(),
              "Select a quiz set for assessment",
              <HelpCircle className="h-4 w-4" />
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

  const sortedInternships = useMemo(() => {
    const items = [...internships];
    if (sortBy === "date") {
      return items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    if (sortBy === "company") {
      return items.sort((a, b) => a.company_name.localeCompare(b.company_name));
    }
    return items;
  }, [internships, sortBy]);

  const filteredInternships = useMemo(() => {
    return sortedInternships.filter(
      (internship) =>
        (internship.company_name?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (internship.internship_role?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        )
    );
  }, [sortedInternships, searchQuery]);

  const internshipsWithQuiz = internships.filter((item) => item.quiz_set).length;

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />

            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200">
                  <Sparkles className="w-4 h-4" />
                  Internship management workspace
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Posted Internships
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  View, edit, search, and manage all your posted internship opportunities.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 min-w-full xl:min-w-[620px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Total Internships</p>
                  <h3 className="text-3xl font-bold mt-2">{internships.length}</h3>
                  <p className="text-xs text-slate-300 mt-1">All posted items</p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Visible Results</p>
                  <h3 className="text-3xl font-bold mt-2">{filteredInternships.length}</h3>
                  <p className="text-xs text-slate-300 mt-1">Filtered internships</p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Quiz Enabled</p>
                  <h3 className="text-3xl font-bold mt-2">{internshipsWithQuiz}</h3>
                  <p className="text-xs text-slate-300 mt-1">Assessment configured</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
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

          {/* Controls */}
          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="sort"
                    className="text-sm font-medium text-slate-700 whitespace-nowrap"
                  >
                    Sort by:
                  </label>
                  <div className="relative">
                    <select
                      id="sort"
                      className="appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="">Default</option>
                      <option value="date">Date Posted</option>
                      <option value="company">Company Name</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-sm text-slate-600 rounded-2xl bg-slate-100 px-4 py-3">
                  <RefreshCw className="w-4 h-4" />
                  {filteredInternships.length} internship
                  {filteredInternships.length !== 1 ? "s" : ""} found
                </div>
              </div>

              <div className="relative w-full lg:w-80">
                <input
                  type="text"
                  placeholder="Search by company or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && !editingInternship && (
            <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600">Loading internships...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredInternships.length === 0 && (
            <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-4">
                <Briefcase className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Internships Found
              </h3>
              <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">
                {searchQuery
                  ? "No internships match your search. Try a different keyword."
                  : "You haven't posted any internships yet."}
              </p>
            </div>
          )}

          {/* Cards */}
          {!loading && filteredInternships.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredInternships.map((internship) => (
                <div
                  key={internship.id}
                  className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden hover:shadow-[0_16px_50px_rgba(15,23,42,0.12)] transition-all duration-300"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                          {internship.internship_role}
                        </h3>
                        <p className="text-sm sm:text-base text-slate-500 mt-1 truncate">
                          {internship.company_name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEdit(internship)}
                          className="group inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-amber-200/60 bg-white text-amber-600 hover:bg-amber-50 hover:border-amber-300 shadow-sm hover:shadow-md transition-all duration-200"
                          title="Edit Internship"
                        >
                          <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>

                        <button
                          onClick={() => handleDelete(internship.id)}
                          className="group inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-red-200/60 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm hover:shadow-md transition-all duration-200"
                          title="Delete Internship"
                        >
                          <Trash className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 text-slate-700 px-3 py-2 text-sm">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        {internship.internship_type}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 text-blue-700 px-3 py-2 text-sm">
                        <Briefcase className="w-4 h-4" />
                        {internship.internship_nature}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
                        <DollarSign className="w-4 h-4" />
                        {internship.stipend}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-2xl bg-violet-50 text-violet-700 px-3 py-2 text-sm">
                        <Users className="w-4 h-4" />
                        {internship.total_vacancies} positions
                      </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                      <div>
                        <p className="text-xs text-slate-500">Posted</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">
                          {internship.application_start_date
                            ? new Date(
                                internship.application_start_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Deadline</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">
                          {internship.application_end_date
                            ? new Date(
                                internship.application_end_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Duration</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">
                          {internship.duration_months} months
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Quiz Set</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1 truncate">
                          {getQuizTitleById(internship.quiz_set || "")}
                        </p>
                      </div>
                    </div>

                    {internship.internship_description && (
                      <div className="mt-5">
                        <p className="text-xs font-semibold text-slate-500 mb-2">
                          Description
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {internship.internship_description.slice(0, 180)}
                          {internship.internship_description.length > 180
                            ? "..."
                            : ""}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-5">
                      <span className="px-3 py-1.5 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Skill: {internship.required_skills}
                      </span>
                      <span className="px-3 py-1.5 text-xs rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        Pass: {internship.pass_percentage || "N/A"}%
                      </span>
                      <span className="px-3 py-1.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
                        Opens: {internship.quiz_open_date || "N/A"}{" "}
                        {internship.quiz_open_time ? `at ${internship.quiz_open_time}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit Modal */}
          {editingInternship && (
            <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
              <div className="min-h-full flex items-center justify-center">
                <div className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3 min-w-0">
                      <Edit className="w-5 h-5 shrink-0" />
                      <span className="truncate">
                        Edit Internship: {editingInternship.internship_role}
                      </span>
                    </h2>

                    <button
                      type="button"
                      onClick={handleCancel}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-4 sm:p-5 lg:p-6">
                    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
                      {formSections.map((section, sectionIndex) => (
                        <div
                          key={sectionIndex}
                          className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.05)]"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              {section.icon}
                            </span>
                            <h3 className="text-lg font-bold text-slate-900">
                              {section.title}
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {section.fields.map((field, fieldIndex) => (
                              <React.Fragment key={fieldIndex}>
                                {field.component()}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white px-6 py-3 font-semibold transition"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Update Internship
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 font-semibold transition"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default PostedInternship;
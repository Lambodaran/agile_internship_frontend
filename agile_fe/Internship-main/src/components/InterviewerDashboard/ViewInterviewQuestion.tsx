import React, { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Trash,
  Eye,
  Clock,
  CheckCircle,
  Save,
  X,
  AlertCircle,
  BookOpen,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Trash2,
  Plus,
  Download,
  Sparkles,
  LayoutList,
  FolderOpen,
} from "lucide-react";
import InterviewerDashboardSkeleton from "../skeleton/InterviewerDashboardSkeleton";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const baseApi = import.meta.env.VITE_BASE_API;

interface Option {
  id: number;
  text: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
}

interface Quiz {
  id: number;
  title: string;
  percentage_for_qualified: number;
  duration_minutes: number;
  questions: Question[];
  created_by: number;
}

const ViewInterviewQuestion: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [expandedQuizIds, setExpandedQuizIds] = useState<Set<number>>(
    new Set()
  );
  const [isDownloading, setIsDownloading] = useState<Set<number>>(new Set());
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const navigate = useNavigate();

  const api = axios.create({
    baseURL: baseApi,
    headers: { "Content-Type": "application/json" },
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Please log in to access this page.");
      navigate("/login");
      return null;
    }
    return { Authorization: `Token ${token}` };
  };

  useEffect(() => {
    const fetchQuizzes = async () => {
      setIsLoading(true);
      setError(null);

      const headers = getAuthHeaders();
      if (!headers) return;

      try {
        const response = await api.get("/quiz/my-quiz/", { headers });
        if (Array.isArray(response.data)) {
          setQuizzes(response.data);
        } else {
          setError("Unexpected API response format.");
        }
      } catch (err: any) {
        console.error("API Error:", err.response || err);
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.removeItem("access_token");
          navigate("/login");
        } else {
          setError("Failed to load quizzes. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, [navigate]);

  const toggleQuizExpansion = (quizId: number) => {
    const newExpandedIds = new Set(expandedQuizIds);
    if (newExpandedIds.has(quizId)) {
      newExpandedIds.delete(quizId);
    } else {
      newExpandedIds.add(quizId);
    }
    setExpandedQuizIds(newExpandedIds);
  };

  const handleEdit = (quiz: Quiz) => {
    setEditingQuiz({ ...quiz });
  };

  const handleDownloadPDF = async (quiz: Quiz) => {
    setIsDownloading((prev) => new Set(prev).add(quiz.id));

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await api.get(`/quiz/${quiz.id}/download-pdf/`, {
        headers,
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `${quiz.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_quiz.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage("Quiz PDF downloaded successfully!");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 1800);
    } catch (error: any) {
      console.error("Download error:", error);

      if (error.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("access_token");
        navigate("/login");
      } else if (error.response?.status === 404) {
        setError("Quiz not found or you don't have permission to download it.");
      } else {
        const errorMessage =
          error.response?.data?.error ||
          "Failed to download quiz. Please try again.";
        setError(errorMessage);
      }
    } finally {
      setIsDownloading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(quiz.id);
        return newSet;
      });
    }
  };

  const handleAddQuestion = () => {
    if (!editingQuiz) return;
    const tempId = -(Date.now() + Math.random());
    const newQuestion: Question = {
      id: tempId,
      text: "",
      options: [
        { id: tempId - 1, text: "", is_correct: false },
        { id: tempId - 2, text: "", is_correct: false },
        { id: tempId - 3, text: "", is_correct: false },
        { id: tempId - 4, text: "", is_correct: false },
      ],
    };

    setEditingQuiz({
      ...editingQuiz,
      questions: [...editingQuiz.questions, newQuestion],
    });
  };

  const handleRemoveQuestion = (questionIndex: number) => {
    if (!editingQuiz) return;

    if (editingQuiz.questions.length <= 1) {
      alert(
        "Cannot remove the last question. A quiz must have at least one question."
      );
      return;
    }

    if (confirm("Are you sure you want to remove this question?")) {
      const updatedQuestions = editingQuiz.questions.filter(
        (_, index) => index !== questionIndex
      );
      setEditingQuiz({
        ...editingQuiz,
        questions: updatedQuestions,
      });
    }
  };

  const validateQuizData = () => {
    if (!editingQuiz) return false;

    if (!editingQuiz.title.trim()) {
      alert("Quiz title cannot be empty.");
      return false;
    }

    for (let i = 0; i < editingQuiz.questions.length; i++) {
      const question = editingQuiz.questions[i];

      if (!question.text.trim()) {
        alert(`Question ${i + 1} text cannot be empty.`);
        return false;
      }

      for (let j = 0; j < question.options.length; j++) {
        if (!question.options[j].text.trim()) {
          alert(`Question ${i + 1}, Option ${j + 1} text cannot be empty.`);
          return false;
        }
      }

      const hasCorrectOption = question.options.some((option) => option.is_correct);
      if (!hasCorrectOption) {
        alert(`Question ${i + 1} must have a correct answer selected.`);
        return false;
      }
    }

    return true;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz) return;

    if (editingQuiz.questions.length === 0) {
      alert("A quiz must have at least one question.");
      return;
    }

    if (!validateQuizData()) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const payload = {
        title: editingQuiz.title,
        percentage_for_qualified: editingQuiz.percentage_for_qualified,
        duration_minutes: editingQuiz.duration_minutes,
        questions: editingQuiz.questions.map((q) => ({
          ...(q.id > 0 && { id: q.id }),
          text: q.text,
          options: q.options.map((o) => ({
            ...(o.id > 0 && { id: o.id }),
            text: o.text,
            is_correct: o.is_correct,
          })),
        })),
      };

      const response = await api.put(`/quiz/${editingQuiz.id}/edit/`, payload, {
        headers,
      });

      setQuizzes(quizzes.map((q) => (q.id === editingQuiz.id ? response.data : q)));
      setEditingQuiz(null);
      setSuccessMessage("Quiz updated successfully!");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 1800);
    } catch (err: any) {
      console.error("Update Error:", err.response || err);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("access_token");
        navigate("/login");
      } else if (err.response?.status === 403) {
        setError("Unauthorized: Only the creator can edit this quiz.");
      } else {
        const errorMessage =
          err.response?.data?.detail || "Failed to update quiz. Please try again.";
        setError(errorMessage);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      await api.delete(`/quiz/${id}/delete/`, { headers });
      setQuizzes(quizzes.filter((q) => q.id !== id));
      setSuccessMessage("Quiz deleted successfully!");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 1800);
    } catch (err: any) {
      console.error("Delete Error:", err.response || err);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("access_token");
        navigate("/login");
      } else if (err.response?.status === 403) {
        setError("Unauthorized: Only the creator can delete this quiz.");
      } else {
        setError("Failed to delete quiz. Please try again.");
      }
    }
  };

  const filteredQuizzes = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.questions.some((ques) =>
        ques.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <>
      <InterviewerDashboardSkeleton>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
          <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />
              <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200">
                    <Sparkles className="w-4 h-4" />
                    Interviewer workspace
                  </div>

                  <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                    View Interview Questions
                  </h1>

                  <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                    View, edit, download, and manage your quiz sets.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-full xl:min-w-[520px]">
                  <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                    <p className="text-slate-300 text-sm">Quiz Sets</p>
                    <h3 className="text-3xl font-bold mt-2">{quizzes.length}</h3>
                    <p className="text-xs text-slate-300 mt-1">Total created sets</p>
                  </div>

                  <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                    <p className="text-slate-300 text-sm">Showing</p>
                    <h3 className="text-3xl font-bold mt-2">
                      {filteredQuizzes.length}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">Filtered results</p>
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

            <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                <div className="relative flex-1 w-full max-w-xl">
                  <input
                    type="text"
                    placeholder="Search quiz set by title or question..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                </div>

                <div className="inline-flex items-center gap-2 text-sm text-slate-600 rounded-2xl bg-slate-100 px-4 py-3">
                  <Filter className="w-4 h-4" />
                  Showing {filteredQuizzes.length} of {quizzes.length} quiz sets
                </div>
              </div>
            </div>

            <div className="hidden lg:block rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-20">
                        S.No
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Quiz Set
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Questions
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <RefreshCw className="animate-spin text-blue-500 mx-auto mb-4" size={40} />
                          <p className="text-slate-600 font-medium">Loading quiz sets...</p>
                        </td>
                      </tr>
                    ) : filteredQuizzes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <FolderOpen className="text-slate-300 mx-auto mb-4" size={56} />
                          <h3 className="text-lg font-semibold text-slate-900">
                            No quiz sets found
                          </h3>
                          <p className="text-sm text-slate-500 mt-2">
                            Create your first quiz to get started.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredQuizzes.map((quiz, index) => (
                        <React.Fragment key={quiz.id}>
                          <tr className="hover:bg-blue-50/40 transition-colors">
                            <td className="px-6 py-5 align-top">
                              <span className="inline-flex items-center justify-center min-w-[42px] h-10 px-3 rounded-2xl bg-blue-100 text-blue-700 font-semibold text-sm">
                                {index + 1}
                              </span>
                            </td>

                            <td className="px-6 py-5 align-top">
                              <button
                                onClick={() => toggleQuizExpansion(quiz.id)}
                                className="flex items-start gap-3 text-left group"
                              >
                                <span className="mt-0.5">
                                  {expandedQuizIds.has(quiz.id) ? (
                                    <ChevronDown className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                                  )}
                                </span>

                                <div>
                                  <div className="font-semibold text-slate-900 text-base">
                                    {quiz.title}
                                  </div>
                                  <div className="text-sm text-slate-500 mt-1">
                                    Click to{" "}
                                    {expandedQuizIds.has(quiz.id)
                                      ? "collapse"
                                      : "expand"}{" "}
                                    questions
                                  </div>
                                </div>
                              </button>
                            </td>

                            <td className="px-6 py-5 align-top">
                              <div className="inline-flex items-center gap-2 rounded-2xl bg-violet-50 text-violet-700 px-3 py-2 text-sm w-fit">
                                <Clock className="w-4 h-4" />
                                Duration: {quiz.duration_minutes} min
                              </div>
                            </td>

                            <td className="px-6 py-5 align-top">
                              <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 text-indigo-700 px-3 py-2 text-sm font-medium">
                                <LayoutList className="w-4 h-4" />
                                {quiz.questions.length} Questions
                              </div>
                            </td>

                            <td className="px-6 py-5 align-top">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDownloadPDF(quiz)}
                                  disabled={isDownloading.has(quiz.id)}
                                  className="group relative inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-emerald-200/60 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                                  title="Download PDF"
                                >
                                  {isDownloading.has(quiz.id) ? (
                                    <RefreshCw className="animate-spin w-4 h-4" />
                                  ) : (
                                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                                  )}
                                </button>

                                <button
                                  onClick={() => handleEdit(quiz)}
                                  className="group relative inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-amber-200/60 bg-white text-amber-600 hover:bg-amber-50 hover:border-amber-300 shadow-sm hover:shadow-md transition-all duration-200"
                                  title="Edit Quiz"
                                >
                                  <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                                </button>

                                <button
                                  onClick={() => handleDelete(quiz.id)}
                                  className="group relative inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-red-200/60 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm hover:shadow-md transition-all duration-200"
                                  title="Delete Quiz"
                                >
                                  <Trash className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {expandedQuizIds.has(quiz.id) &&
                            quiz.questions.map((question, qIndex) => {
                              const correctOptionIndex =
                                question.options.findIndex((o) => o.is_correct) + 1;

                              return (
                                <tr
                                  key={`${quiz.id}-${question.id}`}
                                  className="bg-slate-50/80 border-l-4 border-blue-400"
                                >
                                  <td className="px-6 py-4"></td>

                                  <td className="px-6 py-4 align-top">
                                    <div className="ml-3 flex items-start gap-3">
                                      <span className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">
                                        Q{qIndex + 1}
                                      </span>
                                      <div className="text-sm text-slate-800 max-w-xl leading-relaxed">
                                        {question.text}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-6 py-4 align-top">
                                    <div className="space-y-2">
                                      {question.options.map((option, oIndex) => (
                                        <div
                                          key={option.id}
                                          className={`rounded-xl px-3 py-2 text-xs ${
                                            option.is_correct
                                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                              : "bg-white text-slate-600 border border-slate-200"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-semibold shrink-0">
                                              {oIndex + 1}
                                            </span>
                                            <span className="truncate">{option.text}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </td>

                                  <td className="px-6 py-4 align-top">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1.5 text-xs font-semibold">
                                      <CheckCircle className="w-4 h-4" />
                                      Option {correctOptionIndex || "N/A"}
                                    </span>
                                  </td>

                                  <td className="px-6 py-4"></td>
                                </tr>
                              );
                            })}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:hidden space-y-4">
              {isLoading ? (
                <div className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-10 text-center">
                  <RefreshCw className="animate-spin text-blue-500 mx-auto mb-4" size={40} />
                  <p className="text-slate-600 font-medium">Loading quiz sets...</p>
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <div className="rounded-[28px] bg-white border border-slate-200 shadow-sm p-10 text-center">
                  <FolderOpen className="text-slate-300 mx-auto mb-4" size={56} />
                  <h3 className="text-lg font-semibold text-slate-900">
                    No quiz sets found
                  </h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Create your first quiz to get started.
                  </p>
                </div>
              ) : (
                filteredQuizzes.map((quiz, index) => (
                  <div
                    key={quiz.id}
                    className="rounded-[28px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="inline-flex items-center justify-center min-w-[38px] h-10 px-3 rounded-2xl bg-blue-100 text-blue-700 font-semibold text-sm">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-base truncate">
                              {quiz.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="inline-flex items-center gap-2 rounded-2xl bg-violet-50 text-violet-700 px-3 py-2 text-xs">
                                <Clock className="w-4 h-4" />
                                {quiz.duration_minutes} min
                              </span>
                              <span className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 text-indigo-700 px-3 py-2 text-xs">
                                <LayoutList className="w-4 h-4" />
                                {quiz.questions.length} Questions
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleDownloadPDF(quiz)}
                            disabled={isDownloading.has(quiz.id)}
                            className="group inline-flex items-center justify-center w-10 h-10 rounded-2xl border border-emerald-200/60 bg-white text-emerald-600 hover:bg-emerald-50 shadow-sm transition-all duration-200 disabled:opacity-50"
                          >
                            {isDownloading.has(quiz.id) ? (
                              <RefreshCw className="animate-spin w-4 h-4" />
                            ) : (
                              <Download className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            )}
                          </button>

                          <button
                            onClick={() => handleEdit(quiz)}
                            className="group inline-flex items-center justify-center w-10 h-10 rounded-2xl border border-amber-200/60 bg-white text-amber-600 hover:bg-amber-50 shadow-sm transition-all duration-200"
                          >
                            <Edit className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          </button>

                          <button
                            onClick={() => handleDelete(quiz.id)}
                            className="group inline-flex items-center justify-center w-10 h-10 rounded-2xl border border-red-200/60 bg-white text-red-600 hover:bg-red-50 shadow-sm transition-all duration-200"
                          >
                            <Trash className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleQuizExpansion(quiz.id)}
                        className="inline-flex items-center gap-2 text-blue-600 font-medium"
                      >
                        {expandedQuizIds.has(quiz.id) ? (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Hide Questions
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-4 h-4" />
                            View Questions
                          </>
                        )}
                      </button>
                    </div>

                    {expandedQuizIds.has(quiz.id) && (
                      <div className="border-t border-slate-200 bg-slate-50/70 p-4 space-y-4">
                        {quiz.questions.map((question, qIndex) => {
                          const correctOptionIndex =
                            question.options.findIndex((o) => o.is_correct) + 1;

                          return (
                            <div
                              key={question.id}
                              className="rounded-2xl border border-slate-200 bg-white p-4"
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                                  {qIndex + 1}
                                </span>
                                <p className="text-sm text-slate-800">{question.text}</p>
                              </div>

                              <div className="space-y-2">
                                {question.options.map((option, oIndex) => (
                                  <div
                                    key={option.id}
                                    className={`rounded-xl px-3 py-2 text-xs ${
                                      option.is_correct
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-slate-50 text-slate-600 border border-slate-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-semibold shrink-0">
                                        {oIndex + 1}
                                      </span>
                                      <span>{option.text}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-3">
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1.5 text-xs font-semibold">
                                  <CheckCircle className="w-4 h-4" />
                                  Correct: Option {correctOptionIndex || "N/A"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </InterviewerDashboardSkeleton>

      {editingQuiz && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <div className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white shadow-2xl overflow-hidden">
             <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-3 min-w-0">
                  <Edit className="w-5 h-5 shrink-0" />
                  <span className="truncate">Edit Quiz: {editingQuiz.title}</span>
                </h2>

                <button
                  type="button"
                  onClick={() => setEditingQuiz(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-4 sm:p-5 lg:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Quiz Title
                    </label>
                    <input
                      type="text"
                      value={editingQuiz.title}
                      onChange={(e) =>
                        setEditingQuiz({ ...editingQuiz, title: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                      maxLength={50}
                      required
                    />
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={editingQuiz.duration_minutes}
                      onChange={(e) =>
                        setEditingQuiz({
                          ...editingQuiz,
                          duration_minutes: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-orange-600" />
                    Questions ({editingQuiz.questions.length})
                  </h3>

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 font-semibold transition w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>

                <div className="space-y-4 max-h-[42vh] overflow-y-auto pr-1">
                  {editingQuiz.questions.map((q, qIndex) => (
                    <div
                      key={q.id}
                      className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <h4 className="font-bold text-slate-900 flex items-center gap-3 flex-wrap">
                          <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                            {qIndex + 1}
                          </span>
                          Question {qIndex + 1}
                          {q.id < 0 && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                              New
                            </span>
                          )}
                        </h4>

                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          disabled={editingQuiz.questions.length <= 1}
                          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 font-medium transition ${
                            editingQuiz.questions.length <= 1
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>

                      <div className="space-y-5">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Question Text
                          </label>
                          <textarea
                            value={q.text}
                            onChange={(e) =>
                              setEditingQuiz({
                                ...editingQuiz,
                                questions: editingQuiz.questions.map((q2, i) =>
                                  i === qIndex ? { ...q2, text: e.target.value } : q2
                                ),
                              })
                            }
                            rows={3}
                            maxLength={250}
                            placeholder="Enter your question here..."
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {q.options.map((o, oIndex) => (
                            <div
                              key={o.id}
                              className="rounded-3xl border border-slate-200 bg-white p-4"
                            >
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Option {oIndex + 1}
                              </label>
                              <input
                                type="text"
                                value={o.text}
                                onChange={(e) =>
                                  setEditingQuiz({
                                    ...editingQuiz,
                                    questions: editingQuiz.questions.map((q2, i) =>
                                      i === qIndex
                                        ? {
                                            ...q2,
                                            options: q2.options.map((o2, j) =>
                                              j === oIndex
                                                ? { ...o2, text: e.target.value }
                                                : o2
                                            ),
                                          }
                                        : q2
                                    ),
                                  })
                                }
                                maxLength={255}
                                placeholder={`Enter option ${oIndex + 1}`}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                                required
                              />
                            </div>
                          ))}
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Correct Answer
                          </label>
                          <select
                            value={q.options.findIndex((o) => o.is_correct) + 1 || ""}
                            onChange={(e) =>
                              setEditingQuiz({
                                ...editingQuiz,
                                questions: editingQuiz.questions.map((q2, i) =>
                                  i === qIndex
                                    ? {
                                        ...q2,
                                        options: q2.options.map((o2, j) => ({
                                          ...o2,
                                          is_correct:
                                            parseInt(e.target.value) - 1 === j,
                                        })),
                                      }
                                    : q2
                                ),
                              })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition"
                            required
                          >
                            <option value="">Select Correct Option</option>
                            {q.options.map((_, oIndex) => (
                              <option key={oIndex} value={oIndex + 1}>
                                Option {oIndex + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 font-semibold transition"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingQuiz(null)}
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

      {showSuccessModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-green-100 p-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Success</h3>
            <p className="text-green-600 font-medium mt-2">{successMessage}</p>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 font-medium transition"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewInterviewQuestion;
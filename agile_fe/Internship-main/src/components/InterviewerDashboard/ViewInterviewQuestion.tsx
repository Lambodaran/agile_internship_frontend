import React, { useState, useEffect } from 'react';
import {
  Search,
  Edit,
  Trash,
  Eye,
  FileText,
  Clock,
  BarChart3,
  CheckCircle,
  Save,
  X,
  AlertCircle,
  BookOpen,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Hash,
  Trash2,
  Plus,
  Download
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../skeleton/InterviewerDashboardSkeleton';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [expandedQuizIds, setExpandedQuizIds] = useState<Set<number>>(new Set());
  const [isDownloading, setIsDownloading] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: baseApi,
    headers: { 'Content-Type': 'application/json' },
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Please log in to access this page.');
      navigate('/login');
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
        const response = await api.get('/quiz/my-quiz/', { headers });
        if (Array.isArray(response.data)) {
          setQuizzes(response.data);
        } else {
          setError('Unexpected API response format.');
        }
      } catch (err: any) {
        console.error('API Error:', err.response || err);
        if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('access_token');
          navigate('/login');
        } else {
          setError('Failed to load quizzes. Please try again later.');
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
    setIsDownloading(prev => new Set(prev).add(quiz.id));
    
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      // Call your backend API to get the PDF
      const response = await api.get(`/quiz/${quiz.id}/download-pdf/`, { 
        headers,
        responseType: 'blob' // Important: This tells axios to expect binary data
      });
      
      // Create blob URL from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or create a default one
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_quiz.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Success message - you can replace alert with a toast notification
      alert('Quiz PDF downloaded successfully!');
      
    } catch (error: any) {
      console.error('Download error:', error);
      
      // Handle different error scenarios
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('access_token');
        navigate('/login');
      } else if (error.response?.status === 404) {
        alert('Quiz not found or you don\'t have permission to download it.');
      } else {
        const errorMessage = error.response?.data?.error || 'Failed to download quiz. Please try again.';
        alert(errorMessage);
      }
    } finally {
      setIsDownloading(prev => {
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
      text: '',
      options: [
        { id: tempId - 1, text: '', is_correct: false },
        { id: tempId - 2, text: '', is_correct: false },
        { id: tempId - 3, text: '', is_correct: false },
        { id: tempId - 4, text: '', is_correct: false }
      ]
    };
    setEditingQuiz({
      ...editingQuiz,
      questions: [...editingQuiz.questions, newQuestion]
    });
  };

  const handleRemoveQuestion = (questionIndex: number) => {
    if (!editingQuiz) return;

    if (editingQuiz.questions.length <= 1) {
      alert('Cannot remove the last question. A quiz must have at least one question.');
      return;
    }

    if (confirm('Are you sure you want to remove this question?')) {
      const updatedQuestions = editingQuiz.questions.filter((_, index) => index !== questionIndex);
      setEditingQuiz({
        ...editingQuiz,
        questions: updatedQuestions
      });
    }
  };

  const validateQuizData = () => {
    if (!editingQuiz) return false;
    if (!editingQuiz.title.trim()) {
      alert('Quiz title cannot be empty.');
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
      const hasCorrectOption = question.options.some(option => option.is_correct);
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
      alert('A quiz must have at least one question.');
      return;
    }
    if (!validateQuizData()) {
      return;
    }
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

      const response = await api.put(`/quiz/${editingQuiz.id}/edit/`, payload, { headers });
      setQuizzes(quizzes.map((q) => (q.id === editingQuiz.id ? response.data : q)));
      setEditingQuiz(null);
      alert('Quiz updated successfully!');
    } catch (err: any) {
      console.error('Update Error:', err.response || err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('access_token');
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Unauthorized: Only the creator can edit this quiz.');
      } else {
        const errorMessage = err.response?.data?.detail || 'Failed to update quiz. Please try again.';
        setError(errorMessage);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      await api.delete(`/quiz/${id}/delete/`, { headers });
      setQuizzes(quizzes.filter((q) => q.id !== id));
      alert('Quiz deleted successfully!');
    } catch (err: any) {
      console.error('Delete Error:', err.response || err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('access_token');
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Unauthorized: Only the creator can delete this quiz.');
      } else {
        setError('Failed to delete quiz. Please try again.');
      }
    }
  };

  const filteredQuizzes = quizzes.filter((q) =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.questions.some((ques) => ques.text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
          {/* Header */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl mb-6 sm:mb-8 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2 sm:gap-3">
                  <Eye className="text-blue-600" size={24} />
                  Quiz Management
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">View, edit, and manage your interview quizzes</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center sm:text-right">
                  <p className="text-sm text-gray-500">Total Quizzes</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{quizzes.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 sm:px-6 py-4 rounded-xl sm:rounded-2xl mb-6 flex items-start gap-3 shadow-lg">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold">Error</h3>
                <p className="text-sm sm:text-base">{error}</p>
              </div>
            </div>
          )}

          {/* Edit Form */}
          {editingQuiz && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl mb-6 sm:mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 sm:px-6 py-4">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <Edit className="text-white flex-shrink-0" size={20} />
                  <span className="truncate">Edit Quiz: {editingQuiz.title}</span>
                </h2>
              </div>

              <form onSubmit={handleUpdate} className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="text-blue-500" size={16} />
                      Quiz Title
                    </label>
                    <input
                      type="text"
                      value={editingQuiz.title}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                      className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200"
                      maxLength={50}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="text-purple-500" size={16} />
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
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200"
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                      <BookOpen className="text-orange-500" size={20} />
                      Questions ({editingQuiz.questions.length})
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg sm:rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 justify-center"
                    >
                      <Plus size={16} />
                      Add Question
                    </button>
                  </div>

                  {editingQuiz.questions.map((q, qIndex) => (
                    <div key={q.id} className="border-2 border-gray-100 rounded-lg sm:rounded-2xl p-4 sm:p-6 bg-gray-50 relative">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                            {qIndex + 1}
                          </span>
                          <span>Question {qIndex + 1}</span>
                          {q.id < 0 && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                              New
                            </span>
                          )}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          disabled={editingQuiz.questions.length <= 1}
                          className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-110 shadow-md flex-shrink-0 ${editingQuiz.questions.length <= 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                            }`}
                          title={editingQuiz.questions.length <= 1 ? 'Cannot remove the last question' : 'Remove Question'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

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
                        className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl mb-4 resize-none transition-all duration-200"
                        required
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        {q.options.map((o, oIndex) => (
                          <div key={o.id}>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                                          j === oIndex ? { ...o2, text: e.target.value } : o2
                                        ),
                                      }
                                      : q2
                                  ),
                                })
                              }
                              maxLength={255}
                              placeholder={`Enter option ${oIndex + 1}`}
                              className="w-full border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200"
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <CheckCircle className="text-green-500" size={16} />
                          Correct Answer
                        </label>
                        <select
                          value={q.options.findIndex((o) => o.is_correct) + 1 || ''}
                          onChange={(e) =>
                            setEditingQuiz({
                              ...editingQuiz,
                              questions: editingQuiz.questions.map((q2, i) =>
                                i === qIndex
                                  ? {
                                    ...q2,
                                    options: q2.options.map((o2, j) => ({
                                      ...o2,
                                      is_correct: parseInt(e.target.value) - 1 === j,
                                    })),
                                  }
                                  : q2
                              ),
                            })
                          }
                          className="w-full border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 bg-white"
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
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 justify-center"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingQuiz(null)}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 justify-center"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl mb-6 sm:mb-8 p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search quiz sets by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg sm:rounded-xl transition-all duration-200 bg-gray-50"
                />
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Filter className="text-gray-400" size={18} />
                <span>Showing {filteredQuizzes.length} of {quizzes.length} quiz sets</span>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-12">
                      S.No
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Quiz Set
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <RefreshCw className="animate-spin text-blue-500 mb-4" size={48} />
                          <p className="text-gray-500 text-lg font-medium">Loading quiz sets...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredQuizzes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <BookOpen className="text-gray-300 mb-4" size={64} />
                          <p className="text-lg font-medium">No quiz sets found</p>
                          <p className="text-sm mt-1">Create your first quiz to get started!</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredQuizzes.map((quiz, index) => (
                      <React.Fragment key={quiz.id}>
                        {/* Quiz Set Row */}
                        <tr className="hover:bg-blue-50 transition-all duration-200 border-b border-gray-100">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleQuizExpansion(quiz.id)}
                              className="flex items-center gap-3 text-left hover:text-blue-600 transition-colors duration-200"
                            >
                              {expandedQuizIds.has(quiz.id) ? (
                                <ChevronDown className="text-blue-500" size={18} />
                              ) : (
                                <ChevronRight className="text-gray-400" size={18} />
                              )}
                              <div>
                                <div className="font-medium text-gray-900 text-lg">{quiz.title}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Click to {expandedQuizIds.has(quiz.id) ? 'collapse' : 'expand'} questions
                                </div>
                              </div>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="text-purple-500" size={14} />
                                <span>Duration: {quiz.duration_minutes} min</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                                {quiz.questions.length} Questions
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDownloadPDF(quiz)}
                                disabled={isDownloading.has(quiz.id)}
                                className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 p-2 rounded-lg transition-all duration-200 transform hover:scale-110 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Download PDF"
                              >
                                {isDownloading.has(quiz.id) ? (
                                  <RefreshCw className="animate-spin" size={16} />
                                ) : (
                                  <Download size={16} />
                                )}
                              </button>
                              <button
                                onClick={() => handleEdit(quiz)}
                                className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700 p-2 rounded-lg transition-all duration-200 transform hover:scale-110 shadow-md"
                                title="Edit Quiz"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(quiz.id)}
                                className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 p-2 rounded-lg transition-all duration-200 transform hover:scale-110 shadow-md"
                                title="Delete Quiz"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Questions Rows */}
                        {expandedQuizIds.has(quiz.id) && quiz.questions.map((question, qIndex) => {
                          const options = question.options;
                          const correctOptionIndex = options.findIndex((o) => o.is_correct) + 1;
                          return (
                            <tr key={`${quiz.id}-${question.id}`} className="bg-gray-50 border-l-4 border-blue-300">
                              <td className="px-6 py-3"></td>
                              <td className="px-6 py-3">
                                <div className="ml-8 flex items-center gap-2">
                                  <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                                    Q{qIndex + 1}
                                  </span>
                                  <div className="text-sm text-gray-700 max-w-md">
                                    {question.text}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <div className="text-xs text-gray-500 space-y-1">
                                  {options.map((option, oIndex) => (
                                    <div key={option.id} className="flex items-center gap-2">
                                      <span className="w-5 h-5 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                                        {oIndex + 1}
                                      </span>
                                      <span className="truncate max-w-xs" title={option.text}>
                                        {option.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                  <CheckCircle size={10} />
                                  Option {correctOptionIndex || 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-3"></td>
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

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <RefreshCw className="animate-spin text-blue-500 mb-4 mx-auto" size={48} />
                <p className="text-gray-500 text-lg font-medium">Loading quiz sets...</p>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
                <BookOpen className="text-gray-300 mb-4 mx-auto" size={64} />
                <p className="text-lg font-medium">No quiz sets found</p>
                <p className="text-sm mt-1">Create your first quiz to get started!</p>
              </div>
            ) : (
              filteredQuizzes.map((quiz, index) => (
                <div key={quiz.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Quiz Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <h3 className="font-semibold text-gray-900 text-base truncate">{quiz.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleDownloadPDF(quiz)}
                          disabled={isDownloading.has(quiz.id)}
                          className="bg-green-50 text-green-600 hover:bg-green-100 p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download PDF"
                        >
                          {isDownloading.has(quiz.id) ? (
                            <RefreshCw className="animate-spin" size={14} />
                          ) : (
                            <Download size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(quiz)}
                          className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 p-2 rounded-lg transition-all duration-200"
                          title="Edit Quiz"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg transition-all duration-200"
                          title="Delete Quiz"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="text-purple-500" size={14} />
                        <span>{quiz.duration_minutes} min</span>
                      </div>
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                        {quiz.questions.length} Questions
                      </span>
                    </div>

                    <button
                      onClick={() => toggleQuizExpansion(quiz.id)}
                      className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      {expandedQuizIds.has(quiz.id) ? (
                        <>
                          <ChevronDown size={16} />
                          <span className="text-sm font-medium">Hide Questions</span>
                        </>
                      ) : (
                        <>
                          <ChevronRight size={16} />
                          <span className="text-sm font-medium">Show Questions</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expanded Questions */}
                  {expandedQuizIds.has(quiz.id) && (
                    <div className="p-4 bg-gray-50 space-y-4">
                      {quiz.questions.map((question, qIndex) => {
                        const options = question.options;
                        const correctOptionIndex = options.findIndex((o) => o.is_correct) + 1;
                        return (
                          <div key={question.id} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-start gap-2 mb-3">
                              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                                Q{qIndex + 1}
                              </span>
                              <p className="text-sm text-gray-700 flex-1">{question.text}</p>
                            </div>
                            
                            <div className="space-y-2 mb-3">
                              {options.map((option, oIndex) => (
                                <div key={option.id} className="flex items-start gap-2 text-xs text-gray-600">
                                  <span className="w-4 h-4 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                                    {oIndex + 1}
                                  </span>
                                  <span className="flex-1">{option.text}</span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                <CheckCircle size={8} />
                                Correct: Option {correctOptionIndex || 'N/A'}
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
  );
};

export default ViewInterviewQuestion;
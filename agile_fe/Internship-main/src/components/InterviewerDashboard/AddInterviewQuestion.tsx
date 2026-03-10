import { useEffect, useRef, useState } from "react";
import InterviewerDashboardSkeleton from "../skeleton/InterviewerDashboardSkeleton";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Settings,
  FileText,
  Clock,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle,
  Rocket,
  Upload,
  Download,
  AlertCircle,
  Sparkles,
  LayoutPanelTop,
  ShieldCheck,
  FileSpreadsheet,
  PenSquare,
  X,
} from "lucide-react";

const baseApi = import.meta.env.VITE_BASE_API;

const Papa = {
  parse: (csvText: string) => {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const data = lines.slice(1).map((line) => {
      const values = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim().replace(/"/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/"/g, ""));

      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || "";
      });
      return obj;
    });
    return { data };
  },
};

interface Question {
  question: string;
  options: string[];
  correct: string;
  isImported?: boolean;
}

const AddInterviewQuestion: React.FC = () => {
  const [quizTitle, setQuizTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    {
      question: "",
      options: ["", "", "", ""],
      correct: "",
      isImported: false,
    },
  ]);
  const [csvImportStatus, setCsvImportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [csvError, setCsvError] = useState("");
  const [myQuizCount, setMyQuizCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyQuizCount = async () => {
      try {
        const response = await axios.get(`${baseApi}/quiz/quiz-titles/`, {
          headers: {
            Authorization: `Token ${localStorage.getItem("access_token")}`,
          },
        });

        setMyQuizCount(Array.isArray(response.data) ? response.data.length : 0);
      } catch (error) {
        console.error("Error fetching my quiz count:", error);
        setMyQuizCount(0);
      }
    };

    fetchMyQuizCount();
  }, []);

  const addQuestionSet = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correct: "",
        isImported: false,
      },
    ]);
  };

  const removeQuestionSet = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    } else {
      alert("At least one question is required.");
    }
  };

  const handleQuestionChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedQuestions = [...questions];
    if (field === "question") updatedQuestions[index].question = value;
    if (field === "correct") updatedQuestions[index].correct = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (
    qIndex: number,
    oIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setQuestions(updatedQuestions);
  };

  const downloadCsvTemplate = () => {
    const csvContent = `question,option1,option2,option3,option4,correct_option
"What is the capital of France?","Paris","London","Berlin","Madrid","1"
"Which programming language is known for AI?","Java","Python","C++","Ruby","2"
"What does HTML stand for?","Hypertext Markup Language","High Tech Modern Language","Home Tool Markup Language","Hyperlink Text Management Language","1"`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const validateCsvData = (data: any[]): string | null => {
    const requiredColumns = [
      "question",
      "option1",
      "option2",
      "option3",
      "option4",
      "correct_option",
    ];

    if (data.length === 0) {
      return "CSV file is empty";
    }

    const firstRow = data[0];
    const availableColumns = Object.keys(firstRow);
    const missingColumns = requiredColumns.filter(
      (col) => !availableColumns.includes(col)
    );

    if (missingColumns.length > 0) {
      return `Missing required columns: ${missingColumns.join(
        ", "
      )}. Available columns: ${availableColumns.join(", ")}`;
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      if (
        !row.question &&
        !row.option1 &&
        !row.option2 &&
        !row.option3 &&
        !row.option4
      ) {
        continue;
      }

      if (!row.question || row.question.trim() === "") {
        return `Row ${i + 1}: Question is required`;
      }

      for (let j = 1; j <= 4; j++) {
        const optionKey = `option${j}`;
        if (!row[optionKey] || row[optionKey].toString().trim() === "") {
          return `Row ${i + 1}: Option ${j} is required`;
        }
      }

      const correctOption = row.correct_option?.toString().trim();
      if (!correctOption || !["1", "2", "3", "4"].includes(correctOption)) {
        return `Row ${i + 1}: correct_option must be 1, 2, 3, or 4 (found: "${correctOption}")`;
      }

      if (row.question.length > 250) {
        return `Row ${i + 1}: Question exceeds 250 characters`;
      }

      for (let j = 1; j <= 4; j++) {
        const optionKey = `option${j}`;
        if (row[optionKey] && row[optionKey].toString().length > 255) {
          return `Row ${i + 1}: Option ${j} exceeds 255 characters`;
        }
      }
    }

    return null;
  };

  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvImportStatus("idle");
    setCsvError("");

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setCsvError("Please select a valid CSV file");
      setCsvImportStatus("error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const result = Papa.parse(csvText);

        const validationError = validateCsvData(result.data);
        if (validationError) {
          setCsvError(validationError);
          setCsvImportStatus("error");
          return;
        }

        const importedQuestions = result.data
          .filter((row: any) => row.question && row.question.trim() !== "")
          .map((row: any) => ({
            question: row.question.toString().trim(),
            options: [
              row.option1.toString().trim(),
              row.option2.toString().trim(),
              row.option3.toString().trim(),
              row.option4.toString().trim(),
            ],
            correct: row.correct_option.toString().trim(),
            isImported: true,
          }));

        setQuestions(importedQuestions);
        setCsvImportStatus("success");
        setCsvError("");

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        setCsvError("Error parsing CSV file. Please check the format.");
        setCsvImportStatus("error");
      }
    };

    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quizTitle || !duration) {
      alert("Please fill in all quiz details (title, duration).");
      return;
    }

    if (parseInt(duration) <= 0) {
      alert("Duration must be a positive number.");
      return;
    }

    for (const q of questions) {
      if (!q.question || q.options.some((opt) => !opt) || !q.correct) {
        alert(
          "All questions must have text, four non-empty options, and a correct answer."
        );
        return;
      }

      if (q.question.length > 250) {
        alert("Question text must not exceed 250 characters.");
        return;
      }

      if (q.options.some((opt) => opt.length > 255)) {
        alert("Option text must not exceed 255 characters.");
        return;
      }
    }

    const payload = {
      title: quizTitle,
      duration_minutes: parseInt(duration) || 0,
      questions: questions.map((q) => ({
        text: q.question,
        options: q.options.map((opt, index) => ({
          text: opt,
          is_correct: q.correct === (index + 1).toString(),
        })),
      })),
    };

    try {
      const response = await axios.post(`${baseApi}/quiz/create-quiz/`, payload, {
        headers: {
          Authorization: `Token ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Quiz created:", response.data);
      setSuccessMessage("Quiz created successfully!");
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        navigate("/view-question");
      }, 1800);
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      if (error.response?.data) {
        alert("Failed to create quiz: " + JSON.stringify(error.response.data));
      } else {
        alert("An error occurred while creating the quiz.");
      }
    }
  };

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
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
                  Add Interview Questions
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Build your question set in a clean and professional way.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-full xl:min-w-[520px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Questions Added</p>
                  <h3 className="text-3xl font-bold mt-2">{questions.length}</h3>
                  <p className="text-xs text-slate-300 mt-1">In this form</p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Quiz Sets Created</p>
                  <h3 className="text-3xl font-bold mt-2">{myQuizCount}</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Total created quiz sets
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 lg:p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    Quiz Details
                  </h2>
                  <p className="text-slate-500 text-sm sm:text-base mt-2">
                    Add the title and duration for this question set.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e) =>
                      setQuizTitle(
                        e.target.value
                          .replace(/[^a-zA-Z\s]/g, "")
                          .trimStart()
                          .replace(/\s{2,}/g, " ")
                      )
                    }
                    maxLength={50}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                    placeholder="Enter quiz title..."
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {quizTitle.length}/50 characters
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-600" />
                    Duration
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value.slice(0, 3))}
                      min="1"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition"
                      placeholder="Minutes"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
              <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 lg:p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      Import Questions
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base mt-2">
                      Upload a CSV file and fill the questions quickly.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 sm:p-8 text-center hover:border-blue-400 transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-7 h-7 text-blue-600" />
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    Upload CSV file
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                    Import multiple questions at once using the required CSV
                    format.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvImport}
                    className="hidden"
                    id="csv-upload"
                  />

                  <label
                    htmlFor="csv-upload"
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-medium cursor-pointer transition"
                  >
                    <Upload className="w-4 h-4" />
                    Select CSV File
                  </label>
                </div>

                {csvImportStatus === "success" && (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <CheckCircle className="w-5 h-5" />
                      Import successful
                    </div>
                    <p className="text-sm text-emerald-700 mt-2">
                      Questions imported successfully.
                    </p>
                  </div>
                )}

                {csvImportStatus === "error" && (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-2 text-red-700 font-semibold">
                      <AlertCircle className="w-5 h-5" />
                      Import failed
                    </div>
                    <p className="text-sm text-red-700 mt-2 break-words">
                      {csvError}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 lg:p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                        <LayoutPanelTop className="w-5 h-5" />
                      </div>
                      CSV Guide
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base mt-2">
                      Use the correct structure for import.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-50 p-5 border border-slate-200">
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li>
                      <code className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                        question
                      </code>{" "}
                      - question text
                    </li>
                    <li>
                      <code className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                        option1
                      </code>{" "}
                      - first option
                    </li>
                    <li>
                      <code className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                        option2
                      </code>{" "}
                      - second option
                    </li>
                    <li>
                      <code className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                        option3
                      </code>{" "}
                      - third option
                    </li>
                    <li>
                      <code className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                        option4
                      </code>{" "}
                      - fourth option
                    </li>
                    <li>
                      <code className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs">
                        correct_option
                      </code>{" "}
                      - value must be 1, 2, 3, or 4
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={downloadCsvTemplate}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 font-medium transition w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 lg:p-8 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3 flex-wrap">
                    <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <span>Questions ({questions.length})</span>
                  </h2>
                  <p className="text-slate-500 text-sm sm:text-base mt-2">
                    Review imported questions or add new ones manually.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addQuestionSet}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 font-semibold transition w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>

              <div className="space-y-5">
                {questions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="rounded-[30px] border border-slate-200/80 bg-white p-4 sm:p-5 lg:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] hover:shadow-[0_14px_40px_rgba(15,23,42,0.09)] transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3 flex-wrap">
                          <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                            {qIndex + 1}
                          </span>
                          Question {qIndex + 1}
                          {q.isImported && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                              Imported
                            </span>
                          )}
                        </h3>
                      </div>

                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestionSet(qIndex)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 font-medium transition w-full sm:w-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <PenSquare className="w-4 h-4 text-blue-600" />
                          Question Text
                        </label>
                        <textarea
                          value={q.question}
                          onChange={(e) =>
                            handleQuestionChange(
                              qIndex,
                              "question",
                              e.target.value
                            )
                          }
                          rows={3}
                          maxLength={250}
                          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                          placeholder="Enter your question here..."
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          {q.question.length}/250 characters
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[0, 1, 2, 3].map((oIndex) => (
                          <div
                            key={oIndex}
                            className="rounded-3xl border border-slate-200 bg-white p-4"
                          >
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Option {oIndex + 1}
                            </label>
                            <input
                              type="text"
                              value={q.options[oIndex]}
                              onChange={(e) =>
                                handleOptionChange(qIndex, oIndex, e.target.value)
                              }
                              maxLength={255}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                              placeholder={`Enter option ${oIndex + 1}...`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Correct Answer
                        </label>
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition"
                          value={q.correct}
                          onChange={(e) =>
                            handleQuestionChange(
                              qIndex,
                              "correct",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select the correct option</option>
                          <option value="1">Option 1</option>
                          <option value="2">Option 2</option>
                          <option value="3">Option 3</option>
                          <option value="4">Option 4</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Ready to create this quiz?
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Review your question set and publish when ready.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 font-bold text-base shadow-lg transition w-full lg:w-auto"
                >
                  <Rocket className="w-5 h-5" />
                  Create Quiz
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
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
    </InterviewerDashboardSkeleton>
  );
};

export default AddInterviewQuestion;
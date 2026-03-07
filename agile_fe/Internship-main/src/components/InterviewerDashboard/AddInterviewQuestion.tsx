import { useState, useRef } from "react";
import InterviewerDashboardSkeleton from "../skeleton/InterviewerDashboardSkeleton";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Target, 
  ArrowLeft, 
  Settings, 
  FileText, 
  BarChart3, 
  Clock, 
  HelpCircle, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Rocket,
  Upload,
  Download,
  AlertCircle,
  Package
} from "lucide-react";

const baseApi = import.meta.env.VITE_BASE_API;

const Papa = {
  parse: (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/"/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/"/g, ''));

      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
    return { data };
  }
};

interface Question {
  question: string;
  options: string[];
  correct: string;
  isImported?: boolean; // Add this flag to track imported questions
}

const AddInterviewQuestion: React.FC = () => {
  const [quizTitle, setQuizTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    {
      question: '',
      options: ['', '', '', ''],
      correct: '',
      isImported: false // Default questions are not imported
    }
  ]);
  const [csvImportStatus, setCsvImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [csvError, setCsvError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const addQuestionSet = () => {
    setQuestions([...questions, { 
      question: '', 
      options: ['', '', '', ''], 
      correct: '',
      isImported: false // Manually added questions are not imported
    }]);
  };

  const removeQuestionSet = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    } else {
      alert('At least one question is required.');
    }
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const updatedQuestions = [...questions];
    if (field === 'question') updatedQuestions[index].question = value;
    if (field === 'correct') updatedQuestions[index].correct = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setQuestions(updatedQuestions);
  };

  const downloadCsvTemplate = () => {
    const csvContent = `question,option1,option2,option3,option4,correct_option
"What is the capital of France?","Paris","London","Berlin","Madrid","1"
"Which programming language is known for AI?","Java","Python","C++","Ruby","2"
"What does HTML stand for?","Hypertext Markup Language","High Tech Modern Language","Home Tool Markup Language","Hyperlink Text Management Language","1"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const validateCsvData = (data: any[]): string | null => {
    const requiredColumns = ['question', 'option1', 'option2', 'option3', 'option4', 'correct_option'];

    if (data.length === 0) {
      return 'CSV file is empty';
    }

    const firstRow = data[0];
    const availableColumns = Object.keys(firstRow);
    const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));

    if (missingColumns.length > 0) {
      return `Missing required columns: ${missingColumns.join(', ')}. Available columns: ${availableColumns.join(', ')}`;
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows
      if (!row.question && !row.option1 && !row.option2 && !row.option3 && !row.option4) {
        continue;
      }

      // Check if question is provided
      if (!row.question || row.question.trim() === '') {
        return `Row ${i + 1}: Question is required`;
      }

      // Check if all options are provided
      for (let j = 1; j <= 4; j++) {
        const optionKey = `option${j}`;
        if (!row[optionKey] || row[optionKey].toString().trim() === '') {
          return `Row ${i + 1}: Option ${j} is required`;
        }
      }

      // Check if correct_option is valid
      const correctOption = row.correct_option?.toString().trim();
      if (!correctOption || !['1', '2', '3', '4'].includes(correctOption)) {
        return `Row ${i + 1}: correct_option must be 1, 2, 3, or 4 (found: "${correctOption}")`;
      }

      // Check character limits
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

    setCsvImportStatus('idle');
    setCsvError('');

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setCsvError('Please select a valid CSV file');
      setCsvImportStatus('error');
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
          setCsvImportStatus('error');
          return;
        }

        const importedQuestions = result.data
          .filter((row: any) => row.question && row.question.trim() !== '') // Filter out empty rows
          .map((row: any) => ({
            question: row.question.toString().trim(),
            options: [
              row.option1.toString().trim(),
              row.option2.toString().trim(),
              row.option3.toString().trim(),
              row.option4.toString().trim()
            ],
            correct: row.correct_option.toString().trim(),
            isImported: true // Mark imported questions
          }));

        setQuestions(importedQuestions);
        setCsvImportStatus('success');

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        setCsvError('Error parsing CSV file. Please check the format.');
        setCsvImportStatus('error');
      }
    };

    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!quizTitle || !duration) {
      alert('Please fill in all quiz details (title, duration).');
      return;
    }
    if (parseInt(duration) <= 0) {
      alert('Duration must be a positive number.');
      return;
    }
    for (const q of questions) {
      if (!q.question || q.options.some(opt => !opt) || !q.correct) {
        alert('All questions must have text, four non-empty options, and a correct answer.');
        return;
      }
      if (q.question.length > 250) {
        alert('Question text must not exceed 250 characters.');
        return;
      }
      if (q.options.some(opt => opt.length > 255)) {
        alert('Option text must not exceed 255 characters.');
        return;
      }
    }

    // Transform data to match backend serializer
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
          Authorization: `Token ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Quiz created:', response.data);
      navigate('/view-question');

      console.log('Quiz payload:', payload);
      alert('Quiz created successfully!');
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      if (error.response?.data) {
        alert('Failed to create quiz: ' + JSON.stringify(error.response.data));
      } else {
        alert('An error occurred while creating the quiz.');
      }
    }
  };

  // Count imported questions
  const importedQuestionsCount = questions.filter(q => q.isImported).length;

  return (
    <InterviewerDashboardSkeleton>
      <div className="w-full overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
          {/* Header Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl mb-4 sm:mb-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="w-full sm:w-auto">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3 flex-wrap">
                  <Target className="text-blue-600 flex-shrink-0" size={20} />
                  <span>Create New Quiz</span>
                </h1>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Quiz Configuration Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3 mb-2">
                  <Settings className="text-indigo-600 flex-shrink-0" size={20} />
                  <span>Quiz Configuration</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                    <FileText className="text-blue-500 flex-shrink-0" size={16} />
                    <span>Quiz Title</span>
                  </label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e) =>
                      setQuizTitle(
                        e.target.value
                          .replace(/[^a-zA-Z\s]/g, '')
                          .trimStart()
                          .replace(/\s{2,}/g, ' ')
                      )
                    }
                    maxLength={50}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 text-gray-700 text-sm sm:text-base"
                    placeholder="Enter quiz title..."
                  />
                  <div className="text-xs text-gray-500">{quizTitle.length}/50 characters</div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Clock className="text-purple-500 flex-shrink-0" size={16} />
                    <span>Duration</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value.slice(0, 3))}
                      className="w-full border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 text-gray-700 text-sm sm:text-base"
                      placeholder="Minutes"
                      min="1"
                    />
                    <span className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CSV Import Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3 mb-2">
                  <Upload className="text-green-600 flex-shrink-0" size={20} />
                  <span>Import Questions from CSV</span>
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">Upload a CSV file to quickly import multiple questions</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center hover:border-blue-400 transition-colors duration-200">
                    <Upload className="mx-auto text-gray-400 mb-2" size={28} />
                    <p className="text-sm text-gray-600 mb-3">Choose CSV file to upload</p>
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
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200 inline-block text-sm sm:text-base"
                    >
                      Select CSV File
                    </label>
                  </div>

                  {csvImportStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle size={16} className="flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">Success!</span>
                      </div>
                      <p className="text-green-600 text-sm mt-1">
                        {importedQuestionsCount} questions imported successfully. You can now review and edit them below.
                      </p>
                    </div>
                  )}

                  {csvImportStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">Error</span>
                      </div>
                      <p className="text-red-600 text-sm mt-1 break-words">{csvError}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Download size={16} className="flex-shrink-0" />
                      <span>CSV Format Guide</span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Your CSV should have these columns:
                    </p>
                    <ul className="text-xs sm:text-sm text-gray-600 space-y-1 mb-4">
                      <li className="break-all">• <code className="bg-gray-200 px-1 rounded text-xs">question</code> - The question text</li>
                      <li className="break-all">• <code className="bg-gray-200 px-1 rounded text-xs">option1</code> - First option</li>
                      <li className="break-all">• <code className="bg-gray-200 px-1 rounded text-xs">option2</code> - Second option</li>
                      <li className="break-all">• <code className="bg-gray-200 px-1 rounded text-xs">option3</code> - Third option</li>
                      <li className="break-all">• <code className="bg-gray-200 px-1 rounded text-xs">option4</code> - Fourth option</li>
                      <li className="break-all">• <code className="bg-gray-200 px-1 rounded text-xs">correct_option</code> - Correct answer (1-4)</li>
                    </ul>
                    <button
                      type="button"
                      onClick={downloadCsvTemplate}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      <Download size={14} />
                      <span>Download Template</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <div className="w-full sm:w-auto">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <HelpCircle className="text-orange-600 flex-shrink-0" size={24} />
                    <span>Questions ({questions.length})</span>
                    {importedQuestionsCount > 0 && (
                      <span className="text-xs sm:text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
                        {importedQuestionsCount} imported
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {importedQuestionsCount > 0 
                      ? "Review and edit your imported questions below, or add more questions"
                      : "Add your quiz questions and multiple choice options"
                    }
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                  onClick={addQuestionSet}
                >
                  <Plus size={18} />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="border-2 border-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                        <span className="bg-blue-500 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm flex-shrink-0">
                          {qIndex + 1}
                        </span>
                        <span>Question {qIndex + 1}</span>
                        {q.isImported && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">Imported</span>
                        )}
                      </h3>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold shadow-md transform hover:scale-105 transition-all duration-200 text-sm flex items-center gap-2 w-full sm:w-auto justify-center"
                          onClick={() => removeQuestionSet(qIndex)}
                        >
                          <Trash2 size={16} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Question Text
                        </label>
                        <textarea
                          value={q.question}
                          onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                          rows={3}
                          maxLength={250}
                          className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 resize-none text-gray-700 text-sm sm:text-base"
                          placeholder="Enter your question here..."
                        />
                        <div className="text-xs text-gray-500 mt-1">{q.question.length}/250 characters</div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {[0, 1, 2, 3].map((oIndex) => (
                          <div key={oIndex} className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              Option {oIndex + 1}
                            </label>
                            <input
                              type="text"
                              value={q.options[oIndex]}
                              onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                              maxLength={255}
                              className="w-full border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 text-gray-700 text-sm sm:text-base"
                              placeholder={`Enter option ${oIndex + 1}...`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                          <span>Correct Answer</span>
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 text-gray-700 bg-white text-sm sm:text-base"
                          value={q.correct}
                          onChange={(e) => handleQuestionChange(qIndex, 'correct', e.target.value)}
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

            {/* Submit Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-xl transform hover:scale-105 transition-all duration-200 w-full sm:w-auto flex items-center justify-center gap-3"
                >
                  <Rocket size={20} />
                  <span>Create Quiz</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default AddInterviewQuestion;
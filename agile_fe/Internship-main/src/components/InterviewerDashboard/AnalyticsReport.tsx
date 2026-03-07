// src/pages/interviewer/AnalyticsReport.tsx
import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Calendar,
  Download,
  Filter,
  Briefcase,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  BarChart2Icon as BarChartIcon,
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../../components/skeleton/InterviewerDashboardSkeleton';

// ─── Mock Data ────────────────────────────────────────────────
const funnelData = [
  { name: 'Applied', value: 480, fill: '#3b82f6' },
  { name: 'Took Quiz', value: 320, fill: '#60a5fa' },
  { name: 'Passed Quiz', value: 180, fill: '#93c5fd' },
  { name: 'Interview', value: 95, fill: '#bfdbfe' },
  { name: 'Hired', value: 42, fill: '#1e40af' },
];

const timeToHireData = [
  { month: 'Jan', days: 18 },
  { month: 'Feb', days: 15 },
  { month: 'Mar', days: 14 },
  { month: 'Apr', days: 12 },
  { month: 'May', days: 13 },
  { month: 'Jun', days: 11 },
];

const assessmentScores = [
  { quiz: 'HTML/CSS', avg: 78, passRate: 82 },
  { quiz: 'JavaScript', avg: 65, passRate: 68 },
  { quiz: 'React', avg: 71, passRate: 75 },
  { quiz: 'Python', avg: 82, passRate: 88 },
];

const sourceData = [
  { name: 'University Portal', value: 38 },
  { name: 'LinkedIn', value: 24 },
  { name: 'Job Board', value: 18 },
  { name: 'Referral', value: 12 },
  { name: 'Other', value: 8 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a78bfa'];

const KPICard = ({ icon: Icon, title, value, trend }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <Icon className="w-10 h-10 text-blue-500 opacity-80" />
    </div>
    {trend && (
      <p className="text-sm mt-3">
        <span className={trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
          {trend}
        </span>{' '}
        vs last period
      </p>
    )}
  </div>
);

const AnalyticsReport: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedRole, setSelectedRole] = useState('all');

  // In real app → fetch data here based on filters
  // useEffect(() => { fetchAggregatedData(dateRange, selectedRole) }, [dateRange, selectedRole]);

  const handleExport = (format: 'pdf' | 'csv') => {
    alert(`Exporting current view as ${format.toUpperCase()}... (mock)`);
    // Real: call API endpoint /api/reports/export?format=pdf&range=30d...
  };

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen bg-gray-50 pb-12">
        {/* Sticky Filters Bar */}
        <div className="sticky top-0 z-20 bg-white border-b shadow-sm px-4 md:px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>

            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="ytd">Year to Date</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="frontend">Frontend Developer</option>
                  <option value="python">Python Backend</option>
                  <option value="mobile">Mobile Dev Intern</option>
                </select>
              </div>

              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={18} />
                Export PDF
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard icon={Users} title="Total Applications" value="480" trend="+18%" />
            <KPICard icon={CheckCircle} title="Hired Candidates" value="42" trend="+5%" />
            <KPICard icon={Clock} title="Avg. Time-to-Hire" value="13.8 days" trend="-2.1 days" />
            <KPICard icon={TrendingUp} title="Conversion Rate" value="8.75%" trend="+1.2%" />
          </div>

          {/* Charts Grid */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Hiring Funnel */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Hiring Funnel (Drop-off Analysis)
              </h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 2. Time to Hire Trend */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <Clock size={20} className="text-blue-600" />
                Average Time-to-Hire Trend
              </h2>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={timeToHireData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis unit=" days" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="days" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 3. Assessment Scores */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <BarChartIcon size={20} className="text-blue-600" />
                Quiz Performance Breakdown
              </h2>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={assessmentScores} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quiz" />
                  <YAxis yAxisId="left" orientation="left" unit="%" />
                  <YAxis yAxisId="right" orientation="right" unit="%" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avg" name="Average Score" fill="#3b82f6" />
                  <Bar yAxisId="right" dataKey="passRate" name="Pass Rate" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 4. Source of Candidates */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Candidate Sources
              </h2>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 text-center text-sm text-gray-500">
          Last updated: February 26, 2026 • Data is aggregated from all internship applications
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default AnalyticsReport;
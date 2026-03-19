// src/pages/candidate/SkillLeaderboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Filter,
  Search,
  ChevronDown,
  Star,
  Zap,
  Clock,
  TrendingUp,
  Users,
  Crown,
  Target,
  BarChart2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import CandidateDashboardSkeleton from '../../components/skeleton/CandidateDashboardSkeleton';
import axios from 'axios';

const baseApi = import.meta.env.VITE_BASE_API;

const api = axios.create({
  baseURL: baseApi,
  headers: { "Content-Type": "application/json" },
});

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface TestResult {
  id: number;
  company_name: string;
  internship_title: string;
  score: number;
  passed: boolean;
  completed_date: string;
}

interface Application {
  id: number;
  internship: {
    id: number;
    company_name: string;
    internship_role: string;
  };
  test_score: number | null;
  test_passed: boolean;
  test_completed: boolean;
  applied_at: string;
  status: string;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  profile_photo?: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  username: string | null;
  score: number;
  primaryStack: string;
  badge: string | null;
  userId?: number;
  testsCompleted?: number;
}

interface DomainRank {
  domain: string;
  rank: number;
  percentile: string;
  score: number;
}

interface UserRankData {
  globalRank: number;
  totalScore: number;
  testsCompleted: number;
  domainRanks: DomainRank[];
  recentAchievements: {
    title: string;
    points: string;
    date: string;
    internship?: string;
  }[];
}

// ────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────
const getRankColor = (rank: number) => {
  if (rank === 1) return 'text-yellow-500';
  if (rank === 2) return 'text-gray-400';
  if (rank === 3) return 'text-amber-700';
  return 'text-slate-400';
};

const getRankBadge = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
  return null;
};

const getBadgeFromRank = (rank: number, totalParticipants: number): string | null => {
  const percentile = (rank / totalParticipants) * 100;
  if (percentile <= 1) return "Top 1%";
  if (percentile <= 5) return "Top 5%";
  if (percentile <= 10) return "Top 10%";
  if (percentile <= 15) return "Top 15%";
  return null;
};

const getDomainFromRole = (role: string): string => {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('frontend') || roleLower.includes('front-end')) return 'Frontend';
  if (roleLower.includes('backend') || roleLower.includes('back-end')) return 'Backend';
  if (roleLower.includes('fullstack') || roleLower.includes('full-stack')) return 'Full Stack';
  if (roleLower.includes('python')) return 'Python';
  if (roleLower.includes('data')) return 'Data Science';
  if (roleLower.includes('ui') || roleLower.includes('ux')) return 'UI/UX';
  return 'General';
};

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────
const SkillLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRankData | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUsername = localStorage.getItem("username");

    if (!token) {
      setError("No access token found. Please login again.");
      setLoading(false);
      return;
    }

    const fetchLeaderboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch current user profile to get user ID
        const profileResponse = await api.get('/profiles/', {
          headers: { Authorization: `Token ${token}` }
        }).catch(() => ({ data: { id: 1, username: storedUsername || 'candidate' } }));

        const currentUser = profileResponse.data;
        setCurrentUserId(currentUser.id);

        // Fetch test results for all candidates
        // Note: You might need a dedicated leaderboard endpoint
        // For now, we'll fetch applications and test results
        const [applicationsResponse, testResultsResponse] = await Promise.all([
          api.get('/candidates/list-applications/', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: [] })),
          api.get('/candidates/test-results/', {
            headers: { Authorization: `Token ${token}` }
          }).catch(() => ({ data: { results: [] } }))
        ]);

        const applications = applicationsResponse.data || [];
        const testResults = testResultsResponse.data?.results || [];

        // Build leaderboard from test results and applications
        const leaderboardMap = new Map<number, LeaderboardEntry>();
        const userScores: { [key: string]: { total: number; count: number; domains: Set<string> } } = {};

        // Process test results
        testResults.forEach((result: TestResult) => {
          const key = result.company_name + '-' + result.internship_title;
          if (!userScores[key]) {
            userScores[key] = { total: 0, count: 0, domains: new Set() };
          }
          userScores[key].total += result.score;
          userScores[key].count += 1;
          userScores[key].domains.add(getDomainFromRole(result.internship_title));
        });

        // Create leaderboard entries
        let entries: LeaderboardEntry[] = [];
        Object.entries(userScores).forEach(([key, data], index) => {
          const avgScore = Math.round(data.total / data.count);
          const primaryDomain = Array.from(data.domains)[0] || 'General';
          
          entries.push({
            rank: 0, // Will be sorted and assigned later
            name: key.split('-')[0] || 'Anonymous',
            username: null,
            score: avgScore,
            primaryStack: primaryDomain,
            badge: null,
            testsCompleted: data.count
          });
        });

        // Sort by score descending
        entries.sort((a, b) => b.score - a.score);
        
        // Assign ranks and badges
        entries = entries.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          badge: getBadgeFromRank(index + 1, entries.length)
        }));

        setLeaderboard(entries);

        // Calculate user's rank
        if (currentUser.id) {
          // Find user's applications and calculate their score
          const userApplications = applications.filter((app: Application) => app.test_score !== null);
          const userTotalScore = userApplications.reduce((acc: number, app: Application) => acc + (app.test_score || 0), 0);
          const userAvgScore = userApplications.length > 0 
            ? Math.round(userTotalScore / userApplications.length)
            : 0;

          // Find user's rank
          const userGlobalRank = entries.findIndex(e => e.score <= userAvgScore) + 1;

          // Calculate domain ranks
          const domainGroups: { [key: string]: { scores: number[]; names: string[] } } = {};
          entries.forEach(entry => {
            if (!domainGroups[entry.primaryStack]) {
              domainGroups[entry.primaryStack] = { scores: [], names: [] };
            }
            domainGroups[entry.primaryStack].scores.push(entry.score);
          });

          const domainRanks: DomainRank[] = Object.entries(domainGroups).map(([domain, data]) => {
            const domainScores = data.scores.sort((a, b) => b - a);
            const userDomainScore = userApplications
              .filter((app: Application) => getDomainFromRole(app.internship.internship_role) === domain)
              .reduce((acc: number, app: Application) => acc + (app.test_score || 0), 0);
            
            const userDomainRank = domainScores.findIndex(score => score <= userDomainScore) + 1;
            const percentile = ((userDomainRank / domainScores.length) * 100).toFixed(1);
            
            return {
              domain,
              rank: userDomainRank || 1,
              percentile: `Top ${percentile}%`,
              score: userDomainScore
            };
          });

          // Create recent achievements from test results
          const recentAchievements = testResults
            .slice(0, 3)
            .map((result: TestResult) => ({
              title: `Perfect Score – ${result.internship_title}`,
              points: `+${result.score}`,
              date: new Date(result.completed_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
              internship: result.company_name
            }));

          setUserRank({
            globalRank: userGlobalRank || 1,
            totalScore: userAvgScore,
            testsCompleted: userApplications.length,
            domainRanks: domainRanks.slice(0, 3),
            recentAchievements: recentAchievements.length > 0 ? recentAchievements : [
              { title: "Complete your first quiz", points: "+0", date: "Not started" }
            ]
          });
        }

      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setError('Failed to load leaderboard. Please try again.');
        
        // Set fallback data for development
        setLeaderboard([]);
        setUserRank({
          globalRank: 1,
          totalScore: 0,
          testsCompleted: 0,
          domainRanks: [
            { domain: "Frontend Development", rank: 1, percentile: "Top 1%", score: 0 },
            { domain: "Python", rank: 1, percentile: "Top 1%", score: 0 },
          ],
          recentAchievements: [
            { title: "Complete your first quiz", points: "+0", date: "Not started" }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  // Apply filters and search
  const filteredLeaderboard = leaderboard.filter(item =>
    (filter === 'all' ? true : item.primaryStack.toLowerCase().includes(filter.toLowerCase())) &&
    (item.name?.toLowerCase().includes(search.toLowerCase()) ||
     (item.username?.toLowerCase().includes(search.toLowerCase()) ?? false))
  );

  if (loading) {
    return (
      <CandidateDashboardSkeleton>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">Loading leaderboard...</p>
            <p className="text-sm text-slate-400 mt-2">Gathering top performers</p>
          </div>
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  if (error) {
    return (
      <CandidateDashboardSkeleton>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-800 text-lg font-semibold mb-2">Error loading leaderboard</p>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  const totalParticipants = leaderboard.length;
  const topScore = leaderboard[0]?.score || 0;
  const averageScore = totalParticipants > 0
    ? Math.round(leaderboard.reduce((acc, curr) => acc + curr.score, 0) / totalParticipants)
    : 0;

  return (
    <CandidateDashboardSkeleton>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          
          {/* Header with gradient */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />

            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200 whitespace-nowrap">
                  <Trophy className="w-4 h-4 shrink-0" />
                  <span>Skills competition leaderboard</span>
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Skill Leaderboard
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                  Compete with peers, track your progress, and earn recognition for your skills.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 min-w-full xl:min-w-[620px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Participants</p>
                  <h3 className="text-3xl font-bold mt-2">{totalParticipants}</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Your Rank</p>
                  <h3 className="text-3xl font-bold mt-2">#{userRank?.globalRank || '-'}</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Top Score</p>
                  <h3 className="text-3xl font-bold mt-2">{topScore}</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Avg Score</p>
                  <h3 className="text-3xl font-bold mt-2">{averageScore}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Your Rank Banner */}
          {userRank && (
            <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">
              <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 p-5 sm:p-7 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_28%)]" />
                
                <div className="relative">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-yellow-300" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-100">Your Global Ranking</p>
                        <p className="text-4xl font-bold">#{userRank.globalRank}</p>
                        <p className="text-sm text-blue-100 mt-1">
                          Total Score: {userRank.totalScore} • Tests: {userRank.testsCompleted}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {userRank.domainRanks.map((dr, index) => (
                        <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
                          <p className="text-xs text-blue-100">{dr.domain}</p>
                          <p className="text-2xl font-bold mt-1">#{dr.rank}</p>
                          <p className="text-xs text-blue-100">{dr.percentile}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Filter leaderboard:</span>
              </div>

              <div className="flex flex-wrap gap-3 flex-1 justify-end">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search name or username..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-11 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  />
                </div>

                <div className="relative">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition min-w-[180px] cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="frontend">Frontend</option>
                    <option value="python">Python</option>
                    <option value="fullstack">Full Stack</option>
                    <option value="backend">Backend</option>
                    <option value="data science">Data Science</option>
                    <option value="ui/ux">UI/UX</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 size={20} className="text-blue-600" />
                  Global Rankings
                </h2>
                <p className="text-sm text-slate-500">
                  Showing {filteredLeaderboard.length} of {totalParticipants} participants
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary Stack</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tests</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaderboard.map((entry) => (
                    <tr 
                      key={entry.rank} 
                      className={`hover:bg-slate-50 transition-colors ${
                        entry.userId === currentUserId ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {entry.rank <= 3 ? (
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                              entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                              entry.rank === 2 ? 'bg-slate-200 text-slate-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {entry.rank}
                            </div>
                          ) : (
                            <span className="text-slate-600 font-medium w-8 text-center">{entry.rank}</span>
                          )}
                          {entry.rank <= 3 && getRankBadge(entry.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-slate-900">
                            {entry.username || <span className="text-slate-400 italic">Anonymous</span>}
                          </p>
                          {entry.name && entry.username !== entry.name && (
                            <p className="text-xs text-slate-500">{entry.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {entry.primaryStack}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-slate-900">{entry.score}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{entry.testsCompleted || 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.badge && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            entry.badge.includes('Top') ? 'bg-yellow-100 text-yellow-700' :
                            entry.badge.includes('Rising') ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {entry.badge}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLeaderboard.length === 0 && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  No results found
                </h3>
                <p className="text-sm text-slate-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>

          {/* Recent Achievements */}
          {userRank?.recentAchievements && userRank.recentAchievements.length > 0 && (
            <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Zap size={20} className="text-yellow-600" />
                  Recent Achievements
                </h2>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userRank.recentAchievements.map((ach, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white shrink-0">
                            <Trophy size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{ach.title}</p>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Clock size={12} />
                              {ach.date}
                            </p>
                            {ach.internship && (
                              <p className="text-xs text-slate-400 mt-1">{ach.internship}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-green-600 font-bold text-lg">{ach.points}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer Stats */}
          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl px-6 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <TrendingUp size={16} />
                Leaderboard updates in real-time as you complete quizzes
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Star size={16} />
                  Top 10% get special badges
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Target size={16} />
                  Complete quizzes to improve rank
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default SkillLeaderboard;
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

// ────────────────────────────────────────────────
// Mock data – replace with real API later
// ────────────────────────────────────────────────
const MOCK_LEADERBOARD = [
  { rank: 1, name: "Tharindu", username: "tharindu_dev", score: 2850, primaryStack: "Frontend", badge: "Top 1%" },
  { rank: 2, name: "Lengend", username: "lengend_cse", score: 2720, primaryStack: "Full Stack", badge: "Top 5%" },
  { rank: 3, name: "Anonymous_472", username: null, score: 2680, primaryStack: "Python", badge: null },
  { rank: 4, name: "Nirojan", username: "niro_dev", score: 2540, primaryStack: "Backend", badge: "Rising Star" },
  { rank: 5, name: "Kavindi", username: "kavindi_codes", score: 2450, primaryStack: "Frontend", badge: "Top 10%" },
  { rank: 6, name: "Arjun", username: "arjun_py", score: 2380, primaryStack: "Python", badge: null },
  { rank: 7, name: "Priya", username: "priya_design", score: 2310, primaryStack: "UI/UX", badge: "Rising Star" },
  { rank: 8, name: "Rahul", username: "rahul_dev", score: 2250, primaryStack: "Backend", badge: null },
  { rank: 9, name: "Deepika", username: "deepika_fullstack", score: 2180, primaryStack: "Full Stack", badge: "Top 15%" },
  { rank: 10, name: "Suresh", username: "suresh_data", score: 2120, primaryStack: "Data Science", badge: null },
];

const MOCK_USER_RANK = {
  globalRank: 47,
  domainRanks: [
    { domain: "Frontend Development", rank: 12, percentile: "Top 8%" },
    { domain: "Python", rank: 5, percentile: "Top 3%" },
    { domain: "Full Stack", rank: 31, percentile: "Top 15%" },
  ],
  recentAchievements: [
    { title: "Perfect Score – React Quiz", points: "+120", date: "Feb 25, 2026" },
    { title: "Completed DSA Challenge", points: "+85", date: "Feb 22, 2026" },
    { title: "JavaScript Mastery", points: "+200", date: "Feb 18, 2026" },
  ],
  totalScore: 2720,
};

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

const SkillLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API delay
    setTimeout(() => {
      setLeaderboard(MOCK_LEADERBOARD);
      setUserRank(MOCK_USER_RANK);
      setLoading(false);
    }, 900);

    // Real version would be:
    // fetch(`/api/leaderboard?filter=${filter}&search=${search}`)
  }, [filter, search]);

  const filteredLeaderboard = leaderboard.filter(item =>
    item.primaryStack.toLowerCase().includes(filter === 'all' ? '' : filter.toLowerCase()) &&
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
          </div>
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  const totalParticipants = leaderboard.length;
  const topScore = leaderboard[0]?.score || 0;
  const averageScore = Math.round(leaderboard.reduce((acc, curr) => acc + curr.score, 0) / totalParticipants);

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
                  <h3 className="text-3xl font-bold mt-2">#{userRank?.globalRank}</h3>
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
                        <p className="text-sm text-blue-100 mt-1">Total Score: {userRank.totalScore}</p>
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
                    <option value="datascience">Data Science</option>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaderboard.map((entry) => (
                    <tr 
                      key={entry.rank} 
                      className={`hover:bg-slate-50 transition-colors ${
                        entry.username === 'tharindu_dev' ? 'bg-blue-50/50' : ''
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
          {userRank?.recentAchievements?.length > 0 && (
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
                Leaderboard updates every 24 hours
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
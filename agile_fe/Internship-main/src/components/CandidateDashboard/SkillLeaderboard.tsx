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
} from 'lucide-react';
import CandidateDashboardSkeleton from '../../components/skeleton/CandidateDashboardSkeleton'; // adjust path

// ────────────────────────────────────────────────
// Mock data – replace with real API later
// ────────────────────────────────────────────────
const MOCK_LEADERBOARD = [
  { rank: 1, name: "Tharindu", username: "tharindu_dev", score: 2850, primaryStack: "Frontend", badge: "Top 1%" },
  { rank: 2, name: "Lengend", username: "lengend_cse", score: 2720, primaryStack: "Full Stack", badge: "Top 5%" },
  { rank: 3, name: "Anonymous_472", username: null, score: 2680, primaryStack: "Python", badge: null },
  { rank: 4, name: "Nirojan", username: "niro_dev", score: 2540, primaryStack: "Backend", badge: "Rising Star" },
  // ... more entries
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
  ],
  totalScore: 2720,
};

const SkillLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [filter, setFilter] = useState('all'); // all, frontend, python, fullstack, etc.
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
    item.primaryStack.toLowerCase().includes(filter.toLowerCase()) ||
    (item.name?.toLowerCase().includes(search.toLowerCase())) ||
    (item.username?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <CandidateDashboardSkeleton>
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  return (
    <CandidateDashboardSkeleton>
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Your own rank banner */}
          {userRank && (
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl shadow-xl overflow-hidden text-white">
              <div className="px-6 py-8 sm:px-10 sm:py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Trophy size={32} className="text-yellow-300" />
                      <h1 className="text-3xl font-bold">Your Ranking</h1>
                    </div>
                    <p className="text-xl opacity-90">
                      Global Rank: <span className="font-bold text-yellow-300">#{userRank.globalRank}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {userRank.domainRanks.map((dr, index) => (
                      <div key={index} className="bg-white/20 backdrop-blur-sm px-5 py-3 rounded-xl">
                        <p className="text-sm opacity-80">{dr.domain}</p>
                        <p className="text-2xl font-bold">#{dr.rank}</p>
                        <p className="text-sm opacity-80">{dr.percentile}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search name or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
              />
            </div>

            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none min-w-[180px]"
              >
                <option value="all">All Categories</option>
                <option value="frontend">Frontend</option>
                <option value="python">Python</option>
                <option value="fullstack">Full Stack</option>
                <option value="backend">Backend</option>
                <option value="datascience">Data Science</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Stack</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeaderboard.map((entry) => (
                    <tr key={entry.rank} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {entry.rank <= 3 ? (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold ${
                              entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                              entry.rank === 2 ? 'bg-gray-300 text-gray-800' :
                              'bg-amber-700 text-amber-100'
                            }`}>
                              {entry.rank}
                            </div>
                          ) : (
                            <span className="text-gray-900 font-medium w-8 text-center mr-3">{entry.rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {entry.username ? (
                            <span className="font-medium text-gray-900">{entry.username}</span>
                          ) : (
                            <span className="text-gray-500 italic">Anonymous</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entry.primaryStack}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.score}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.badge && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
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
              <div className="p-12 text-center text-gray-500">
                No results found for current filters
              </div>
            )}
          </div>

          {/* Recent Achievements (side-like widget) */}
          {userRank?.recentAchievements?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap size={20} className="text-yellow-600" />
                Recent Achievements
              </h2>
              <div className="space-y-3">
                {userRank.recentAchievements.map((ach, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{ach.title}</p>
                      <p className="text-sm text-gray-500">{ach.date}</p>
                    </div>
                    <div className="text-green-600 font-bold">+{ach.points}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default SkillLeaderboard;
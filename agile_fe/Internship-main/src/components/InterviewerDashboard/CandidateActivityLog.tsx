// src/pages/interviewer/CandidateActivityLog.tsx
import React, { useState } from 'react';
import {
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  Mail,
  Plus,
  AlertCircle,
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../../components/skeleton/InterviewerDashboardSkeleton'; // adjust path if needed

interface ActivityItem {
  id: string;
  type: 'system' | 'user' | 'note';
  description: string;
  actor?: string;        // who performed the action (null = system)
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

const CandidateActivityLog = () => {
  // Mock data - replace with real API fetch later
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'system',
      description: 'Application submitted for Frontend Developer Intern',
      actor: undefined,
      timestamp: 'Feb 10, 2025 • 09:15 AM',
      icon: <FileText className="h-4 w-4" />,
      color: 'gray',
    },
    {
      id: '2',
      type: 'system',
      description: 'Online coding test invitation sent',
      actor: undefined,
      timestamp: 'Feb 11, 2025 • 02:30 PM',
      icon: <Mail className="h-4 w-4" />,
      color: 'blue',
    },
    {
      id: '3',
      type: 'system',
      description: 'Coding test completed – Score: 82%',
      actor: undefined,
      timestamp: 'Feb 12, 2025 • 11:45 AM',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'green',
    },
    {
      id: '4',
      type: 'user',
      description: 'Moved to Face-to-Face round',
      actor: 'Sarah K.',
      timestamp: 'Feb 15, 2025 • 04:20 PM',
      icon: <Calendar className="h-4 w-4" />,
      color: 'indigo',
    },
    {
      id: '5',
      type: 'note',
      description: 'Candidate requested to reschedule interview to next Monday due to university exam',
      actor: 'John D.',
      timestamp: 'Feb 16, 2025 • 10:05 AM',
      icon: <MessageSquare className="h-4 w-4" />,
      color: 'purple',
    },
  ]);

  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);

    // Simulate API delay
    setTimeout(() => {
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        type: 'note',
        description: newNote.trim(),
        actor: 'You',
        timestamp: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        icon: <MessageSquare className="h-4 w-4" />,
        color: 'purple',
      };

      setActivities([newActivity, ...activities]);
      setNewNote('');
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <InterviewerDashboardSkeleton>
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="text-blue-600" size={28} />
            Candidate Activity Log
          </h1>
          <p className="mt-2 text-gray-600">
            Timeline of all actions, status changes, and internal notes for this candidate
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          {/* Candidate Info Bar (you can make this dynamic later) */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">Nirojan Raj</h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  Frontend Developer Intern Application
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm">
                  Stage: Face-to-Face
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

              {activities.map((activity, index) => (
                <div key={activity.id} className="relative mb-8 last:mb-0">
                  {/* Dot */}
                  <div
                    className={`
                      absolute left-0 top-1.5 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm
                      ${activity.color === 'green' ? 'bg-green-100 text-green-600 border-green-200' : ''}
                      ${activity.color === 'blue' ? 'bg-blue-100 text-blue-600 border-blue-200' : ''}
                      ${activity.color === 'purple' ? 'bg-purple-100 text-purple-600 border-purple-200' : ''}
                      ${activity.color === 'indigo' ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : ''}
                      ${activity.color === 'gray' ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}
                    `}
                  >
                    {activity.icon}
                  </div>

                  {/* Content Card */}
                  <div className="ml-16 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{activity.description}</p>
                        {activity.actor && (
                          <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-600">
                            <User size={14} />
                            <span>{activity.actor}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {activity.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Note Form */}
          <div className="border-t bg-gray-50 p-6">
            <form onSubmit={handleAddNote} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add internal note or observation..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newNote.trim()}
                className={`
                  flex items-center justify-center gap-2 px-6 py-2.5 
                  bg-blue-600 text-white rounded-lg font-medium
                  hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed
                  transition-colors min-w-[120px]
                `}
              >
                {isSubmitting ? (
                  'Saving...'
                ) : (
                  <>
                    <Plus size={18} />
                    Add Note
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Optional footer note */}
        <p className="mt-6 text-center text-sm text-gray-500">
          All actions are automatically logged. Internal notes are visible only to interviewers.
        </p>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default CandidateActivityLog;
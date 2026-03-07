// src/pages/candidate/CandidateMessage.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  User,
  MessageSquare,
} from 'lucide-react';
import CandidateDashboardSkeleton from '../../components/skeleton/CandidateDashboardSkeleton'; // adjust path

// ─── Types ────────────────────────────────────────────────
interface Message {
  id: string;
  sender: 'candidate' | 'recruiter' | 'system';
  content: string;
  timestamp: string;
  read: boolean;
  attachment?: { name: string; url: string; type: string };
  isLink?: boolean;
}

interface Conversation {
  id: string;
  companyName: string;
  recruiterName: string;
  role: string;
  internshipId: string;
  applicationId: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status:
    | 'applied'
    | 'shortlisted'
    | 'quiz_completed'
    | 'interview_scheduled'
    | 'offer_extended'
    | 'rejected'
    | 'hired';
  messages: Message[];
}

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-c1',
    companyName: 'TechNova Solutions',
    recruiterName: 'Ms. Anjali Perera',
    role: 'Frontend Developer Intern',
    internshipId: 'int-101',
    applicationId: 'app_cand001_int101',
    lastMessage: 'Interview scheduled for March 5th at 3:00 PM',
    lastMessageTime: 'Yesterday 4:30 PM',
    unreadCount: 1,
    status: 'interview_scheduled',
    messages: [
      {
        id: 'm1',
        sender: 'recruiter',
        content: 'Hi Lengend, congratulations! You have been shortlisted.',
        timestamp: 'Feb 20, 10:15 AM',
        read: true,
      },
      {
        id: 'm2',
        sender: 'candidate',
        content: 'Thank you! Looking forward to the next steps.',
        timestamp: 'Feb 20, 10:18 AM',
        read: true,
      },
      {
        id: 'm3',
        sender: 'system',
        content: 'System: You scored 92% on the Frontend Quiz. Recruiter has been notified.',
        timestamp: 'Feb 22, 2:45 PM',
        read: true,
      },
      {
        id: 'm4',
        sender: 'recruiter',
        content:
          'Interview scheduled for March 5th at 3:00 PM.\nJoin here: https://zoom.us/j/1234567890',
        timestamp: 'Yesterday 4:30 PM',
        read: false,
        isLink: true,
      },
    ],
  },
  {
    id: 'conv-c2',
    companyName: 'InnoSpark',
    recruiterName: 'Mr. Rajesh Kumar',
    role: 'Python Backend Intern',
    internshipId: 'int-107',
    applicationId: 'app_cand001_int107',
    lastMessage: 'Assignment received. We will review it soon.',
    lastMessageTime: '2 days ago',
    unreadCount: 0,
    status: 'shortlisted',
    messages: [
      {
        id: 'm5',
        sender: 'candidate',
        content: 'Assignment submitted!',
        timestamp: 'Feb 25, 11:40 AM',
        read: true,
      },
      {
        id: 'm6',
        sender: 'recruiter',
        content: 'Thank you. We will review it soon.',
        timestamp: 'Feb 25, 2:10 PM',
        read: true,
      },
    ],
  },
  // more conversations...
];

// ─── Component ─────────────────────────────────────────────
const CandidateMessage: React.FC = () => {
  const [conversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(
    MOCK_CONVERSATIONS[0] || null,
  );
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConv) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'candidate',
      content: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };

    // In real app: send via websocket / API
    setSelectedConv((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, newMsg],
            lastMessage: newMsg.content,
            lastMessageTime: newMsg.timestamp,
          }
        : null,
    );

    setMessageInput('');
  };

  // Very basic URL detection → turn into clickable link
  const renderMessageContent = (msg: Message) => {
    if (msg.isLink || msg.content.includes('http') || msg.content.includes('zoom.us') || msg.content.includes('meet.google.com')) {
      const urlMatch = msg.content.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        const url = urlMatch[0];
        const textWithoutUrl = msg.content.replace(url, '').trim();
        return (
          <>
            {textWithoutUrl && <p>{textWithoutUrl}</p>}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 bg-white/20 text-white rounded border border-white/30 hover:bg-white/30 transition text-sm"
            >
              <ExternalLink size={14} />
              {url.includes('zoom.us') ? 'Join Zoom Meeting' : 'Join Meeting'}
            </a>
          </>
        );
      }
    }
    return <p>{msg.content}</p>;
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.recruiterName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      applied: 'bg-gray-100 text-gray-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      quiz_completed: 'bg-indigo-100 text-indigo-800',
      interview_scheduled: 'bg-purple-100 text-purple-800',
      offer_extended: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      hired: 'bg-emerald-100 text-emerald-800',
    };

    const labels = {
      applied: 'Applied',
      shortlisted: 'Shortlisted',
      quiz_completed: 'Quiz Completed',
      interview_scheduled: 'Interview Scheduled',
      offer_extended: 'Offer Extended',
      rejected: 'Not Selected',
      hired: 'Hired',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <CandidateDashboardSkeleton>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>

          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search companies, roles, messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            />
          </div>
        </div>

        {/* Two-pane layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Conversations */}
          <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No messages yet</div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConv?.id === conv.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                      {conv.companyName.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-medium text-gray-900 truncate">{conv.companyName}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {conv.lastMessageTime}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.role}</p>
                      <p className="mt-1 text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConv ? (
              <>
                {/* Chat header with status */}
                <div className="bg-white border-b px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {selectedConv.companyName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">{selectedConv.companyName}</h2>
                        <p className="text-sm text-gray-600">{selectedConv.role}</p>
                      </div>
                    </div>

                    <div>{getStatusBadge(selectedConv.status)}</div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-gray-50">
                  {selectedConv.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === 'candidate'
                          ? 'justify-end'
                          : msg.sender === 'system'
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      {msg.sender === 'system' ? (
                        <div className="max-w-[80%] px-5 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-center text-sm text-yellow-800">
                          {msg.content}
                          <p className="text-xs mt-1 opacity-70">{msg.timestamp}</p>
                        </div>
                      ) : (
                        <div
                          className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                            msg.sender === 'candidate'
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white shadow-sm border border-gray-200 rounded-bl-none'
                          }`}
                        >
                          {renderMessageContent(msg)}
                          <p
                            className={`text-xs mt-1 opacity-70 ${
                              msg.sender === 'candidate' ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {msg.timestamp}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="bg-white border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-2.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                      title="Attach file"
                    >
                      <Paperclip size={20} />
                    </button>

                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 px-5 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                    />

                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="p-3.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Send message"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-40" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default CandidateMessage;
// src/pages/interviewer/InterviewerMessage.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Paperclip,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Filter,
  ChevronDown,
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../../components/skeleton/InterviewerDashboardSkeleton';

// ─── Types ────────────────────────────────────────────────
interface Message {
  id: string;
  sender: 'recruiter' | 'candidate';
  content: string;
  timestamp: string;
  read: boolean;
  attachment?: { name: string; url: string; type: string };
}

interface Conversation {
  id: string;
  candidateName: string;
  candidateId: string;
  role: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  starred: boolean;
  status: 'pending' | 'interview' | 'offered' | 'rejected' | 'hired';
  applicationId: string;
  messages: Message[];
}

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv1',
    candidateName: 'Nirojan Selvan',
    candidateId: 'cand101',
    role: 'Frontend Developer Intern',
    lastMessage: 'Thank you! I will join the call at 3 PM.',
    lastMessageTime: '10:22 AM',
    unreadCount: 2,
    starred: true,
    status: 'interview',
    applicationId: 'app_001',
    messages: [
      { id: 'm1', sender: 'recruiter', content: 'Hi Nirojan, are you available for an interview tomorrow at 3 PM?', timestamp: 'Yesterday 4:18 PM', read: true },
      { id: 'm2', sender: 'candidate', content: 'Yes, that works for me!', timestamp: 'Yesterday 4:25 PM', read: true },
      { id: 'm3', sender: 'recruiter', content: 'Great! Here’s the Zoom link: …', timestamp: 'Yesterday 4:30 PM', read: true },
      { id: 'm4', sender: 'candidate', content: 'Thank you! I will join the call at 3 PM.', timestamp: '10:22 AM', read: false },
      { id: 'm5', sender: 'candidate', content: 'Should I prepare anything specific?', timestamp: '10:23 AM', read: false },
    ],
  },
  {
    id: 'conv2',
    candidateName: 'Kavindi Sharma',
    candidateId: 'cand102',
    role: 'Python Backend Intern',
    lastMessage: 'Assignment submitted!',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    starred: false,
    status: 'pending',
    applicationId: 'app_002',
    messages: [],
  },
  // ... more mock entries
];

// ─── Component ─────────────────────────────────────────────
const InterviewerMessage: React.FC = () => {
  const [conversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(MOCK_CONVERSATIONS[0] || null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive / conversation changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConv) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'recruiter',
      content: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };

    // In real app → send via websocket / API, then update state
    setSelectedConv((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, newMsg],
            lastMessage: newMsg.content,
            lastMessageTime: newMsg.timestamp,
          }
        : null
    );

    setMessageInput('');
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <InterviewerDashboardSkeleton>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search candidates or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            />
          </div>
        </div>

        {/* Main content – two pane layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Conversation List */}
          <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="divide-y divide-gray-100">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No conversations found</div>
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
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-600 font-medium">
                        {conv.candidateName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className="font-medium text-gray-900 truncate">{conv.candidateName}</p>
                          <span className="text-xs text-gray-500">{conv.lastMessageTime}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conv.role}</p>
                        <p className="mt-1 text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                      {conv.starred && <Star size={16} className="text-yellow-500 fill-yellow-500 ml-1.5" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Active Chat */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {selectedConv ? (
              <>
                {/* Chat header */}
                <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                      {selectedConv.candidateName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">{selectedConv.candidateName}</h2>
                      <p className="text-sm text-gray-600">{selectedConv.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedConv.status === 'hired' ? 'bg-green-100 text-green-800' :
                      selectedConv.status === 'interview' ? 'bg-blue-100 text-blue-800' :
                      selectedConv.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedConv.status.charAt(0).toUpperCase() + selectedConv.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-5">
                  {selectedConv.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'recruiter' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                          msg.sender === 'recruiter'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-200 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 opacity-70 ${msg.sender === 'recruiter' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="bg-white border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                      title="Attach file"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to start messaging
              </div>
            )}
          </div>

          {/* Optional right sidebar – candidate quick info */}
          {/* You can make this collapsible with a state + button */}
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default InterviewerMessage;
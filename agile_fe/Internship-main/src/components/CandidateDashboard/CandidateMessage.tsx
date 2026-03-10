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
import CandidateDashboardSkeleton from '../../components/skeleton/CandidateDashboardSkeleton';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const baseApi = import.meta.env.VITE_BASE_API;
const api = axios.create({
  baseURL: baseApi,
});

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

// ─── Component ─────────────────────────────────────────────
const CandidateMessage: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Please log in to access this page.');
      navigate('/login');
      return null;
    }
    return { Authorization: `Token ${token}` };
  };

  // Load conversations where this candidate is attended + selected
  useEffect(() => {
    let cancelled = false;
    const headers = getAuthHeaders();
    if (!headers) {
      setIsLoadingConversations(false);
      return;
    }
    setError(null);
    api
      .get<Conversation[]>('/messages/candidate-conversations/', { headers })
      .then((res) => {
        if (!cancelled && Array.isArray(res.data)) {
          setConversations(res.data);
          if (res.data.length > 0) {
            setSelectedConv(res.data[0]);
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
          setError('Session expired. Please log in again.');
        } else {
          setError('Failed to load messages.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingConversations(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!selectedConv?.applicationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    const headers = getAuthHeaders();
    if (!headers) return;
    setIsLoadingMessages(true);
    api
      .get<Message[]>(
        `/messages/candidate/conversations/${selectedConv.applicationId}/messages/`,
        { headers },
      )
      .then((res) => {
        if (!cancelled && Array.isArray(res.data)) {
          setMessages(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedConv?.applicationId]);

  // Scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageInput.trim();
    if (!content || !selectedConv || sending) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    const formData = new FormData();
    formData.append('content', content);
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    setSending(true);
    api
      .post<Message>(
        `/messages/candidate/conversations/${selectedConv.applicationId}/send/`,
        formData,
        { headers: { ...headers, 'Content-Type': 'multipart/form-data' } },
      )
      .then((res) => {
        setMessages((prev) => [...prev, res.data]);
        setConversations((prev) =>
          prev.map((conv) =>
            conv.applicationId === selectedConv.applicationId
              ? {
                  ...conv,
                  lastMessage: res.data.content,
                  lastMessageTime: res.data.timestamp,
                }
              : conv,
          ),
        );
        setSelectedConv((prev) =>
          prev && prev.applicationId === selectedConv.applicationId
            ? { ...prev, lastMessage: res.data.content, lastMessageTime: res.data.timestamp }
            : prev,
        );
        setMessageInput('');
        setSelectedFile(null);
      })
      .catch(() => setError('Failed to send message.'))
      .finally(() => setSending(false));
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  // Very basic URL/attachment rendering
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

    return (
      <>
        {msg.content && <p>{msg.content}</p>}
        {msg.attachment && (
          <a
            href={msg.attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/40 bg-white/10 text-xs"
          >
            <ExternalLink size={14} />
            {msg.attachment.name || 'Download file'}
          </a>
        )}
      </>
    );
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
        {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}
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
          <div className="w-full md:w-80 lg=w-96 border-r border-gray-200 bg-white overflow-y-auto">
            {isLoadingConversations ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No messages yet. You will see chats here once you are marked Attended and Selected
                for an interview.
              </div>
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
                  {isLoadingMessages ? (
                    <div className="text-center text-gray-500">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm">No messages yet</div>
                  ) : (
                    messages.map((msg) => (
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
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="bg-white border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-2.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                      title="Attach file"
                      onClick={handleFileButtonClick}
                    >
                      <Paperclip size={20} />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    <div className="flex-1 flex flex-col gap-1">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full px-5 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                      />
                      {selectedFile && (
                        <div className="text-xs text-gray-500 px-2">
                          Attached: {selectedFile.name}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!messageInput.trim() || sending}
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
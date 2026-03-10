// src/pages/interviewer/InterviewerMessage.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Star,
  ExternalLink,
} from 'lucide-react';
import InterviewerDashboardSkeleton from '../../components/skeleton/InterviewerDashboardSkeleton';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const baseApi = import.meta.env.VITE_BASE_API;
const api = axios.create({
  baseURL: baseApi,
});

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

// ─── Component ─────────────────────────────────────────────
const InterviewerMessage: React.FC = () => {
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

  useEffect(() => {
    let cancelled = false;
    const headers = getAuthHeaders();
    if (!headers) {
      setIsLoadingConversations(false);
      return;
    }
    setError(null);
    api.get<Conversation[]>('/messages/interviewer-conversations/', { headers })
      .then((res) => {
        if (!cancelled && Array.isArray(res.data)) {
          setConversations(res.data);
          if (res.data.length > 0) setSelectedConv(res.data[0]);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
          setError('Session expired. Please log in again.');
        } else setError('Failed to load conversations.');
      })
      .finally(() => { if (!cancelled) setIsLoadingConversations(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedConv?.applicationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    const headers = getAuthHeaders();
    if (!headers) return;
    setIsLoadingMessages(true);
    api.get<Message[]>(`/messages/conversations/${selectedConv.applicationId}/messages/`, { headers })
      .then((res) => {
        if (!cancelled && Array.isArray(res.data)) setMessages(res.data);
      })
      .catch(() => { if (!cancelled) setMessages([]); })
      .finally(() => { if (!cancelled) setIsLoadingMessages(false); });
    return () => { cancelled = true; };
  }, [selectedConv?.applicationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageInput.trim();
    if ((!content && !selectedFile) || !selectedConv || sending) return;
    const headers = getAuthHeaders();
    if (!headers) return;

    const formData = new FormData();
    formData.append('content', content);
    if (selectedFile) formData.append('file', selectedFile);

    setSending(true);
    api
      .post<Message>(
        `/messages/conversations/${selectedConv.applicationId}/send/`,
        formData,
        { headers: { ...headers, 'Content-Type': 'multipart/form-data' } },
      )
      .then((res) => {
        setMessages((prev) => [...prev, res.data]);
        const lastText = res.data.content || (res.data.attachment ? `Attachment: ${res.data.attachment.name}` : '');
        setConversations((prev) =>
          prev.map((c) =>
            c.applicationId === selectedConv.applicationId
              ? { ...c, lastMessage: lastText, lastMessageTime: res.data.timestamp }
              : c,
          ),
        );
        setSelectedConv((prev) =>
          prev && prev.applicationId === selectedConv.applicationId
            ? { ...prev, lastMessage: lastText, lastMessageTime: res.data.timestamp }
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
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <InterviewerDashboardSkeleton>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
        {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}
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
              {isLoadingConversations ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No conversations yet. Only candidates marked as Attended and Selected in Post-Interview Decisions appear here.
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
                  {messages.map((msg) => (
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
                        {msg.content && <p>{msg.content}</p>}
                        {msg.attachment && (
                          <a
                            href={msg.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${
                              msg.sender === 'recruiter'
                                ? 'border-blue-400/50 bg-white/10 text-white'
                                : 'border-gray-300 bg-gray-50 text-gray-800'
                            }`}
                          >
                            <ExternalLink size={14} />
                            {msg.attachment.name || 'Download file'}
                          </a>
                        )}
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                      />
                      {selectedFile && (
                        <span className="text-xs text-gray-500 px-2">Attached: {selectedFile.name}</span>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={(!messageInput.trim() && !selectedFile) || sending}
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

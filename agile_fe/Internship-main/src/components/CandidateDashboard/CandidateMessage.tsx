// src/pages/candidate/CandidateMessage.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Send,
  Paperclip,
  ExternalLink,
  MessageSquare,
  Loader2,
  Bell,
  AlertCircle,
  X,
} from 'lucide-react';
import CandidateDashboardSkeleton from '../../components/skeleton/CandidateDashboardSkeleton';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const baseApi = import.meta.env.VITE_BASE_API;

const api = axios.create({
  baseURL: baseApi,
});

interface ChatMessage {
  id: string | number;
  sender: 'candidate' | 'recruiter' | 'system' | string;
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
  messages: ChatMessage[];
}

const CandidateMessage: React.FC = () => {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draftMessages, setDraftMessages] = useState<Record<string, string>>({});
  const [draftFiles, setDraftFiles] = useState<Record<string, File | null>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const currentApplicationId = selectedConv?.applicationId || '';

  const currentMessageInput = currentApplicationId
    ? draftMessages[currentApplicationId] || ''
    : '';

  const currentSelectedFile = currentApplicationId
    ? draftFiles[currentApplicationId] || null
    : null;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Please log in to access this page.');
      navigate('/login');
      return null;
    }
    return { Authorization: `Token ${token}` };
  };

  const normalizeMessage = (msg: any): ChatMessage => {
    return {
      id: msg.id,
      sender: msg.sender || msg.sender_type || 'recruiter',
      content: msg.content || '',
      timestamp: msg.timestamp || msg.created_at || '',
      read: typeof msg.read === 'boolean' ? msg.read : true,
      attachment: msg.attachment
        ? {
            name: msg.attachment.name || 'Attachment',
            url: msg.attachment.url,
            type: msg.attachment.type || '',
          }
        : msg.file || msg.file_url
        ? {
            name: msg.file_name || 'Attachment',
            url: msg.file_url || msg.file,
            type: msg.file_type || '',
          }
        : undefined,
      isLink: msg.isLink || false,
    };
  };

  const fetchConversations = async (preserveSelected = true) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await api.get<Conversation[]>('/messages/candidate-conversations/', {
        headers,
      });

      if (Array.isArray(res.data)) {
        setConversations(res.data);

        if (preserveSelected && selectedConv) {
          const updatedSelected = res.data.find(
            (conv) => conv.applicationId === selectedConv.applicationId
          );
          if (updatedSelected) {
            setSelectedConv(updatedSelected);
          }
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      } else {
        console.error('Failed to refresh conversations:', err?.response?.data || err);
      }
    }
  };

  const fetchMessages = async (
    applicationId: string | number,
    showLoading = false
  ) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    if (showLoading) setIsLoadingMessages(true);

    try {
      const res = await api.get<any[]>(
        `/messages/candidate/conversations/${applicationId}/messages/`,
        { headers }
      );

      if (Array.isArray(res.data)) {
        setMessages(res.data.map(normalizeMessage));

        setConversations((prev) =>
          prev.map((conv) =>
            String(conv.applicationId) === String(applicationId)
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      }
    } catch (err) {
      console.error('Failed to refresh messages:', err);
    } finally {
      if (showLoading) setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      const headers = getAuthHeaders();
      if (!headers) {
        setIsLoadingConversations(false);
        return;
      }

      setError(null);

      try {
        const res = await api.get<Conversation[]>('/messages/candidate-conversations/', {
          headers,
        });

        if (!cancelled && Array.isArray(res.data)) {
          setConversations(res.data);
        }
      } catch (err: any) {
        if (cancelled) return;

        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
          setError('Session expired. Please log in again.');
        } else {
          setError('Failed to load conversations.');
        }
      } finally {
        if (!cancelled) setIsLoadingConversations(false);
      }
    };

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!selectedConv?.applicationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      const headers = getAuthHeaders();
      if (!headers) return;

      setIsLoadingMessages(true);

      try {
        const res = await api.get<any[]>(
          `/messages/candidate/conversations/${selectedConv.applicationId}/messages/`,
          { headers }
        );

        if (!cancelled && Array.isArray(res.data)) {
          setMessages(res.data.map(normalizeMessage));

          setConversations((prev) =>
            prev.map((conv) =>
              conv.applicationId === selectedConv.applicationId
                ? { ...conv, unreadCount: 0 }
                : conv
            )
          );
        }
      } catch (err) {
        if (!cancelled) {
          setMessages([]);
          console.error('Failed to load candidate messages:', err);
        }
      } finally {
        if (!cancelled) setIsLoadingMessages(false);
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedConv?.applicationId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);

      if (selectedConv?.applicationId) {
        fetchMessages(selectedConv.applicationId, false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConv?.applicationId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredConversations = useMemo(() => {
  return [...conversations]
    .filter(
      (conv) =>
        conv.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.recruiterName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
}, [conversations, searchQuery]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    const content = currentMessageInput.trim();
    if ((!content && !currentSelectedFile) || !selectedConv || sending) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    const formData = new FormData();

    if (content) {
      formData.append('content', content);
    }

    if (currentSelectedFile) {
      formData.append('file', currentSelectedFile);
    }

    setSending(true);

    api
      .post<any>(
        `/messages/candidate/conversations/${selectedConv.applicationId}/send/`,
        formData,
        {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      .then((res) => {
        const newMessage = normalizeMessage(res.data);

        setMessages((prev) => [...prev, newMessage]);

        const lastText =
          newMessage.content ||
          (newMessage.attachment ? `Attachment: ${newMessage.attachment.name}` : '');

        setConversations((prev) =>
          prev.map((conv) =>
            conv.applicationId === selectedConv.applicationId
              ? {
                  ...conv,
                  lastMessage: lastText,
                  lastMessageTime: newMessage.timestamp,
                  unreadCount: 0,
                }
              : conv
          )
        );

        setSelectedConv((prev) =>
          prev && prev.applicationId === selectedConv.applicationId
            ? {
                ...prev,
                lastMessage: lastText,
                lastMessageTime: newMessage.timestamp,
                unreadCount: 0,
              }
            : prev
        );

        setDraftMessages((prev) => ({
          ...prev,
          [selectedConv.applicationId]: '',
        }));

        setDraftFiles((prev) => ({
          ...prev,
          [selectedConv.applicationId]: null,
        }));

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      })
      .catch((err) => {
        console.error('Failed to send candidate message:', err?.response?.data || err);
        setError('Failed to send message.');
      })
      .finally(() => setSending(false));
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!selectedConv?.applicationId) return;

    setDraftFiles((prev) => ({
      ...prev,
      [selectedConv.applicationId]: file,
    }));
  };

  const handleRemoveAttachment = () => {
    if (!selectedConv?.applicationId) return;

    setDraftFiles((prev) => ({
      ...prev,
      [selectedConv.applicationId]: null,
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || 'Now';

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (
      msg.isLink ||
      msg.content.includes('http') ||
      msg.content.includes('zoom.us') ||
      msg.content.includes('meet.google.com')
    ) {
      const urlMatch = msg.content.match(/(https?:\/\/[^\s]+)/);

      if (urlMatch) {
        const url = urlMatch[0];
        const textWithoutUrl = msg.content.replace(url, '').trim();

        return (
          <>
            {textWithoutUrl && <p className="whitespace-pre-wrap">{textWithoutUrl}</p>}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 mt-2 rounded-xl px-3 py-2 text-sm font-medium border transition ${
                msg.sender === 'candidate'
                  ? 'bg-white/15 text-white border-white/20 hover:bg-white/20'
                  : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
              }`}
            >
              <ExternalLink size={14} />
              {url.includes('zoom.us')
                ? 'Join Zoom Meeting'
                : url.includes('meet.google.com')
                ? 'Join Google Meet'
                : 'Open Link'}
            </a>
          </>
        );
      }
    }

    return (
      <>
        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
        {msg.attachment && (
          <a
            href={msg.attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border transition ${
              msg.sender === 'candidate'
                ? 'bg-white/15 text-white border-white/20 hover:bg-white/20'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ExternalLink size={14} />
            {msg.attachment.name || 'Download file'}
          </a>
        )}
      </>
    );
  };

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + (conv.unreadCount || 0),
    0
  );

  return (
    <CandidateDashboardSkeleton>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-6">
          {error && (
            <div className="rounded-[28px] border border-red-200 bg-red-50 p-4 sm:p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_32%)]" />

            <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200">
                  <MessageSquare className="w-4 h-4" />
                  Candidate communication workspace
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Messages
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Stay connected with recruiters, receive interview links, and
                  respond to important updates.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-w-full xl:min-w-[620px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Conversations</p>
                  <h3 className="text-3xl font-bold mt-2">{conversations.length}</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Unread</p>
                  <h3 className="text-3xl font-bold mt-2">{totalUnread}</h3>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Visible Results</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {filteredConversations.length}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
            <div className="relative w-full lg:max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search companies, recruiters, or roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm sm:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden h-[76vh]">
            <div className="grid grid-cols-1 lg:grid-cols-[370px_minmax(0,1fr)] h-full">
              <div className="border-r border-slate-200 bg-white min-h-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
                  <h2 className="text-lg font-bold text-slate-900">
                    Your Conversations
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Recruiters can contact you here after shortlisting or interview
                    decisions.
                  </p>
                </div>

                <div className="overflow-y-auto h-[calc(76vh-81px)]">
                  {isLoadingConversations ? (
                    <div className="p-10 text-center">
                      <Loader2 className="w-7 h-7 animate-spin text-blue-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">
                        Loading conversations...
                      </p>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-10 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                        <Bell className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 mb-2">
                        No conversations yet
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        You will see chats here once recruiters start contacting you.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {filteredConversations.map((conv) => (
                        <button
                          key={conv.id}
                          type="button"
                          onClick={() => {
                            setSelectedConv(conv);
                            setConversations((prev) =>
                              prev.map((item) =>
                                item.applicationId === conv.applicationId
                                  ? { ...item, unreadCount: 0 }
                                  : item
                              )
                            );
                          }}
                          className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${
                            selectedConv?.id === conv.id
                              ? 'border-blue-200 bg-blue-50 shadow-sm'
                              : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                              {conv.companyName.charAt(0)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">
  {conv.recruiterName}
</p>
<p className="text-sm text-slate-600 truncate">
  {conv.role} • {conv.companyName}
</p>
                                </div>

                                {conv.unreadCount > 0 && (
                                  <span className="inline-flex min-w-[22px] h-[22px] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white">
                                    {conv.unreadCount}
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-sm text-slate-500 truncate">
                                {conv.lastMessage || 'No messages yet'}
                              </p>

                              <div className="mt-3 flex justify-end">
                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                  {formatTime(conv.lastMessageTime)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col min-w-0 bg-slate-50/60 h-full overflow-hidden">
                {selectedConv ? (
                  <>
                    <div className="border-b border-slate-200 bg-white px-5 sm:px-6 py-4 shrink-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                            {selectedConv.companyName.charAt(0)}
                          </div>

                          <div className="min-w-0">
  <h2 className="font-bold text-slate-900 text-lg truncate">
    {selectedConv.recruiterName}
  </h2>
  <p className="text-sm text-slate-500 truncate">
    {selectedConv.role} • {selectedConv.companyName}
  </p>
</div>
                        </div>
                      </div>
                    </div>

                    <div
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5 bg-[linear-gradient(to_bottom,rgba(248,250,252,0.85),rgba(239,246,255,0.55))]"
                    >
                      {isLoadingMessages ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="w-7 h-7 animate-spin text-blue-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">
                              Loading messages...
                            </p>
                          </div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center max-w-sm">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm mb-4">
                              <MessageSquare className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 mb-2">
                              No messages yet
                            </h3>
                            <p className="text-sm text-slate-500">
                              When the recruiter sends a message, it will appear here.
                            </p>
                          </div>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isCandidate = msg.sender === 'candidate';
                          const isSystem = msg.sender === 'system';

                          return (
                            <div
                              key={String(msg.id)}
                              className={`flex ${
                                isCandidate
                                  ? 'justify-end'
                                  : isSystem
                                  ? 'justify-center'
                                  : 'justify-start'
                              }`}
                            >
                              {isSystem ? (
                                <div className="max-w-[85%] rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-center shadow-sm">
                                  <p className="text-sm text-amber-800">{msg.content}</p>
                                  <p className="text-xs mt-1 text-amber-600">
                                    {formatTime(msg.timestamp)}
                                  </p>
                                </div>
                              ) : (
                                <div
                                  className={`max-w-[85%] sm:max-w-[72%] rounded-[22px] px-4 py-3 shadow-sm ${
                                    isCandidate
                                      ? 'bg-blue-600 text-white rounded-br-md'
                                      : 'bg-emerald-50 border border-emerald-200 text-slate-800 rounded-bl-md'
                                  }`}
                                >
                                  {renderMessageContent(msg)}
                                  <p
                                    className={`text-[11px] mt-2 ${
                                      isCandidate ? 'text-blue-100' : 'text-slate-500'
                                    }`}
                                  >
                                    {formatTime(msg.timestamp)}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="border-t border-slate-200 bg-white p-4 sm:p-5 shrink-0">
                      <form onSubmit={handleSendMessage} className="space-y-3">
                        {currentSelectedFile && (
                          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-xs text-slate-600">
                            <Paperclip size={14} />
                            <span>Attached: {currentSelectedFile.name}</span>
                            <button
                              type="button"
                              onClick={handleRemoveAttachment}
                              className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
                              aria-label="Remove attachment"
                              title="Remove attachment"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        <div className="flex items-end gap-3">
                          <button
                            type="button"
                            onClick={handleFileButtonClick}
                            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition shrink-0"
                            title="Attach file"
                          >
                            <Paperclip size={18} />
                          </button>

                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                          />

                          <div className="flex-1">
                            <input
                              type="text"
                              value={currentMessageInput}
                              onChange={(e) => {
                                if (!selectedConv?.applicationId) return;

                                setDraftMessages((prev) => ({
                                  ...prev,
                                  [selectedConv.applicationId]: e.target.value,
                                }));
                              }}
                              placeholder="Type your message..."
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm sm:text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={
                              (!currentMessageInput.trim() && !currentSelectedFile) ||
                              sending
                            }
                            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm shrink-0"
                            aria-label="Send message"
                          >
                            {sending ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Send size={18} />
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center px-6">
                    <div className="text-center max-w-sm">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white border border-slate-200 shadow-sm mb-5">
                        <MessageSquare className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-sm sm:text-base text-slate-500">
                        Choose a recruiter conversation from the left to start
                        reading and replying.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default CandidateMessage;
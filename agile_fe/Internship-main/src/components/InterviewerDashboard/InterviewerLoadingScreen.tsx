import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Inbox,
  UserCheck,
  UserX,
  Briefcase,
  X,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Calendar,
  Clock3,
  Sparkles,
  ArrowRight,
  Building2,
  Copy,
  Activity,
  TrendingUp,
} from "lucide-react";
import InterviewerDashboardSkeleton from "../skeleton/InterviewerDashboardSkeleton";

const baseApi = import.meta.env.VITE_BASE_API;

const api = axios.create({
  baseURL: baseApi,
  headers: { "Content-Type": "application/json" },
});

interface Interview {
  id: number;
  candidate_name: string;
  internship_role: string;
  date: string;
  time: string | null;
  zoom: string;
  company_name: string;
}

interface DashboardCounts {
  total_jobs_posted: number;
  total_applications_received: number;
  total_accepted: number;
  total_rejected: number;
}

const isUpcomingInterview = (interview: Interview): boolean => {
  const now = new Date();
  const interviewDate = new Date(interview.date);

  if (interview.time) {
    const [hours, minutes] = interview.time.split(":");
    interviewDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    interviewDate.setHours(23, 59, 59, 999);
  }

  return interviewDate > now;
};

const sortInterviewsByDateTime = (interviews: Interview[]): Interview[] => {
  return [...interviews].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    if (a.time) {
      const [hoursA, minutesA] = a.time.split(":");
      dateA.setHours(parseInt(hoursA), parseInt(minutesA), 0, 0);
    }

    if (b.time) {
      const [hoursB, minutesB] = b.time.split(":");
      dateB.setHours(parseInt(hoursB), parseInt(minutesB), 0, 0);
    }

    return dateA.getTime() - dateB.getTime();
  });
};

const formatInterviewDateTime = (date: string, time: string | null) => {
  const interviewDate = new Date(date);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isToday = interviewDate.toDateString() === today.toDateString();
  const isTomorrow = interviewDate.toDateString() === tomorrow.toDateString();

  let dateStr = "";

  if (isToday) {
    dateStr = "Today";
  } else if (isTomorrow) {
    dateStr = "Tomorrow";
  } else {
    dateStr = interviewDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        interviewDate.getFullYear() !== today.getFullYear()
          ? "numeric"
          : undefined,
    });
  }

  return time ? `${dateStr}, ${time}` : dateStr;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const VideoCallComponent: React.FC<{
  onClose: () => void;
  meetingUrl: string;
  candidateName: string;
}> = ({ onClose, meetingUrl, candidateName }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const initializeMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        activeStream = mediaStream;
        setStream(mediaStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        setIsConnected(true);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Unable to access camera/microphone. Please check permissions.");
      }
    };

    initializeMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleVideo = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setIsVideoOn(videoTrack.enabled);
  };

  const toggleAudio = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsAudioOn(audioTrack.enabled);
  };

  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    onClose();
  };

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-white/5">
        <div className="min-w-0">
          <h3 className="text-white text-lg sm:text-xl font-semibold truncate">
            Interview with {candidateName}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-300">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? "bg-emerald-400" : "bg-yellow-400"
              }`}
            />
            {isConnected ? "Connected" : "Connecting..."}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />

        <div className="relative h-full flex items-center justify-center p-4 sm:p-6">
          <div className="w-full h-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden relative">
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-2xl">
                  {candidateName.charAt(0).toUpperCase()}
                </div>

                <h4 className="text-white text-lg sm:text-xl font-semibold mt-5">
                  Waiting for {candidateName} to join
                </h4>

                <p className="text-slate-300 text-sm mt-2 max-w-md mx-auto">
                  You can copy and share the meeting link, or continue using the
                  external meeting platform.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={copyMeetingLink}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 transition"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? "Copied" : "Copy Link"}
                  </button>

                  <a
                    href={meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition"
                  >
                    <Video className="w-4 h-4" />
                    Join External Meeting
                  </a>
                </div>
              </div>
            </div>

            <div className="absolute top-4 right-4 w-36 h-28 sm:w-52 sm:h-36 rounded-2xl overflow-hidden border border-white/20 bg-black shadow-2xl">
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {!isVideoOn && (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-slate-300" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-white/5 px-4 sm:px-6 py-5">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition ${
              isAudioOn
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isAudioOn ? (
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition ${
              isVideoOn
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isVideoOn ? (
              <Video className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>

          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition"
          >
            <Phone className="w-5 h-5 sm:w-6 sm:h-6 rotate-[135deg]" />
          </button>
        </div>

        <p className="text-center text-slate-400 text-xs sm:text-sm mt-4">
          Manage your camera and microphone here, or continue through the
          external meeting link.
        </p>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  subtext: string;
}> = ({ title, value, icon, accent, subtext }) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
          <p className="text-xs text-slate-500 mt-2">{subtext}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:scale-110 transition">
          {icon}
        </div>
      </div>
    </div>
  );
};

const ModernAnalyticsCard: React.FC<{
  counts: DashboardCounts;
}> = ({ counts }) => {
  const total =
    counts.total_applications_received +
    counts.total_accepted +
    counts.total_rejected +
    counts.total_jobs_posted;

  const data = [
    {
      label: "Applications Received",
      value: counts.total_applications_received,
      color: "bg-blue-500",
      light: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      label: "Shortlisted",
      value: counts.total_accepted,
      color: "bg-emerald-500",
      light: "bg-emerald-50",
      text: "text-emerald-700",
    },
    {
      label: "Rejected",
      value: counts.total_rejected,
      color: "bg-red-500",
      light: "bg-red-50",
      text: "text-red-700",
    },
    {
      label: "Active Job Postings",
      value: counts.total_jobs_posted,
      color: "bg-violet-500",
      light: "bg-violet-50",
      text: "text-violet-700",
    },
  ];

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Analytics Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            A modern view of your recruitment performance.
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-center">
        <div className="flex items-center justify-center">
          <div className="relative w-52 h-52">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-emerald-400 p-[14px] shadow-xl">
              <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center text-center">
                <p className="text-sm text-slate-500">Total Metrics</p>
                <h3 className="text-4xl font-bold text-slate-900 mt-1">
                  {total}
                </h3>
                <p className="text-xs text-slate-400 mt-1 px-4">
                  Combined dashboard activity
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage =
              total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl ${item.light} flex items-center justify-center`}
                    >
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {item.label}
                      </p>
                      <p className={`text-xs ${item.text}`}>
                        {percentage}% of total activity
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <h4 className="text-lg font-bold text-slate-900">
                      {item.value}
                    </h4>
                  </div>
                </div>

                <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const EmployerLoadingScreen: React.FC = () => {
  const [counts, setCounts] = useState<DashboardCounts>({
    total_jobs_posted: 0,
    total_applications_received: 0,
    total_accepted: 0,
    total_rejected: 0,
  });

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<{
    url: string;
    candidate: string;
  } | null>(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUsername = localStorage.getItem("username");

    if (storedUsername) {
      setUsername(storedUsername);
    }

    if (!token) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/interviewer/interviewer-dashboard/", {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        const dashboardCounts = response.data.counts ?? {
          total_jobs_posted: 0,
          total_applications_received: 0,
          total_accepted: 0,
          total_rejected: 0,
        };

        const allInterviews = response.data.scheduled_interviews ?? [];
        const upcomingInterviews = sortInterviewsByDateTime(
          allInterviews.filter(isUpcomingInterview)
        );

        setCounts(dashboardCounts);
        setInterviews(upcomingInterviews);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleMeetingClick = (zoomUrl: string, candidateName: string) => {
    setSelectedMeeting({ url: zoomUrl, candidate: candidateName });
  };

  const closeMeeting = () => {
    setSelectedMeeting(null);
  };

  const displayName = useMemo(() => {
    if (!username) return "";
    return username.charAt(0).toUpperCase() + username.slice(1);
  }, [username]);

  return (
    <InterviewerDashboardSkeleton>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-3 sm:px-5 lg:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-xl px-8 py-10 text-center">
              <div className="w-12 h-12 mx-auto rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Loading dashboard
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Preparing your latest interview overview...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-950 via-blue-950 to-violet-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_30%)]" />

              <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200">
                    <Sparkles className="w-4 h-4" />
                    Interviewer workspace
                  </div>

                  <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                    {getGreeting()}
                    {displayName ? `, ${displayName}` : ""}.
                  </h1>

                  <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                    Here is your hiring dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-full lg:min-w-[340px]">
                  <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                    <p className="text-slate-300 text-sm">Upcoming interviews</p>
                    <h3 className="text-3xl font-bold mt-2">{interviews.length}</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Scheduled and pending
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
  <p className="text-slate-300 text-sm">Next Interview</p>
  <h3 className="text-xl font-bold mt-2 truncate">
    {interviews.length > 0
      ? formatInterviewDateTime(interviews[0].date, interviews[0].time)
      : "No interviews"}
  </h3>
  <p className="text-xs text-slate-300 mt-1 truncate">
    {interviews.length > 0
      ? interviews[0].candidate_name
      : "No scheduled interview"}
  </p>
</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                title="Applications Received"
                value={counts.total_applications_received}
                icon={<Inbox className="w-6 h-6" />}
                accent="bg-blue-500"
                subtext="Total applications entering your pipeline"
              />
              <StatCard
                title="Candidates Shortlisted"
                value={counts.total_accepted}
                icon={<UserCheck className="w-6 h-6" />}
                accent="bg-emerald-500"
                subtext="Profiles moved to the next stage"
              />
              <StatCard
                title="Applications Rejected"
                value={counts.total_rejected}
                icon={<UserX className="w-6 h-6" />}
                accent="bg-red-500"
                subtext="Candidates not selected for continuation"
              />
              <StatCard
                title="Active Job Postings"
                value={counts.total_jobs_posted}
                icon={<Briefcase className="w-6 h-6" />}
                accent="bg-violet-500"
                subtext="Currently open opportunities"
              />
            </div>

            {/* Main Section */}
            <div className="grid grid-cols-1 2xl:grid-cols-[1.05fr_1.2fr] gap-6">
              <ModernAnalyticsCard counts={counts} />

              <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Upcoming Interviews
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Quickly access scheduled interviews and meeting links.
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>

                {interviews.length > 0 ? (
                  <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
                    {interviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="group rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-300"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Upcoming
                              </span>

                              {interview.company_name && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-medium">
                                  <Building2 className="w-3 h-3" />
                                  {interview.company_name}
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 truncate">
                              {interview.candidate_name}
                            </h3>

                            <p className="text-sm text-slate-600 mt-1">
                              {interview.internship_role}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-3 text-sm">
                              <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 text-blue-700 px-3 py-2">
                                <Calendar className="w-4 h-4" />
                                {formatInterviewDateTime(
                                  interview.date,
                                  interview.time
                                )}
                              </div>

                              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 text-slate-700 px-3 py-2">
                                <Clock3 className="w-4 h-4" />
                                {interview.time ? interview.time : "Time not specified"}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
                            {interview.zoom ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleMeetingClick(
                                      interview.zoom,
                                      interview.candidate_name
                                    )
                                  }
                                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 text-sm font-medium transition"
                                >
                                  <Video className="w-4 h-4" />
                                  Start Interview
                                </button>

                                <a
                                  href={interview.zoom}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 text-sm font-medium transition"
                                >
                                  Join Link
                                  <ArrowRight className="w-4 h-4" />
                                </a>
                              </>
                            ) : (
                              <div className="inline-flex items-center rounded-2xl bg-slate-100 text-slate-500 px-4 py-3 text-sm">
                                Meeting link not available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-[320px] rounded-3xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
                    <div className="text-center px-4">
                      <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-base font-semibold text-slate-800">
                        No upcoming interviews
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Scheduled interviews will appear here automatically.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedMeeting && (
          <VideoCallComponent
            onClose={closeMeeting}
            meetingUrl={selectedMeeting.url}
            candidateName={selectedMeeting.candidate}
          />
        )}
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default EmployerLoadingScreen;
import React, { useEffect, useState, useRef } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  Award,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  X,
  Briefcase,
  PieChartIcon,
  Sparkles,
  ArrowRight,
  Building2,
  Clock3,
  Copy,
  Target,
} from "lucide-react";
import CandidateDashboardSkeleton from "../skeleton/CandidateDashboardSkeleton";
import axios from "axios";
import { PieChart } from "react-minimal-pie-chart";

const baseApi = import.meta.env.VITE_BASE_API;

interface StatCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  accent: string;
  subtext: string;
}

interface TestResult {
  id: number;
  internship_title: string;
  company_name: string;
  score: number;
  passed: boolean;
  completed_date: string;
  test_date: string;
}

interface ScheduledInterview {
  id: number;
  company: string;
  role: string;
  date: string;
  time: string;
  zoom: string;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const CandidateVideoCallComponent: React.FC<{
  onClose: () => void;
  meetingUrl: string;
  companyName: string;
  role: string;
}> = ({ onClose, meetingUrl, companyName, role }) => {
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
            Interview with {companyName}
          </h3>
          <p className="text-sm text-slate-300 truncate mt-1">{role}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-300">
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
                  {companyName.charAt(0).toUpperCase()}
                </div>

                <h4 className="text-white text-lg sm:text-xl font-semibold mt-5">
                  Waiting for interviewer to join
                </h4>

                <p className="text-slate-300 text-sm mt-2 max-w-md mx-auto">
                  You are ready for the interview. You can copy the meeting link
                  or continue using the external meeting platform.
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
              <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded-lg">
                You
              </div>
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
          Manage your microphone and camera here, or continue through the
          external meeting link.
        </p>
      </div>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  icon,
  accent,
  subtext,
}) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{count}</h3>
          <p className="text-xs text-slate-500 mt-2">{subtext}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:scale-110 transition">
          {icon}
        </div>
      </div>
    </div>
  );
};

const ModernBreakdownCard: React.FC<{
  applied: number;
  approved: number;
  rejected: number;
}> = ({ applied, approved, rejected }) => {
  const total = applied + approved + rejected;

  const data = [
    {
      label: "Applied",
      value: applied,
      color: "#3b82f6",
      dot: "bg-blue-500",
      light: "bg-blue-50",
      text: "text-blue-700",
    },
    {
      label: "Approved",
      value: approved,
      color: "#22c55e",
      dot: "bg-emerald-500",
      light: "bg-emerald-50",
      text: "text-emerald-700",
    },
    {
      label: "Rejected",
      value: rejected,
      color: "#ef4444",
      dot: "bg-red-500",
      light: "bg-red-50",
      text: "text-red-700",
    },
  ].filter((item) => item.value > 0);

  const noData = data.length === 0;

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Application Breakdown
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            A modern summary of your current application activity.
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <PieChartIcon className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-center">
        <div className="flex items-center justify-center">
          <div className="relative w-52 h-52 flex items-center justify-center">
            {noData ? (
              <div className="w-52 h-52 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-center p-6">
                <p className="text-sm text-slate-500">No records available</p>
              </div>
            ) : (
              <div className="relative w-52 h-52">
                <PieChart
                  data={data.map((item) => ({
                    title: item.label,
                    value: item.value,
                    color: item.color,
                  }))}
                  lineWidth={26}
                  animate
                  rounded
                  label={() => ""}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-slate-500">Total</p>
                  <h3 className="text-4xl font-bold text-slate-900 mt-1">
                    {total}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 px-4">
                    All application records
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {[
            {
              label: "Applied",
              value: applied,
              dot: "bg-blue-500",
              light: "bg-blue-50",
              text: "text-blue-700",
            },
            {
              label: "Approved",
              value: approved,
              dot: "bg-emerald-500",
              light: "bg-emerald-50",
              text: "text-emerald-700",
            },
            {
              label: "Rejected",
              value: rejected,
              dot: "bg-red-500",
              light: "bg-red-50",
              text: "text-red-700",
            },
          ].map((item, index) => {
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
                      <div className={`w-3 h-3 rounded-full ${item.dot}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {item.label}
                      </p>
                      <p className={`text-xs ${item.text}`}>
                        {percentage}% of applications
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
                    className={`h-full rounded-full ${item.dot} transition-all duration-700`}
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

const isUpcomingInterview = (dateStr: string, timeStr: string): boolean => {
  try {
    const now = new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);

    const interviewDateTime = new Date(year, month - 1, day, hour, minute);
    return interviewDateTime > now;
  } catch (error) {
    console.error("Error parsing date/time:", error);
    return false;
  }
};

const sortInterviewsByDateTime = (
  interviews: ScheduledInterview[]
): ScheduledInterview[] => {
  return interviews.sort((a, b) => {
    try {
      const [yearA, monthA, dayA] = a.date.split("-").map(Number);
      const [hourA, minuteA] = a.time.split(":").map(Number);
      const dateTimeA = new Date(yearA, monthA - 1, dayA, hourA, minuteA);

      const [yearB, monthB, dayB] = b.date.split("-").map(Number);
      const [hourB, minuteB] = b.time.split(":").map(Number);
      const dateTimeB = new Date(yearB, monthB - 1, dayB, hourB, minuteB);

      return dateTimeA.getTime() - dateTimeB.getTime();
    } catch (error) {
      console.error("Error sorting interviews:", error);
      return 0;
    }
  });
};

const CandidateLoadingScreen: React.FC = () => {
  const [counts, setCounts] = useState({
    applied: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledInterview[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<
    ScheduledInterview[]
  >([]);
  const [scheduledError, setScheduledError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testResultsLoading, setTestResultsLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<{
    url: string;
    company: string;
    role: string;
  } | null>(null);
  const [displayName, setDisplayName] = useState("User");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "User";

    const formattedName = storedUsername
      .split(" ")
      .map((word) =>
        word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ""
      )
      .join(" ");

    setDisplayName(formattedName);
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(
          `${baseApi}/candidates/application-counts/`,
          {
            headers: {
              Authorization: token ? `Token ${token}` : "",
            },
          }
        );

        setCounts({
          applied: response.data.applied ?? 0,
          approved: response.data.approved ?? 0,
          rejected: response.data.rejected ?? 0,
        });
      } catch (err) {
        console.error("Error loading counts", err);
        setError("Failed to load application counts.");
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  useEffect(() => {
    const fetchScheduled = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await axios.get(
          `${baseApi}/candidates/scheduled-interviews/`,
          {
            headers: {
              Authorization: token ? `Token ${token}` : "",
            },
          }
        );

        const allInterviews = res.data.interviews || [];
        setScheduled(allInterviews);

        const upcoming = allInterviews.filter((interview: ScheduledInterview) =>
          isUpcomingInterview(interview.date, interview.time)
        );

        const sortedUpcoming = sortInterviewsByDateTime(upcoming);
        setUpcomingInterviews(sortedUpcoming);
      } catch (err) {
        console.error("Error loading scheduled interviews", err);
        setScheduledError("Failed to load scheduled interviews.");
      }
    };

    fetchScheduled();
  }, []);

  useEffect(() => {
    const fetchTestResults = async () => {
      setTestResultsLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(`${baseApi}/candidates/test-results/`, {
          headers: {
            Authorization: token ? `Token ${token}` : "",
          },
        });

        setTestResults(response.data.results || []);
      } catch (err) {
        console.error("Error loading test results", err);
      } finally {
        setTestResultsLoading(false);
      }
    };

    fetchTestResults();
  }, []);

  const handleMeetingClick = (
    zoomUrl: string,
    company: string,
    role: string
  ) => {
    setSelectedMeeting({ url: zoomUrl, company, role });
  };

  const closeMeeting = () => {
    setSelectedMeeting(null);
  };

  function formatTimeToAMPM(timeStr: string): string {
    if (!timeStr) return "";
    const [hourStr, minuteStr] = timeStr.split(":");
    if (hourStr === undefined || minuteStr === undefined) return timeStr;

    let hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  }

  const formatDateDisplay = (dateStr: string): string => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return "Tomorrow";
      } else {
        return date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year:
            date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
        });
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateStr;
    }
  };

  if (loading) {
    return (
      <CandidateDashboardSkeleton>
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-3 sm:px-5 lg:px-6 py-4 sm:py-6">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-xl px-8 py-10 text-center">
              <div className="w-12 h-12 mx-auto rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Loading dashboard
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Preparing your candidate overview...
              </p>
            </div>
          </div>
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  if (error) {
    return (
      <CandidateDashboardSkeleton>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-4 sm:p-6 flex items-center justify-center">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  const passedTests = testResults.filter((test) => test.passed).length;
  const failedTests = testResults.filter((test) => !test.passed).length;
  const averageScore =
    testResults.length > 0
      ? Math.round(
          testResults.reduce((sum, test) => sum + test.score, 0) /
            testResults.length
        )
      : 0;

  const stats = [
    {
      title: "Applied Applications",
      count: counts.applied,
      icon: <FileText className="w-6 h-6" />,
      accent: "bg-blue-500",
      subtext: "Applications you have submitted",
    },
    {
      title: "Approved Applications",
      count: counts.approved,
      icon: <CheckCircle className="w-6 h-6" />,
      accent: "bg-emerald-500",
      subtext: "Applications moved forward",
    },
    {
      title: "Rejected Applications",
      count: counts.rejected,
      icon: <XCircle className="w-6 h-6" />,
      accent: "bg-red-500",
      subtext: "Applications not selected",
    },
  ];

  return (
    <CandidateDashboardSkeleton>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-3 sm:px-5 lg:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-950 via-blue-950 to-violet-950 p-5 sm:p-7 lg:p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_30%)]" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-slate-200">
                  <Sparkles className="w-4 h-4" />
                  Candidate workspace
                </div>

                <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  {getGreeting()}, {displayName}.
                </h1>

                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Track your applications, interviews, and assessment progress
                  in one place.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-full lg:min-w-[340px]">
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Upcoming interviews</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {upcomingInterviews.length}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Scheduled and pending
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-4">
                  <p className="text-slate-300 text-sm">Next interview</p>
                  <h3 className="text-xl font-bold mt-2 truncate">
                    {upcomingInterviews.length > 0
                      ? formatDateDisplay(upcomingInterviews[0].date)
                      : "No interviews"}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 truncate">
                    {upcomingInterviews.length > 0
                      ? `${upcomingInterviews[0].company} • ${formatTimeToAMPM(
                          upcomingInterviews[0].time
                        )}`
                      : "No scheduled interview"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                count={stat.count}
                icon={stat.icon}
                accent={stat.accent}
                subtext={stat.subtext}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-[1.05fr_1.2fr] gap-6">
            <ModernBreakdownCard
              applied={counts.applied}
              approved={counts.approved}
              rejected={counts.rejected}
            />

            <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Upcoming Interviews
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Quickly access your scheduled interviews and meeting links.
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              {scheduledError ? (
                <div className="min-h-[320px] rounded-3xl border border-dashed border-red-200 bg-red-50 flex items-center justify-center">
                  <div className="text-center px-4">
                    <p className="text-sm font-medium text-red-600">
                      {scheduledError}
                    </p>
                  </div>
                </div>
              ) : upcomingInterviews.length > 0 ? (
                <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
                  {upcomingInterviews.map((item) => (
                    <div
                      key={item.id}
                      className="group rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-300"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Upcoming
                            </span>

                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-medium">
                              <Building2 className="w-3 h-3" />
                              {item.company}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 truncate">
                            {item.role}
                          </h3>

                          <p className="text-sm text-slate-600 mt-1">
                            Interview opportunity with {item.company}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-3 text-sm">
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 text-blue-700 px-3 py-2">
                              <Calendar className="w-4 h-4" />
                              {formatDateDisplay(item.date)}
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 text-slate-700 px-3 py-2">
                              <Clock3 className="w-4 h-4" />
                              {formatTimeToAMPM(item.time)}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
                          {item.zoom ? (
                            <>
                              <button
                                onClick={() =>
                                  handleMeetingClick(
                                    item.zoom,
                                    item.company,
                                    item.role
                                  )
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 text-sm font-medium transition"
                              >
                                <Video className="w-4 h-4" />
                                Join Interview
                              </button>

                              <a
                                href={item.zoom}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 text-sm font-medium transition"
                              >
                                Open Link
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

          <div className="rounded-[28px] border border-violet-200/60 bg-gradient-to-br from-violet-50 via-white to-slate-50 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-semibold">
                  <Award className="w-4 h-4" />
                  Assessment Overview
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-3">
                  Assessment Results
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Review your completed assessments, outcomes, and score
                  performance.
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
            </div>

            {testResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Tests Passed
                      </p>
                      <h3 className="text-3xl font-bold text-emerald-600 mt-2">
                        {passedTests}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2">
                        Successfully completed assessments
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Tests Failed
                      </p>
                      <h3 className="text-3xl font-bold text-red-600 mt-2">
                        {failedTests}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2">
                        Assessments requiring improvement
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                      <XCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Average Score
                      </p>
                      <h3 className="text-3xl font-bold text-violet-600 mt-2">
                        {averageScore}%
                      </h3>
                      <p className="text-xs text-slate-500 mt-2">
                        Overall assessment performance
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
                      <Target className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {testResultsLoading ? (
              <div className="min-h-[220px] rounded-3xl border border-dashed border-slate-200 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="w-10 h-10 mx-auto rounded-full border-4 border-slate-200 border-t-violet-600 animate-spin" />
                  <p className="text-sm text-slate-500 mt-4">
                    Loading assessment results...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="block sm:hidden">
                  {testResults.length === 0 ? (
                    <div className="min-h-[260px] rounded-3xl border border-dashed border-slate-200 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center px-4">
                        <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-slate-800">
                          No assessment results
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Completed assessments will appear here automatically.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {testResults.map((result) => (
                        <div
                          key={result.id}
                          className="rounded-3xl border border-white/70 bg-white/85 backdrop-blur-sm p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-base font-semibold text-slate-900 truncate">
                                {result.company_name}
                              </p>
                              <p className="text-sm text-slate-600 truncate mt-1">
                                {result.internship_title}
                              </p>
                            </div>

                            <span
                              className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                                result.passed
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {result.passed ? "PASSED" : "FAILED"}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-slate-100 px-3 py-3">
                              <p className="text-xs text-slate-500">Score</p>
                              <p
                                className={`text-sm font-bold mt-1 ${
                                  result.score >= 80
                                    ? "text-emerald-600"
                                    : result.score >= 60
                                    ? "text-amber-600"
                                    : "text-red-600"
                                }`}
                              >
                                {result.score}%
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-100 px-3 py-3">
                              <p className="text-xs text-slate-500">
                                Completed
                              </p>
                              <p className="text-sm font-medium text-slate-700 mt-1">
                                {new Date(
                                  result.completed_date
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden sm:block">
                  <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 backdrop-blur-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200">
                            <th className="px-4 sm:px-5 py-4 text-left text-sm font-semibold text-slate-600">
                              Company
                            </th>
                            <th className="px-4 sm:px-5 py-4 text-left text-sm font-semibold text-slate-600">
                              Role
                            </th>
                            <th className="px-4 sm:px-5 py-4 text-left text-sm font-semibold text-slate-600">
                              Score
                            </th>
                            <th className="px-4 sm:px-5 py-4 text-left text-sm font-semibold text-slate-600">
                              Result
                            </th>
                            <th className="px-4 sm:px-5 py-4 text-left text-sm font-semibold text-slate-600">
                              Date Completed
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 bg-white/90">
                          {testResults.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-12 text-center text-slate-500"
                              >
                                No assessment results available.
                              </td>
                            </tr>
                          ) : (
                            testResults.map((result) => (
                              <tr
                                key={result.id}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <td className="px-4 sm:px-5 py-4">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate max-w-[220px]">
                                      {result.company_name}
                                    </p>
                                  </div>
                                </td>

                                <td className="px-4 sm:px-5 py-4">
                                  <p className="text-sm text-slate-700 truncate max-w-[260px]">
                                    {result.internship_title}
                                  </p>
                                </td>

                                <td className="px-4 sm:px-5 py-4">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                      result.score >= 80
                                        ? "bg-emerald-100 text-emerald-700"
                                        : result.score >= 60
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {result.score}%
                                  </span>
                                </td>

                                <td className="px-4 sm:px-5 py-4">
                                  <span
                                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                      result.passed
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {result.passed ? "PASSED" : "FAILED"}
                                  </span>
                                </td>

                                <td className="px-4 sm:px-5 py-4 text-sm text-slate-600">
                                  {new Date(
                                    result.completed_date
                                  ).toLocaleDateString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {selectedMeeting && (
          <CandidateVideoCallComponent
            onClose={closeMeeting}
            meetingUrl={selectedMeeting.url}
            companyName={selectedMeeting.company}
            role={selectedMeeting.role}
          />
        )}
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default CandidateLoadingScreen;
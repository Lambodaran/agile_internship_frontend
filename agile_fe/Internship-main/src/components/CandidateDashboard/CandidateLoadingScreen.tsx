import React, { useEffect, useState, useRef } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Target,
  Calendar,
  Award,
  TrendingUp,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  X,
  Briefcase,
  PieChartIcon,
} from "lucide-react";
import CandidateDashboardSkeleton from "../skeleton/CandidateDashboardSkeleton";
import axios from "axios";
import { PieChart } from "react-minimal-pie-chart";
const baseApi = import.meta.env.VITE_BASE_API;

interface StatCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
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

const username = localStorage.getItem("username") || "User";

// Custom Video Call Component for Candidates
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

  useEffect(() => {
    // Initialize local video stream
    const initializeMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

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
      // Cleanup
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Interview with {companyName}
          </h3>
          <p className="text-sm text-gray-300">{role}</p>
          <p className="text-xs text-gray-400">
            {isConnected ? "Connected - Ready for interview" : "Connecting..."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-gray-900">
        {/* Remote Video (Interviewer) - Main */}
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <video
            ref={remoteVideoRef}
            className="max-w-full max-h-full"
            autoPlay
            playsInline
          />
          {/* Placeholder when no remote video */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">
                  {companyName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-lg">Waiting for interviewer to join...</p>
              <p className="text-sm text-gray-300 mt-2">
                You're ready! The interviewer will join shortly.
              </p>
            </div>
          </div>
        </div>

        {/* Local Video (Candidate) - Picture-in-Picture */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {!isVideoOn && (
            <div className="absolute inset-0 bg-gray-600 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
            You
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-colors ${
              isAudioOn
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isAudioOn ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              isVideoOn
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isVideoOn ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <Phone className="w-6 h-6 transform rotate-[135deg]" />
          </button>

          {/* External Meeting Link */}
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Join External Platform
          </a>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            Interview in progress - Use controls above to manage your camera and
            microphone
          </p>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  icon,
  bgColor,
  iconColor,
}) => {
  return (
    <div
      className={`${bgColor} p-4 sm:p-6 rounded-lg border-l-4 ${iconColor} w-full`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
            {count}
          </p>
        </div>
        <div
          className={`p-2 sm:p-3 rounded-full ${iconColor
            .replace("border-l-", "bg-")
            .replace("-500", "-100")} flex-shrink-0 ml-2`}
        >
          {React.cloneElement(icon as React.ReactElement, {
            className: `w-5 h-5 sm:w-6 sm:h-6 ${iconColor
              .replace("border-l-", "text-")
              .replace("-500", "-600")}`,
          })}
        </div>
      </div>
    </div>
  );
};

// Helper function to check if an interview is upcoming
const isUpcomingInterview = (dateStr: string, timeStr: string): boolean => {
  try {
    const now = new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);

    const interviewDateTime = new Date(year, month - 1, day, hour, minute);

    // Return true if the interview is in the future
    return interviewDateTime > now;
  } catch (error) {
    console.error("Error parsing date/time:", error);
    return false;
  }
};

// Helper function to sort interviews by date and time
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

  useEffect(() => {
    console.log("useEffect running, fetching counts...");
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

        console.log("Counts response:", response.data);
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

        // Filter for upcoming interviews only
        const upcoming = allInterviews.filter((interview: ScheduledInterview) =>
          isUpcomingInterview(interview.date, interview.time)
        );

        // Sort upcoming interviews by date and time
        const sortedUpcoming = sortInterviewsByDateTime(upcoming);
        setUpcomingInterviews(sortedUpcoming);

        console.log("All interviews:", allInterviews.length);
        console.log("Upcoming interviews:", sortedUpcoming.length);
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
        const response = await axios.get(
          `${baseApi}/candidates/test-results/`,
          {
            headers: {
              Authorization: token ? `Token ${token}` : "",
            },
          }
        );

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

  // Helper function to format date for better display
  const formatDateDisplay = (dateStr: string): string => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check if it's today or tomorrow
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
        <div className="min-h-screen flex items-center justify-center text-gray-600 p-4">
          Loading...
        </div>
      </CandidateDashboardSkeleton>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex items-center justify-center">
        <p className="text-red-600 font-semibold text-center">{error}</p>
      </div>
    );
  }

  // Calculate test statistics
  const passedTests = testResults.filter((test) => test.passed).length;
  const failedTests = testResults.filter((test) => !test.passed).length;
  const averageScore =
    testResults.length > 0
      ? Math.round(
          testResults.reduce((sum, test) => sum + test.score, 0) /
            testResults.length
        )
      : 0;

  // total for chart calculations
  const total = counts.applied + counts.approved + counts.rejected;
  const filteredData = [
    { title: "Applied", value: counts.applied, color: "#3b82f6" },
    { title: "Approved", value: counts.approved, color: "#22c55e" },
    { title: "Rejected", value: counts.rejected, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const noData = filteredData.length === 0;

  const stats = [
    {
      title: "Applied Applications",
      count: counts.applied,
      icon: <FileText />,
      bgColor: "bg-blue-50",
      iconColor: "border-l-blue-500",
    },
    {
      title: "Approved Applications",
      count: counts.approved,
      icon: <CheckCircle />,
      bgColor: "bg-green-50",
      iconColor: "border-l-green-500",
    },
    {
      title: "Rejected Applications",
      count: counts.rejected,
      icon: <XCircle />,
      bgColor: "bg-red-50",
      iconColor: "border-l-red-500",
    },
  ];

  return (
    <CandidateDashboardSkeleton>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Grid - Responsive layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                count={stat.count}
                icon={stat.icon}
                bgColor={stat.bgColor}
                iconColor={stat.iconColor}
              />
            ))}
          </div>

          {/* Content Grid - Stack on mobile, side by side on larger screens */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 md:mb-8">
            {/* Upcoming Scheduled Events */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Upcoming Interviews
                </h2>
              </div>
              {upcomingInterviews.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-gray-500 text-sm sm:text-base">
                    No upcoming interviews scheduled.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    You have {upcomingInterviews.length} upcoming interview
                    {upcomingInterviews.length > 1 ? "s" : ""}.
                  </p>
                  <ul className="space-y-3 sm:space-y-4">
                    {upcomingInterviews.map((item) => (
                      <li
                        key={item.id}
                        className="border p-3 sm:p-4 rounded-md bg-blue-50 border-blue-200"
                      >
                        <div className="space-y-1 sm:space-y-2">
                          <p className="font-medium text-gray-800 text-sm sm:text-base break-words">
                            Company: {item.company}
                          </p>
                          <p className="font-medium text-gray-800 text-sm sm:text-base break-words">
                            Role: {item.role}
                          </p>
                          <p className="text-xs sm:text-sm text-blue-600 font-medium">
                            Date: {formatDateDisplay(item.date)}
                          </p>
                          <p className="text-xs sm:text-sm text-blue-600 font-medium">
                            Time: {formatTimeToAMPM(item.time)}
                          </p>
                          <button
                            onClick={() =>
                              handleMeetingClick(
                                item.zoom,
                                item.company,
                                item.role
                              )
                            }
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-xs sm:text-sm mt-2 bg-transparent border-none cursor-pointer font-medium transition-colors duration-200"
                          >
                            <Video className="w-4 h-4" />
                            Join Interview
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              {/* Title always left */}
              <div className="flex items-center mb-4">
                <PieChartIcon className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Dashboard Breakdown
                </h2>
              </div>

              {/* Center Pie Chart + Legend */}
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 sm:w-48 sm:h-48 mb-4 sm:mb-6">
                  {noData ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 text-center text-sm sm:text-base">
                        No records available
                      </p>
                    </div>
                  ) : (
                    <PieChart
                      data={filteredData}
                      lineWidth={30}
                      radius={40}
                      animate
                      labelStyle={{
                        fontSize: "7px",
                        fontWeight: "bold",
                        fill: "#000",
                      }}
                      labelPosition={70}
                    />
                  )}
                </div>

                {/* Legend - Responsive layout */}
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm w-full">
                  <div className="flex items-center justify-center sm:justify-start">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Applied Applications</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Approved Applications</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Rejected Applications</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Results Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <Award className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Assessment Results
              </h2>
            </div>

            {/* Mobile Card Layout */}
            <div className="block sm:hidden">
              {testResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No assessment results available.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {testResults.map((result) => (
                    <div
                      key={result.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {result.company_name}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {result.internship_title}
                          </p>
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ml-2 ${
                            result.passed
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {result.passed ? "PASSED" : "FAILED"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span
                          className={`font-medium ${
                            result.score >= 80
                              ? "text-green-600"
                              : result.score >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {result.score}%
                        </span>
                        <span className="text-gray-600">
                          {new Date(result.completed_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-3 sm:px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Company
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Role
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Score
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Result
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Date Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {testResults.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No assessment results available.
                      </td>
                    </tr>
                  ) : (
                    testResults.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {result.company_name}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {result.internship_title}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm">
                          <span
                            className={`font-medium ${
                              result.score >= 80
                                ? "text-green-600"
                                : result.score >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {result.score}%
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              result.passed
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {result.passed ? "PASSED" : "FAILED"}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                          {new Date(result.completed_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            {testResults.length > 0 && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {passedTests}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Tests Passed
                    </p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">
                      {failedTests}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Tests Failed
                    </p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600">
                      {averageScore}%
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Average Score
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Built-in Video Call Interface for Candidates */}
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

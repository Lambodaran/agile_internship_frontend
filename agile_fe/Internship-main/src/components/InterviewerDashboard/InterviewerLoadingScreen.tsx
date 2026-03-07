import React, { useEffect, useState, useRef } from "react";
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
  PieChartIcon,
  Calendar,
} from "lucide-react";
import InterviewerDashboardSkeleton from "../skeleton/InterviewerDashboardSkeleton";
import axios from "axios";
import { PieChart } from "react-minimal-pie-chart";

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

// Helper function to check if an interview is upcoming
const isUpcomingInterview = (interview: Interview): boolean => {
  const now = new Date();
  const interviewDate = new Date(interview.date);

  // If there's a time specified, combine date and time
  if (interview.time) {
    const [hours, minutes] = interview.time.split(":");
    interviewDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    // If no time specified, consider it upcoming if it's today or later
    // Set to end of day to be inclusive
    interviewDate.setHours(23, 59, 59, 999);
  }

  return interviewDate > now;
};

// Helper function to sort interviews by date and time
const sortInterviewsByDateTime = (interviews: Interview[]): Interview[] => {
  return interviews.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    // Add time if available
    if (a.time) {
      const [hoursA, minutesA] = a.time.split(":");
      dateA.setHours(parseInt(hoursA), parseInt(minutesA));
    }
    if (b.time) {
      const [hoursB, minutesB] = b.time.split(":");
      dateB.setHours(parseInt(hoursB), parseInt(minutesB));
    }

    return dateA.getTime() - dateB.getTime();
  });
};

// Custom Video Call Component using WebRTC
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
            Interview with {candidateName}
          </h3>
          <p className="text-sm text-gray-300">
            {isConnected ? "Connected" : "Connecting..."}
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
        {/* Remote Video (Main) */}
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
                  {candidateName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-lg">Waiting for {candidateName} to join...</p>
              <p className="text-sm text-gray-300 mt-2">
                Share this meeting link:
                <button
                  onClick={() => navigator.clipboard.writeText(meetingUrl)}
                  className="ml-2 text-blue-400 hover:text-blue-300 underline"
                >
                  Copy Link
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Local Video (Picture-in-Picture) */}
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
            Join External Meeting
          </a>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            Use the controls above to manage your audio/video, or join the
            external meeting platform
          </p>
        </div>
      </div>
    </div>
  );
};

const EmployerLoadingScreen: React.FC = () => {
  const [counts, setCounts] = useState({
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

  useEffect(() => {
    const token = localStorage.getItem("access_token");

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

        setCounts(response.data.counts ?? counts);

        // Filter and sort upcoming interviews
        const allInterviews = response.data.scheduled_interviews ?? [];
        const upcomingInterviews = allInterviews
          .filter(isUpcomingInterview)
          .sort(sortInterviewsByDateTime);

        setInterviews(upcomingInterviews);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const {
    total_jobs_posted,
    total_applications_received,
    total_accepted,
    total_rejected,
  } = counts;

  const pieData = [
    {
      title: `Applications Received (${total_applications_received})`,
      value: total_applications_received,
      color: "#3B82F6",
    },
    {
      title: `Shortlisted (${total_accepted})`,
      value: total_accepted,
      color: "#10B981",
    },
    {
      title: `Rejected (${total_rejected})`,
      value: total_rejected,
      color: "#EF4444",
    },
    {
      title: `Active Job Postings (${total_jobs_posted})`,
      value: total_jobs_posted,
      color: "#8B5CF6",
    },
  ].filter((item) => item.value > 0);

  const handleMeetingClick = (zoomUrl: string, candidateName: string) => {
    setSelectedMeeting({ url: zoomUrl, candidate: candidateName });
  };

  const closeMeeting = () => {
    setSelectedMeeting(null);
  };

  // Format date for display
  const formatInterviewDateTime = (date: string, time: string | null) => {
    const interviewDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if it's today or tomorrow
    const isToday = interviewDate.toDateString() === today.toDateString();
    const isTomorrow = interviewDate.toDateString() === tomorrow.toDateString();

    let dateStr;
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

  return (
    <InterviewerDashboardSkeleton>
      <div className="w-full flex flex-col gap-4 sm:gap-6 px-3 sm:px-5 py-4 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  title: "Applications Received",
                  count: total_applications_received,
                  icon: <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />,
                  bgColor: "bg-blue-50",
                  iconColor: "border-l-blue-500",
                },
                {
                  title: "Candidates Shortlisted",
                  count: total_accepted,
                  icon: <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />,
                  bgColor: "bg-green-50",
                  iconColor: "border-l-green-500",
                },
                {
                  title: "Applications Rejected",
                  count: total_rejected,
                  icon: <UserX className="w-5 h-5 sm:w-6 sm:h-6" />,
                  bgColor: "bg-red-50",
                  iconColor: "border-l-red-500",
                },
                {
                  title: "Active Job Postings",
                  count: total_jobs_posted,
                  icon: <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />,
                  bgColor: "bg-purple-50",
                  iconColor: "border-l-purple-500",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-3 sm:p-4 rounded-lg shadow-sm ${stat.bgColor} border-l-4 ${stat.iconColor} hover:shadow-md transition-shadow duration-200`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-shrink-0">{stat.icon}</div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </p>
                      <p className="text-lg sm:text-xl font-semibold text-gray-900">
                        {stat.count}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts and Interviews Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              {/* Pie Chart Section */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 order-2 xl:order-1">
                <div className="flex items-center mb-4">
                  <PieChartIcon className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Dashboard Breakdown
                  </h2>
                </div>

                {pieData.length > 0 ? (
                  <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6">
                    <div className="w-full max-w-48 sm:max-w-56 lg:flex-shrink-0">
                      <PieChart
                        data={pieData}
                        lineWidth={20}
                        radius={40}
                        paddingAngle={2}
                        animate
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:gap-3 w-full lg:w-auto">
                      {pieData.map(({ title, color }, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 sm:gap-3"
                        >
                          <div
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                            {title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-32 text-gray-500">
                    <p className="text-sm">No data available for chart</p>
                  </div>
                )}
              </div>

              {/* Upcoming Interviews Section */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 order-1 xl:order-2">
                <div className="flex items-center mb-4">
                  <Calendar className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Upcoming Interviews
                  </h2>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {interviews.length > 0 ? (
                    interviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {interview.candidate_name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              {interview.internship_role}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              {formatInterviewDateTime(
                                interview.date,
                                interview.time
                              )}
                            </p>
                            {interview.zoom && (
                              <button
                                onClick={() =>
                                  handleMeetingClick(
                                    interview.zoom,
                                    interview.candidate_name
                                  )
                                }
                                className="inline-flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline mt-2 font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer"
                              >
                                <Video className="w-4 h-4" />
                                Start Interview
                              </button>
                            )}
                          </div>
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center min-h-32 text-gray-500">
                      <div className="text-center">
                        <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          No upcoming interviews scheduled.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Built-in Video Call Interface */}
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

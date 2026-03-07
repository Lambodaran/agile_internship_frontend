import {
  Calendar,
  ChevronRight,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  Users,
  X,
  Menu,
  Award,
  User,
  Mail,
  BarChart2,
  Clock,
} from "lucide-react";
import { useState, ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../Header/Header";

interface InterviewerDashboardSkeletonProps {
  children: ReactNode;
}

const InterviewerDashboardSkeleton = ({ children }: InterviewerDashboardSkeletonProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
        setMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const interviewQuestionPaths = [
    "/add-question",
    "/import-question",
    "/view-question",
    "/export-question",
  ];

  const internshipPaths = [
    "/post-internship",
    "/posted-internship",
    "/internship-application",
  ];

  const [isInterviewQuestionOpen, setInterviewQuestionOpen] = useState(
    interviewQuestionPaths.includes(location.pathname)
  );

  const [isInternshipOpen, setInternshipOpen] = useState(
    internshipPaths.includes(location.pathname)
  );

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      closeMobileMenu();
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      toggleMobileMenu();
    } else {
      setSidebarOpen(!isSidebarOpen);
    }
  };

  const SidebarContent = () => (
    <nav className="mt-[5px] px-2">
      {/* Dashboard */}
      <div
        onClick={() => handleNavigation("/interviewer-dashboard")}
        title={(!isSidebarOpen && !isMobile) ? "Dashboard" : ""}
        className={`cursor-pointer px-4 py-3 rounded-lg flex items-center transition-colors duration-200 ${
          isActive("/interviewer-dashboard")
            ? "bg-blue-500 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mr-3 flex-shrink-0" />
        {(isSidebarOpen || isMobile) && <span className="font-medium">Dashboard</span>}
      </div>

      {/* Calendar */}
      <div
        onClick={() => handleNavigation("/interviewer-calendar")}
        title={(!isSidebarOpen && !isMobile) ? "Interview Calendar" : ""}
        className={`cursor-pointer px-4 py-3 mt-2 rounded-lg flex items-center transition-colors duration-200 ${
          isActive("/interviewer-calendar")
            ? "bg-blue-500 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Calendar className="w-5 h-5 mr-3 flex-shrink-0" />
        {(isSidebarOpen || isMobile) && <span className="font-medium">Interview Calendar</span>}
      </div>

      {/* Interview Questions */}
      <div className="mt-2">
        <div
          onClick={() => setInterviewQuestionOpen(!isInterviewQuestionOpen)}
          title={(!isSidebarOpen && !isMobile) ? "Interview Questions" : ""}
          className="cursor-pointer px-4 py-3 flex items-center justify-between text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors duration-200"
        >
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-3 flex-shrink-0" />
            {(isSidebarOpen || isMobile) && <span className="font-medium">Interview Questions</span>}
          </div>
          {(isSidebarOpen || isMobile) && (
            <ChevronRight
              className={`w-4 h-4 transform transition-transform duration-200 ${
                isInterviewQuestionOpen ? "rotate-90" : ""
              }`}
            />
          )}
        </div>

        {(isSidebarOpen || isMobile) && isInterviewQuestionOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {[
              { path: "/add-question", label: "Add Interview Questions" },
              { path: "/view-question", label: "View Interview Questions" },
            ].map(({ path, label }) => (
              <div
                key={path}
                onClick={() => handleNavigation(path)}
                className={`cursor-pointer px-4 py-2 text-sm rounded-lg flex items-center transition-colors duration-200 ${
                  isActive(path)
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <ChevronRight className="w-3 h-3 mr-2 flex-shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Internships */}
      <div className="mt-2">
        <div
          onClick={() => setInternshipOpen(!isInternshipOpen)}
          title={(!isSidebarOpen && !isMobile) ? "Internships" : ""}
          className="cursor-pointer px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg flex items-center justify-between transition-colors duration-200"
        >
          <div className="flex items-center">
            <GraduationCap className="w-5 h-5 mr-3 flex-shrink-0" />
            {(isSidebarOpen || isMobile) && <span className="font-medium">Internships</span>}
          </div>
          {(isSidebarOpen || isMobile) && (
            <ChevronRight
              className={`w-4 h-4 transform transition-transform duration-200 ${
                isInternshipOpen ? "rotate-90" : ""
              }`}
            />
          )}
        </div>

        {(isSidebarOpen || isMobile) && isInternshipOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {[
              { path: "/post-internship", label: "Post Internship" },
              { path: "/posted-internship", label: "Posted Internship" },
              { path: "/internship-application", label: "Internship Applications" },
            ].map(({ path, label }) => (
              <div
                key={path}
                onClick={() => handleNavigation(path)}
                className={`cursor-pointer px-4 py-2 text-sm rounded-lg flex items-center transition-colors duration-200 ${
                  isActive(path)
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <ChevronRight className="w-3 h-3 mr-2 flex-shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Face to Face */}
      <div
        onClick={() => handleNavigation("/interviewer-f2f")}
        title={(!isSidebarOpen && !isMobile) ? "Face-to-Face" : ""}
        className={`cursor-pointer px-4 py-3 mt-2 rounded-lg flex items-center transition-colors duration-200 ${
          isActive("/interviewer-f2f")
            ? "bg-blue-500 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Handshake className="w-5 h-5 mr-3 flex-shrink-0" />
        {(isSidebarOpen || isMobile) && <span className="font-medium">Face-to-Face</span>}
      </div>
      
      {/* Selected candidate */}
      <div
        onClick={() => handleNavigation("/interviewer-selected-candidate")}
        title={(!isSidebarOpen && !isMobile) ? "Selected-Candidate" : ""}
        className={`cursor-pointer px-4 py-3 mt-2 rounded-lg flex items-center transition-colors duration-200 ${
          isActive("/interviewer-selected-candidate")
            ? "bg-blue-500 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Award className="w-5 h-5 mr-3 flex-shrink-0" />
        {(isSidebarOpen || isMobile) && <span className="font-medium">Selected Candidate</span>}
      </div>


       {/* Interviewer profile */}
      <div
        onClick={() => handleNavigation("/interviewer-profile")}
        title={(!isSidebarOpen && !isMobile) ? "Interviewer-Profile" : ""}
        className={`cursor-pointer px-4 py-3 mt-2 rounded-lg flex items-center transition-colors duration-200 ${
          isActive("/interviewer-profile")
            ? "bg-blue-500 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <User className="w-5 h-5 mr-3 flex-shrink-0" />
        {(isSidebarOpen || isMobile) && <span className="font-medium">Interviewer Profile</span>}
      </div>

      {/* Messages */}
      <div
        onClick={() => handleNavigation("/interviewer-messages")}
        title={(!isSidebarOpen && !isMobile) ? "Messages" : ""}
        className={`cursor-pointer px-4 py-3 mt-2 rounded-lg flex items-center transition-colors duration-200 ${
          isActive("/interviewer-messages")
            ? "bg-blue-500 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Mail className="w-5 h-5 mr-3 flex-shrink-0" />
        {(isSidebarOpen || isMobile) && <span className="font-medium">Messages</span>}
      </div>

      {/* Analytics & Reports */}
      <div
        onClick={() => handleNavigation("/interviewer-analytics")}
        title={(!isSidebarOpen && !isMobile) ? "Analytics" : ""}
        className={`cursor-pointer px-4 py-3 mt-2 rounded-lg flex items-center transition-colors duration-200 ${
          isActive("/interviewer-analytics")
            ? "bg-blue-500 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <BarChart2 className="w-5 h-5 mr-3 flex-shrink-0" />
        {(isSidebarOpen || isMobile) && <span className="font-medium">Analytics & Reports</span>}
      </div>

      {/* Talent Pool */}
      <div
        onClick={() => handleNavigation("/interviewer-talent-pool")}
        title={(!isSidebarOpen && !isMobile) ? "Talent Pool" : ""}
        className={`cursor-pointer px-4 py-3 mt-2 rounded-lg flex items-center transition-colors duration-200 ${
          isActive("/interviewer-talent-pool")
            ? "bg-blue-500 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Users className="w-5 h-5 mr-3 flex-shrink-0" />
        {(isSidebarOpen || isMobile) && <span className="font-medium">Talent Pool</span>}
      </div>

      {/* Candidate Activity Log */}
      <div
        onClick={() => handleNavigation("/candidate-activity-log")}
        title={(!isSidebarOpen && !isMobile) ? "Candidate Activity" : ""}
        className={`cursor-pointer px-4 py-3 mt-2 rounded-lg flex items-center transition-colors duration-200 ${
          isActive("/candidate-activity-log")
            ? "bg-blue-500 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Clock className="w-5 h-5 mr-3 flex-shrink-0" />
        {(isSidebarOpen || isMobile) && <span className="font-medium">Candidate Activity</span>}
      </div> 

    </nav>
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Header at top */}
      <Header
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={toggleSidebar}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden bg-gray-50">
        {/* Desktop Sidebar */}
        <div className={`
          hidden md:block bg-white shadow-lg transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "w-72" : "w-16"} 
          overflow-y-auto border-r border-gray-200
        `}>
          <SidebarContent />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={closeMobileMenu}
            />
            {/* Sidebar */}
            <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto">
              {/* Mobile sidebar header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
                <button
                  aria-label="Close menu"
                  title="Close menu"
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 bg-gray-100 overflow-y-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerDashboardSkeleton;
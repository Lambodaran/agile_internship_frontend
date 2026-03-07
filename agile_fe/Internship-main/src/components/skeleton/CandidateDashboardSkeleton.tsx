import {
  Briefcase,
  Calendar,
  FileText,
  LayoutDashboard,
  Menu,
  X,
  Bookmark,
  MessageSquare,
  Trophy,
  History,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import Header from "../Header/Header";

interface CandidateDashboardSkeletonProps {
  children: ReactNode;
}

const CandidateDashboardSkeleton = ({ children }: CandidateDashboardSkeletonProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size and adjust sidebar behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, sidebar should be closed by default
      if (mobile && isSidebarOpen) {
        setSidebarOpen(false);
      } else if (!mobile && !isSidebarOpen) {
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: "/candidate-dashboard",
    },
    {
      label: "Calendar",
      icon: <Calendar className="w-5 h-5" />,
      path: "/candidate-calendar"
    },
    {
      label: "Internship",
      icon: <Briefcase className="w-5 h-5" />,
      path: "/internship",
    },
    {
      label: "Applied Internship",
      icon: <FileText className="w-5 h-5" />,
      path: "/applied-internship"
    },
    {
      label: "Saved Internships",
      icon: <Bookmark className="w-5 h-5" />,
      path: "/saved-internship"
    },
    {
      label: "Messages",
      icon: <MessageSquare className="w-5 h-5" />,
      path: "/candidate-messages"
    },
    {
      label: "Leaderboard",
      icon: <Trophy className="w-5 h-5" />,
      path: "/skill-leaderboard"
    },
    {
      label: "Document Center",
      icon: <FileText className="w-5 h-5" />,
      path: "/document-center"
    },
    {
      label: "Application History",
      icon: <History className="w-5 h-5" />,
      path: "/application-history"
    },
    {
      label: "Profile",
      icon: <FileText className="w-5 h-5" />,
      path: "/candidate-profile"
    },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleNavItemClick = (path: string) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />
      
      <div className="flex flex-1 overflow-hidden bg-gray-50 relative">
        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div 
          className={`bg-white shadow-lg transition-all duration-300 z-30
            ${isMobile 
              ? `fixed left-0 top-16 h-[calc(100vh-4rem)] ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'}`
              : `relative ${isSidebarOpen ? 'w-64 lg:w-1/4' : 'w-16'}`
            }
            overflow-y-auto`}
        >
          {/* Mobile Close Button */}
          {isMobile && isSidebarOpen && (
            <div className="flex justify-end p-4 border-b">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

          <nav className="mt-4 space-y-2 px-2">
            {navItems.map((item) => (
              <div
                key={item.label}
                onClick={() => handleNavItemClick(item.path)}
                className={`relative group cursor-pointer px-4 py-3 rounded-lg flex items-center space-x-3 transition-all duration-200 
                  ${isActive(item.path)
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  }
                  ${!isSidebarOpen && !isMobile ? 'justify-center' : ''}
                `}
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                
                {(isSidebarOpen || isMobile) && (
                  <span className="font-medium text-sm md:text-base whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {/* Tooltip for collapsed desktop sidebar */}
                {!isSidebarOpen && !isMobile && (
                  <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-100">
          <div className="p-3 sm:p-4 md:p-6 h-full">
            <div className="max-w-full">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboardSkeleton;
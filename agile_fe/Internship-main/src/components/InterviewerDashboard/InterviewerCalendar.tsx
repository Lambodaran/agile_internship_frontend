import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, MapPin, Video, Phone, FileText, Bell, Briefcase, Menu, X } from 'lucide-react';
import axios from 'axios';
import InterviewerDashboardSkeleton from '../skeleton/InterviewerDashboardSkeleton';

const baseApi = import.meta.env.VITE_BASE_API;

const api = axios.create({
  baseURL: baseApi,
  headers: { 'Content-Type': 'application/json' },
});

const InterviewerCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('Month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Fetch interviews from API (keeping original logic)
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const token = localStorage?.getItem('access_token') || 'mock-token';
        console.log('Token:', token);
        console.log('Base API:', baseApi);
        if (!token) {
          throw new Error('No access token found. Please log in.');
        }

        const response = await api.get('/interviewer/interview_calendar/', {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        // Transform API data (keeping original logic)
        const formattedInterviews = response.data.scheduled_interviews.map(interview => {
          const date = new Date(interview.date);
          if (isNaN(date.getTime())) {
            console.error('Invalid date:', interview.date);
            return null;
          }
          return {
            id: interview.id,
            candidateName: interview.candidate_name,
            position: interview.internship_role,
            date: date.toLocaleDateString('en-CA'),
            time: interview.time || 'N/A',
            type: interview.zoom ? 'video' : 'in-person',
            location: interview.zoom || interview.company_name || 'N/A',
            notes: `Interview for ${interview.internship_role}`
          };
        }).filter(Boolean);

        console.log('Interviews:', formattedInterviews);
        setInterviews(formattedInterviews);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch interviews.');
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  // All original helper functions (keeping exact logic)
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month's days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonth.getDate() - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonth.getDate() - i)
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      });
    }

    // Next month's days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day)
      });
    }

    return days;
  };

  const getWeekDays = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(date.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      days.push(currentDay);
    }
    return days;
  };

  const getWeekRange = (date) => {
    const weekDays = getWeekDays(date);
    const start = weekDays[0];
    const end = weekDays[6];
    
    if (start.getMonth() === end.getMonth()) {
      return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
  };

  const getInterviewsForDate = (date) => {
    const dateStr = date.toLocaleDateString('en-CA');
    return interviews.filter(interview => interview.date === dateStr);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const navigateWeek = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction * 7));
      return newDate;
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-3 h-3" />;
      case 'phone':
        return <Phone className="w-3 h-3" />;
      case 'in-person':
        return <MapPin className="w-3 h-3" />;
      default:
        return <Calendar className="w-3 h-3" />;
    }
  };

  // Handle mobile menu toggle - now controls notes display
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);
  const today = new Date();
  const isToday = (date) => date.toDateString() === today.toDateString();
  const todayInterviews = getInterviewsForDate(today);

  if (loading) {
    return (
      <InterviewerDashboardSkeleton>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading interviews...</div>
        </div>
      </InterviewerDashboardSkeleton>
    );
  }

  if (error) {
    return (
      <InterviewerDashboardSkeleton>
        <div className="flex items-center justify-center min-h-screen">
          <div className="p-6 text-red-600 text-center">
            <div className="text-lg font-semibold mb-2">Error</div>
            <div>{error}</div>
          </div>
        </div>
      </InterviewerDashboardSkeleton>
    );
  }

  return (
    <InterviewerDashboardSkeleton>
      <div className="bg-white min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              <span className="hidden sm:inline">Interview Management Calendar</span>
              <span className="sm:hidden">Interview Calendar</span>
            </h1>
            
            {/* Desktop Notes Button */}
            <div className="hidden lg:block">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                {showNotes ? 'Hide Notes' : 'Notes'}
              </button>
            </div>

            {/* Mobile/Tablet Menu Button (Three lines) */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" /> 
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Calendar Section */}
          <div className="flex-1 p-4 sm:p-6">
            {/* Mobile/Tablet Notes Panel - Show when menu is open */}
            {isMobileMenuOpen && (
              <div className="lg:hidden mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900 text-base">Interview Notes</h3>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {interviews.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No interviews scheduled yet.
                    </div>
                  ) : (
                    interviews.slice(0, 5).map((interview) => (
                      <div key={interview.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900 text-sm">{interview.candidateName}</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Briefcase className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900 text-sm">{interview.position}</span>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {interview.date} at {interview.time}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          {getTypeIcon(interview.type)}
                          <span className="text-sm text-gray-600 capitalize">{interview.type}</span>
                        </div>
                        <div className="text-xs text-gray-700 bg-gray-50 rounded p-2">
                          {interview.notes}
                        </div>
                      </div>
                    ))
                  )}
                  {interviews.length > 5 && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      Showing first 5 interviews
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Calendar Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 min-w-0 flex-shrink">
                  <span className="hidden sm:inline">
                    {view === 'Week' 
                      ? getWeekRange(currentDate)
                      : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    }
                  </span>
                  <span className="sm:hidden">
                    {view === 'Week' 
                      ? `${monthNames[currentDate.getMonth()].slice(0, 3)} ${currentDate.getFullYear()}`
                      : `${monthNames[currentDate.getMonth()].slice(0, 3)} ${currentDate.getFullYear()}`
                    }
                  </span>
                </h2>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => view === 'Week' ? navigateWeek(-1) : navigateMonth(-1)}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => view === 'Week' ? navigateWeek(1) : navigateMonth(1)}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-end">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {['Month', 'Week', 'Today'].map((viewType) => (
                    <button
                      key={viewType}
                      onClick={() => setView(viewType)}
                      className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                        view === viewType 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {viewType}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Monthly Calendar */}
              {view === 'Month' && (
                <>
                  <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {dayNames.map((day, index) => (
                      <div key={day} className="p-2 sm:p-3 text-center text-xs font-medium text-gray-700">
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.slice(0, 1)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {days.map((dayObj, index) => {
                      const interviews = getInterviewsForDate(dayObj.date);
                      const isCurrentDay = isToday(dayObj.date);

                      return (
                        <div
                          key={index}
                          className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border-b border-r border-gray-200 ${
                            !dayObj.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                          } ${isCurrentDay ? 'bg-blue-50' : ''}`}
                        >
                          <div
                            className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                              !dayObj.isCurrentMonth
                                ? 'text-gray-400'
                                : isCurrentDay
                                ? 'text-blue-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {dayObj.day}
                          </div>

                          <div className="space-y-1">
                            {interviews.slice(0, 1).map((interview) => (
                              <div
                                key={interview.id}
                                className="p-1 sm:p-2 rounded text-xs border bg-green-100 text-green-800 border-green-200 cursor-pointer hover:shadow-sm transition-shadow"
                                onClick={() => setSelectedDate(dayObj.date)}
                              >
                                <div className="flex items-center space-x-1 mb-1">
                                  <span className="font-medium truncate text-[10px] sm:text-xs">{interview.time}</span>
                                </div>
                                <div className="hidden sm:flex items-center space-x-1 mb-1">
                                  <User className="w-3 h-3 text-green-800" />
                                  <span className="font-medium truncate text-green-900">{interview.candidateName}</span>
                                </div>
                                <div className="hidden sm:flex items-center space-x-1">
                                  <Briefcase className="w-3 h-3 text-green-800" />
                                  <span className="font-medium truncate text-green-900">{interview.position}</span>
                                </div>
                                <div className="sm:hidden text-[10px] truncate">{interview.candidateName}</div>
                              </div>
                            ))}
                            {interviews.length > 1 && (
                              <div className="text-[10px] sm:text-xs text-gray-500 text-center py-1">
                                +{interviews.length - 1} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Weekly Calendar */}
              {view === 'Week' && (
                <>
                  <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {weekDays.map((date, index) => {
                      const isCurrentDay = isToday(date);
                      return (
                        <div key={index} className={`p-2 sm:p-3 text-center border-r border-gray-200 last:border-r-0 ${isCurrentDay ? 'bg-blue-100' : ''}`}>
                          <div className={`text-xs font-medium ${isCurrentDay ? 'text-blue-600' : 'text-gray-700'}`}>
                            <span className="hidden sm:inline">{dayNamesShort[date.getDay()]}</span>
                            <span className="sm:hidden">{dayNamesShort[date.getDay()].slice(0, 1)}</span>
                          </div>
                          <div className={`text-sm sm:text-lg font-semibold mt-1 ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
                            {date.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-7">
                    {weekDays.map((date, index) => {
                      const interviews = getInterviewsForDate(date);
                      const isCurrentDay = isToday(date);

                      return (
                        <div
                          key={index}
                          className={`min-h-[200px] sm:min-h-[300px] p-1 sm:p-3 border-r border-gray-200 last:border-r-0 ${isCurrentDay ? 'bg-blue-50' : 'bg-white'}`}
                        >
                          <div className="space-y-1 sm:space-y-2">
                            {interviews.map((interview) => (
                              <div
                                key={interview.id}
                                className="p-2 sm:p-3 rounded-lg text-xs sm:text-sm border bg-green-100 text-green-800 border-green-200 cursor-pointer hover:shadow-md transition-all duration-200"
                                onClick={() => setSelectedDate(date)}
                              >
                                <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                                  {getTypeIcon(interview.type)}
                                  <span className="font-semibold text-[10px] sm:text-sm">{interview.time}</span>
                                </div>
                                <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-green-800" />
                                  <span className="font-medium text-green-900 truncate text-[10px] sm:text-sm">{interview.candidateName}</span>
                                </div>
                                <div className="hidden sm:flex items-center space-x-2">
                                  <Briefcase className="w-4 h-4 text-green-800" />
                                  <span className="font-medium text-green-900 truncate">{interview.position}</span>
                                </div>
                              </div>
                            ))}
                            {interviews.length === 0 && (
                              <div className="text-center text-gray-400 text-xs sm:text-sm mt-4 sm:mt-8">
                                No interviews
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Today View */}
              {view === 'Today' && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-yellow-50 border-b border-yellow-200 text-center py-3 font-semibold text-yellow-800 text-sm sm:text-base">
                    {today.toDateString()}
                  </div>
                  <div className="p-3 sm:p-4 space-y-2">
                    {todayInterviews.length === 0 ? (
                      <div className="text-gray-600 text-sm text-center">
                        No interviews scheduled for today.
                      </div>
                    ) : (
                      todayInterviews.map((interview) => (
                        <div
                          key={interview.id}
                          className="p-3 sm:p-4 border rounded-lg bg-green-100 text-green-800 border-green-200 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-green-800" />
                              <span className="font-medium text-green-900">{interview.candidateName}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-700">
                              {getTypeIcon(interview.type)}
                              <span>{interview.time}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Briefcase className="w-4 h-4 text-green-800" />
                            <span className="font-medium text-green-900">{interview.position}</span>
                          </div>
                          <div className="text-xs text-gray-500">{interview.notes}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Today's Interviews Summary */}
            {(view === 'Month' || view === 'Week') && (
              <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900 text-sm sm:text-base">Today's Interviews</h3>
                </div>
                <div className="space-y-2">
                  {todayInterviews.length === 0 ? (
                    <div className="text-gray-600 text-sm text-center">
                      No interviews scheduled for today.
                    </div>
                  ) : (
                    todayInterviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white rounded-lg border border-blue-200 space-y-2 sm:space-y-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <User className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-900 text-sm sm:text-base">{interview.candidateName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Briefcase className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-900 text-sm sm:text-base">{interview.position}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900 text-sm sm:text-base">{interview.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Notes Panel */}
          {showNotes && (
            <div className="hidden lg:block w-80 bg-gray-50 border-l border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Interview Notes</h3>
              </div>
              <div className="space-y-4 max-h-none overflow-y-auto">
                {interviews.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No interviews scheduled yet.
                  </div>
                ) : (
                  interviews.slice(0, 5).map((interview) => (
                    <div key={interview.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{interview.candidateName}</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Briefcase className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{interview.position}</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {interview.date} at {interview.time}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        {getTypeIcon(interview.type)}
                        <span className="text-sm text-gray-600 capitalize">{interview.type}</span>
                      </div>
                      <div className="text-xs text-gray-700 bg-gray-50 rounded p-2">
                        {interview.notes}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </InterviewerDashboardSkeleton>
  );
};

export default InterviewerCalendar;
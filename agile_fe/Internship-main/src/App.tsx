import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import PrivateRoute from "@/components/PrivateRoute";
import LoginForm from "./components/LoginForm";

// Loading Screen component
import InterviewerLoadingScreen from "@/components/InterviewerDashboard/InterviewerLoadingScreen";
import CandidateLoadingScreen from "@/components/CandidateDashboard/CandidateLoadingScreen";

// Not found
import NotFound from "./pages/NotFound";

// Interviewer components
import InterviewerCalendar from "./components/InterviewerDashboard/InterviewerCalendar";
import AddInterviewQuestion from "./components/InterviewerDashboard/AddInterviewQuestion";
import ViewInterviewQuestion from "./components/InterviewerDashboard/ViewInterviewQuestion";
import PostInternship from "./components/InterviewerDashboard/PostInternship";
import PostedInternship from "./components/InterviewerDashboard/PostedInternship";
import InternshipApplications from "./components/InterviewerDashboard/InternshipApplications";
import InterviewerF2F from "./components/InterviewerDashboard/InterviewerF2F";
import InterviewerSelectedCandidate from "./components/InterviewerDashboard/InterviewerSelectedCandidate";
import InterviewerProfile from "./components/InterviewerDashboard/InterviewerProfile";
import InterviewerMessage from "./components/InterviewerDashboard/InterviewerMessage";
import AnalyticsReport from "./components/InterviewerDashboard/AnalyticsReport";
import TalentPool from "./components/InterviewerDashboard/TalentPool";
import CandidateActivityLog from "./components/InterviewerDashboard/CandidateActivityLog";

// Candidate Components
import CandidateInternship from "./components/CandidateDashboard/CandidateInternship";
import AppliedInternship from "./components/CandidateDashboard/AppliedInternship";
import CandidateCalendar from "./components/CandidateDashboard/CandidateCalendar";
import CandidateProfile from "./components/CandidateDashboard/CandidateProfile";
import SavedInternship from "./components/CandidateDashboard/SavedInternships";
import CandidateMessage from "./components/CandidateDashboard/CandidateMessage";
import SkillLeadeerboard from "./components/CandidateDashboard/SkillLeaderboard";
import DocumentCenter from "./components/CandidateDashboard/DocumentCenter";
import ApplicationHistory from "./components/CandidateDashboard/AppilicationHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginForm />} />

          <Route element={<PrivateRoute />}>

            {/* Interviewer Routes */}
            <Route
              path="/interviewer-dashboard"
              element={
                  <InterviewerLoadingScreen />
              }
            />
            <Route
              path="/interviewer-calendar"
              element={
                  <InterviewerCalendar />
              }
            />
            <Route
              path="/add-question"
              element={
                  <AddInterviewQuestion />
              }
            />
            <Route
              path="/view-question"
              element={
                  <ViewInterviewQuestion />
              }
            />
            <Route
              path="/post-internship"
              element={
                  <PostInternship />
              }
            />
            <Route
              path="/posted-internship"
              element={
                  <PostedInternship />
              }
            />
            <Route
              path="/internship-application"
              element={
                  <InternshipApplications />
              }
            />
            <Route
              path="/interviewer-f2f"
              element={
                  <InterviewerF2F />
              }
            />
            <Route
              path="/interviewer-selected-candidate"
              element={
                  <InterviewerSelectedCandidate />
              }
            />
            <Route
              path="/interviewer-profile"
              element={
                  <InterviewerProfile />
              }
            />
            <Route
              path="/interviewer-messages"
              element={
                  <InterviewerMessage />
              }
            />
            <Route
              path="/interviewer-analytics"
              element={
                  <AnalyticsReport />
              }
            />
            <Route
              path="/interviewer-talent-pool"
              element={
                  <TalentPool />
              }
            />
            <Route
              path="/interviewer-talent-pool"
              element={
                  <TalentPool />
              }
            />
            <Route
              path="/candidate-activity-log"
              element={
                  <CandidateActivityLog />
              }
            />


            

            {/* Candidate Routes */}
            <Route
              path="/candidate-dashboard"
              element={
                  <CandidateLoadingScreen />
              }
            />
            <Route
              path="/internship"
              element={
                  <CandidateInternship />
              }
            />
            <Route
              path="/candidate-calendar"
              element={
                  <CandidateCalendar />
              }
            />
            <Route
              path="/applied-internship"
              element={
                  <AppliedInternship />
              }
            />
            <Route
              path="/candidate-profile"
              element={
                  <CandidateProfile />
              }
            />
            <Route
              path="/saved-internship"
              element={
                  <SavedInternship />
              }
            />
            <Route
              path="/candidate-messages"
              element={
                  <CandidateMessage />
              }
            />
            <Route
              path="/skill-leaderboard"
              element={
                  <SkillLeadeerboard />
              }
            />
            <Route
              path="/Document-Center"
              element={
                  <DocumentCenter />
              }
            />
            <Route
              path="/application-history"
              element={
                  <ApplicationHistory />
              }
            />


          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

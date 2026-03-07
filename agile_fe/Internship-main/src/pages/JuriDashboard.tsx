import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Download,
  Upload,
  MessageSquare,
  Bell,
  Calendar,
  Users,
  Trophy,
  MessageCircle,
  Phone,
  ExternalLink,
  AlertTriangle,
  Menu,
} from "lucide-react";

import Overview from "@/components/JuriDashboard/Overview";
import AnnouncementFeed from "@/components/JuriDashboard/AnnouncementFeed";
import Team from "@/components/JuriDashboard/Team";
import Mark from "@/components/JuriDashboard/Marks";
import Memorial from "@/components/JuriDashboard/Memorial";
import Round from "@/components/JuriDashboard/Round";

import Sidebar from "@/components/JuriDashboard/sidebar";
import Profile from "@/components/JuriDashboard/Profile";
import DashboardSkeleton from "./DashboardSkeleton";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [overviewData] = useState({
    team_details: {
      team_code: "TC123",
      team_name: "Justice League",
      university: "Example University",
      participants: [
        { name: "Alice Smith" },
        { name: "Bob Johnson" },
        { name: "Carol Williams" },
      ],
    },
    competition_progress: {
      total_teams: 50,
      qualified_for_round_2: 25,
      rounds_completed: 1,
    },
    upcoming_deadline: {
      title: "Memorial Submission",
      deadline: "2025-08-10T23:59:59",
    },
  });

  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get("view");
    if (view) {
      setActiveTab(view);
    }
  }, [location.search]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white flex">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <main className="flex-1 lg:ml-64">
        <div className="flex items-center justify-between p-4 border-b lg:hidden">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold">Moot Court Central</h1>
        </div>

        <div className="container mx-auto px-4 py-6">
          <TabsContent value="overview">
            <Overview overviewData={overviewData} />
          </TabsContent>

          <TabsContent value="marks">
            <Mark teamCode={overviewData?.team_details?.team_code} />
          </TabsContent>

          <TabsContent value="announcement">
            <AnnouncementFeed />
          </TabsContent>

          <TabsContent value="team">
            <Team/>
          </TabsContent>

          <TabsContent value="profile">
            <Profile/>
          </TabsContent>

          <TabsContent value="memorial">
            <Memorial/>
          </TabsContent>
          <TabsContent value="round">
            <Round/>
          </TabsContent>
        </div>
      </main>
    </Tabs>
  );
};

export default Dashboard;

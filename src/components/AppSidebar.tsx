import {
  Home, 
  BookOpen,
  Calendar,
  Users,
  FolderOpen,
  Settings,
  LogOut,
  GraduationCap,
  BrainCircuit,
  ClipboardList,
  BarChart,
  MessageCircle,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import NotificationBell from "./NotificationBell";

const studentMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Notes", url: "/dashboard/notes", icon: FolderOpen },
  { title: "Study Sessions", url: "/dashboard/sessions", icon: BookOpen },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
  { title: "Groups", url: "/dashboard/groups", icon: Users },
  {
    title: "Course Generator",
    url: "/dashboard/course-generator",
    icon: GraduationCap,
  },
  {
    title: "Learning Paths",
    url: "/dashboard/learning-paths",
    icon: GraduationCap,
  },
  { title: "Discussion Forums", url: "/dashboard/forums", icon: MessageCircle },
  {
    title: "Smart Interviews",
    url: "/dashboard/smart-interviews",
    icon: BrainCircuit,
  },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const tutorMenuItems = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "Study Sessions", url: "/dashboard/sessions", icon: BookOpen },
  { title: "Groups", url: "/dashboard/groups", icon: Users },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
  { title: "Assignments", url: "/dashboard/assignments", icon: ClipboardList },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart },
  { title: "Discussion Forums", url: "/dashboard/forums", icon: MessageCircle },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = user?.role === "tutor" ? tutorMenuItems : studentMenuItems;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display font-bold">Zenith Study</h2>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.name} • {user?.role}
            </p>
          </div>
          <NotificationBell />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {user?.role === "tutor" ? "Teaching Tools" : "Main Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

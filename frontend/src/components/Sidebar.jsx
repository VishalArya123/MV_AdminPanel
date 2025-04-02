import React from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen, 
  UserRoundCheck, 
  PlayCircle, 
  CalendarDays, 
  Newspaper, 
  MessageSquare, 
  MessageCircle, 
  Video, 
  Trophy,
  Users
} from "lucide-react";

const navigationItems = [
  { id: "user-management", icon: Users, label: "User Management", path: "/user-management" },
  { id: "manage-subscribers", icon: UserRoundCheck, label: "My Subscribers", path: "/manage-subscribers" },
  { id: "blogs", icon: BookOpen, label: "Blogs", path: "/blogs" },
  { id: "newsletters", icon: Newspaper, label: "NewsLetter", path: "/news" },
  { id: "certificates", icon: BookOpen, label: "Certificates", path: "/certificates" },
  { id: "events", icon: CalendarDays, label: "Events", path: "/events" },
  { id: "webinars", icon: Video, label: "Webinars", path: "/webinars" },
  // { id: "courses", icon: PlayCircle, label: "Courses", path: "/courses" },
  // { id: "rewards", icon: Trophy, label: "Rewards", path: "/rewards" },
  { id: "text-testimonials", icon: MessageSquare, label: "Text Testimonials", path: "/text-testimonials" },
  { id: "video-testimonials", icon: MessageCircle, label: "Video Testimonials", path: "/video-testimonials" }
];

const Sidebar = () => {
  return (
    <div className="w-52 bg-white shadow-lg fixed h-screen overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="text-emerald-500" />
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
      </div>
      <nav className="mt-4">
        {navigationItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? "bg-emerald-50 border-r-4 border-emerald-500 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
// Step 8: Update Sidebar.jsx with user information and logout button
import React from "react";
import { NavLink ,Link} from "react-router-dom";
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
  Users,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Sidebar = () => {
  const { userData, userPrivilege, canAccessRoute, handleLogout } = useAuth();

  const navigationItems = [
    {
      id: "user-management",
      icon: Users,
      label: "User Management",
      path: "/user-management",
      requiredPrivilege: "Admin",
    },
    {
      id: "manage-subscribers",
      icon: UserRoundCheck,
      label: "My Subscribers",
      path: "/manage-subscribers",
      requiredPrivilege: "Manager",
    },
    {
      id: "blogs",
      icon: BookOpen,
      label: "Blogs",
      path: "/blogs",
      requiredPrivilege: "Employee",
    },
    {
      id: "newsletters",
      icon: Newspaper,
      label: "NewsLetter",
      path: "/news",
      requiredPrivilege: "Employee",
    },
    {
      id: "certificates",
      icon: BookOpen,
      label: "Certificates",
      path: "/certificates",
      requiredPrivilege: "Employee",
    },
    {
      id: "events",
      icon: CalendarDays,
      label: "Events",
      path: "/events",
      requiredPrivilege: "Employee",
    },
    {
      id: "webinars",
      icon: Video,
      label: "Webinars",
      path: "/webinars",
      requiredPrivilege: "Employee",
    },
    {
      id: "text-testimonials",
      icon: MessageSquare,
      label: "Text Testimonials",
      path: "/text-testimonials",
      requiredPrivilege: "Employee",
    },
    {
      id: "video-testimonials",
      icon: MessageCircle,
      label: "Video Testimonials",
      path: "/video-testimonials",
      requiredPrivilege: "Employee",
    },
  ];

  // Filter navigation items based on user privilege
  const filteredNavItems = navigationItems.filter((item) =>
    canAccessRoute(item.path)
  );

  return (
    <div className="w-52 bg-white shadow-lg fixed h-screen flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="text-emerald-500" />
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
      </div>

      <nav className="mt-4 flex-grow overflow-y-auto">
        {filteredNavItems.map((item) => (
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

      {/* User info and logout section */}

      <div className="mt-auto border-t border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/profile">
            <User size={20} className="text-emerald-500" />
            <div className="text-sm">
              <p className="font-medium text-gray-700">
                {userData?.name || "User"}
              </p>
              <p className="text-xs text-gray-500">{userPrivilege}</p>
            </div>
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

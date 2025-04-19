// Step 7: Update App.jsx with authentication and protected routes
import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Blogs from "./components/Blogs";
import ManageSubscribers from "./components/ManageSubscribers";
import Certificates from "./components/Certificates";
import Events from "./components/Events";
import News from "./components/Newsletters";
import TextTestimonials from "./components/TextTestimonials";
import VideoTestimonials from "./components/VideoTestimonials";
import Webinars from "./components/Webinars";
import UserManagement from "./components/UserManagement";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import Profile from "./components/Profile";
import Courses from "./components/Courses";
const App = () => {
  const { isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <div className="ml-52 w-full p-6">
                    <Routes>
                      <Route path="/" element={<Navigate to="/profile" replace />} />
                      <Route path="/blogs" element={<Blogs />} />
                      <Route path="/manage-subscribers" element={<ManageSubscribers />} />
                      <Route path="/user-management" element={<UserManagement />} />
                      <Route path="/certificates" element={<Certificates />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/news" element={<News />} />
                      <Route path="/text-testimonials" element={<TextTestimonials />} />
                      <Route path="/video-testimonials" element={<VideoTestimonials />} />
                      <Route path="/webinars" element={<Webinars />} />
                      <Route path="/courses" element={<Courses />} />
                      <Route path="/profile" element={<Profile />} />
                    </Routes>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
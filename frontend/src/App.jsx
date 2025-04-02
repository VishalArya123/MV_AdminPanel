import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Blogs from "./components/Blogs";
import ManageSubscribers from "./components/ManageSubscribers";
import Certificates from "./components/Certificates";
import Courses from "./components/Courses";
import Events from "./components/Events";
import News from "./components/Newsletters";
import TextTestimonials from "./components/TextTestimonials";
import VideoTestimonials from "./components/VideoTestimonials";
import Webinars from "./components/Webinars";
import Rewards from "./components/Rewards";
import UserManagement from "./components/UserManagement";

const App = () => {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="ml-52 w-full p-6">
          <Routes>
            <Route path="/" element={<Blogs />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/manage-subscribers" element={<ManageSubscribers />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/events" element={<Events />} />
            <Route path="/news" element={<News />} />
            <Route path="/text-testimonials" element={<TextTestimonials />} />
            <Route path="/video-testimonials" element={<VideoTestimonials />} />
            <Route path="/webinars" element={<Webinars />} />
            <Route path="/rewards" element={<Rewards />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
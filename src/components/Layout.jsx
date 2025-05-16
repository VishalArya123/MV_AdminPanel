// Layout.jsx
import React from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-52 p-6 flex-1">{children}</main>
    </div>
  );
};

export default Layout;
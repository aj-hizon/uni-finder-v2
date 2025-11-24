// src/components/Sidebar.jsx

import React from "react";
import { FiHome, FiBookOpen, FiUsers, FiSettings } from "react-icons/fi";
import { GraduationCap } from "lucide-react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const navItems = [
    { name: "Dashboard", icon: FiHome, path: "/dashboard" },
    { name: "Universities", icon: GraduationCap, path: "/admin/universities" },
    { name: "Users", icon: FiUsers, path: "/admin/users" },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col justify-between">
      {/* Top Section */}
      <div>
        {/* App Title/Logo */}
        <div className="p-4 text-xl font-bold flex items-center space-x-4 bg-blue-500/20">
          <GraduationCap className="h-6 w-6" />
          <div>UniAdmin</div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex flex-col">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center p-4 transition-colors ${
                  isActive
                    ? "bg-blue-500/20 text-white font-semibold"
                    : "text-white hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom User Section */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold text-white">
            AD
          </div>
          <div>
            <div className="text-sm font-medium">Admin User</div>
            <div className="text-xs text-gray-400">admin@uni.edu</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

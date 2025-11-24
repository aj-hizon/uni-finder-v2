// src/components/StatCard.jsx

import React from "react";
import { FiBookOpen, FiUsers, FiBriefcase, FiClipboard } from "react-icons/fi";

// Function to map the placeholder icon string to an actual icon component
const getIconComponent = (icon) => {
  switch (icon) {
    case "🏢":
      return FiBriefcase;
    case "📖":
      return FiBookOpen;
    case "👤":
      return FiUsers;
    case "✅":
      return FiClipboard;
    default:
      return FiClipboard;
  }
};

const StatCard = ({ title, value, change, subtitle, icon, iconBg }) => {
  const IconComponent = getIconComponent(icon);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-gray-500 font-medium text-sm font-poppins">{title}</h3>
        <div className={`p-2 rounded-full ${iconBg}`}>
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {change && (
        <p className="text-sm text-green-600 font-semibold">{change}</p>
      )}
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

export default StatCard;

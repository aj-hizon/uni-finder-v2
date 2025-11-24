// src/components/ActivityItem.jsx

import React from "react";

const ActivityItem = ({ event, details, time, user }) => {
  return (
    <div className="flex items-start space-x-4">
      <div className="w-2 h-2 mt-2 rounded-full bg-green-500 flex-shrink-0"></div>
      <div className="flex-1">
        <p className="text-gray-800 font-medium leading-tight">**{event}**</p>
        <p className="text-sm text-gray-600 leading-tight">{details}</p>
        <p className="text-xs text-gray-400 mt-1">
          {time} · **{user}**
        </p>
      </div>
    </div>
  );
};

export default ActivityItem;

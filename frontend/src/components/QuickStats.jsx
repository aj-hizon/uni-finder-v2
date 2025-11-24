// src/components/QuickStats.jsx

import React from "react";

const QuickStats = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4 font-poppins">Quick Stats</h2>
      <div className="space-y-4">
        {/* Avg Programs per University */}
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <p className="text-gray-600">Avg Programs per University</p>
          <p className="text-xl font-bold text-gray-900">3.25</p>
        </div>

        {/* Active User Sessions */}
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <p className="text-gray-600">Active User Sessions</p>
          <p className="text-xl font-bold text-gray-900">47</p>
        </div>

        {/* Last Sync Time */}
        <div className="flex justify-between items-center pt-2">
          <p className="text-gray-600">Last Sync Time</p>
          <p className="text-md font-medium text-gray-700">2 mins ago</p>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;

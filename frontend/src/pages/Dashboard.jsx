import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import QuickStats from "../components/QuickStats";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUniversities: 0,
    totalPrograms: 0,
    totalUsers: 0,
    systemHealth: 100,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const rawToken = localStorage.getItem("adminToken");
        const token = rawToken?.replace(/^"|"$/g, "").trim();

        const [programVectorsRes, usersRes, activitiesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/admin/program_vectors`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/admin/activities`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 10 },
          }),
        ]);

        const schools = programVectorsRes.data.map((p) => p.school?.trim());
        const uniqueSchools = new Set(schools.filter(Boolean));

        setStats({
          totalUniversities: uniqueSchools.size,
          totalPrograms: programVectorsRes.data.length,
          totalUsers: usersRes.data.length,
          systemHealth: 99.8,
        });

        setRecentActivities(
          Array.isArray(activitiesRes.data)
            ? activitiesRes.data.sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
              )
            : []
        );
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-400"></div>
        </div>
      )}

      <Sidebar />
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Universities"
            value={stats.totalUniversities}
            change=""
            icon="🏢"
            iconBg="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Total Programs"
            value={stats.totalPrograms}
            change=""
            icon="📖"
            iconBg="bg-green-100 text-green-600"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            change=""
            icon="👤"
            iconBg="bg-purple-100 text-purple-600"
          />
          <StatCard
            title="System Health"
            value={`${stats.systemHealth}%`}
            subtitle="All systems operational"
            icon="✅"
            iconBg="bg-red-100 text-red-600"
          />
        </div>

        {/* Recent Activity & Quick Stats */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 font-poppins">
              Recent Activity
            </h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, idx) => {
                  let bgColor = "bg-gray-100";
                  if (activity.event.toLowerCase().includes("login"))
                    bgColor = "bg-green-100";
                  else if (activity.event.toLowerCase().includes("logout"))
                    bgColor = "bg-yellow-100";
                  else if (activity.event.toLowerCase().includes("delete"))
                    bgColor = "bg-red-100";
                  else if (activity.event.toLowerCase().includes("search"))
                    bgColor = "bg-blue-100";

                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-md shadow-sm flex justify-between items-start text-sm ${bgColor}`}
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {activity.event}
                        </p>
                        <p className="text-gray-600">{activity.details}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {activity.user ? `User: ${activity.user}` : "System"}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 ml-3">
                        {new Date(activity.timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">No recent activity</p>
              )}
            </div>
          </div>

          <div className="w-full lg:w-80 bg-white p-6 rounded-lg shadow-md">
            <QuickStats />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

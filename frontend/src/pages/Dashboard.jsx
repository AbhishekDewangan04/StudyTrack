import { useState, useEffect, useCallback, useMemo } from 'react';
import { taskAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatsCards from '../components/StatsCards';
import TaskFilters from '../components/TaskFilters';
import TaskCard from '../components/TaskCard';
import TaskTableView from '../components/TaskTableView';
import TaskModal from '../components/TaskModal';
import CalendarView from '../components/CalendarView';
import AnalyticsView from '../components/AnalyticsView';
import NotificationsView from '../components/NotificationsView';
import ProfileView from '../components/ProfileView';
import SettingsView from '../components/SettingsView';
import LocationsView from '../components/LocationsView';
import FocusView from '../components/FocusView';
import ProModal from '../components/ProModal';
import AiBotView from '../components/AiBotView';

import WeeklyActivity from '../components/dashboard/WeeklyProgressChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import UpcomingTasks from '../components/dashboard/UpcomingTasks';
import StudyLocationsCard from '../components/dashboard/StudyLocationsCard';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';

import { BookOpen, AlertCircle, Plus, LayoutGrid, List } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'tasks', 'calendar', 'analytics', 'locations', 'focus', 'notifications', 'profile', 'settings'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('studytrack_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('studytrack_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' default matching reference image
  const [sortBy, setSortBy] = useState('deadline');

  // Task Data & API State
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [hasViewedNotifications, setHasViewedNotifications] = useState(false);

  // Filters & Search State
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDeadline, setFilterDeadline] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterRecurrence, setFilterRecurrence] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedTask, setSelectedTask] = useState(null);

  const { socket } = useSocket();

  // Helper to recompute stats dynamically
  const computeStats = (taskList) => {
    const now = new Date();
    const totalTasks = taskList.length;
    const completedTasks = taskList.filter((t) => t.status === 'Completed').length;
    const pendingTasks = taskList.filter((t) => t.status === 'Pending').length;
    const overdueTasks = taskList.filter(
      (t) => t.status === 'Pending' && new Date(t.deadline) < now
    ).length;

    return { totalTasks, completedTasks, pendingTasks, overdueTasks };
  };

  // Fetch tasks and statistics from backend API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterStatus !== 'All') params.status = filterStatus;
      if (filterSubject.trim()) params.subject = filterSubject.trim();
      if (filterDeadline !== 'all') params.deadline = filterDeadline;
      if (filterLocation !== 'all') params.location = filterLocation;
      if (filterRecurrence !== 'all') params.recurrence = filterRecurrence;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [tasksData, statsData] = await Promise.all([
        taskAPI.getTasks(params),
        taskAPI.getStats(),
      ]);

      setTasks(tasksData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSubject, filterDeadline, filterLocation, filterRecurrence, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-Time Socket.IO Event Listener Setup
  useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      setTasks((prevTasks) => {
        const exists = prevTasks.some((t) => t._id === newTask._id);
        const updatedList = exists
          ? prevTasks.map((t) => (t._id === newTask._id ? newTask : t))
          : [newTask, ...prevTasks];
        setStats(computeStats(updatedList));
        return updatedList;
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prevTasks) => {
        const updatedList = prevTasks.map((t) =>
          t._id === updatedTask._id ? updatedTask : t
        );
        setStats(computeStats(updatedList));
        return updatedList;
      });
    };

    const handleTaskDeleted = ({ id }) => {
      setTasks((prevTasks) => {
        const updatedList = prevTasks.filter((t) => t._id !== id);
        setStats(computeStats(updatedList));
        return updatedList;
      });
    };

    const handleNewNotification = (notif) => {
      setLiveNotifications((prev) => [notif, ...prev.slice(0, 19)]);
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  // Filtered tasks computation
  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (task) =>
          task.title?.toLowerCase().includes(query) ||
          task.subject?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.locationName?.toLowerCase().includes(query) ||
          task.locationAddress?.toLowerCase().includes(query)
      );
    }

    if (filterStatus === 'Pending') {
      list = list.filter((t) => t.status === 'Pending');
    } else if (filterStatus === 'Completed') {
      list = list.filter((t) => t.status === 'Completed');
    } else if (filterStatus === 'Overdue') {
      const now = new Date();
      list = list.filter((t) => t.status === 'Pending' && new Date(t.deadline) < now);
    }

    if (filterLocation === 'withLocation') {
      list = list.filter((t) => t.locationName || t.locationAddress || t.locationLatitude !== null);
    } else if (filterLocation === 'withoutLocation') {
      list = list.filter((t) => !t.locationName && !t.locationAddress && t.locationLatitude === null);
    }

    if (filterRecurrence === 'recurring') {
      list = list.filter((t) => t.isRecurring);
    } else if (filterRecurrence === 'oneTime') {
      list = list.filter((t) => !t.isRecurring);
    }

    if (sortBy === 'created') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    }

    return list;
  }, [tasks, searchQuery, filterStatus, filterLocation, filterRecurrence, sortBy]);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => t.status === 'Pending' && new Date(t.deadline) < now);
  }, [tasks]);

  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'Pending');
  }, [tasks]);

  const unreadNotifCount = useMemo(() => {
    if (hasViewedNotifications) return 0;
    return overdueTasks.length + liveNotifications.length;
  }, [hasViewedNotifications, overdueTasks.length, liveNotifications.length]);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'notifications') {
      setHasViewedNotifications(true);
    }
  };

  // Task Operations
  const handleCreate = async (formData) => {
    await taskAPI.createTask(formData);
  };

  const handleUpdate = async (formData) => {
    if (!selectedTask) return;
    await taskAPI.updateTask(selectedTask._id, formData);
  };

  const handleToggleStatus = async (task) => {
    try {
      const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await taskAPI.updateTask(task._id, { status: nextStatus });
    } catch (err) {
      console.error('Error toggling task status:', err);
      alert('Failed to update task status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await taskAPI.deleteTask(id);
      } catch (err) {
        console.error('Error deleting task:', err);
        alert('Failed to delete assignment');
      }
    }
  };

  // Modal Triggers
  const openCreateModal = () => {
    setSelectedTask(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openViewModal = (task) => {
    setSelectedTask(task);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    if (modalMode === 'create') {
      await handleCreate(formData);
    } else if (modalMode === 'edit') {
      await handleUpdate(formData);
    }
  };

  const resetFilters = () => {
    setFilterStatus('All');
    setFilterSubject('');
    setFilterDeadline('all');
    setFilterLocation('all');
    setFilterRecurrence('all');
    setSearchQuery('');
    setSortBy('deadline');
  };

  // Formatted date string matching reference image (e.g. "Friday, Oct 3, 2026")
  const formattedHeaderDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#111827] flex font-sans transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        overdueCount={overdueTasks.length}
        pendingCount={pendingTasks.length}
        unreadNotifCount={unreadNotifCount}
        onOpenProModal={() => setIsProModalOpen(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'md:pl-[76px]' : 'md:pl-[270px]'
        } min-w-0`}
      >
        {/* Top Navigation Bar */}
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenCreateModal={openCreateModal}
          onRefresh={fetchData}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          overdueTasks={overdueTasks}
          pendingTasks={pendingTasks}
          liveNotifications={liveNotifications}
          unreadNotifCount={unreadNotifCount}
          onViewNotifications={() => setHasViewedNotifications(true)}
          setActiveTab={handleSelectTab}
        />

        {/* Main Body Content */}
        <main className="flex-1 px-4 sm:px-8 py-6 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Error Alert Banner */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchData}
                className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW (DASHBOARD) - Reference Top-Left Card */}
          {(activeTab === 'overview' || activeTab === 'dashboard') && (
            <div className="space-y-6">
              {/* Dashboard Greeting Header Matching Reference */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Good morning, {user?.name?.split(' ')[0] || 'Abhishek'} 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    Let's make today productive!
                  </p>
                </div>

                <div className="text-right space-y-0.5 hidden sm:block">
                  <p className="text-xs font-bold text-slate-400">
                    {formattedHeaderDate}
                  </p>
                  <p className="text-xs italic text-slate-600 font-medium">
                    "Discipline today leads to freedom tomorrow."
                  </p>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <StatsCards stats={stats} loading={loading} />

              {/* Middle Row: Weekly Progress (Left ~65%) & Recent Activity (Right ~35%) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <WeeklyActivity tasks={tasks} />
                </div>
                <div>
                  <RecentActivity
                    liveNotifications={liveNotifications}
                    tasks={tasks}
                    onSelectTab={setActiveTab}
                  />
                </div>
              </div>

              {/* Bottom Row: Upcoming Deadlines (Left 50%) & Study Locations (Right 50%) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UpcomingTasks
                  tasks={tasks}
                  onViewTask={openViewModal}
                  onSelectTab={setActiveTab}
                />
                <StudyLocationsCard
                  tasks={tasks}
                  onSelectTab={setActiveTab}
                />
              </div>
            </div>
          )}

          {/* TAB 2: MY TASKS - Reference Top-Right Card */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {/* My Tasks Page Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    My Tasks
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    Manage all your assignments and stay on track.
                  </p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  {/* View Mode Toggle (Table / Grid) */}
                  <div className="bg-slate-200/60 p-1 rounded-xl flex items-center space-x-1 text-xs">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500'
                      }`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500'
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>

                  {/* + Add Task Primary Button */}
                  <button
                    onClick={openCreateModal}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 bg-[#4F46E5] hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>

              {/* Filter Toolbar */}
              <TaskFilters
                filterStatus={filterStatus}
                onStatusChange={setFilterStatus}
                filterSubject={filterSubject}
                onSubjectChange={setFilterSubject}
                filterDeadline={filterDeadline}
                onDeadlineChange={setFilterDeadline}
                filterLocation={filterLocation}
                onLocationChange={setFilterLocation}
                filterRecurrence={filterRecurrence}
                onRecurrenceChange={setFilterRecurrence}
                onResetFilters={resetFilters}
              />

              {/* Task Table / Grid / Empty State */}
              {loading && tasks.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : filteredTasks.length > 0 ? (
                viewMode === 'table' ? (
                  <TaskTableView
                    tasks={filteredTasks}
                    onToggleStatus={handleToggleStatus}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onView={openViewModal}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onToggleStatus={handleToggleStatus}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        onView={openViewModal}
                      />
                    ))}
                  </div>
                )
              ) : (
                <EmptyState
                  title="No tasks match your criteria"
                  description="Try clearing your search query or subject filters."
                  actionLabel="Reset Filters"
                  onAction={resetFilters}
                />
              )}
            </div>
          )}

          {/* TAB 3: CALENDAR - Reference Bottom-Right Top Card */}
          {activeTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              onViewTask={openViewModal}
              onOpenCreateModal={openCreateModal}
              onOpenProModal={() => setIsProModalOpen(true)}
            />
          )}

          {/* TAB 4: ANALYTICS - Reference Bottom-Left Card */}
          {activeTab === 'analytics' && <AnalyticsView />}

          {/* TAB 5: LOCATIONS */}
          {activeTab === 'locations' && (
            <LocationsView
              tasks={tasks}
              onOpenCreateModal={openCreateModal}
              onOpenProModal={() => setIsProModalOpen(true)}
            />
          )}

          {/* TAB 6: FOCUS */}
          {activeTab === 'focus' && <FocusView />}

          {/* TAB 7: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <NotificationsView
              tasks={tasks}
              onViewTask={openViewModal}
              onToggleStatus={handleToggleStatus}
            />
          )}

          {/* TAB 8: AI BOT */}
          {activeTab === 'ai-bot' && (
            <AiBotView
              tasks={tasks}
              onOpenProModal={() => setIsProModalOpen(true)}
            />
          )}

          {/* TAB 9: PROFILE & SETTINGS */}
          {activeTab === 'profile' && <ProfileView stats={stats} />}

          {/* TAB 10: SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsView viewMode={viewMode} onViewModeChange={setViewMode} />
          )}
        </main>
      </div>

      {/* Task Modal (Add / Edit / View) */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        initialData={selectedTask}
        onSubmit={handleModalSubmit}
        existingTasks={tasks}
        onOpenProModal={() => setIsProModalOpen(true)}
      />

      {/* Upgrade to PRO Modal - Reference Bottom-Right Bottom-Left Card */}
      <ProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;

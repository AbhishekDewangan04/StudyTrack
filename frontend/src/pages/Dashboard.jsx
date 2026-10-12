import { useState, useEffect, useCallback, useMemo } from 'react';
import { taskAPI } from '../services/api';
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

import DashboardHero from '../components/dashboard/DashboardHero';
import SubjectDistribution from '../components/dashboard/SubjectDistribution';
import WeeklyActivity from '../components/dashboard/WeeklyProgressChart';
import UpcomingTasks from '../components/dashboard/UpcomingTasks';
import QuickActions from '../components/dashboard/QuickActions';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';

import { BookOpen, AlertCircle, Plus, LayoutGrid, List, CheckCircle2, Clock } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState('overview');
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
  const [viewMode, setViewMode] = useState('table');
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
  const [modalMode, setModalMode] = useState('create');
  const [selectedTask, setSelectedTask] = useState(null);

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

  // Periodic lightweight background sync (every 45s) and refetch on tab focus
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 45000);

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData]);

  // Filtered tasks computation
  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (task) =>
          task.title?.toLowerCase().includes(query) ||
          task.subject?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
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

    if (sortBy === 'created') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    }

    return list;
  }, [tasks, searchQuery, filterStatus, sortBy]);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => t.status === 'Pending' && new Date(t.deadline) < now);
  }, [tasks]);

  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'Pending');
  }, [tasks]);

  const todaysFocusTasks = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((t) => t.status === 'Pending')
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 3);
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
    try {
      const newTask = await taskAPI.createTask(formData);
      setTasks((prev) => {
        const next = [newTask, ...prev.filter((t) => t._id !== newTask._id)];
        setStats(computeStats(next));
        return next;
      });
      setLiveNotifications((prev) => [
        {
          id: `${newTask._id}-created-${Date.now()}`,
          type: 'created',
          title: 'Assignment Created',
          message: `"${newTask.title}" (${newTask.subject}) was added to your planner.`,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 19),
      ]);
      fetchData();
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  };

  const handleUpdate = async (formData) => {
    if (!selectedTask) return;
    try {
      const updated = await taskAPI.updateTask(selectedTask._id, formData);
      setTasks((prev) => {
        const next = prev.map((t) => (t._id === updated._id ? updated : t));
        setStats(computeStats(next));
        return next;
      });
      setLiveNotifications((prev) => [
        {
          id: `${updated._id}-updated-${Date.now()}`,
          type: 'updated',
          title: updated.status === 'Completed' ? 'Assignment Completed 🎉' : 'Assignment Updated',
          message: `"${updated.title}" status is now ${updated.status}.`,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 19),
      ]);
      fetchData();
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const handleToggleStatus = async (task) => {
    try {
      const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      const updated = await taskAPI.updateTask(task._id, { status: nextStatus });
      setTasks((prev) => {
        const next = prev.map((t) => (t._id === updated._id ? updated : t));
        setStats(computeStats(next));
        return next;
      });
      setLiveNotifications((prev) => [
        {
          id: `${updated._id}-toggle-${Date.now()}`,
          type: 'updated',
          title: updated.status === 'Completed' ? 'Assignment Completed 🎉' : 'Assignment Reopened',
          message: `"${updated.title}" status changed to ${updated.status}.`,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 19),
      ]);
      fetchData();
    } catch (err) {
      console.error('Error toggling task status:', err);
      alert('Failed to update task status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        const deleted = tasks.find((t) => t._id === id);
        await taskAPI.deleteTask(id);
        setTasks((prev) => {
          const next = prev.filter((t) => t._id !== id);
          setStats(computeStats(next));
          return next;
        });
        if (deleted) {
          setLiveNotifications((prev) => [
            {
              id: `${id}-deleted-${Date.now()}`,
              type: 'deleted',
              title: 'Assignment Removed',
              message: `"${deleted.title}" was removed from your planner.`,
              timestamp: new Date().toISOString(),
            },
            ...prev.slice(0, 19),
          ]);
        }
        fetchData();
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

  return (
    <div className="min-h-screen bg-[#090B12] text-slate-100 flex font-sans transition-colors selection:bg-[#9B6BFF]/30">
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
          isSidebarCollapsed ? 'md:pl-[76px]' : 'md:pl-[260px]'
        } min-w-0`}
      >
        {/* Top Navigation Bar */}
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeTab={activeTab}
        />

        {/* Main Body Content */}
        <main className="flex-1 px-4 sm:px-8 py-6 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Error Alert Banner */}
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchData}
                className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW (DASHBOARD) - Reference Section 4 */}
          {(activeTab === 'overview' || activeTab === 'dashboard') && (
            <div className="space-y-6">
              {/* 3D Hero Section */}
              <DashboardHero
                onCreateTask={openCreateModal}
                onViewTasks={() => setActiveTab('tasks')}
              />

              {/* 4 Task Metric Cards */}
              <StatsCards stats={stats} loading={loading} />

              {/* Main Grid: Today's Focus & Upcoming Deadlines (Left) + Subject Donut & Weekly Progress (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (6 cols): Today's Focus & Upcoming Deadlines */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Today's Focus Card */}
                  <div className="bg-[#191B2B] border border-[#191B2B] p-5 rounded-2xl shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white tracking-tight font-display flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#FFBF69]" />
                        <span>Today's Focus</span>
                      </h3>
                      <span className="text-[11px] font-bold text-[#FFBF69] bg-[#FFBF69]/10 px-2 py-0.5 rounded-full border border-[#FFBF69]/20">
                        {todaysFocusTasks.length} Active
                      </span>
                    </div>

                    <div className="space-y-2">
                      {todaysFocusTasks.length > 0 ? (
                        todaysFocusTasks.map((t) => (
                          <div
                            key={t._id}
                            onClick={() => openViewModal(t)}
                            className="p-3 rounded-xl bg-[#111522] border border-[#111522] hover:border-[#9B6BFF]/30 transition flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#9B6BFF] shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-bold text-white truncate">{t.title}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate">{t.subject || 'General'}</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleStatus(t); }}
                              className="text-[10px] font-bold text-[#C4A7FF] bg-[#9B6BFF]/15 hover:bg-[#9B6BFF]/30 px-2.5 py-1 rounded-lg transition"
                            >
                              Complete
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic py-4 text-center">No urgent tasks for today! Great job.</p>
                      )}
                    </div>
                  </div>

                  {/* Upcoming Deadlines */}
                  <UpcomingTasks
                    tasks={tasks}
                    onViewTask={openViewModal}
                    onSelectTab={setActiveTab}
                  />
                </div>

                {/* Right Column (6 cols): Subject Distribution & Weekly Progress */}
                <div className="lg:col-span-6 space-y-6">
                  <SubjectDistribution tasks={tasks} />
                  <WeeklyActivity tasks={tasks} />
                </div>
              </div>

              {/* Quick Actions Strip */}
              <QuickActions
                onCreateTask={openCreateModal}
                onSelectTab={setActiveTab}
              />
            </div>
          )}

          {/* TAB 2: MY TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                    Tasks & Assignments
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                    Manage your coursework and track deadlines
                  </p>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className="bg-[#111522] p-1 rounded-xl flex items-center space-x-1 text-xs border border-[#191B2B]">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        viewMode === 'table' ? 'bg-[#9B6BFF] text-white font-bold' : 'text-slate-400'
                      }`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        viewMode === 'grid' ? 'bg-[#9B6BFF] text-white font-bold' : 'text-slate-400'
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={openCreateModal}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 gradient-btn-purple font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Task</span>
                  </button>
                </div>
              </div>

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

          {/* TAB 3: CALENDAR */}
          {activeTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              onViewTask={openViewModal}
              onOpenCreateModal={openCreateModal}
              onOpenProModal={() => setIsProModalOpen(true)}
            />
          )}

          {/* TAB 4: ANALYTICS */}
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

          {/* TAB 9: PROFILE */}
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

      {/* Upgrade to PRO Modal */}
      <ProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;

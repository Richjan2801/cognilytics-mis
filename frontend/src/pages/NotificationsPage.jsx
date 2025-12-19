import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import showToast from '../utils/toast';
import EmptyState from '../components/ui/EmptyState';
import { 
  Bell, BellRing, CheckCircle, AlertCircle, Info, 
  TrendingUp, Users, BookOpen, Settings, Trash2, 
  Check, Filter, X
} from 'lucide-react';

function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, alerts, updates, system
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    // Generate role-specific notifications
    const generateNotifications = () => {
      const baseNotifications = [];
      const now = new Date();

      if (user.role === 'Student') {
        baseNotifications.push(
          {
            id: 1,
            type: 'alert',
            title: 'High Cognitive Load Detected',
            message: 'Your cognitive load in "Advanced Mathematics" session reached 8.5. Consider taking a break.',
            timestamp: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
            isRead: false,
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-100'
          },
          {
            id: 2,
            type: 'update',
            title: 'New Achievement Unlocked',
            message: 'Congratulations! You earned the "Consistent Learner" badge for 10 consecutive days of study.',
            timestamp: new Date(now - 5 * 60 * 60 * 1000), // 5 hours ago
            isRead: false,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
          },
          {
            id: 3,
            type: 'update',
            title: 'Session Summary Available',
            message: 'Your performance summary for "Physics Lab" session is now available.',
            timestamp: new Date(now - 24 * 60 * 60 * 1000), // 1 day ago
            isRead: true,
            icon: Info,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
          },
          {
            id: 4,
            type: 'alert',
            title: 'Upcoming Session Reminder',
            message: 'You have "Chemistry 101" session starting in 30 minutes.',
            timestamp: new Date(now - 30 * 60 * 1000), // 30 mins ago
            isRead: false,
            icon: Bell,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100'
          },
          {
            id: 5,
            type: 'update',
            title: 'Progress Report Generated',
            message: 'Your weekly progress report is ready. Check your dashboard for details.',
            timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            isRead: true,
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
          }
        );
      } else if (user.role === 'Teacher') {
        baseNotifications.push(
          {
            id: 1,
            type: 'alert',
            title: 'Student Overload Alert',
            message: '3 students in "Advanced Mathematics" are showing high cognitive load (CL > 8.0).',
            timestamp: new Date(now - 1 * 60 * 60 * 1000), // 1 hour ago
            isRead: false,
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-100'
          },
          {
            id: 2,
            type: 'update',
            title: 'Daily Summary Available',
            message: 'Your daily teaching summary for December 19, 2025 is ready.',
            timestamp: new Date(now - 3 * 60 * 60 * 1000), // 3 hours ago
            isRead: false,
            icon: Info,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
          },
          {
            id: 3,
            type: 'system',
            title: 'New Recommendation Generated',
            message: 'AI has generated 2 new recommendations based on recent student performance.',
            timestamp: new Date(now - 6 * 60 * 60 * 1000), // 6 hours ago
            isRead: true,
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
          },
          {
            id: 4,
            type: 'alert',
            title: 'Session Starting Soon',
            message: 'Your "Physics Lab" session with 18 students starts in 15 minutes.',
            timestamp: new Date(now - 45 * 60 * 1000), // 45 mins ago
            isRead: false,
            icon: Bell,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100'
          },
          {
            id: 5,
            type: 'update',
            title: 'Weekly Report Ready',
            message: 'Your weekly performance report (Dec 12-18) is now available.',
            timestamp: new Date(now - 24 * 60 * 60 * 1000), // 1 day ago
            isRead: true,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
          },
          {
            id: 6,
            type: 'update',
            title: 'Student Progress Update',
            message: '5 students have completed their assignments in "Chemistry 101".',
            timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            isRead: true,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
          }
        );
      } else if (user.role === 'Admin') {
        baseNotifications.push(
          {
            id: 1,
            type: 'system',
            title: 'System Maintenance Scheduled',
            message: 'Scheduled maintenance window: December 20, 2025, 2:00 AM - 4:00 AM.',
            timestamp: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
            isRead: false,
            icon: Settings,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
          },
          {
            id: 2,
            type: 'alert',
            title: 'High Server Load Detected',
            message: 'Server CPU usage reached 85%. Consider scaling resources.',
            timestamp: new Date(now - 4 * 60 * 60 * 1000), // 4 hours ago
            isRead: false,
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-100'
          },
          {
            id: 3,
            type: 'update',
            title: 'New User Registrations',
            message: '12 new users registered today (8 students, 3 teachers, 1 admin).',
            timestamp: new Date(now - 5 * 60 * 60 * 1000), // 5 hours ago
            isRead: true,
            icon: Users,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
          },
          {
            id: 4,
            type: 'system',
            title: 'Database Backup Completed',
            message: 'Daily database backup completed successfully. Size: 2.4 GB.',
            timestamp: new Date(now - 12 * 60 * 60 * 1000), // 12 hours ago
            isRead: true,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
          },
          {
            id: 5,
            type: 'update',
            title: 'Weekly Analytics Report',
            message: 'Weekly system analytics report (Dec 12-18) is ready for review.',
            timestamp: new Date(now - 24 * 60 * 60 * 1000), // 1 day ago
            isRead: true,
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
          },
          {
            id: 6,
            type: 'alert',
            title: 'Storage Capacity Warning',
            message: 'Storage usage at 78%. Consider expanding storage capacity.',
            timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            isRead: true,
            icon: AlertCircle,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100'
          }
        );
      }

      return baseNotifications;
    };

    setNotifications(generateNotifications());
  }, [user]);

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    if (unreadCount > 0) {
      showToast.success(`${unreadCount} notification${unreadCount > 1 ? 's' : ''} marked as read`);
    }
  };

  const handleDelete = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    showToast.info('Notification deleted');
  };

  const handleClearAll = () => {
    const count = notifications.length;
    setNotifications([]);
    setShowClearModal(false);
    showToast.success(`All ${count} notifications cleared`);
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BellRing className="w-8 h-8 mr-3 text-indigo-600" />
                Notifications
              </h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? (
                  <span>You have <span className="font-semibold text-indigo-600">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}</span>
                ) : (
                  <span>All caught up! No new notifications</span>
                )}
              </p>
            </div>
            {notifications.length > 0 && (
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={() => setShowClearModal(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('alerts')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'alerts'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Alerts ({notifications.filter(n => n.type === 'alert').length})
            </button>
            <button
              onClick={() => setFilter('updates')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'updates'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Updates ({notifications.filter(n => n.type === 'update').length})
            </button>
            <button
              onClick={() => setFilter('system')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'system'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              System ({notifications.filter(n => n.type === 'system').length})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8">
            <EmptyState
              variant="no-notifications"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow ${
                    !notification.isRead ? 'border-l-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-full ${notification.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${notification.color}`} />
                      </div>

                      {/* Content */}
                      <div className="ml-4 flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              {!notification.isRead && (
                                <span className="ml-2 w-2 h-2 bg-indigo-600 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Clear All Modal */}
        {showClearModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Clear All Notifications?</h3>
              </div>
              <p className="text-gray-600 mb-6">
                This will permanently delete all notifications. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;

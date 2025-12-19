import { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Brain, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Award,
  Clock,
  UserCheck,
  Target
} from 'lucide-react';
import { SkeletonDashboardGrid } from '../components/ui/Skeleton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/**
 * Admin Dashboard
 * 
 * System-wide analytics and monitoring dashboard for administrators
 * Shows aggregated data across all teachers, students, and classes
 */

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with mock data
    const fetchAdminData = () => {
      setLoading(true);
      
      setTimeout(() => {
        const mockData = {
        systemStats: {
          totalUsers: 46, // 1 teacher + 45 students
          totalTeachers: 1,
          totalStudents: 45,
          activeSessionsToday: 28,
          systemAvgCL: 52.4,
          criticalAlerts: 3,
          avgPerformance: 7.8
        },
        clTrend: [
          { date: 'Dec 13', cl: 51.2, sessions: 42 },
          { date: 'Dec 14', cl: 53.5, sessions: 38 },
          { date: 'Dec 15', cl: 54.8, sessions: 45 },
          { date: 'Dec 16', cl: 52.1, sessions: 40 },
          { date: 'Dec 17', cl: 55.3, sessions: 35 },
          { date: 'Dec 18', cl: 51.8, sessions: 43 },
          { date: 'Dec 19', cl: 52.4, sessions: 28 },
        ],
        clByTeacher: [
          { teacher: 'John Doe', avgCL: 52.4, students: 45, classes: 4, status: 'active' }
        ],
        clBySubject: [
          { subject: 'Aljabar Linear', avgCL: 61.0, sessions: 78, students: 42 },
          { subject: 'Kalkulus Integral', avgCL: 54.5, sessions: 65, students: 38 },
          { subject: 'Geometri Analitik', avgCL: 58.2, sessions: 58, students: 35 },
          { subject: 'Statistika Dasar', avgCL: 42.8, sessions: 82, students: 45 },
        ],
        teacherPerformance: [
          {
            id: 1,
            name: 'John Doe',
            email: 'teacher@cognilytics.com',
            students: 45,
            activeClasses: 4,
            avgCL: 52.4,
            highLoadStudents: 8,
            performance: 7.8,
            status: 'active',
            lastActive: '2024-12-19 10:30'
          }
        ],
        systemAlerts: [
          {
            id: 1,
            type: 'critical',
            title: 'High Cognitive Load Detected',
            message: '8 students experiencing cognitive overload in Aljabar Linear',
            teacher: 'John Doe',
            subject: 'Aljabar Linear',
            affectedStudents: 8,
            timestamp: '2024-12-19 10:15',
            status: 'unresolved'
          },
          {
            id: 2,
            type: 'warning',
            title: 'Elevated CL Levels',
            message: 'Class average CL has increased by 5% in the last 3 days',
            teacher: 'John Doe',
            subject: 'Kalkulus Integral',
            affectedStudents: 12,
            timestamp: '2024-12-19 09:45',
            status: 'unresolved'
          },
          {
            id: 3,
            type: 'info',
            title: 'Session Activity Low',
            message: 'Only 28 sessions today, below average of 40',
            teacher: null,
            subject: null,
            affectedStudents: null,
            timestamp: '2024-12-19 08:30',
            status: 'acknowledged'
          }
        ],
        recentActivities: [
          {
            id: 1,
            type: 'session',
            teacher: 'John Doe',
            student: 'John Doe',
            subject: 'Aljabar Linear',
            cl: 58.5,
            timestamp: '2024-12-19 10:30',
            status: 'completed'
          },
          {
            id: 2,
            type: 'alert',
            teacher: 'John Doe',
            description: 'High CL alert triggered for 3 students',
            subject: 'Geometri Analitik',
            timestamp: '2024-12-19 10:15'
          },
          {
            id: 3,
            type: 'session',
            teacher: 'John Doe',
            student: 'John Doe',
            subject: 'Statistika Dasar',
            cl: 45.2,
            timestamp: '2024-12-19 09:45',
            status: 'completed'
          },
          {
            id: 4,
            type: 'recommendation',
            teacher: 'John Doe',
            description: 'AI generated teaching recommendation',
            subject: 'Kalkulus Integral',
            timestamp: '2024-12-19 09:30'
          }
        ]
      };

      setAdminData(mockData);
      setLoading(false);
      }, 1500); // Simulate API delay
    };

    fetchAdminData();
  }, []);

  if (loading || !adminData) {
    return (
      <div className="p-6">
        <SkeletonDashboardGrid />
      </div>
    );
  }

  const { systemStats, clTrend, clByTeacher, clBySubject, teacherPerformance, systemAlerts, recentActivities } = adminData;

  const getCLColor = (cl) => {
    if (cl < 40) return 'text-cl-low';
    if (cl < 60) return 'text-cl-optimal';
    if (cl < 75) return 'text-cl-high';
    return 'text-cl-overload';
  };

  const getCLBadge = (cl) => {
    if (cl < 40) return 'low';
    if (cl < 60) return 'optimal';
    if (cl < 75) return 'high';
    return 'overload';
  };

  const getAlertVariant = (type) => {
    switch(type) {
      case 'critical': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-danger-DEFAULT" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning-DEFAULT" />;
      case 'info': return <Activity className="w-5 h-5 text-primary-600" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          System-wide cognitive load monitoring and analytics
        </p>
      </div>

      {/* System KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{systemStats.totalUsers}</h3>
                <p className="text-sm text-gray-500 mt-2">
                  {systemStats.totalTeachers} teachers, {systemStats.totalStudents} students
                </p>
              </div>
              <Users className="w-10 h-10 text-primary-600" />
            </div>
          </Card.Content>
        </Card>

        {/* Active Sessions */}
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{systemStats.activeSessionsToday}</h3>
                <p className="text-sm text-gray-500 mt-2">Today</p>
              </div>
              <Activity className="w-10 h-10 text-secondary-600" />
            </div>
          </Card.Content>
        </Card>

        {/* System Avg CL */}
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Avg CL</p>
                <h3 className={`text-3xl font-bold mt-2 ${getCLColor(systemStats.systemAvgCL)}`}>
                  {systemStats.systemAvgCL}
                </h3>
                <p className="text-sm text-gray-500 mt-2">Across all classes</p>
              </div>
              <Brain className={`w-10 h-10 ${getCLColor(systemStats.systemAvgCL)}`} />
            </div>
          </Card.Content>
        </Card>

        {/* Critical Alerts */}
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <h3 className="text-3xl font-bold text-danger-DEFAULT mt-2">{systemStats.criticalAlerts}</h3>
                <p className="text-sm text-gray-500 mt-2">Require attention</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-danger-DEFAULT" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* System Alerts */}
      {systemAlerts.filter(a => a.type !== 'info').length > 0 && (
        <Card className="border-l-4 border-danger-DEFAULT">
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-DEFAULT" />
              System Alerts
            </Card.Title>
            <Card.Description>Critical and warning alerts requiring attention</Card.Description>
          </Card.Header>
          <Card.Content className="p-6">
            <div className="space-y-3">
              {systemAlerts.filter(a => a.type !== 'info').map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-4 border-l-4 rounded-lg ${
                    alert.type === 'critical' 
                      ? 'border-danger-DEFAULT bg-danger-50' 
                      : 'border-warning-DEFAULT bg-warning-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                          <Badge variant={getAlertVariant(alert.type)}>
                            {alert.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          {alert.teacher && <span>Teacher: {alert.teacher}</span>}
                          {alert.subject && <span>Subject: {alert.subject}</span>}
                          {alert.affectedStudents && <span>Students: {alert.affectedStudents}</span>}
                          <span>{new Date(alert.timestamp).toLocaleString('id-ID', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System CL Trend */}
        <Card>
          <Card.Header>
            <Card.Title>System-Wide CL Trend</Card.Title>
            <Card.Description>Average cognitive load over the past 7 days</Card.Description>
          </Card.Header>
          <Card.Content className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={clTrend}>
                <defs>
                  <linearGradient id="clGradientAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-semibold">{payload[0].payload.date}</p>
                          <p className={`font-bold ${getCLColor(payload[0].value)}`}>
                            Avg CL: {payload[0].value}
                          </p>
                          <p className="text-sm text-gray-600">
                            Sessions: {payload[0].payload.sessions}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cl" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="url(#clGradientAdmin)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        {/* CL by Subject */}
        <Card>
          <Card.Header>
            <Card.Title>CL by Subject</Card.Title>
            <Card.Description>Average cognitive load per subject area</Card.Description>
          </Card.Header>
          <Card.Content className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clBySubject}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" angle={-15} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-semibold">{payload[0].payload.subject}</p>
                          <p className={`font-bold ${getCLColor(payload[0].value)}`}>
                            Avg CL: {payload[0].value}
                          </p>
                          <p className="text-sm text-gray-600">
                            Sessions: {payload[0].payload.sessions}
                          </p>
                          <p className="text-sm text-gray-600">
                            Students: {payload[0].payload.students}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="avgCL" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>
      </div>

      {/* Teacher Performance Table */}
      <Card>
        <Card.Header>
          <Card.Title>Teacher Performance</Card.Title>
          <Card.Description>Overview of all teachers and their class statistics</Card.Description>
        </Card.Header>
        <Card.Content className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Teacher</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Students</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Classes</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Avg CL</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">High Load</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Performance</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {teacherPerformance.map((teacher) => (
                  <tr key={teacher.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{teacher.name}</div>
                      <div className="text-sm text-gray-500">{teacher.lastActive}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{teacher.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold">{teacher.students}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold">{teacher.activeClasses}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={getCLBadge(teacher.avgCL)}>
                        {teacher.avgCL}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-semibold ${teacher.highLoadStudents > 5 ? 'text-danger-DEFAULT' : 'text-gray-900'}`}>
                        {teacher.highLoadStudents}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Award className="w-4 h-4 text-warning-DEFAULT" />
                        <span className="font-semibold">{teacher.performance}/10</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={teacher.status === 'active' ? 'success' : 'default'}>
                        {teacher.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>

      {/* Recent Activities */}
      <Card>
        <Card.Header>
          <Card.Title>Recent System Activities</Card.Title>
          <Card.Description>Latest events across the platform</Card.Description>
        </Card.Header>
        <Card.Content className="p-6">
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className={`p-2 rounded-lg ${
                  activity.type === 'session' ? 'bg-primary-100' :
                  activity.type === 'alert' ? 'bg-danger-100' :
                  'bg-success-100'
                }`}>
                  {activity.type === 'session' && <BookOpen className="w-4 h-4 text-primary-600" />}
                  {activity.type === 'alert' && <AlertTriangle className="w-4 h-4 text-danger-DEFAULT" />}
                  {activity.type === 'recommendation' && <Target className="w-4 h-4 text-success-DEFAULT" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {activity.type === 'session' && (
                      <>
                        <span className="font-semibold text-gray-900">{activity.student}</span>
                        <span className="text-gray-600">completed</span>
                        <span className="font-semibold text-gray-900">{activity.subject}</span>
                        <Badge variant={getCLBadge(activity.cl)}>CL: {activity.cl}</Badge>
                      </>
                    )}
                    {activity.type !== 'session' && (
                      <p className="text-gray-700">{activity.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>Teacher: {activity.teacher}</span>
                    {activity.subject && <span>Subject: {activity.subject}</span>}
                    <span>{new Date(activity.timestamp).toLocaleString('id-ID', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

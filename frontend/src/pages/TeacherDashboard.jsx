import { useState, useEffect } from 'react';
import { TrendingUp, Users, AlertCircle, Award, Flame, Search, Filter, Lightbulb, Coffee, Trophy } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SkeletonDashboardGrid } from '../components/ui/Skeleton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/**
 * Teacher Dashboard - Complete
 * 
 * Menampilkan overview cognitive load untuk semua siswa yang diampu
 * - KPI Cards: Rata-rata CL, siswa high-load, siswa aktif, performance index
 * - CL Overview Chart: Trend 7 hari terakhir
 * - CL by Topic: Bar chart breakdown per topik
 * - Alerts: Critical alerts untuk siswa overload
 * - Recommendations: Teaching tips berbasis AI
 * - Class List: Full list dengan search & filter
 * - Recent Submissions: Tabel pengukuran terbaru
 */

export default function TeacherDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCL, setFilterCL] = useState('all'); // all, low, optimal, high, overload

  // Fetch dashboard data
  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    
    // Mock data - akan diganti dengan API call
    setTimeout(() => {
      const mockData = {
      overview: {
        avg_cl_index: 52.4,
        high_load_students: 8,
        active_students: 42,
        total_students: 45,
        performance_index: 7.8,
      },
      cl_trend_7days: [
        { date: '13 Dec', avgCL: 45 },
        { date: '14 Dec', avgCL: 52 },
        { date: '15 Dec', avgCL: 48 },
        { date: '16 Dec', avgCL: 58 },
        { date: '17 Dec', avgCL: 62 },
        { date: '18 Dec', avgCL: 55 },
        { date: '19 Dec', avgCL: 51 },
      ],
      topic_breakdown: [
        { topic_name: 'Aljabar Linear', avg_cl: 61.0, student_count: 12 },
        { topic_name: 'Kalkulus Integral', avg_cl: 48.5, student_count: 10 },
        { topic_name: 'Geometri Analitik', avg_cl: 55.2, student_count: 15 },
        { topic_name: 'Statistika Dasar', avg_cl: 42.8, student_count: 8 },
      ],
      class_list: [
        {
          student_id: 'usr_002',
          student_name: 'John Doe',
          email: 'student1@example.com',
          current_cl: 67,
          avg_cl: 62.5,
          sessions_completed: 12,
          last_active: '19 Dec 09:30',
        },
        {
          student_id: 'usr_003',
          student_name: 'John Doe',
          email: 'student2@example.com',
          current_cl: 45,
          avg_cl: 48.2,
          sessions_completed: 10,
          last_active: '19 Dec 09:15',
        },
        {
          student_id: 'usr_004',
          student_name: 'John Doe',
          email: 'student3@example.com',
          current_cl: 82,
          avg_cl: 78.4,
          sessions_completed: 15,
          last_active: '19 Dec 08:45',
        },
        {
          student_id: 'usr_005',
          student_name: 'John Doe',
          email: 'student4@example.com',
          current_cl: 38,
          avg_cl: 42.1,
          sessions_completed: 8,
          last_active: '19 Dec 08:30',
        },
        {
          student_id: 'usr_006',
          student_name: 'John Doe',
          email: 'student5@example.com',
          current_cl: 55,
          avg_cl: 52.8,
          sessions_completed: 14,
          last_active: '19 Dec 08:00',
        },
      ],
      alerts: [
        {
          alert_id: 'alt_001',
          severity: 'critical',
          student_name: 'John Doe (student3)',
          message: 'Student has CL of 82 (Overload). Immediate intervention needed.',
          topic: 'Geometri Analitik',
        },
        {
          alert_id: 'alt_002',
          severity: 'warning',
          student_name: 'John Doe (student1)',
          message: 'Sustained high CL (67) for 3 consecutive sessions.',
          topic: 'Aljabar Linear',
        },
      ],
      recommendations: [
        {
          id: 'rec_001',
          priority: 'high',
          title: 'Immediate Attention Required',
          description: '1 student in overload state. Schedule one-on-one session.',
          icon: 'alert',
        },
        {
          id: 'rec_002',
          priority: 'medium',
          title: 'Adjust Aljabar Linear Approach',
          description: 'Highest CL (61.0). Use more visual aids.',
          icon: 'lightbulb',
        },
        {
          id: 'rec_003',
          priority: 'low',
          title: 'Great Progress in Statistika',
          description: 'Optimal CL (42.8). Keep current method.',
          icon: 'trophy',
        },
        {
          id: 'rec_004',
          priority: 'medium',
          title: 'Schedule Class Break',
          description: 'Average CL >50 for 3 days. Plan lighter activities.',
          icon: 'coffee',
        },
      ],
      recent_submissions: [
        {
          id: 1,
          studentName: 'John Doe',
          topic: 'Aljabar Linear',
          clValue: 67,
          timestamp: '19 Dec 09:30',
        },
        {
          id: 2,
          studentName: 'John Doe',
          topic: 'Kalkulus Integral',
          clValue: 45,
          timestamp: '19 Dec 09:15',
        },
        {
          id: 3,
          studentName: 'John Doe',
          topic: 'Geometri Analitik',
          clValue: 82,
          timestamp: '19 Dec 08:45',
        },
        {
          id: 4,
          studentName: 'John Doe',
          topic: 'Statistika Dasar',
          clValue: 38,
          timestamp: '19 Dec 08:30',
        },
        {
          id: 5,
          studentName: 'John Doe',
          topic: 'Aljabar Linear',
          clValue: 55,
          timestamp: '19 Dec 08:00',
        },
      ],
    };
    
    setDashboardData(mockData);
    setIsLoading(false);
    }, 1500); // Simulate 1.5s loading
  }, []);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="p-6">
        <SkeletonDashboardGrid />
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="p-6">Loading...</div>;
  }

  // Filter class list
  const filteredClassList = dashboardData.class_list.filter((student) => {
    const matchesSearch = student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterCL === 'all') return matchesSearch;
    if (filterCL === 'low') return matchesSearch && student.current_cl < 30;
    if (filterCL === 'optimal') return matchesSearch && student.current_cl >= 30 && student.current_cl < 60;
    if (filterCL === 'high') return matchesSearch && student.current_cl >= 60 && student.current_cl < 80;
    if (filterCL === 'overload') return matchesSearch && student.current_cl >= 80;
    return matchesSearch;
  });

  // Priority icon mapping
  const getPriorityIcon = (icon) => {
    switch (icon) {
      case 'alert': return <AlertCircle className="w-5 h-5" />;
      case 'lightbulb': return <Lightbulb className="w-5 h-5" />;
      case 'trophy': return <Trophy className="w-5 h-5" />;
      case 'coffee': return <Coffee className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-danger-DEFAULT bg-danger-light';
      case 'medium': return 'text-warning-DEFAULT bg-warning-light';
      case 'low': return 'text-success-DEFAULT bg-success-light';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600 mt-1">Complete overview of your students' cognitive load</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Average CL */}
        <Card className="animate-fade-in hover:shadow-lg transition-all duration-200">
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average CL</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {dashboardData.overview.avg_cl_index}
                </h3>
                <p className="text-sm text-success-DEFAULT mt-1 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Optimal Range
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <Flame className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* High-Load Students */}
        <Card className="animate-fade-in hover:shadow-lg transition-all duration-200" style={{animationDelay: '100ms'}}>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High-Load Students</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {dashboardData.overview.high_load_students}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Need attention</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-danger-light flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-danger-DEFAULT" />
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Active Students */}
        <Card className="animate-fade-in hover:shadow-lg transition-all duration-200" style={{animationDelay: '300ms'}}>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {dashboardData.overview.active_students}/{dashboardData.overview.total_students}
                </h3>
                <p className="text-sm text-gray-500 mt-1">This week</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary-600" />
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Performance Index */}
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance Index</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {dashboardData.overview.performance_index}
                </h3>
                <p className="text-sm text-success-DEFAULT mt-1">Above average</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-success-light flex items-center justify-center">
                <Award className="w-6 h-6 text-success-DEFAULT" />
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Critical Alerts Section */}
      {dashboardData.alerts && dashboardData.alerts.length > 0 && (
        <Card className="border-l-4 border-danger-DEFAULT">
          <Card.Header>
            <Card.Title className="flex items-center text-danger-DEFAULT">
              <AlertCircle className="w-5 h-5 mr-2" />
              Critical Alerts
            </Card.Title>
            <Card.Description>Immediate actions required</Card.Description>
          </Card.Header>
          <Card.Content className="p-6">
            <div className="space-y-4">
              {dashboardData.alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical'
                      ? 'border-danger-DEFAULT bg-danger-light/20'
                      : 'border-warning-DEFAULT bg-warning-light/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{alert.student_name}</p>
                      <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">Topic: {alert.topic}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-4"
                    >
                      Take Action
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Two Column Layout: CL Trend + CL by Topic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CL Overview Chart */}
        <Card>
          <Card.Header>
            <Card.Title>CL Trend (7 Days)</Card.Title>
            <Card.Description>Class average cognitive load over time</Card.Description>
          </Card.Header>
          <Card.Content className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.cl_trend_7days}>
                <defs>
                  <linearGradient id="colorCL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgCL"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCL)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        {/* CL by Topic Chart */}
        <Card>
          <Card.Header>
            <Card.Title>CL by Topic</Card.Title>
            <Card.Description>Average cognitive load per subject</Card.Description>
          </Card.Header>
          <Card.Content className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.topic_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="topic_name"
                  stroke="#6B7280"
                  style={{ fontSize: '11px' }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="avg_cl"
                  fill="#3B82F6"
                  radius={[8, 8, 0, 0]}
                  label={{ position: 'top', fontSize: 12, fill: '#374151' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>
      </div>

      {/* Teaching Recommendations */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-warning-DEFAULT" />
            Teaching Recommendations
          </Card.Title>
          <Card.Description>AI-generated insights and actionable tips</Card.Description>
        </Card.Header>
        <Card.Content className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${getPriorityColor(rec.priority)}`}>
                    {getPriorityIcon(rec.icon)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    <Badge
                      clValue={rec.priority === 'high' ? 85 : rec.priority === 'medium' ? 65 : 40}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Class List with Search & Filter */}
      <Card>
        <Card.Header>
          <Card.Title>Class List</Card.Title>
          <Card.Description>All students with current CL status</Card.Description>
        </Card.Header>
        <Card.Content className="p-6">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterCL}
                onChange={(e) => setFilterCL(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All CL Levels</option>
                <option value="low">Low (0-29)</option>
                <option value="optimal">Optimal (30-59)</option>
                <option value="high">High (60-79)</option>
                <option value="overload">Overload (80-100)</option>
              </select>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Current CL</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Avg CL</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Sessions</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Active</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredClassList.map((student) => (
                  <tr key={student.student_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.student_name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-gray-900">{student.current_cl}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{student.avg_cl}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{student.sessions_completed}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{student.last_active}</td>
                    <td className="py-3 px-4">
                      <Badge clValue={student.current_cl} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredClassList.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No students found matching your criteria.
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Recent Submissions Table */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Submissions</Card.Title>
          <Card.Description>Latest cognitive load measurements</Card.Description>
        </Card.Header>
        <Card.Content className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Topic</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CL Value</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recent_submissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-primary-700">
                            {submission.studentName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{submission.studentName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{submission.topic}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-gray-900">{submission.clValue}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge clValue={submission.clValue} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">{submission.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}


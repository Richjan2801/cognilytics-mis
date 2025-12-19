import { useState, useEffect } from 'react';
import { Users, Mail, Award, Search, Filter, Eye, TrendingUp, TrendingDown, BookOpen, Calendar, MessageSquare, ChevronRight } from 'lucide-react';
import { SkeletonStatCard, SkeletonTable } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

/**
 * Teachers Page
 * 
 * Comprehensive teacher management and performance tracking
 * Shows teacher list, stats, performance metrics, and detailed views
 */

export default function TeachersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Simulate data loading
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  }, []);

  // Mock teachers data with comprehensive stats
  const mockTeachers = [
    {
      id: 1,
      name: 'John Doe #1',
      email: 'john.doe1@cognilytics.com',
      students: 45,
      avgCL: 52.4,
      activeClasses: 3,
      status: 'active',
      subjects: ['Aljabar Linear', 'Kalkulus'],
      joinDate: '2024-01-15',
      totalSessions: 248,
      performanceScore: 92,
      trend: 'up',
      recentActivity: '2 hours ago'
    },
    {
      id: 2,
      name: 'John Doe #2',
      email: 'john.doe2@cognilytics.com',
      students: 38,
      avgCL: 48.2,
      activeClasses: 2,
      status: 'active',
      subjects: ['Geometri Analitik'],
      joinDate: '2024-02-20',
      totalSessions: 186,
      performanceScore: 88,
      trend: 'stable',
      recentActivity: '5 hours ago'
    },
    {
      id: 3,
      name: 'John Doe #3',
      email: 'john.doe3@cognilytics.com',
      students: 52,
      avgCL: 58.6,
      activeClasses: 4,
      status: 'active',
      subjects: ['Statistika Dasar', 'Kalkulus'],
      joinDate: '2023-09-10',
      totalSessions: 412,
      performanceScore: 95,
      trend: 'up',
      recentActivity: '1 hour ago'
    },
    {
      id: 4,
      name: 'John Doe #4',
      email: 'john.doe4@cognilytics.com',
      students: 28,
      avgCL: 45.8,
      activeClasses: 2,
      status: 'active',
      subjects: ['Aljabar Linear'],
      joinDate: '2024-03-12',
      totalSessions: 124,
      performanceScore: 85,
      trend: 'up',
      recentActivity: '30 minutes ago'
    },
    {
      id: 5,
      name: 'John Doe #5',
      email: 'john.doe5@cognilytics.com',
      students: 32,
      avgCL: 62.4,
      activeClasses: 3,
      status: 'inactive',
      subjects: ['Geometri Analitik', 'Statistika'],
      joinDate: '2023-11-05',
      totalSessions: 298,
      performanceScore: 78,
      trend: 'down',
      recentActivity: '2 days ago'
    },
  ];

  // Filter teachers
  const filteredTeachers = mockTeachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || teacher.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate aggregated stats
  const totalTeachers = mockTeachers.length;
  const activeTeachers = mockTeachers.filter(t => t.status === 'active').length;
  const totalStudents = mockTeachers.reduce((sum, t) => sum + t.students, 0);
  const avgCL = (mockTeachers.reduce((sum, t) => sum + t.avgCL, 0) / totalTeachers).toFixed(1);
  const avgPerformance = (mockTeachers.reduce((sum, t) => sum + t.performanceScore, 0) / totalTeachers).toFixed(1);

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success-DEFAULT" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-danger-DEFAULT" />;
    return <div className="w-4 h-4" />;
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>

        {/* Table skeleton */}
        <SkeletonTable rows={5} columns={10} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-primary-600" />
            Teacher Management
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor teacher performance and manage accounts
          </p>
        </div>
        <Button variant="primary">
          <Users className="w-4 h-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{totalTeachers}</h3>
              </div>
              <Users className="w-8 h-8 text-primary-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <h3 className="text-3xl font-bold text-success-DEFAULT mt-2">{activeTeachers}</h3>
              </div>
              <Award className="w-8 h-8 text-success-DEFAULT" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{totalStudents}</h3>
              </div>
              <Users className="w-8 h-8 text-secondary-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg CL</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{avgCL}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-cl-optimal-light flex items-center justify-center">
                <Badge clValue={parseFloat(avgCL)} />
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{avgPerformance}%</h3>
              </div>
              <Award className="w-8 h-8 text-primary-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <Card.Content className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Teachers List */}
      <Card>
        <Card.Header>
          <Card.Title>All Teachers ({filteredTeachers.length})</Card.Title>
          <Card.Description>Comprehensive teacher list with performance metrics</Card.Description>
        </Card.Header>
        <Card.Content className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Teacher</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Students</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Avg CL</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Classes</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Sessions</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Performance</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Trend</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-sm font-semibold text-primary-700">
                            {teacher.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{teacher.name}</p>
                          <p className="text-xs text-gray-500">Joined {new Date(teacher.joinDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{teacher.recentActivity}</p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm font-semibold text-gray-900">{teacher.students}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge clValue={teacher.avgCL} />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm text-gray-600">{teacher.activeClasses}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{teacher.totalSessions}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-[80px]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-700">{teacher.performanceScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                teacher.performanceScore >= 90 ? 'bg-success-DEFAULT' :
                                teacher.performanceScore >= 80 ? 'bg-primary-600' :
                                teacher.performanceScore >= 70 ? 'bg-warning-DEFAULT' :
                                'bg-danger-DEFAULT'
                              }`}
                              style={{ width: `${teacher.performanceScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        {getTrendIcon(teacher.trend)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        teacher.status === 'active' 
                          ? 'bg-success-light text-success-DEFAULT' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedTeacher(teacher)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTeachers.length === 0 && (
            <EmptyState
              variant={searchTerm || filterStatus !== 'all' ? 'no-results' : 'no-teachers'}
              className="py-8"
            />
          )}
        </Card.Content>
      </Card>

      {/* Teacher Detail Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-700">
                      {selectedTeacher.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTeacher.name}</h2>
                    <p className="text-gray-600">{selectedTeacher.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTeacher(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Students</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedTeacher.students}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Avg CL</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedTeacher.avgCL}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedTeacher.totalSessions}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Performance</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedTeacher.performanceScore}%</p>
                </div>
              </div>

              {/* Subjects Taught */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  Subjects Taught
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.subjects.map((subject, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Classes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  Active Classes
                </h3>
                <div className="space-y-2">
                  {Array.from({ length: selectedTeacher.activeClasses }, (_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedTeacher.subjects[i % selectedTeacher.subjects.length]}</p>
                          <p className="text-sm text-gray-600">Class {String.fromCharCode(65 + i)} • {12 + i * 3} students</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created new session</p>
                      <p className="text-xs text-gray-600">{selectedTeacher.recentActivity}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-success-DEFAULT rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Completed grading</p>
                      <p className="text-xs text-gray-600">Yesterday at 4:32 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-warning-DEFAULT rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Updated student records</p>
                      <p className="text-xs text-gray-600">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button variant="primary" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

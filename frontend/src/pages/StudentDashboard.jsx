import { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target,
  BookOpen,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Activity,
  Award,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { SkeletonDashboardGrid } from '../components/ui/Skeleton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Student Dashboard
 * 
 * Personal cognitive load monitoring dashboard for students
 * Shows individual progress, trends, and personalized recommendations
 */

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with mock data
    const fetchStudentData = () => {
      setLoading(true);
      
      // Simulate API delay
      setTimeout(() => {
        // Mock student personal data
        const mockData = {
        student: {
          name: 'John Doe',
          studentId: 'STU-2024-001',
          grade: '10A',
          email: 'student@cognilytics.com'
        },
        stats: {
          currentCL: 54.2,
          avgCL: 52.8,
          totalSessions: 28,
          studyTime: 42, // hours
          clTrend: 'up', // up, down, stable
          clChange: 2.5
        },
        clTrend: [
          { day: 'Mon', cl: 48.5, date: '2024-12-13' },
          { day: 'Tue', cl: 52.0, date: '2024-12-14' },
          { day: 'Wed', cl: 55.3, date: '2024-12-15' },
          { day: 'Thu', cl: 51.8, date: '2024-12-16' },
          { day: 'Fri', cl: 56.2, date: '2024-12-17' },
          { day: 'Sat', cl: 53.5, date: '2024-12-18' },
          { day: 'Sun', cl: 54.2, date: '2024-12-19' },
        ],
        currentStatus: {
          level: 'optimal', // optimal, high, overload
          message: 'You\'re doing great! Keep up the good work.',
          color: 'success'
        },
        recentActivities: [
          {
            id: 1,
            topic: 'Aljabar Linear',
            type: 'quiz',
            cl: 58.5,
            score: 85,
            duration: 45,
            date: '2024-12-19 10:30',
            status: 'completed'
          },
          {
            id: 2,
            topic: 'Kalkulus Integral',
            type: 'exercise',
            cl: 52.0,
            score: 90,
            duration: 30,
            date: '2024-12-18 14:00',
            status: 'completed'
          },
          {
            id: 3,
            topic: 'Statistika Dasar',
            type: 'reading',
            cl: 45.8,
            score: null,
            duration: 25,
            date: '2024-12-18 09:15',
            status: 'completed'
          },
          {
            id: 4,
            topic: 'Geometri Analitik',
            type: 'quiz',
            cl: 62.3,
            score: 75,
            duration: 50,
            date: '2024-12-17 16:20',
            status: 'completed'
          }
        ],
        recommendations: [
          {
            id: 1,
            type: 'break',
            priority: 'medium',
            title: 'Consider a short break',
            message: 'Your CL has been slightly elevated. A 15-minute break could help.',
            icon: 'Coffee',
            topic: 'General'
          },
          {
            id: 2,
            type: 'practice',
            priority: 'low',
            title: 'Great progress in Statistika!',
            message: 'Your CL is optimal in this topic. Keep practicing to maintain mastery.',
            icon: 'TrendingUp',
            topic: 'Statistika Dasar'
          },
          {
            id: 3,
            type: 'strategy',
            priority: 'medium',
            title: 'Aljabar Linear needs attention',
            message: 'Try breaking down complex problems into smaller steps.',
            icon: 'Lightbulb',
            topic: 'Aljabar Linear'
          }
        ],
        achievements: [
          { id: 1, name: '7-Day Streak', icon: '🔥', unlocked: true },
          { id: 2, name: 'CL Master', icon: '🎯', unlocked: true },
          { id: 3, name: 'Early Bird', icon: '🌅', unlocked: false },
          { id: 4, name: 'Night Owl', icon: '🦉', unlocked: true }
        ]
      };

      setStudentData(mockData);
      setLoading(false);
      }, 1500); // Simulate API delay
    };

    fetchStudentData();
  }, []);

  if (loading || !studentData) {
    return (
      <div className="p-6">
        <SkeletonDashboardGrid />
      </div>
    );
  }

  const { stats, clTrend, currentStatus, recentActivities, recommendations, achievements } = studentData;

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

  const getActivityIcon = (type) => {
    switch(type) {
      case 'quiz': return <Target className="w-4 h-4" />;
      case 'exercise': return <BookOpen className="w-4 h-4" />;
      case 'reading': return <BookOpen className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {studentData.student.name}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your learning progress and cognitive load overview
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Student ID</p>
          <p className="font-semibold text-gray-900">{studentData.student.studentId}</p>
        </div>
      </div>

      {/* Current Status Alert */}
      {currentStatus.level === 'overload' && (
        <Card className={`border-l-4 border-danger-DEFAULT bg-danger-50`}>
          <Card.Content className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger-DEFAULT flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-danger-DEFAULT">High Cognitive Load Alert</h4>
                <p className="text-sm text-gray-700 mt-1">{currentStatus.message}</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {currentStatus.level === 'optimal' && (
        <Card className={`border-l-4 border-success-DEFAULT bg-success-50`}>
          <Card.Content className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-DEFAULT flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-success-DEFAULT">Optimal Learning State</h4>
                <p className="text-sm text-gray-700 mt-1">{currentStatus.message}</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Personal KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current CL */}
        <Card className="animate-fade-in hover:shadow-lg transition-all duration-200">
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current CL</p>
                <h3 className={`text-3xl font-bold mt-2 ${getCLColor(stats.currentCL)}`}>
                  {stats.currentCL}
                </h3>
                <div className="flex items-center gap-1 mt-2">
                  {stats.clTrend === 'up' ? (
                    <ArrowUp className="w-4 h-4 text-danger-DEFAULT" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-success-DEFAULT" />
                  )}
                  <span className={`text-sm ${stats.clTrend === 'up' ? 'text-danger-DEFAULT' : 'text-success-DEFAULT'}`}>
                    {stats.clChange}% from yesterday
                  </span>
                </div>
              </div>
              <Brain className={`w-10 h-10 ${getCLColor(stats.currentCL)}`} />
            </div>
          </Card.Content>
        </Card>

        {/* Average CL */}
        <Card className="animate-fade-in hover:shadow-lg transition-all duration-200" style={{animationDelay: '100ms'}}>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average CL</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.avgCL}</h3>
                <p className="text-sm text-gray-500 mt-2">Last 7 days</p>
              </div>
              <TrendingUp className="w-10 h-10 text-primary-600" />
            </div>
          </Card.Content>
        </Card>

        {/* Total Sessions */}
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSessions}</h3>
                <p className="text-sm text-gray-500 mt-2">This month</p>
              </div>
              <Calendar className="w-10 h-10 text-secondary-600" />
            </div>
          </Card.Content>
        </Card>

        {/* Study Time */}
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Study Time</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.studyTime}h</h3>
                <p className="text-sm text-gray-500 mt-2">This month</p>
              </div>
              <Clock className="w-10 h-10 text-success-DEFAULT" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - CL Trend Chart (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* CL Trend Chart */}
          <Card>
            <Card.Header>
              <Card.Title>My Cognitive Load Trend</Card.Title>
              <Card.Description>Your CL levels over the past 7 days</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={clTrend}>
                  <defs>
                    <linearGradient id="clGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-semibold">{payload[0].payload.day}</p>
                            <p className="text-sm text-gray-600">{payload[0].payload.date}</p>
                            <p className={`font-bold ${getCLColor(payload[0].value)}`}>
                              CL: {payload[0].value}
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
                    fill="url(#clGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card.Content>
          </Card>

          {/* Recent Activities */}
          <Card>
            <Card.Header>
              <Card.Title>Recent Activities</Card.Title>
              <Card.Description>Your latest learning sessions</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{activity.topic}</h4>
                          <Badge variant={activity.type === 'quiz' ? 'primary' : 'secondary'}>
                            {activity.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.duration} min
                          </span>
                          {activity.score && (
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              Score: {activity.score}%
                            </span>
                          )}
                          <span>
                            {new Date(activity.date).toLocaleString('id-ID', { 
                              day: 'numeric', 
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">CL</p>
                      <Badge variant={getCLBadge(activity.cl)}>
                        {activity.cl}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline">View All Activities</Button>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Right Column - Recommendations & Achievements (1/3 width) */}
        <div className="space-y-6">
          {/* Achievements */}
          <Card>
            <Card.Header>
              <Card.Title>Achievements</Card.Title>
              <Card.Description>Your earned badges</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`p-4 border rounded-lg text-center transition-all ${
                      achievement.unlocked 
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300' 
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <p className="text-xs font-medium text-gray-700">{achievement.name}</p>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          {/* Recommendations */}
          <Card>
            <Card.Header>
              <Card.Title>Recommendations</Card.Title>
              <Card.Description>Personalized tips for you</Card.Description>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div 
                    key={rec.id}
                    className={`p-4 border-l-4 rounded-lg ${
                      rec.priority === 'high' 
                        ? 'border-danger-DEFAULT bg-danger-50' 
                        : rec.priority === 'medium'
                        ? 'border-warning-DEFAULT bg-warning-50'
                        : 'border-success-DEFAULT bg-success-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {rec.icon === 'Coffee' && <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                      {rec.icon === 'TrendingUp' && <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                      {rec.icon === 'Lightbulb' && <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                      <div>
                        <h5 className="font-semibold text-sm text-gray-900">{rec.title}</h5>
                        <p className="text-xs text-gray-700 mt-1">{rec.message}</p>
                        <p className="text-xs text-gray-500 mt-2">Topic: {rec.topic}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          {/* Quick Actions */}
          <Card>
            <Card.Header>
              <Card.Title>Quick Actions</Card.Title>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start New Session
                </Button>
                <Button className="w-full" variant="outline">
                  <Activity className="w-4 h-4 mr-2" />
                  View My Progress
                </Button>
                <Button className="w-full" variant="outline">
                  <Award className="w-4 h-4 mr-2" />
                  View Achievements
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}

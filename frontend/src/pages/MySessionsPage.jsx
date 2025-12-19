import { useState, useEffect } from 'react';
import { Calendar, Clock, Target, BookOpen, Filter, Search, Download } from 'lucide-react';
import { SkeletonList, SkeletonStatCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

/**
 * My Sessions Page
 * 
 * History of all learning sessions with filters and search
 */

export default function MySessionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');

  // Simulate data loading
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1200);
  }, []);

  // Mock sessions data
  const sessions = [
    {
      id: 1,
      topic: 'Aljabar Linear',
      type: 'quiz',
      date: '2024-12-19',
      time: '10:30',
      duration: 45,
      cl: 58.5,
      score: 85,
      status: 'completed',
      questions: 20,
      correct: 17
    },
    {
      id: 2,
      topic: 'Kalkulus Integral',
      type: 'exercise',
      date: '2024-12-18',
      time: '14:00',
      duration: 30,
      cl: 52.0,
      score: 90,
      status: 'completed',
      questions: 15,
      correct: 13
    },
    {
      id: 3,
      topic: 'Statistika Dasar',
      type: 'reading',
      date: '2024-12-18',
      time: '09:15',
      duration: 25,
      cl: 45.8,
      score: null,
      status: 'completed',
      questions: null,
      correct: null
    },
    {
      id: 4,
      topic: 'Geometri Analitik',
      type: 'quiz',
      date: '2024-12-17',
      time: '16:20',
      duration: 50,
      cl: 62.3,
      score: 75,
      status: 'completed',
      questions: 20,
      correct: 15
    },
    {
      id: 5,
      topic: 'Aljabar Linear',
      type: 'exercise',
      date: '2024-12-16',
      time: '11:00',
      duration: 40,
      cl: 55.2,
      score: 88,
      status: 'completed',
      questions: 12,
      correct: 10
    },
    {
      id: 6,
      topic: 'Kalkulus Integral',
      type: 'reading',
      date: '2024-12-15',
      time: '13:45',
      duration: 35,
      cl: 48.5,
      score: null,
      status: 'completed',
      questions: null,
      correct: null
    },
    {
      id: 7,
      topic: 'Statistika Dasar',
      type: 'quiz',
      date: '2024-12-14',
      time: '10:00',
      duration: 55,
      cl: 51.8,
      score: 82,
      status: 'completed',
      questions: 25,
      correct: 20
    },
    {
      id: 8,
      topic: 'Geometri Analitik',
      type: 'exercise',
      date: '2024-12-13',
      time: '15:30',
      duration: 45,
      cl: 59.0,
      score: 78,
      status: 'completed',
      questions: 18,
      correct: 14
    }
  ];

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || session.type === filterType;
    const matchesTopic = filterTopic === 'all' || session.topic === filterTopic;
    return matchesSearch && matchesType && matchesTopic;
  });

  // Calculate stats
  const totalSessions = sessions.length;
  const avgCL = (sessions.reduce((sum, s) => sum + s.cl, 0) / sessions.length).toFixed(1);
  const avgScore = (sessions.filter(s => s.score).reduce((sum, s) => sum + s.score, 0) / sessions.filter(s => s.score).length).toFixed(1);
  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);

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

  const getTypeIcon = (type) => {
    switch(type) {
      case 'quiz': return <Target className="w-4 h-4" />;
      case 'exercise': return <BookOpen className="w-4 h-4" />;
      case 'reading': return <BookOpen className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const uniqueTopics = [...new Set(sessions.map(s => s.topic))];

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <SkeletonList items={8} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-600 mt-1">Complete history of all your learning sessions</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{totalSessions}</h3>
              </div>
              <Calendar className="w-8 h-8 text-primary-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average CL</p>
                <h3 className={`text-3xl font-bold mt-2 ${getCLColor(avgCL)}`}>{avgCL}</h3>
              </div>
              <Target className="w-8 h-8 text-secondary-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{avgScore}%</h3>
              </div>
              <Target className="w-8 h-8 text-success-DEFAULT" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Time</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{totalTime}m</h3>
              </div>
              <Clock className="w-8 h-8 text-warning-DEFAULT" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter by Type */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none"
              >
                <option value="all">All Types</option>
                <option value="quiz">Quiz</option>
                <option value="exercise">Exercise</option>
                <option value="reading">Reading</option>
              </select>
            </div>

            {/* Filter by Topic */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none"
              >
                <option value="all">All Topics</option>
                {uniqueTopics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Sessions List */}
      <Card>
        <Card.Header>
          <Card.Title>Session History</Card.Title>
          <Card.Description>Showing {filteredSessions.length} of {totalSessions} sessions</Card.Description>
        </Card.Header>
        <Card.Content className="p-6">
          <div className="space-y-3">
            {filteredSessions.length === 0 ? (
              <EmptyState
                variant={searchTerm || filterType !== 'all' || filterTopic !== 'all' ? 'no-results' : 'no-sessions'}
                className="py-8"
              />
            ) : (
              filteredSessions.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Left Section */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className="p-3 bg-primary-100 rounded-lg">
                      {getTypeIcon(session.type)}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{session.topic}</h4>
                        <Badge variant={session.type === 'quiz' ? 'primary' : session.type === 'exercise' ? 'secondary' : 'default'}>
                          {session.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.time} ({session.duration} min)
                        </span>
                        {session.score && (
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Score: {session.score}% ({session.correct}/{session.questions})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section - CL Badge */}
                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-600 mb-1">Cognitive Load</p>
                    <Badge variant={getCLBadge(session.cl)} className="text-lg px-3 py-1">
                      {session.cl}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

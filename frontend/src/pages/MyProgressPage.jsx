import { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { SkeletonStatCard, SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

/**
 * My Progress Page
 * 
 * Progress tracking per topic with mastery levels and recommendations
 */

export default function MyProgressPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate data loading
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1200);
  }, []);

  // Mock progress data
  const overallProgress = {
    totalTopics: 4,
    masteredTopics: 1,
    inProgressTopics: 2,
    needsAttentionTopics: 1,
    overallMastery: 68,
    avgCL: 52.8
  };

  const topicProgress = [
    {
      id: 1,
      name: 'Statistika Dasar',
      mastery: 88,
      status: 'mastered', // mastered, in-progress, needs-attention
      sessions: 8,
      avgCL: 42.8,
      lastSession: '2024-12-18',
      improvement: '+15%',
      badges: ['Fast Learner', 'Consistent'],
      strengths: ['Descriptive Statistics', 'Data Visualization'],
      weaknesses: [],
      recommendation: 'Excellent progress! Ready for advanced topics.'
    },
    {
      id: 2,
      name: 'Kalkulus Integral',
      mastery: 72,
      status: 'in-progress',
      sessions: 6,
      avgCL: 54.5,
      lastSession: '2024-12-18',
      improvement: '+8%',
      badges: ['Steady Progress'],
      strengths: ['Basic Integration', 'Substitution Method'],
      weaknesses: ['Integration by Parts', 'Trigonometric Integration'],
      recommendation: 'Focus on integration techniques. Consider more practice exercises.'
    },
    {
      id: 3,
      name: 'Geometri Analitik',
      mastery: 65,
      status: 'in-progress',
      sessions: 5,
      avgCL: 58.2,
      lastSession: '2024-12-17',
      improvement: '+5%',
      badges: [],
      strengths: ['Points and Lines', 'Distance Formula'],
      weaknesses: ['Circles', 'Conic Sections', 'Transformations'],
      recommendation: 'More practice needed on circles and conic sections.'
    },
    {
      id: 4,
      name: 'Aljabar Linear',
      mastery: 48,
      status: 'needs-attention',
      sessions: 9,
      avgCL: 61.0,
      lastSession: '2024-12-19',
      improvement: '-2%',
      badges: [],
      strengths: ['Matrix Basics'],
      weaknesses: ['Matrix Operations', 'Determinants', 'Eigenvalues', 'Linear Systems'],
      recommendation: 'High cognitive load detected. Consider breaking down complex problems into smaller steps. Review fundamentals before moving forward.'
    }
  ];

  const getMasteryColor = (mastery) => {
    if (mastery >= 80) return 'text-success-DEFAULT';
    if (mastery >= 60) return 'text-cl-optimal';
    if (mastery >= 40) return 'text-warning-DEFAULT';
    return 'text-danger-DEFAULT';
  };

  const getMasteryBgColor = (mastery) => {
    if (mastery >= 80) return 'bg-success-DEFAULT';
    if (mastery >= 60) return 'bg-cl-optimal';
    if (mastery >= 40) return 'bg-warning-DEFAULT';
    return 'bg-danger-DEFAULT';
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'mastered': return <Badge variant="success">Mastered</Badge>;
      case 'in-progress': return <Badge variant="primary">In Progress</Badge>;
      case 'needs-attention': return <Badge variant="danger">Needs Attention</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'mastered': return <CheckCircle className="w-5 h-5 text-success-DEFAULT" />;
      case 'in-progress': return <TrendingUp className="w-5 h-5 text-primary-600" />;
      case 'needs-attention': return <AlertCircle className="w-5 h-5 text-danger-DEFAULT" />;
      default: return null;
    }
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
        <p className="text-gray-600 mt-1">Track your mastery level across all topics</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Mastery</p>
                <h3 className={`text-3xl font-bold mt-2 ${getMasteryColor(overallProgress.overallMastery)}`}>
                  {overallProgress.overallMastery}%
                </h3>
              </div>
              <Award className="w-8 h-8 text-primary-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mastered Topics</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {overallProgress.masteredTopics}/{overallProgress.totalTopics}
                </h3>
              </div>
              <CheckCircle className="w-8 h-8 text-success-DEFAULT" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {overallProgress.inProgressTopics}
                </h3>
              </div>
              <TrendingUp className="w-8 h-8 text-primary-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {overallProgress.needsAttentionTopics}
                </h3>
              </div>
              <AlertCircle className="w-8 h-8 text-warning-DEFAULT" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Topic Progress Cards */}
      <div className="space-y-6">
        {topicProgress.map((topic) => (
          <Card key={topic.id} className={`${topic.status === 'needs-attention' ? 'border-l-4 border-danger-DEFAULT' : ''}`}>
            <Card.Content className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(topic.status)}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{topic.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {topic.sessions} sessions • Last: {new Date(topic.lastSession).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                {getStatusBadge(topic.status)}
              </div>

              {/* Mastery Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Mastery Level</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getMasteryColor(topic.mastery)}`}>
                      {topic.mastery}%
                    </span>
                    <span className={`text-sm ${topic.improvement.startsWith('+') ? 'text-success-DEFAULT' : 'text-danger-DEFAULT'}`}>
                      {topic.improvement}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${getMasteryBgColor(topic.mastery)}`}
                    style={{ width: `${topic.mastery}%` }}
                  ></div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Strengths */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-DEFAULT" />
                    Strengths
                  </h4>
                  {topic.strengths.length > 0 ? (
                    <ul className="space-y-1">
                      {topic.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-gray-700">• {strength}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Building foundations...</p>
                  )}
                </div>

                {/* Weaknesses */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-warning-DEFAULT" />
                    Areas to Improve
                  </h4>
                  {topic.weaknesses.length > 0 ? (
                    <ul className="space-y-1">
                      {topic.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-sm text-gray-700">• {weakness}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-success-DEFAULT">All areas looking good! 🎉</p>
                  )}
                </div>

                {/* Badges */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-warning-DEFAULT" />
                    Badges Earned
                  </h4>
                  {topic.badges.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {topic.badges.map((badge, idx) => (
                        <Badge key={idx} variant="success" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No badges yet</p>
                  )}
                </div>
              </div>

              {/* Recommendation */}
              <div className={`p-4 rounded-lg ${
                topic.status === 'mastered' 
                  ? 'bg-success-50 border border-success-200' 
                  : topic.status === 'needs-attention'
                  ? 'bg-danger-50 border border-danger-200'
                  : 'bg-primary-50 border border-primary-200'
              }`}>
                <div className="flex items-start gap-2">
                  <Brain className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-sm text-gray-900 mb-1">Recommendation</h5>
                    <p className="text-sm text-gray-700">{topic.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* CL Info */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Average CL: <span className="font-semibold">{topic.avgCL}</span></span>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Overall Recommendation */}
      <Card className="border-l-4 border-primary-600 bg-primary-50">
        <Card.Content className="p-6">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Overall Learning Recommendation
          </h4>
          <p className="text-sm text-gray-700">
            You're making great progress overall! Focus more attention on <strong>Aljabar Linear</strong> as it shows higher cognitive load. 
            Consider taking breaks between sessions and breaking complex problems into smaller steps. 
            Your mastery in <strong>Statistika Dasar</strong> is excellent—keep up the great work!
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}

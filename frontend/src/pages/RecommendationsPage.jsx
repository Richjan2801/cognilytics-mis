import { useState } from 'react';
import { Lightbulb, AlertCircle, TrendingUp, Coffee, BookOpen, Check, X, StickyNote, Filter, Search, Calendar, CheckCircle2 } from 'lucide-react';
import showToast from '../utils/toast';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

/**
 * Recommendations Page
 * 
 * Detailed teaching recommendations and interventions with actionable features
 * Based on cognitive load analysis and AI insights
 */

export default function RecommendationsPage() {
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [recommendations, setRecommendations] = useState([
    {
      id: 1,
      type: 'critical',
      title: 'Immediate Intervention Required',
      description: 'Student John Doe (student3) has CL of 82 (Overload). Schedule one-on-one session immediately.',
      affectedStudents: 1,
      topic: 'Geometri Analitik',
      action: 'Contact student for personal consultation',
      priority: 'high',
      status: 'pending',
      notes: '',
      createdDate: '2025-12-19',
    },
    {
      id: 2,
      type: 'teaching_strategy',
      title: 'Adjust Aljabar Linear Teaching Approach',
      description: 'This topic shows highest average CL (61.0). Consider breaking down complex concepts into smaller chunks or using more visual aids.',
      affectedStudents: 12,
      topic: 'Aljabar Linear',
      action: 'Review lesson plan and teaching materials',
      priority: 'medium',
      status: 'in-progress',
      notes: 'Started preparing simplified materials',
      createdDate: '2025-12-18',
    },
    {
      id: 3,
      type: 'break',
      title: 'Schedule Class Break Session',
      description: 'Class average CL has been consistently above 50 for 3 consecutive days. Plan a lighter review session or break day.',
      affectedStudents: 45,
      topic: 'All Topics',
      action: 'Schedule review/game day',
      priority: 'medium',
      status: 'pending',
      notes: '',
      createdDate: '2025-12-19',
    },
    {
      id: 4,
      type: 'positive',
      title: 'Excellent Progress in Statistika',
      description: 'Students showing optimal CL (42.8) in this topic. Current teaching method is very effective.',
      affectedStudents: 8,
      topic: 'Statistika Dasar',
      action: 'Continue current approach, share best practices',
      priority: 'low',
      status: 'implemented',
      notes: 'Shared approach with other teachers',
      createdDate: '2025-12-15',
    },
    {
      id: 5,
      type: 'teaching_strategy',
      title: 'Introduce More Interactive Elements',
      description: 'Students in afternoon sessions show 15% higher CL. Consider adding interactive activities to maintain engagement.',
      affectedStudents: 18,
      topic: 'Kalkulus Integral',
      action: 'Add quiz games and group discussions',
      priority: 'medium',
      status: 'pending',
      notes: '',
      createdDate: '2025-12-18',
    },
    {
      id: 6,
      type: 'critical',
      title: 'Multiple Students Struggling',
      description: '5 students consistently showing CL above 70. Group intervention session recommended.',
      affectedStudents: 5,
      topic: 'Aljabar Linear',
      action: 'Organize small group tutoring session',
      priority: 'high',
      status: 'dismissed',
      notes: 'Students showed improvement after regular sessions',
      createdDate: '2025-12-17',
    },
  ]);

  // Filter and search
  const filteredRecommendations = recommendations.filter(rec => {
    const matchesPriority = filterPriority === 'all' || rec.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || rec.status === filterStatus;
    const matchesSearch = rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rec.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rec.topic.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesStatus && matchesSearch;
  });

  // Handle status change
  const handleStatusChange = (id, newStatus) => {
    setRecommendations(recommendations.map(rec =>
      rec.id === id ? { ...rec, status: newStatus } : rec
    ));
    
    const statusMessages = {
      'in-progress': 'Started working on recommendation',
      'implemented': 'Recommendation marked as implemented',
      'dismissed': 'Recommendation dismissed',
      'pending': 'Recommendation reopened'
    };
    
    showToast.success(statusMessages[newStatus] || 'Status updated');
  };

  // Handle notes update
  const handleNotesUpdate = (id, notes) => {
    setRecommendations(recommendations.map(rec =>
      rec.id === id ? { ...rec, notes } : rec
    ));
    showToast.info('Notes updated');
  };

  // Calculate stats
  const criticalCount = recommendations.filter(r => r.priority === 'high' && r.status !== 'dismissed' && r.status !== 'implemented').length;
  const teachingTipsCount = recommendations.filter(r => r.type === 'teaching_strategy' && r.status === 'pending').length;
  const breakNeededCount = recommendations.filter(r => r.type === 'break' && r.status === 'pending').length;
  const positiveNotesCount = recommendations.filter(r => r.type === 'positive').length;
  const implementedCount = recommendations.filter(r => r.status === 'implemented').length;
  const inProgressCount = recommendations.filter(r => r.status === 'in-progress').length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-danger-DEFAULT bg-danger-light/20';
      case 'medium': return 'border-warning-DEFAULT bg-warning-light/20';
      case 'low': return 'border-success-DEFAULT bg-success-light/20';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'implemented': return 'bg-success-light text-success-DEFAULT';
      case 'dismissed': return 'bg-gray-200 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in-progress': return 'In Progress';
      case 'implemented': return 'Implemented';
      case 'dismissed': return 'Dismissed';
      default: return status;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'critical': return <AlertCircle className="w-6 h-6 text-danger-DEFAULT" />;
      case 'teaching_strategy': return <BookOpen className="w-6 h-6 text-primary-600" />;
      case 'break': return <Coffee className="w-6 h-6 text-warning-DEFAULT" />;
      case 'positive': return <TrendingUp className="w-6 h-6 text-success-DEFAULT" />;
      default: return <Lightbulb className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-primary-600" />
            Teaching Recommendations
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered insights and actionable recommendations based on cognitive load analysis
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-success-DEFAULT" />
          <span className="font-medium text-gray-700">{implementedCount} Implemented</span>
          <span className="text-gray-400 mx-2">•</span>
          <span className="text-gray-600">{inProgressCount} In Progress</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Actions</p>
                <h3 className="text-3xl font-bold text-danger-DEFAULT mt-2">{criticalCount}</h3>
              </div>
              <AlertCircle className="w-8 h-8 text-danger-DEFAULT" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teaching Tips</p>
                <h3 className="text-3xl font-bold text-primary-600 mt-2">{teachingTipsCount}</h3>
              </div>
              <Lightbulb className="w-8 h-8 text-primary-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Break Needed</p>
                <h3 className="text-3xl font-bold text-warning-DEFAULT mt-2">{breakNeededCount}</h3>
              </div>
              <Coffee className="w-8 h-8 text-warning-DEFAULT" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Positive Notes</p>
                <h3 className="text-3xl font-bold text-success-DEFAULT mt-2">{positiveNotesCount}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-success-DEFAULT" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <Card.Content className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search recommendations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="implemented">Implemented</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <Card>
            <Card.Content className="p-8">
              <EmptyState
                variant={searchTerm || filterPriority !== 'all' || filterStatus !== 'all' ? 'no-results' : 'no-recommendations'}
              />
            </Card.Content>
          </Card>
        ) : (
          filteredRecommendations.map((rec) => (
            <Card key={rec.id} className={`border-l-4 ${getPriorityColor(rec.priority)}`}>
              <Card.Content className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getTypeIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(rec.status)}`}>
                            {getStatusLabel(rec.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                      <Badge clValue={rec.priority === 'high' ? 85 : rec.priority === 'medium' ? 65 : 40} className="ml-4" />
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center text-gray-700">
                        <span className="font-medium mr-1">Topic:</span>
                        <span>{rec.topic}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <span className="font-medium mr-1">Affected:</span>
                        <span>{rec.affectedStudents} student{rec.affectedStudents > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(rec.createdDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">
                        💡 Suggested Action:
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{rec.action}</p>
                    </div>

                    {/* Notes Section */}
                    {rec.status !== 'pending' && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <StickyNote className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 mb-1">Notes:</p>
                            {rec.notes ? (
                              <p className="text-sm text-blue-700">{rec.notes}</p>
                            ) : (
                              <p className="text-sm text-blue-600 italic">No notes added yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {rec.status === 'pending' && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            const notes = prompt('Add notes (optional):');
                            handleStatusChange(rec.id, 'in-progress');
                            if (notes) handleNotesUpdate(rec.id, notes);
                          }}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Start Working
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const notes = prompt('Add notes (optional):');
                            handleStatusChange(rec.id, 'implemented');
                            if (notes) handleNotesUpdate(rec.id, notes);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Mark Implemented
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const notes = prompt('Reason for dismissing (optional):');
                            handleStatusChange(rec.id, 'dismissed');
                            if (notes) handleNotesUpdate(rec.id, notes);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    )}

                    {rec.status === 'in-progress' && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            const additionalNotes = prompt('Add completion notes:', rec.notes);
                            handleStatusChange(rec.id, 'implemented');
                            if (additionalNotes) handleNotesUpdate(rec.id, additionalNotes);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Mark Complete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updatedNotes = prompt('Update notes:', rec.notes);
                            if (updatedNotes !== null) handleNotesUpdate(rec.id, updatedNotes);
                          }}
                        >
                          <StickyNote className="w-4 h-4 mr-1" />
                          Update Notes
                        </Button>
                      </div>
                    )}

                    {(rec.status === 'implemented' || rec.status === 'dismissed') && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(rec.id, 'pending')}
                        >
                          Reopen
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

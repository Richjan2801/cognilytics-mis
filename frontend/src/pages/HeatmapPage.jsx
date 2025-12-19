import { useState, useEffect } from 'react';
import { Flame, Calendar, Filter, Download, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { SkeletonStatCard, SkeletonCard } from '../components/ui/Skeleton';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

/**
 * Heatmap Page
 * 
 * Interactive cognitive load heatmap visualization
 * Shows CL levels across students and topics in a matrix format
 */

export default function HeatmapPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('student-topic'); // student-topic, time-series
  const [dateRange, setDateRange] = useState('7days');
  const [selectedTopic, setSelectedTopic] = useState('all');

  // Simulate data loading
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  // Mock heatmap data - Student vs Topic matrix
  const students = [
    'John Doe #1', 'John Doe #2', 'John Doe #3', 'John Doe #4', 'John Doe #5',
    'John Doe #6', 'John Doe #7', 'John Doe #8', 'John Doe #9', 'John Doe #10'
  ];

  const topics = ['Aljabar Linear', 'Kalkulus Integral', 'Geometri Analitik', 'Statistika Dasar'];

  // Heatmap data: CL values for each student-topic combination
  const heatmapData = {
    'John Doe #1': { 'Aljabar Linear': 68, 'Kalkulus Integral': 52, 'Geometri Analitik': 58, 'Statistika Dasar': 45 },
    'John Doe #2': { 'Aljabar Linear': 72, 'Kalkulus Integral': 55, 'Geometri Analitik': 62, 'Statistika Dasar': 48 },
    'John Doe #3': { 'Aljabar Linear': 58, 'Kalkulus Integral': 48, 'Geometri Analitik': 54, 'Statistika Dasar': 42 },
    'John Doe #4': { 'Aljabar Linear': 82, 'Kalkulus Integral': 68, 'Geometri Analitik': 75, 'Statistika Dasar': 52 },
    'John Doe #5': { 'Aljabar Linear': 48, 'Kalkulus Integral': 42, 'Geometri Analitik': 45, 'Statistika Dasar': 38 },
    'John Doe #6': { 'Aljabar Linear': 65, 'Kalkulus Integral': 58, 'Geometri Analitik': 62, 'Statistika Dasar': 48 },
    'John Doe #7': { 'Aljabar Linear': 55, 'Kalkulus Integral': 52, 'Geometri Analitik': 48, 'Statistika Dasar': 45 },
    'John Doe #8': { 'Aljabar Linear': 78, 'Kalkulus Integral': 65, 'Geometri Analitik': 72, 'Statistika Dasar': 55 },
    'John Doe #9': { 'Aljabar Linear': 52, 'Kalkulus Integral': 48, 'Geometri Analitik': 52, 'Statistika Dasar': 42 },
    'John Doe #10': { 'Aljabar Linear': 62, 'Kalkulus Integral': 55, 'Geometri Analitik': 58, 'Statistika Dasar': 48 },
  };

  // Time series data - Daily CL averages
  const timeSeriesData = [
    { date: 'Mon', values: [52, 58, 62, 45] },
    { date: 'Tue', values: [55, 62, 65, 48] },
    { date: 'Wed', values: [58, 65, 68, 52] },
    { date: 'Thu', values: [52, 58, 62, 48] },
    { date: 'Fri', values: [62, 68, 72, 55] },
    { date: 'Sat', values: [58, 62, 65, 52] },
    { date: 'Sun', values: [55, 58, 62, 48] },
  ];

  const getCLColor = (cl) => {
    if (cl < 40) return 'bg-green-200 hover:bg-green-300';
    if (cl < 60) return 'bg-blue-200 hover:bg-blue-300';
    if (cl < 75) return 'bg-yellow-200 hover:bg-yellow-300';
    return 'bg-red-200 hover:bg-red-300';
  };

  const getCLLabel = (cl) => {
    if (cl < 40) return 'Low';
    if (cl < 60) return 'Optimal';
    if (cl < 75) return 'High';
    return 'Overload';
  };

  const getCLTextColor = (cl) => {
    if (cl < 40) return 'text-green-900';
    if (cl < 60) return 'text-blue-900';
    if (cl < 75) return 'text-yellow-900';
    return 'text-red-900';
  };

  // Calculate stats
  const allValues = Object.values(heatmapData).flatMap(obj => Object.values(obj));
  const avgCL = (allValues.reduce((a, b) => a + b, 0) / allValues.length).toFixed(1);
  const maxCL = Math.max(...allValues);
  const minCL = Math.min(...allValues);
  const overloadCount = allValues.filter(v => v >= 75).length;

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-80 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <SkeletonCard className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flame className="w-7 h-7 text-orange-500" />
            Cognitive Load Heatmap
          </h1>
          <p className="text-gray-600 mt-1">
            Visual representation of student cognitive load across topics
          </p>
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
                <p className="text-sm font-medium text-gray-600">Average CL</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{avgCL}</h3>
              </div>
              <Flame className="w-8 h-8 text-primary-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Highest CL</p>
                <h3 className="text-3xl font-bold text-danger-DEFAULT mt-2">{maxCL}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-danger-DEFAULT" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lowest CL</p>
                <h3 className="text-3xl font-bold text-success-DEFAULT mt-2">{minCL}</h3>
              </div>
              <TrendingDown className="w-8 h-8 text-success-DEFAULT" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overload Cases</p>
                <h3 className="text-3xl font-bold text-danger-DEFAULT mt-2">{overloadCount}</h3>
              </div>
              <Flame className="w-8 h-8 text-danger-DEFAULT" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filters & Controls */}
      <Card>
        <Card.Content className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="student-topic">Student vs Topic</option>
                <option value="time-series">Time Series</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Topic Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Topics</option>
                {topics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Heatmap Visualization */}
      {viewMode === 'student-topic' && (
        <Card>
          <Card.Header>
            <Card.Title>Student vs Topic Heatmap</Card.Title>
            <Card.Description>Cognitive load levels for each student across different topics</Card.Description>
          </Card.Header>
          <Card.Content className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-900 border-b-2 border-gray-300 bg-gray-50 sticky left-0 z-10">
                      Student
                    </th>
                    {topics.map(topic => (
                      <th key={topic} className="p-3 text-center font-semibold text-gray-900 border-b-2 border-gray-300 bg-gray-50 min-w-[140px]">
                        {topic}
                      </th>
                    ))}
                    <th className="p-3 text-center font-semibold text-gray-900 border-b-2 border-gray-300 bg-gray-50">
                      Avg
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => {
                    const studentData = heatmapData[student];
                    const studentAvg = (Object.values(studentData).reduce((a, b) => a + b, 0) / topics.length).toFixed(1);
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900 border-b border-gray-200 bg-white sticky left-0 z-10">
                          {student}
                        </td>
                        {topics.map(topic => {
                          const cl = studentData[topic];
                          return (
                            <td key={topic} className="p-2 border-b border-gray-200">
                              <div 
                                className={`p-3 rounded-lg text-center font-semibold transition-all cursor-pointer ${getCLColor(cl)} ${getCLTextColor(cl)}`}
                                title={`${student} - ${topic}: CL ${cl} (${getCLLabel(cl)})`}
                              >
                                {cl}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-3 text-center font-bold text-gray-900 border-b border-gray-200 bg-gray-50">
                          {studentAvg}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Topic Averages Row */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="p-3 text-gray-900 border-t-2 border-gray-300">
                      Topic Avg
                    </td>
                    {topics.map(topic => {
                      const topicValues = students.map(s => heatmapData[s][topic]);
                      const topicAvg = (topicValues.reduce((a, b) => a + b, 0) / students.length).toFixed(1);
                      return (
                        <td key={topic} className="p-3 text-center text-gray-900 border-t-2 border-gray-300">
                          {topicAvg}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center text-gray-900 border-t-2 border-gray-300">
                      {avgCL}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Time Series View */}
      {viewMode === 'time-series' && (
        <Card>
          <Card.Header>
            <Card.Title>Time Series Heatmap</Card.Title>
            <Card.Description>Daily cognitive load trends across topics</Card.Description>
          </Card.Header>
          <Card.Content className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-900 border-b-2 border-gray-300 bg-gray-50">
                      Day
                    </th>
                    {topics.map(topic => (
                      <th key={topic} className="p-3 text-center font-semibold text-gray-900 border-b-2 border-gray-300 bg-gray-50 min-w-[140px]">
                        {topic}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSeriesData.map((day, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900 border-b border-gray-200">
                        {day.date}
                      </td>
                      {day.values.map((cl, topicIdx) => (
                        <td key={topicIdx} className="p-2 border-b border-gray-200">
                          <div 
                            className={`p-3 rounded-lg text-center font-semibold transition-all cursor-pointer ${getCLColor(cl)} ${getCLTextColor(cl)}`}
                            title={`${day.date} - ${topics[topicIdx]}: CL ${cl}`}
                          >
                            {cl}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Legend */}
      <Card className="border-l-4 border-primary-600 bg-primary-50">
        <Card.Content className="p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Color Legend</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded bg-green-200 border-2 border-green-300"></div>
                  <div>
                    <p className="font-semibold text-sm">Low (0-39)</p>
                    <p className="text-xs text-gray-600">Under-challenged</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded bg-blue-200 border-2 border-blue-300"></div>
                  <div>
                    <p className="font-semibold text-sm">Optimal (40-59)</p>
                    <p className="text-xs text-gray-600">Perfect learning zone</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded bg-yellow-200 border-2 border-yellow-300"></div>
                  <div>
                    <p className="font-semibold text-sm">High (60-74)</p>
                    <p className="text-xs text-gray-600">Challenging but manageable</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded bg-red-200 border-2 border-red-300"></div>
                  <div>
                    <p className="font-semibold text-sm">Overload (75+)</p>
                    <p className="text-xs text-gray-600">Needs intervention</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

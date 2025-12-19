import { useState } from 'react';
import { FileEdit, Save, Plus, Users, CheckCircle, XCircle, AlertCircle, Upload, Trash2, Info } from 'lucide-react';
import showToast from '../utils/toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

/**
 * Data Entry Page
 * 
 * Manual entry of cognitive load measurements with validation,
 * success/error feedback, and batch entry support
 */

export default function DataEntryPage() {
  const [formData, setFormData] = useState({
    studentId: '',
    topicId: '',
    sessionDate: '',
    sessionDuration: '',
    successRate: '',
    pauseFrequency: '',
    behaviorHints: '',
    physiologicalHR: '',
  });

  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null); // null, 'success', 'error'
  const [calculatedCL, setCalculatedCL] = useState(null);
  const [batchEntries, setBatchEntries] = useState([]);
  const [showBatchMode, setShowBatchMode] = useState(false);

  // Students list (mock data)
  const students = [
    { id: 'usr_001', name: 'John Doe #1' },
    { id: 'usr_002', name: 'John Doe #2' },
    { id: 'usr_003', name: 'John Doe #3' },
    { id: 'usr_004', name: 'John Doe #4' },
    { id: 'usr_005', name: 'John Doe #5' },
  ];

  // Topics list
  const topics = [
    { id: 'tpc_001', name: 'Aljabar Linear' },
    { id: 'tpc_002', name: 'Kalkulus Integral' },
    { id: 'tpc_003', name: 'Geometri Analitik' },
    { id: 'tpc_004', name: 'Statistika Dasar' },
  ];

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.studentId) newErrors.studentId = 'Student is required';
    if (!formData.topicId) newErrors.topicId = 'Topic is required';
    if (!formData.sessionDate) newErrors.sessionDate = 'Session date is required';
    
    if (!formData.sessionDuration) {
      newErrors.sessionDuration = 'Duration is required';
    } else if (formData.sessionDuration < 1 || formData.sessionDuration > 480) {
      newErrors.sessionDuration = 'Duration must be between 1 and 480 minutes';
    }

    if (!formData.successRate) {
      newErrors.successRate = 'Success rate is required';
    } else if (formData.successRate < 0 || formData.successRate > 100) {
      newErrors.successRate = 'Success rate must be between 0 and 100';
    }

    if (!formData.pauseFrequency) {
      newErrors.pauseFrequency = 'Pause frequency is required';
    } else if (formData.pauseFrequency < 0 || formData.pauseFrequency > 10) {
      newErrors.pauseFrequency = 'Pause frequency must be between 0 and 10';
    }

    if (formData.behaviorHints && (formData.behaviorHints < 0 || formData.behaviorHints > 10)) {
      newErrors.behaviorHints = 'Behavior hints must be between 0 and 10';
    }

    if (formData.physiologicalHR && (formData.physiologicalHR < 40 || formData.physiologicalHR > 200)) {
      newErrors.physiologicalHR = 'Heart rate must be between 40 and 200 BPM';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate CL
  const calculateCL = () => {
    const sr = parseFloat(formData.successRate) || 0;
    const pf = parseFloat(formData.pauseFrequency) || 0;
    const bh = parseFloat(formData.behaviorHints) || 0;
    const ph = parseFloat(formData.physiologicalHR) || 0;

    // Normalize values to 0-100 scale
    const srNorm = sr;
    const pfNorm = (pf / 10) * 100;
    const bhNorm = (bh / 10) * 100;
    const phNorm = ph > 0 ? ((ph - 40) / 160) * 100 : 50; // Default 50 if not provided

    // CL formula (inverted SR since lower success = higher CL)
    const cl = (0.35 * (100 - srNorm)) + (0.30 * pfNorm) + (0.20 * bhNorm) + (0.15 * phNorm);
    
    return Math.round(cl * 10) / 10; // Round to 1 decimal
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitStatus('error');
      return;
    }

    try {
      const cl = calculateCL();
      setCalculatedCL(cl);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const entry = {
        ...formData,
        calculatedCL: cl,
        timestamp: new Date().toISOString(),
      };

      console.log('CL measurement saved:', entry);
      showToast.success(`CL measurement saved successfully! (CL: ${cl})`);
      setSubmitStatus('success');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        resetForm();
      }, 2000);

    } catch (error) {
      console.error('Error saving measurement:', error);
      showToast.error('Failed to save measurement. Please try again.');
      setSubmitStatus('error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
    // Reset submit status
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      topicId: '',
      sessionDate: '',
      sessionDuration: '',
      successRate: '',
      pauseFrequency: '',
      behaviorHints: '',
      physiologicalHR: '',
    });
    setErrors({});
    setSubmitStatus(null);
    setCalculatedCL(null);
  };

  const addToBatch = () => {
    if (!validateForm()) {
      return;
    }

    const cl = calculateCL();
    const entry = {
      id: Date.now(),
      ...formData,
      calculatedCL: cl,
      studentName: students.find(s => s.id === formData.studentId)?.name,
      topicName: topics.find(t => t.id === formData.topicId)?.name,
    };

    setBatchEntries([...batchEntries, entry]);
    showToast.success('Entry added to batch queue');
    resetForm();
  };

  const removeBatchEntry = (id) => {
    setBatchEntries(batchEntries.filter(e => e.id !== id));
    showToast.info('Entry removed from batch');
  };

  const submitBatch = async () => {
    if (batchEntries.length === 0) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Batch entries saved:', batchEntries);
      showToast.success(`${batchEntries.length} measurements saved successfully!`);
      setSubmitStatus('success');
      setBatchEntries([]);
      
      setTimeout(() => {
        setSubmitStatus(null);
        setShowBatchMode(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving batch:', error);
      showToast.error('Failed to save batch entries. Please try again.');
      setSubmitStatus('error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileEdit className="w-7 h-7 text-primary-600" />
            Manual Data Entry
          </h1>
          <p className="text-gray-600 mt-1">
            Enter cognitive load measurements with validation and batch support
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showBatchMode ? 'primary' : 'outline'}
            onClick={() => setShowBatchMode(!showBatchMode)}
          >
            <Upload className="w-4 h-4 mr-2" />
            {showBatchMode ? 'Single Mode' : 'Batch Mode'}
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {submitStatus === 'success' && (
        <div className="bg-success-light border-l-4 border-success-DEFAULT p-4 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-success-DEFAULT flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-success-DEFAULT">Success!</h4>
            <p className="text-sm text-success-DEFAULT mt-1">
              {showBatchMode 
                ? `Successfully saved ${batchEntries.length} measurements.`
                : `CL measurement saved successfully. Calculated CL: ${calculatedCL}`
              }
            </p>
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="bg-danger-light border-l-4 border-danger-DEFAULT p-4 rounded-lg flex items-start gap-3">
          <XCircle className="w-5 h-5 text-danger-DEFAULT flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-danger-DEFAULT">Validation Error</h4>
            <p className="text-sm text-danger-DEFAULT mt-1">
              Please check the form for errors and try again.
            </p>
            {Object.keys(errors).length > 0 && (
              <ul className="text-sm text-danger-DEFAULT mt-2 list-disc list-inside">
                {Object.values(errors).filter(Boolean).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Entries</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">0</h3>
              </div>
              <FileEdit className="w-8 h-8 text-primary-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">5</h3>
              </div>
              <Plus className="w-8 h-8 text-secondary-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Students Measured</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">5</h3>
              </div>
              <Users className="w-8 h-8 text-success-DEFAULT" />
            </div>
          </Card.Content>
        </Card>

        {showBatchMode && (
          <Card>
            <Card.Content className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Batch Queue</p>
                  <h3 className="text-3xl font-bold text-primary-600 mt-2">{batchEntries.length}</h3>
                </div>
                <Upload className="w-8 h-8 text-primary-600" />
              </div>
            </Card.Content>
          </Card>
        )}
      </div>

      {/* Batch Queue */}
      {showBatchMode && batchEntries.length > 0 && (
        <Card className="border-l-4 border-primary-600">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <Card.Title>Batch Queue ({batchEntries.length} entries)</Card.Title>
                <Card.Description>Review and submit all entries at once</Card.Description>
              </div>
              <Button variant="primary" onClick={submitBatch}>
                <Save className="w-4 h-4 mr-2" />
                Submit All ({batchEntries.length})
              </Button>
            </div>
          </Card.Header>
          <Card.Content className="p-6">
            <div className="space-y-2">
              {batchEntries.map((entry, idx) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-sm font-semibold text-gray-700 w-8">#{idx + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{entry.studentName}</p>
                      <p className="text-xs text-gray-600">{entry.topicName} • {entry.sessionDate}</p>
                    </div>
                    <Badge clValue={entry.calculatedCL} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBatchEntry(entry.id)}
                  >
                    <Trash2 className="w-4 h-4 text-danger-DEFAULT" />
                  </Button>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Data Entry Form */}
      <Card>
        <Card.Header>
          <Card.Title>
            {showBatchMode ? 'Add Entry to Batch' : 'New CL Measurement'}
          </Card.Title>
          <Card.Description>
            {showBatchMode 
              ? 'Fill the form and add to batch queue. Submit all at once when ready.'
              : 'Enter all required fields to calculate and save cognitive load measurement'
            }
          </Card.Description>
        </Card.Header>
        <Card.Content className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Session Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student <span className="text-danger-DEFAULT">*</span>
                  </label>
                  <select
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.studentId ? 'border-danger-DEFAULT' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select student...</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                  {errors.studentId && (
                    <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.studentId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic <span className="text-danger-DEFAULT">*</span>
                  </label>
                  <select
                    name="topicId"
                    value={formData.topicId}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.topicId ? 'border-danger-DEFAULT' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select topic...</option>
                    {topics.map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.name}</option>
                    ))}
                  </select>
                  {errors.topicId && (
                    <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.topicId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Date <span className="text-danger-DEFAULT">*</span>
                  </label>
                  <input
                    type="date"
                    name="sessionDate"
                    value={formData.sessionDate}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.sessionDate ? 'border-danger-DEFAULT' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.sessionDate && (
                    <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.sessionDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) <span className="text-danger-DEFAULT">*</span>
                  </label>
                  <input
                    type="number"
                    name="sessionDuration"
                    value={formData.sessionDuration}
                    onChange={handleChange}
                    placeholder="e.g., 60"
                    min="1"
                    max="480"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.sessionDuration ? 'border-danger-DEFAULT' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.sessionDuration && (
                    <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.sessionDuration}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CL Indicators */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CL Indicators</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Success Rate (0-100%) <span className="text-danger-DEFAULT">*</span>
                  </label>
                  <input
                    type="number"
                    name="successRate"
                    value={formData.successRate}
                    onChange={handleChange}
                    placeholder="e.g., 85"
                    min="0"
                    max="100"
                    step="0.1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.successRate ? 'border-danger-DEFAULT' : 'border-gray-300'
                    }`}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Percentage of tasks completed correctly</p>
                  {errors.successRate && (
                    <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.successRate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pause Frequency (0-10) <span className="text-danger-DEFAULT">*</span>
                  </label>
                  <input
                    type="number"
                    name="pauseFrequency"
                    value={formData.pauseFrequency}
                    onChange={handleChange}
                    placeholder="e.g., 5"
                    min="0"
                    max="10"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.pauseFrequency ? 'border-danger-DEFAULT' : 'border-gray-300'
                    }`}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of significant pauses during session</p>
                  {errors.pauseFrequency && (
                    <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.pauseFrequency}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Behavior Hints Used (0-10)
                  </label>
                  <input
                    type="number"
                    name="behaviorHints"
                    value={formData.behaviorHints}
                    onChange={handleChange}
                    placeholder="e.g., 3"
                    min="0"
                    max="10"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.behaviorHints ? 'border-danger-DEFAULT' : 'border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Times student asked for help or hints</p>
                  {errors.behaviorHints && (
                    <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.behaviorHints}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Physiological HR (BPM)
                  </label>
                  <input
                    type="number"
                    name="physiologicalHR"
                    value={formData.physiologicalHR}
                    onChange={handleChange}
                    placeholder="e.g., 85"
                    min="40"
                    max="200"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.physiologicalHR ? 'border-danger-DEFAULT' : 'border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Average heart rate during session (optional)</p>
                  {errors.physiologicalHR && (
                    <p className="text-xs text-danger-DEFAULT mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.physiologicalHR}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetForm}>
                Clear Form
              </Button>
              <div className="flex gap-2">
                {showBatchMode && (
                  <Button type="button" variant="outline" onClick={addToBatch}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Batch
                  </Button>
                )}
                <Button type="submit" variant="primary">
                  <Save className="w-4 h-4 mr-2" />
                  {showBatchMode ? 'Calculate & Add' : 'Calculate & Save CL'}
                </Button>
              </div>
            </div>
          </form>
        </Card.Content>
      </Card>

      {/* Info Card */}
      <Card className="border-l-4 border-primary-600 bg-primary-50">
        <Card.Content className="p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">How CL is Calculated</h4>
              <p className="text-sm text-gray-700 mb-2">
                <strong>CL Index = (0.35 × SR) + (0.30 × PF) + (0.20 × BH) + (0.15 × PH)</strong>
              </p>
              <p className="text-xs text-gray-600">
                SR = Success Rate (inverted) | PF = Pause Frequency | BH = Behavioral Hints | PH = Physiological (HR)
              </p>
              <p className="text-xs text-gray-600 mt-2">
                All values are normalized to 0-100 scale. Success Rate is inverted (lower success = higher CL).
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

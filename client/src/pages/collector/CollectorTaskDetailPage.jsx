import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Play,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Camera,
  Trash2,
  Shield,
  Truck,
  Check,
  Info,
  Calendar,
  X
} from 'lucide-react';
import CollectorLayout from '../../components/collector/CollectorLayout';
import Button from '../../components/common/Button';
import LocationPickerMap from '../../components/map/LocationPickerMap';
import {
  getCollectorTaskById,
  acceptCollectorTask,
  startCollectorTask,
  submitCollectorVerification
} from '../../services/collectorService';

export const CollectorTaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  // Evidence submission state
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidencePreviews, setEvidencePreviews] = useState([]);
  const [completionNotes, setCompletionNotes] = useState('');
  const [evidenceError, setEvidenceError] = useState('');

  // Optional before files
  const [beforeFiles, setBeforeFiles] = useState([]);
  const [beforePreviews, setBeforePreviews] = useState([]);

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getCollectorTaskById(id);
      if (res?.success && res.task) {
        setTask(res.task);
      } else {
        setError('Task allocation record not found.');
      }
    } catch (err) {
      console.error('[Collector Task Detail Error]:', err);
      if (err.response?.status === 403) {
        setError('Access forbidden: You cannot view another collector’s assignment.');
      } else if (err.response?.status === 404) {
        setError('Task record not found.');
      } else {
        setError(err.response?.data?.message || 'Failed to load task details.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // Handle Before Files Selection
  const handleBeforeFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;

    if (beforeFiles.length + selected.length > 5) {
      alert('You can attach a maximum of 5 before-work photos.');
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of selected) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} exceeds the 5 MB limit.`);
        continue;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setBeforeFiles((prev) => [...prev, ...validFiles]);
    setBeforePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeBeforeFile = (index) => {
    URL.revokeObjectURL(beforePreviews[index]);
    setBeforeFiles((prev) => prev.filter((_, i) => i !== index));
    setBeforePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle After/Evidence Files Selection
  const handleEvidenceFileChange = (e) => {
    setEvidenceError('');
    const selected = Array.from(e.target.files);
    if (!selected.length) return;

    if (evidenceFiles.length + selected.length > 5) {
      setEvidenceError('You can attach a maximum of 5 completion evidence photos.');
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of selected) {
      if (file.size > 5 * 1024 * 1024) {
        setEvidenceError(`File "${file.name}" exceeds 5 MB.`);
        continue;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setEvidenceFiles((prev) => [...prev, ...validFiles]);
    setEvidencePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeEvidenceFile = (index) => {
    URL.revokeObjectURL(evidencePreviews[index]);
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
    setEvidencePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Actions
  const handleAccept = async () => {
    try {
      setSubmitting(true);
      const res = await acceptCollectorTask(id);
      if (res?.success) {
        await fetchTask();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async () => {
    try {
      setSubmitting(true);
      let formData = null;

      if (beforeFiles.length > 0) {
        formData = new FormData();
        beforeFiles.forEach((file) => {
          formData.append('images', file);
        });
      }

      const res = await startCollectorTask(id, formData);
      if (res?.success) {
        await fetchTask();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to commence work.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    setEvidenceError('');

    if (evidenceFiles.length === 0) {
      setEvidenceError('At least one completion evidence photograph is required.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      evidenceFiles.forEach((file) => {
        formData.append('images', file);
      });
      if (completionNotes.trim()) {
        formData.append('notes', completionNotes.trim());
      }

      const res = await submitCollectorVerification(id, formData);
      if (res?.success) {
        // Clear local file buffers
        evidencePreviews.forEach((url) => URL.revokeObjectURL(url));
        setEvidenceFiles([]);
        setEvidencePreviews([]);
        await fetchTask();
      }
    } catch (err) {
      console.error('[Evidence Submit Error]:', err);
      setEvidenceError(err.response?.data?.message || 'Failed to upload completion evidence.');
    } finally {
      setSubmitting(false);
    }
  };

  const complaint = task?.complaint;
  const [lng, lat] = complaint?.location?.coordinates || [0, 0];
  const hasCoords = Boolean(lat && lng);

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'complaint-priority-high';
      case 'medium':
        return 'complaint-priority-medium';
      case 'low':
      default:
        return 'complaint-priority-low';
    }
  };

  const stepperStages = [
    { key: 'assigned', label: '1. Dispatched' },
    { key: 'accepted', label: '2. Accepted' },
    { key: 'in_progress', label: '3. In Remediation' },
    { key: 'submitted_for_verification', label: '4. In Audit' },
    { key: 'verified', label: '5. Completed' }
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'assigned':
        return 0;
      case 'accepted':
        return 1;
      case 'in_progress':
        return 2;
      case 'submitted_for_verification':
        return 3;
      case 'verified':
        return 4;
      default:
        return -1;
    }
  };

  const currentStageIdx = getStageIndex(task?.status);

  return (
    <CollectorLayout
      title={`Task ${complaint?.complaintCode || 'Detail'}`}
      subtitle="Execution workflow, location navigation, and evidence submission."
    >
      <div className="admin-page-container">
        {/* Back navigation */}
        <div style={{ marginBottom: '1rem' }}>
          <Link
            to="/collector/tasks"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-forest)',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Route Queue</span>
          </Link>
        </div>

        {loading ? (
          <div className="complaints-card" style={{ padding: '2.5rem' }}>
            <div className="notif-loading-wrap">
              <div className="notif-skeleton-item" style={{ height: '60px' }} />
              <div className="notif-skeleton-item" style={{ height: '140px' }} />
              <div className="notif-skeleton-item" style={{ height: '240px' }} />
            </div>
          </div>
        ) : error ? (
          <div className="complaints-empty-state">
            <AlertTriangle size={36} color="var(--color-clay)" />
            <h3 style={{ color: 'var(--color-forest)', margin: '12px 0 6px 0' }}>Access Notice</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              {error}
            </p>
            <Button variant="secondary" size="sm" to="/collector/tasks">
              Back to My Tasks
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* WORKFLOW PROGRESS STEPPER */}
            <div className="complaints-card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
                Operational State Progression
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', paddingBottom: '8px' }}>
                {stepperStages.map((stage, idx) => {
                  const isDone = currentStageIdx >= idx;
                  const isCurrent = currentStageIdx === idx;

                  return (
                    <div
                      key={stage.key}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: '1 1 0',
                        minWidth: '85px',
                        textAlign: 'center'
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isCurrent
                            ? 'var(--color-lime)'
                            : isDone
                            ? 'var(--color-forest)'
                            : 'var(--color-paper)',
                          color: isCurrent
                            ? 'var(--color-forest)'
                            : isDone
                            ? '#ffffff'
                            : 'var(--color-muted)',
                          border: isCurrent
                            ? '2px solid var(--color-forest)'
                            : '2px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          marginBottom: '6px'
                        }}
                      >
                        {isDone && !isCurrent ? <Check size={14} /> : idx + 1}
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: isCurrent ? 700 : isDone ? 600 : 500,
                          color: isCurrent
                            ? 'var(--color-forest)'
                            : isDone
                            ? 'var(--color-forest)'
                            : 'var(--color-muted)'
                        }}
                      >
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MAIN TASK DETAILS & MAP SPLIT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Left Column: Complaint & Task Specifications */}
              <div className="complaints-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-forest)' }}>
                    {complaint?.complaintCode}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="complaint-category-pill" style={{ textTransform: 'capitalize' }}>
                      {complaint?.category}
                    </span>
                    <span className={`complaint-priority-pill ${getPriorityBadgeClass(complaint?.priority)}`}>
                      {complaint?.priority} Priority
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Citizen Incident Report
                  </h4>
                  <p style={{ color: 'var(--color-forest)', fontSize: '0.925rem', lineHeight: 1.5, margin: 0 }}>
                    {complaint?.description}
                  </p>
                </div>

                {/* Citizen Submitted Evidence Photos */}
                {complaint?.images && complaint.images.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Citizen Reported Photos ({complaint.images.length})
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {complaint.images.map((img, i) => (
                        <img
                          key={i}
                          src={img.url}
                          alt={`Complaint evidence ${i + 1}`}
                          onClick={() => setActivePhotoModal(img.url)}
                          style={{
                            width: '76px',
                            height: '76px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer'
                          }}
                          title="Click to view full photo"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Before-Work Photos if any */}
                {task?.beforeImages && task.beforeImages.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Before-Remediation Photos ({task.beforeImages.length})
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {task.beforeImages.map((img, i) => (
                        <img
                          key={i}
                          src={img.url}
                          alt={`Before cleanup ${i + 1}`}
                          onClick={() => setActivePhotoModal(img.url)}
                          style={{
                            width: '76px',
                            height: '76px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer'
                          }}
                          title="Click to view full photo"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignment Metadata */}
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-muted)' }}>Assigned At:</span>
                    <strong style={{ color: 'var(--color-forest)' }}>
                      {task?.assignedAt ? new Date(task.assignedAt).toLocaleString() : '—'}
                    </strong>
                  </div>
                  {task?.acceptedAt && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-muted)' }}>Accepted At:</span>
                      <strong style={{ color: 'var(--color-forest)' }}>
                        {new Date(task.acceptedAt).toLocaleString()}
                      </strong>
                    </div>
                  )}
                  {task?.startedAt && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-muted)' }}>Started At:</span>
                      <strong style={{ color: 'var(--color-forest)' }}>
                        {new Date(task.startedAt).toLocaleString()}
                      </strong>
                    </div>
                  )}
                  {task?.submittedAt && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-muted)' }}>Submitted At:</span>
                      <strong style={{ color: 'var(--color-forest)' }}>
                        {new Date(task.submittedAt).toLocaleString()}
                      </strong>
                    </div>
                  )}
                  {task?.notes && (
                    <div style={{ marginTop: '6px', padding: '8px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ color: 'var(--color-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Collector Completion Note:</span>
                      <span style={{ color: 'var(--color-forest)' }}>{task.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Location Map & External Navigation */}
              <div className="complaints-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={18} color="var(--color-clay)" />
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-forest)', margin: 0 }}>
                      Location &amp; Navigation
                    </h3>
                  </div>
                </div>

                <div style={{ marginBottom: '10px', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-forest)' }}>
                    {complaint?.location?.address?.formattedAddress || 'Incident location mapped'}
                  </div>
                  {complaint?.location?.address?.landmark && (
                    <div style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>
                      Landmark: {complaint.location.address.landmark}
                    </div>
                  )}
                  <div style={{ color: 'var(--color-muted)', fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '2px' }}>
                    GPS: {lat?.toFixed(5)}, {lng?.toFixed(5)}
                  </div>
                </div>

                {/* Leaflet Map Preview */}
                <div style={{ flex: 1, minHeight: '260px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                  {hasCoords ? (
                    <LocationPickerMap
                      latitude={lat}
                      longitude={lng}
                      height="260px"
                      readOnly={true}
                    />
                  ) : (
                    <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
                      Coordinates unavailable
                    </div>
                  )}
                </div>

                {/* Direct GPS Directions External Buttons */}
                {hasCoords && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px',
                        backgroundColor: 'var(--color-forest)',
                        color: 'var(--color-lime)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={14} />
                      <span>Google Maps</span>
                    </a>

                    <a
                      href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${lat}%2C${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px',
                        backgroundColor: 'var(--color-paper)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-forest)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={14} />
                      <span>OpenStreetMap</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION CONTROLS SURFACE BASED ON STATE */}
            {task?.status === 'assigned' && (
              <div className="complaints-card" style={{ borderLeft: '4px solid #d97706', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', color: 'var(--color-forest)', fontSize: '1.1rem' }}>
                      Ready to accept this route assignment?
                    </h3>
                    <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                      Accepting confirms you will navigate to the location and handle waste remediation.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleAccept}
                    disabled={submitting}
                    style={{ minHeight: '44px', padding: '0 24px', fontWeight: 700 }}
                  >
                    {submitting ? 'Accepting...' : 'Accept Assignment'}
                  </Button>
                </div>
              </div>
            )}

            {task?.status === 'accepted' && (
              <div className="complaints-card" style={{ borderLeft: '4px solid #0284c7', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 6px 0', color: 'var(--color-forest)', fontSize: '1.1rem' }}>
                  Arrived on Site? Begin Remediation
                </h3>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                  Starting work updates the civic tracking state to "In Progress" and notifies dispatch supervisors. You may optionally take before-work photos.
                </p>

                {/* Optional Before Photos Picker */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-forest)' }}>
                    <Camera size={16} />
                    <span>Attach Optional Before-Photos (Max 5)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleBeforeFileChange}
                      style={{ display: 'none' }}
                      disabled={submitting}
                    />
                  </label>

                  {beforePreviews.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {beforePreviews.map((url, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img
                            src={url}
                            alt="Before preview"
                            style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                          />
                          <button
                            type="button"
                            onClick={() => removeBeforeFile(i)}
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: '#dc2626',
                              color: '#fff',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="md"
                  icon={Play}
                  iconPosition="left"
                  onClick={handleStart}
                  disabled={submitting}
                  style={{ minHeight: '44px', padding: '0 24px', fontWeight: 700 }}
                >
                  {submitting ? 'Starting Work...' : 'Commence Work on Site'}
                </Button>
              </div>
            )}

            {task?.status === 'in_progress' && (
              <div className="complaints-card" style={{ borderLeft: '4px solid #d97706', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 6px 0', color: 'var(--color-forest)', fontSize: '1.15rem' }}>
                  Submit Completion Evidence for Verification
                </h3>
                <p style={{ margin: '0 0 1.25rem 0', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                  CleanLoop requires photo proof of the cleared location before tasks can move to municipal audit. Collectors cannot directly mark complaints as resolved.
                </p>

                {evidenceError && (
                  <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', border: '1px solid #f87171', borderRadius: 'var(--radius-sm)', color: '#b91c1c', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    {evidenceError}
                  </div>
                )}

                <form onSubmit={handleSubmitEvidence}>
                  {/* Photo picker */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-forest)', marginBottom: '6px' }}>
                      Required Remediation Evidence Photos (1 to 5 images, Max 5MB each) *
                    </label>

                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 18px', backgroundColor: 'var(--color-forest)', color: 'var(--color-lime)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 }}>
                      <Camera size={18} />
                      <span>Take or Select Completion Photos</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleEvidenceFileChange}
                        style={{ display: 'none' }}
                        disabled={submitting}
                      />
                    </label>

                    {evidencePreviews.length > 0 && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {evidencePreviews.map((url, i) => (
                          <div key={i} style={{ position: 'relative' }}>
                            <img
                              src={url}
                              alt="Evidence preview"
                              style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '2px solid var(--color-forest)' }}
                            />
                            <button
                              type="button"
                              onClick={() => removeEvidenceFile(i)}
                              aria-label="Remove photo"
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Completion Notes */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-forest)', marginBottom: '4px' }}>
                      Field Remediation Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      placeholder="e.g., Cleared 3 bags of plastic waste; sanitized surrounding pavement with civic disinfectant..."
                      disabled={submitting}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-paper)',
                        color: 'var(--color-forest)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    icon={Upload}
                    iconPosition="left"
                    disabled={submitting || evidenceFiles.length === 0}
                    style={{ minHeight: '48px', padding: '0 28px', fontWeight: 700 }}
                  >
                    {submitting ? 'Uploading Proof & Submitting...' : 'Submit Evidence for Verification →'}
                  </Button>
                </form>
              </div>
            )}

            {task?.status === 'submitted_for_verification' && (
              <div className="complaints-card" style={{ borderLeft: '4px solid #0f766e', backgroundColor: '#f0fdfa', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Clock size={24} color="#0f766e" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', color: '#0f766e', fontSize: '1.1rem' }}>
                      Remediation Submitted — Awaiting Municipal Verification
                    </h3>
                    <p style={{ margin: '0 0 1rem 0', color: '#134e4a', fontSize: '0.875rem' }}>
                      Your completion evidence has been dispatched to municipal administrators for audit approval. Further edits are locked during review.
                    </p>

                    {task.completionImages && task.completionImages.length > 0 && (
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                          Submitted Verification Photographs ({task.completionImages.length})
                        </span>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {task.completionImages.map((img, i) => (
                            <img
                              key={i}
                              src={img.url}
                              alt={`Submitted completion proof ${i + 1}`}
                              onClick={() => setActivePhotoModal(img.url)}
                              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid #99f6e4' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {task?.status === 'verified' && (
              <div className="complaints-card" style={{ borderLeft: '4px solid #16a34a', backgroundColor: '#f0fdf4', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', color: '#16a34a', fontSize: '1.1rem' }}>
                      Task Verified &amp; Officially Closed
                    </h3>
                    <p style={{ margin: '0 0 1rem 0', color: '#14532d', fontSize: '0.875rem' }}>
                      Remediation proof was audited and approved by municipal supervisory staff. The civic complaint has been officially resolved.
                    </p>

                    {task.completionImages && task.completionImages.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {task.completionImages.map((img, i) => (
                          <img
                            key={i}
                            src={img.url}
                            alt={`Verified completion ${i + 1}`}
                            onClick={() => setActivePhotoModal(img.url)}
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid #bbf7d0' }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Photo Preview Modal */}
      {activePhotoModal && (
        <div className="admin-modal-backdrop" onClick={() => setActivePhotoModal(null)}>
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActivePhotoModal(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
            <img
              src={activePhotoModal}
              alt="Enlarged evidence"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </CollectorLayout>
  );
};

export default CollectorTaskDetailPage;


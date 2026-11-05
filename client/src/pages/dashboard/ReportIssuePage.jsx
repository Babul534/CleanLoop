import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UploadCloud,
  X,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Layers,
  Leaf,
  HardHat,
  Trash2,
  Factory,
  Boxes,
  HelpCircle,
  Sparkles,
  Send
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import LocationPickerMap from '../../components/map/LocationPickerMap';
import Button from '../../components/common/Button';
import { createComplaint } from '../../services/complaintService';

const CATEGORIES = [
  {
    id: 'plastic',
    label: 'Plastic Waste',
    desc: 'Bottles, film bags, single-use containers, plastics',
    icon: Layers
  },
  {
    id: 'organic',
    label: 'Organic Waste',
    desc: 'Food scraps, agricultural biomass, degradable matter',
    icon: Leaf
  },
  {
    id: 'construction',
    label: 'Construction Waste',
    desc: 'Rubble, concrete fragments, scrap lumber, tiles',
    icon: HardHat
  },
  {
    id: 'household',
    label: 'Household Waste',
    desc: 'General domestic rubbish, cartons, daily litter',
    icon: Trash2
  },
  {
    id: 'industrial',
    label: 'Industrial Waste',
    desc: 'Chemical residues, machine packing, manufacturing scrap',
    icon: Factory
  },
  {
    id: 'mixed',
    label: 'Mixed Waste',
    desc: 'Multi-stream unsegregated piles, dense trash dumps',
    icon: Boxes
  },
  {
    id: 'other',
    label: 'Other',
    desc: 'Specialized debris, bulk scrap or unclassified waste',
    icon: HelpCircle
  }
];

const PRIORITIES = [
  {
    id: 'low',
    label: 'Low',
    desc: 'Contained waste, minimal neighborhood disruption'
  },
  {
    id: 'medium',
    label: 'Medium',
    desc: 'Roadside debris, standard pedestrian or curb obstruction'
  },
  {
    id: 'high',
    label: 'High',
    desc: 'Hazardous runoff, waterway proximity, severe obstruction'
  }
];

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ReportIssuePage = () => {
  const navigate = useNavigate();

  // Form State
  const [images, setImages] = useState([]); // Array of File objects
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [reportedPriority, setReportedPriority] = useState('medium');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [formattedAddress, setFormattedAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [locationSource, setLocationSource] = useState('manual');

  // UI & Loading States
  const [dragOver, setDragOver] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  const fileInputRef = useRef(null);

  // Handle image files selection
  const handleFiles = (incomingFiles) => {
    setFormError('');
    const newFiles = Array.from(incomingFiles);

    if (images.length + newFiles.length > 5) {
      setFormError('You can attach a maximum of 5 photographs.');
      return;
    }

    const validatedItems = [];
    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFormError(`"${file.name}" is not supported. Use JPG, PNG, or WEBP.`);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setFormError(`"${file.name}" exceeds the 5 MB file size limit.`);
        return;
      }
      validatedItems.push({
        file,
        preview: URL.createObjectURL(file)
      });
    }

    setImages((prev) => [...prev, ...validatedItems]);
  };

  const removeImage = (index) => {
    setImages((prev) => {
      if (prev[index]?.preview) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Browser Geolocation API
  const handleGetLocation = () => {
    setGpsMessage('');
    setFormError('');

    if (!('geolocation' in navigator)) {
      setGpsMessage('Geolocation is not supported by your browser. Please click the map below.');
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setLocationSource('gps');
        setGpsLoading(false);
        setGpsMessage(`Captured current coordinates: ${lat}, ${lng}`);
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsMessage('Location permission was denied. You can click on the map below instead.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsMessage('Location information is unavailable. Please click on the map.');
            break;
          case error.TIMEOUT:
            setGpsMessage('GPS request timed out. Please click on the map.');
            break;
          default:
            setGpsMessage('Could not acquire location. Please click on the map.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Map click handler
  const handleMapCoordChange = ({ lat, lng }) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationSource('manual');
    setGpsMessage(`Selected on map: ${lat}, ${lng}`);
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');

    // Validations
    if (images.length === 0) {
      setFormError('Please attach at least one photograph of the waste.');
      return;
    }

    if (!category) {
      setFormError('Please select a waste category.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setFormError('Please provide a description of at least 10 characters.');
      return;
    }

    if (latitude === null || longitude === null) {
      setFormError('Please select the geographic location of the waste using GPS or by clicking the map.');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('reportedPriority', reportedPriority);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('locationSource', locationSource);
      if (formattedAddress.trim()) formData.append('formattedAddress', formattedAddress.trim());
      if (landmark.trim()) formData.append('landmark', landmark.trim());

      images.forEach((item) => {
        formData.append('images', item.file);
      });

      const result = await createComplaint(formData);

      if (result?.success && result.complaint) {
        setSubmittedComplaint(result.complaint);
      } else {
        throw new Error(result?.message || 'Failed to submit complaint.');
      }
    } catch (err) {
      console.error('[Submit Complaint Error]:', err);
      const serverMsg =
        err.response?.data?.message || err.message || 'Submission failed. Please check your data and retry.';
      setFormError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Report a Problem"
      subtitle="Report waste in your neighborhood. Every submission triggers accountable municipal cleanup."
    >
      <div className="report-page-header">
        <Link to="/dashboard" className="report-backlink">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
        <h2 className="report-page-title">Report a problem. Improve your neighborhood.</h2>
        <p className="report-page-subtitle">
          Share what you found, show us where it is, and help the cleaning team take action.
        </p>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} className="auth-alert-icon" />
          <div className="auth-alert-content">
            <strong>Submission Notice:</strong> {formError}
          </div>
        </div>
      )}

      <form className="report-form" onSubmit={handleSubmit} noValidate>
        {/* SECTION 1: PHOTOGRAPHS */}
        <section className="form-section-card">
          <div className="form-section-header">
            <span className="form-section-number">1</span>
            <div className="form-section-title-wrap">
              <h3>Photographic Evidence</h3>
              <p>Upload 1 to 5 clear photographs of the waste (JPEG, PNG, WEBP, up to 5 MB each).</p>
            </div>
          </div>

          <div
            className={`photo-dropzone ${dragOver ? 'is-dragover' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files) {
                handleFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
            />
            <UploadCloud size={36} className="photo-dropzone-icon" />
            <div className="photo-dropzone-text">
              Click to browse or drag &amp; drop photos here
            </div>
            <p className="photo-dropzone-hint">
              Selected: {images.length} / 5 photographs
            </p>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="photo-previews-grid">
              {images.map((item, idx) => (
                <div key={idx} className="photo-preview-item">
                  <img src={item.preview} alt={`Upload ${idx + 1}`} className="photo-preview-img" />
                  <button
                    type="button"
                    className="photo-preview-remove-btn"
                    onClick={() => removeImage(idx)}
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: WASTE CATEGORY */}
        <section className="form-section-card">
          <div className="form-section-header">
            <span className="form-section-number">2</span>
            <div className="form-section-title-wrap">
              <h3>Waste Category</h3>
              <p>Choose the category that best describes the majority of the waste present.</p>
            </div>
          </div>

          <div className="category-grid">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-card-btn ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setCategory(cat.id)}
                >
                  <div className="category-card-icon">
                    <Icon size={18} />
                  </div>
                  <div className="category-card-name">{cat.label}</div>
                  <p className="category-card-desc">{cat.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: PROBLEM DESCRIPTION */}
        <section className="form-section-card">
          <div className="form-section-header">
            <span className="form-section-number">3</span>
            <div className="form-section-title-wrap">
              <h3>Describe the Problem</h3>
              <p>Provide specific details regarding the waste condition, hazards, or obstruction.</p>
            </div>
          </div>

          <div className="auth-input-group">
            <textarea
              id="report-desc"
              rows={4}
              maxLength={1000}
              required
              placeholder="Tell us what happened, approximate volume, and what kind of waste is present..."
              className="auth-input"
              style={{ height: 'auto', padding: '0.75rem', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '4px' }}>
              <span>Minimum 10 characters</span>
              <span>{1000 - description.length} characters remaining</span>
            </div>
          </div>
        </section>

        {/* SECTION 4: PRIORITY SELECTION */}
        <section className="form-section-card">
          <div className="form-section-header">
            <span className="form-section-number">4</span>
            <div className="form-section-title-wrap">
              <h3>Suggested Priority</h3>
              <p>Indicate the civic urgency. Operational dispatch priority is validated by municipal audit.</p>
            </div>
          </div>

          <div className="priority-options-grid">
            {PRIORITIES.map((pri) => {
              const isSelected = reportedPriority === pri.id;
              return (
                <button
                  key={pri.id}
                  type="button"
                  className={`priority-card-btn ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setReportedPriority(pri.id)}
                >
                  <div className="priority-card-title">{pri.label} Priority</div>
                  <p className="priority-card-desc">{pri.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 5: GEOLOCATION & MAP */}
        <section className="form-section-card">
          <div className="form-section-header">
            <span className="form-section-number">5</span>
            <div className="form-section-title-wrap">
              <h3>Incident Location</h3>
              <p>Use your current GPS coordinates or click directly on the interactive map.</p>
            </div>
          </div>

          <div className="location-actions-bar">
            <Button
              variant="outline"
              size="sm"
              icon={Navigation}
              onClick={handleGetLocation}
              disabled={gpsLoading}
            >
              {gpsLoading ? 'Acquiring GPS Signal...' : 'Use My Current Location'}
            </Button>

            <span className="location-coords-badge">
              <MapPin size={14} />
              {latitude !== null && longitude !== null
                ? `Coordinates: ${latitude}, ${longitude}`
                : 'No coordinates selected yet'}
            </span>
          </div>

          {gpsMessage && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-forest)', margin: '0 0 1rem 0' }}>
              {gpsMessage}
            </p>
          )}

          {/* Leaflet + OpenStreetMap Picker */}
          <LocationPickerMap
            latitude={latitude}
            longitude={longitude}
            onChange={handleMapCoordChange}
            height="320px"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
            <div className="auth-input-group">
              <label htmlFor="report-address" className="auth-label">
                Street Address / Area
              </label>
              <input
                id="report-address"
                type="text"
                placeholder="e.g. 42 Elm Street, Ward 7"
                className="auth-input"
                value={formattedAddress}
                onChange={(e) => setFormattedAddress(e.target.value)}
              />
            </div>

            <div className="auth-input-group">
              <label htmlFor="report-landmark" className="auth-label">
                Landmark <span className="auth-label-optional">(Optional)</span>
              </label>
              <input
                id="report-landmark"
                type="text"
                placeholder="e.g. Opposite Metro Gate 3"
                className="auth-input"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* SECTION 6: REVIEW & SUBMIT */}
        <section className="form-section-card">
          <div className="form-section-header">
            <span className="form-section-number">6</span>
            <div className="form-section-title-wrap">
              <h3>Review and Submit</h3>
              <p>Verify summary details before publishing to municipal collection queue.</p>
            </div>
          </div>

          <div className="review-summary-box">
            <div className="review-summary-item">
              <span className="review-item-label">Attached Photos</span>
              <span className="review-item-value">{images.length} / 5 photos</span>
            </div>

            <div className="review-summary-item">
              <span className="review-item-label">Selected Category</span>
              <span className="review-item-value" style={{ textTransform: 'capitalize' }}>
                {category || 'Not chosen yet'}
              </span>
            </div>

            <div className="review-summary-item">
              <span className="review-item-label">Suggested Priority</span>
              <span className="review-item-value" style={{ textTransform: 'capitalize' }}>
                {reportedPriority}
              </span>
            </div>

            <div className="review-summary-item">
              <span className="review-item-label">Coordinates</span>
              <span className="review-item-value">
                {latitude !== null && longitude !== null ? `${latitude}, ${longitude}` : 'Missing'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="btn-inline-spinner" />
                <span>Uploading to Cloudinary &amp; saving...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Submit Complaint</span>
              </>
            )}
          </button>
        </section>
      </form>

      {/* Success Modal */}
      {submittedComplaint && (
        <div className="success-card-overlay">
          <div className="success-card">
            <div className="success-card-icon">
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-forest)', margin: '0 0 6px 0' }}>
              Complaint Submitted Successfully
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-muted)', margin: 0 }}>
              Your complaint has been queued for municipal triage. Here is your tracking reference:
            </p>

            <div className="success-card-code">
              {submittedComplaint.complaintCode}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '1rem' }}>
              <Button
                variant="primary"
                size="md"
                to="/dashboard"
                style={{ flex: 1 }}
              >
                Return to Dashboard
              </Button>
              <Button
                variant="outline"
                size="md"
                to="/my-reports"
                style={{ flex: 1 }}
              >
                View in My Reports
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ReportIssuePage;


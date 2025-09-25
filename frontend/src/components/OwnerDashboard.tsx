import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Button from './Button';
import DrivewayEditModal from './DrivewayEditModal';
import DashboardNav from './DashboardNav';
import cachedApi from '../services/cachedApi';
import './OwnerDashboard.css';

interface Driveway {
  _id: string;
  address: string;
  description: string;
  availability: { date: string; startTime: string; endTime: string; pricePerHour: number }[];
  isAvailable: boolean;
  carSizeCompatibility: string[]; // Array of compatible car sizes
  drivewaySize: string;
}

const OwnerDashboard: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [driveways, setDriveways] = useState<Driveway[]>([]);
  const [formData, setFormData] = useState({
    address: '',
    description: '',
    images: [''], // Placeholder for image URLs
    availability: [{ date: '', startTime: '', endTime: '', pricePerHour: 0 }],
    carSizeCompatibility: ['small', 'medium'], // Default compatible sizes
    drivewaySize: 'medium',
  });
  const [editingDrivewayId, setEditingDrivewayId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDriveway, setEditingDriveway] = useState<Driveway | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState('driveways');

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDriveways();
    }
  }, [isAuthenticated, user]);

  const fetchDriveways = async () => {
    try {
      const res = await cachedApi.get<Driveway[]>('/api/driveways', {
        cache: true,
        cacheTTL: 30 * 1000 // 30 seconds cache
      });
      setDriveways(res.data);
    } catch (err: any) {
      console.error('Fetch driveways error:', err);
      toast.error(`Failed to fetch driveways: ${err.response?.data?.msg || 'Server Error'}`);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onAvailabilityChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newAvailability = [...formData.availability];
    newAvailability[index] = { ...newAvailability[index], [name]: name === 'pricePerHour' ? parseFloat(value) || 0 : value };
    setFormData({ ...formData, availability: newAvailability });
  };

  const addAvailabilitySlot = () => {
    setFormData({ ...formData, availability: [...formData.availability, { date: '', startTime: '', endTime: '', pricePerHour: 0 }] });
  };

  const removeAvailabilitySlot = (index: number) => {
    const newAvailability = formData.availability.filter((_, i) => i !== index);
    setFormData({ ...formData, availability: newAvailability });
  };

  const resetForm = () => {
    setFormData({
      address: '',
      description: '',
      images: [''],
      availability: [{ date: '', startTime: '', endTime: '', pricePerHour: 0 }],
    });
    setEditingDrivewayId(null);
  };

  const handleEditClick = (driveway: Driveway) => {
    setEditingDriveway(driveway);
    setShowEditModal(true);
  };

  const handleAddNew = () => {
    setEditingDriveway(null);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setEditingDriveway(null);
  };

  const handleModalSave = async (drivewayData: any) => {
    setIsModalLoading(true);
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (editingDriveway) {
        await cachedApi.put(`/api/driveways/${editingDriveway._id}`, drivewayData);
        toast.success('Driveway updated successfully!');
      } else {
        await cachedApi.post('/api/driveways', drivewayData);
        toast.success('Driveway added successfully!');
      }
      
      fetchDriveways();
    } catch (err: any) {
      toast.error(`Failed to save driveway: ${err.response?.data?.msg || 'Server Error'}`);
      throw err; // Re-throw to let modal handle the error state
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (editingDrivewayId) {
        await cachedApi.put(`/api/driveways/${editingDrivewayId}`, formData);
        toast.success('Driveway updated successfully!');
      } else {
        await cachedApi.post('/api/driveways', formData);
        toast.success('Driveway added successfully!');
      }
      resetForm();
      fetchDriveways();
    } catch (err: any) {
      toast.error(`Failed to save driveway: ${err.response?.data?.msg || 'Server Error'}`);
    }
  };

  const handleDeleteDriveway = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this driveway?')) {
      try {
        const config = {
          headers: {
          },
        };
        await cachedApi.delete(`/api/driveways/${id}`);
        toast.success('Driveway deleted successfully!');
        fetchDriveways();
      } catch (err: any) {
        toast.error(`Failed to delete driveway: ${err.response?.data?.msg || 'Server Error'}`);
      }
    }
  };

  if (isLoading) {
    return <div className="text-center mt-8 text-lg font-medium">Loading user data...</div>;
  }

  if (!isAuthenticated || !user?.roles.includes('owner')) {
    return <div className="text-center mt-12 text-red-600 text-xl font-bold">Access Denied or Not Authenticated.</div>;
  }

  return (
    <div className="owner-dashboard">
      <h2 className="dashboard-title">Parkway.com - Owner Dashboard</h2>

      <div className="section-header">
        <h3 className="section-title">Manage Your Driveways</h3>
        <Button variant="primary" onClick={handleAddNew}>
          Add New Driveway
        </Button>
      </div>

      {/* Enhanced Section Navigation */}
      <DashboardNav
        sections={[
          {
            id: 'driveways',
            label: 'My Driveways',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
              </svg>
            )
          },
          {
            id: 'analytics',
            label: 'Analytics',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            )
          },
          {
            id: 'earnings',
            label: 'Earnings',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            )
          }
        ]}
        currentSection={currentSection}
        onSectionChange={(sectionId) => {
          setCurrentSection(sectionId);
          // Scroll to section if needed
          const element = document.getElementById(`${sectionId}-section`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />
      
      {/* Legacy form - hidden but kept for compatibility */}
      <form onSubmit={onSubmit} className="dashboard-form" style={{ display: 'none' }}>
        <div className="form-group">
          <label htmlFor="address" className="form-label">Address</label>
        <input
          type="text"
            id="address"
          name="address"
          value={formData.address}
          onChange={onChange}
            placeholder="Enter driveway address"
          required
            className="form-input"
        />
        </div>
        <div className="form-group">
          <label htmlFor="description" className="form-label">Description</label>
        <textarea
            id="description"
          name="description"
          value={formData.description}
          onChange={onChange}
            placeholder="Describe your driveway (size, features, etc.)"
          rows={4}
            className="form-textarea"
        ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="drivewaySize" className="form-label">Driveway Size</label>
          <select
            id="drivewaySize"
            name="drivewaySize"
            value={formData.drivewaySize}
            onChange={onChange}
            className="form-input"
          >
            <option value="small">Small (1 car)</option>
            <option value="medium">Medium (2 cars)</option>
            <option value="large">Large (3+ cars)</option>
            <option value="extra-large">Extra Large (RV/Bus friendly)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Car Size Compatibility</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            {['small', 'medium', 'large', 'extra-large'].map((size) => (
              <label key={size} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.carSizeCompatibility.includes(size)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        carSizeCompatibility: [...formData.carSizeCompatibility, size]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        carSizeCompatibility: formData.carSizeCompatibility.filter(s => s !== size)
                      });
                    }
                  }}
                  style={{ margin: 0 }}
                />
                <span style={{ textTransform: 'capitalize' }}>
                  {size === 'extra-large' ? 'Extra Large' : size} 
                  {size === 'small' && ' (Hatchback, Sedan)'}
                  {size === 'medium' && ' (SUV, Crossover)'}
                  {size === 'large' && ' (Truck, Van)'}
                  {size === 'extra-large' && ' (RV, Bus)'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="availability-section">
          <h4 className="availability-title">Availability Slots</h4>
          {formData.availability.map((slot, index) => (
            <div key={index} className="availability-slot">
              <div className="slot-header">
                <span className="slot-number">Slot {index + 1}</span>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeAvailabilitySlot(index)}
                  icon
                  aria-label="Remove slot"
                >
                  ×
                </Button>
              </div>
              <div className="slot-inputs">
                <div>
                  <label className="form-label">Date</label>
            <input
              type="date"
              name="date"
              value={slot.date}
              onChange={(e) => onAvailabilityChange(index, e)}
              required
                    className="slot-input"
            />
                </div>
                <div>
                  <label className="form-label">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={slot.startTime}
              onChange={(e) => onAvailabilityChange(index, e)}
              required
                    className="slot-input"
            />
                </div>
                <div>
                  <label className="form-label">End Time</label>
            <input
              type="time"
              name="endTime"
              value={slot.endTime}
              onChange={(e) => onAvailabilityChange(index, e)}
              required
                    className="slot-input"
            />
                </div>
                <div>
                  <label className="form-label">Price/Hour ($)</label>
            <input
              type="number"
              name="pricePerHour"
              value={slot.pricePerHour}
              onChange={(e) => onAvailabilityChange(index, e)}
                    placeholder="0.00"
              required
                    min="0"
                    step="0.01"
                    className="slot-input price-input"
            />
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="success"
            onClick={addAvailabilitySlot}
            fullWidth
          >
            + Add Availability Slot
          </Button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
          >
          {editingDrivewayId ? 'Update Driveway' : 'Add Driveway'}
          </Button>
        {editingDrivewayId && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleCancelEdit}
              fullWidth
            >
            Cancel Edit
            </Button>
        )}
        </div>
      </form>

      <h3 className="section-title">Your Listed Driveways</h3>
      {driveways.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">No driveways listed yet. Add your first driveway to start earning!</p>
        </div>
      ) : (
        <div id="driveways-section" className="driveways-grid">
          {driveways.map((driveway) => (
            <div key={driveway._id} className="driveway-card">
              <h4 className="driveway-title">{driveway.address}</h4>
              <p className="driveway-description">
                <strong>Description:</strong> {driveway.description}
              </p>
              <div className={`driveway-status ${driveway.isAvailable ? 'status-available' : 'status-unavailable'}`}>
                <span>{driveway.isAvailable ? 'Available' : 'Unavailable'}</span>
              </div>
              
              <div className="availability-list">
                <h5 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                  Availability Slots:
                </h5>
                {driveway.availability.map((slot, idx) => (
                  <div key={idx} className="availability-item">
                    <div className="availability-detail">
                      <strong>Date:</strong> {slot.date.split('T')[0]}
                    </div>
                    <div className="availability-detail">
                      <strong>Time:</strong> {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="availability-detail">
                      <strong>Price:</strong> <span className="availability-price">${slot.pricePerHour.toFixed(2)}/hour</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="driveway-actions">
                <Button
                  variant="danger"
                onClick={() => handleDeleteDriveway(driveway._id)}
                  fullWidth
                >
                  Delete
                </Button>
                <Button
                  variant="primary"
                onClick={() => handleEditClick(driveway)}
                  fullWidth
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Edit Modal */}
      <DrivewayEditModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        driveway={editingDriveway}
        isLoading={isModalLoading}
      />
    </div>
  );
};

export default OwnerDashboard;

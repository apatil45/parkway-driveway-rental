import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import ProfileRoleSwitcher from './ProfileRoleSwitcher';
import GeocodingInputWithAutocomplete from './GeocodingInputWithAutocomplete';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'contact'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    carSize: 'medium',
    drivewaySize: 'medium'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        carSize: user.carSize || 'medium',
        drivewaySize: user.drivewaySize || 'medium'
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (address: string, coordinates?: { latitude: number; longitude: number }) => {
    setFormData(prev => ({
      ...prev,
      address: address
    }));
    // Note: coordinates could be stored if needed for future features
  };

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to update the user
      // For now, we'll just update the local state
      console.log('Updating user profile:', formData);
      setIsEditing(false);
      // You can add a success message here
    } catch (error) {
      console.error('Error updating profile:', error);
      // You can add an error message here
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        carSize: user.carSize || 'medium',
        drivewaySize: user.drivewaySize || 'medium'
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2 className="profile-title">Parkway.com - My Account</h2>
        <div className="profile-nav">
          <button 
            className={`nav-button ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            My Profile
          </button>
          <button 
            className={`nav-button ${activeSection === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveSection('contact')}
          >
            Contact Info
          </button>
        </div>
      </div>

      <div className="profile-content">
        {activeSection === 'profile' && (
          <div className="profile-section">
            <div className="section-header">
              <h3 className="section-title">Personal Information</h3>
              {!isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="profile-info">
              <div className="profile-avatar-large">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              
              <div className="info-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="info-value">{user?.name || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  ) : (
                    <div className="info-value">{user?.email || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <div className="info-value role-badge">
                    {user?.roles.includes('driver') && user?.roles.includes('owner') 
                      ? 'Driver & Owner' 
                      : user?.roles.includes('driver') 
                        ? 'Driver' 
                        : 'Property Owner'}
                  </div>
                </div>

                {/* Role Switcher for users with multiple roles */}
                <ProfileRoleSwitcher />

                {user?.roles.includes('driver') && (
                  <div className="form-group">
                    <label className="form-label">Car Size</label>
                    {isEditing ? (
                      <select
                        name="carSize"
                        value={formData.carSize}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="extra-large">Extra Large</option>
                      </select>
                    ) : (
                      <div className="info-value">{user?.carSize || 'Medium'}</div>
                    )}
                  </div>
                )}

                {user?.roles.includes('owner') && (
                  <div className="form-group">
                    <label className="form-label">Driveway Size</label>
                    {isEditing ? (
                      <select
                        name="drivewaySize"
                        value={formData.drivewaySize}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="extra-large">Extra Large</option>
                      </select>
                    ) : (
                      <div className="info-value">{user?.drivewaySize || 'Medium'}</div>
                    )}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="form-actions">
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                  <Button variant="secondary" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="contact-section">
            <div className="section-header">
              <h3 className="section-title">Contact Information</h3>
              {!isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit Contact
                </Button>
              )}
            </div>

            <div className="contact-info">
              <div className="info-grid">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="info-value">{user?.phone || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  {isEditing ? (
                    <GeocodingInputWithAutocomplete
                      value={formData.address}
                      onChange={handleAddressChange}
                      placeholder="Enter your address"
                      label=""
                      className="form-input"
                    />
                  ) : (
                    <div className="info-value">{user?.address || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="info-value">{user?.email || 'Not provided'}</div>
                </div>
              </div>

              {isEditing && (
                <div className="form-actions">
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                  <Button variant="secondary" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

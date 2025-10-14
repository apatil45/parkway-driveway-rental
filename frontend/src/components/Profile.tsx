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
        phone: user.phoneNumber || '',
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
        phone: user.phoneNumber || '',
        address: user.address || '',
        carSize: user.carSize || 'medium',
        drivewaySize: user.drivewaySize || 'medium'
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Parkway.com - My Account</h1>
          <div className="flex gap-2">
            <button 
              className={`btn ${activeSection === 'profile' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setActiveSection('profile')}
            >
              My Profile
            </button>
            <button 
              className={`btn ${activeSection === 'contact' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setActiveSection('contact')}
            >
              Contact Info
            </button>
          </div>
        </div>

        {/* Profile Content */}
        {activeSection === 'profile' && (
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                {!isEditing && (
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                
                {/* User Info */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="text-gray-900 font-medium">{user?.name || 'Not provided'}</div>
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
                      <div className="text-gray-900 font-medium">{user?.email || 'Not provided'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <div className="flex items-center gap-2">
                      {user?.roles?.includes('driver') && user?.roles?.includes('owner') ? (
                        <>
                          <span className="badge badge-primary">Driver</span>
                          <span className="badge badge-success">Owner</span>
                        </>
                      ) : user?.roles?.includes('driver') ? (
                        <span className="badge badge-primary">Driver</span>
                      ) : user?.roles?.includes('owner') ? (
                        <span className="badge badge-success">Owner</span>
                      ) : (
                        <span className="text-gray-500">Not specified</span>
                      )}
                    </div>
                  </div>

                  {/* Role Switcher for users with multiple roles */}
                  <div className="form-group">
                    <ProfileRoleSwitcher />
                  </div>

                  {user?.roles?.includes('driver') && (
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
                        <div className="text-gray-900 font-medium">{user?.carSize || 'Medium'}</div>
                      )}
                    </div>
                  )}

                  {user?.roles?.includes('owner') && (
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
                        <div className="text-gray-900 font-medium">{user?.drivewaySize || 'Medium'}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-4 mt-6">
                  <button className="btn btn-primary" onClick={handleSave}>
                    Save Changes
                  </button>
                  <button className="btn btn-outline" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
                {!isEditing && (
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Contact
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div className="text-gray-900 font-medium">{user?.phoneNumber || 'Not provided'}</div>
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
                    <div className="text-gray-900 font-medium">{user?.address || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="text-gray-900 font-medium">{user?.email || 'Not provided'}</div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-4 mt-6">
                  <button className="btn btn-primary" onClick={handleSave}>
                    Save Changes
                  </button>
                  <button className="btn btn-outline" onClick={handleCancel}>
                    Cancel
                  </button>
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

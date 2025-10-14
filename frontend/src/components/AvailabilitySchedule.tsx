import React, { useState, useEffect } from 'react';
import './AvailabilitySchedule.css';

interface DayAvailability {
  dayOfWeek: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

interface AvailabilityScheduleProps {
  value?: DayAvailability[];
  onChange: (availability: DayAvailability[]) => void;
  errors?: { [key: string]: string };
  disabled?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const AvailabilitySchedule: React.FC<AvailabilityScheduleProps> = ({
  value = [],
  onChange,
  errors = {},
  disabled = false
}) => {
  const [availability, setAvailability] = useState<DayAvailability[]>(value);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Initialize availability state
  useEffect(() => {
    if (value.length > 0) {
      setAvailability(value);
    } else {
      // Initialize with all days unchecked
      const initialAvailability = DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day.value,
        isAvailable: false,
        startTime: '09:00',
        endTime: '17:00'
      }));
      setAvailability(initialAvailability);
    }
  }, [value]);

  // Validate time ranges
  const validateTimeRange = (startTime: string, endTime: string): string | null => {
    if (!startTime || !endTime) return null;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end <= start) {
      return 'End time must be after start time';
    }
    
    return null;
  };

  // Handle day availability toggle
  const handleDayToggle = (dayValue: string, isAvailable: boolean) => {
    const updatedAvailability = availability.map(day => 
      day.dayOfWeek === dayValue 
        ? { ...day, isAvailable }
        : day
    );
    
    setAvailability(updatedAvailability);
    onChange(updatedAvailability.filter(day => day.isAvailable));
    
    // Clear validation errors for this day
    if (validationErrors[dayValue]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[dayValue];
        return newErrors;
      });
    }
  };

  // Handle time change
  const handleTimeChange = (dayValue: string, field: 'startTime' | 'endTime', time: string) => {
    const updatedAvailability = availability.map(day => 
      day.dayOfWeek === dayValue 
        ? { ...day, [field]: time }
        : day
    );
    
    setAvailability(updatedAvailability);
    onChange(updatedAvailability.filter(day => day.isAvailable));
    
    // Validate time range
    const dayData = updatedAvailability.find(day => day.dayOfWeek === dayValue);
    if (dayData && dayData.isAvailable) {
      const error = validateTimeRange(dayData.startTime, dayData.endTime);
      setValidationErrors(prev => ({
        ...prev,
        [dayValue]: error || ''
      }));
    }
  };

  return (
    <div className="availability-schedule">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Weekly Availability</h4>
        <p className="text-sm text-gray-600">
          Select the days and times when your driveway is available for parking.
        </p>
      </div>
      
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const dayData = availability.find(d => d.dayOfWeek === day.value);
          const isAvailable = dayData?.isAvailable || false;
          const startTime = dayData?.startTime || '09:00';
          const endTime = dayData?.endTime || '17:00';
          const dayError = validationErrors[day.value] || errors[day.value];
          
          return (
            <div 
              key={day.value} 
              className={`schedule-row ${isAvailable ? '' : 'disabled'} ${dayError ? 'error' : ''}`}
            >
              <div className="schedule-day-label">
                <input
                  type="checkbox"
                  id={`day-${day.value}`}
                  checked={isAvailable}
                  onChange={(e) => handleDayToggle(day.value, e.target.checked)}
                  disabled={disabled}
                  className="schedule-day-checkbox"
                  aria-describedby={dayError ? `${day.value}-error` : undefined}
                />
                <label 
                  htmlFor={`day-${day.value}`}
                  className="schedule-day-text"
                >
                  {day.label}
                </label>
              </div>
              
              <div className="schedule-time-inputs">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleTimeChange(day.value, 'startTime', e.target.value)}
                  disabled={disabled || !isAvailable}
                  className="schedule-time-input"
                  placeholder="Start time"
                  aria-label={`${day.label} start time`}
                />
                
                <span className="schedule-time-separator">to</span>
                
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleTimeChange(day.value, 'endTime', e.target.value)}
                  disabled={disabled || !isAvailable}
                  className="schedule-time-input"
                  placeholder="End time"
                  aria-label={`${day.label} end time`}
                />
              </div>
              
              {dayError && (
                <div id={`${day.value}-error`} className="form-error mt-2" role="alert">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {dayError}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {Object.keys(validationErrors).length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span className="text-sm font-medium text-red-700">
              Please fix the time validation errors above
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilitySchedule;

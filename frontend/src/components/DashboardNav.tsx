import React from 'react';
import { useLocation } from 'react-router-dom';
import Button from './Button';
import './DashboardNav.css';

interface DashboardNavProps {
  sections: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    path?: string;
  }>;
  onSectionChange?: (sectionId: string) => void;
  currentSection?: string;
  className?: string;
}

const DashboardNav: React.FC<DashboardNavProps> = ({
  sections,
  onSectionChange,
  currentSection,
  className = ''
}) => {
  const location = useLocation();

  const handleSectionClick = (section: any) => {
    if (onSectionChange) {
      onSectionChange(section.id);
    }
  };

  return (
    <nav className={`dashboard-nav ${className}`}>
      <div className="dashboard-nav-container">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`dashboard-nav-item ${currentSection === section.id ? 'active' : ''}`}
            onClick={() => handleSectionClick(section)}
          >
            {section.icon && (
              <span className="nav-icon">
                {section.icon}
              </span>
            )}
            <span className="nav-label">{section.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default DashboardNav;

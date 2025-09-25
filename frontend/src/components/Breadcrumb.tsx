import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumb.css';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const location = useLocation();
  
  // Generate breadcrumb items from current path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;
    
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/' }
    ];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbs.push({
        label,
        path: currentPath
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();

  return (
    <nav className={`breadcrumb ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <li key={item.path} className="breadcrumb-item">
              {isLast ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.path} className="breadcrumb-link">
                  {item.label}
                </Link>
              )}
              {!isLast && (
                <svg 
                  className="breadcrumb-separator" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;

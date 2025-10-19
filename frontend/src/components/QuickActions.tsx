import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// 
// Icon component for rendering SVG icons
const Icon: React.FC<{ name: string; size?: number }> = ({ name, size = 20 }) => {
  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  };

  const icons: { [key: string]: JSX.Element } = {
    search: (
      <svg {...iconProps}>
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    calendar: (
      <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    heart: (
      <svg {...iconProps}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    'help-circle': (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    plus: (
      <svg {...iconProps}>
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    home: (
      <svg {...iconProps}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
    'dollar-sign': (
      <svg {...iconProps}>
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    'user-plus': (
      <svg {...iconProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
    ),
    'log-in': (
      <svg {...iconProps}>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10,17 15,12 10,7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
    )
  };

  return icons[name] || icons['help-circle'];
};

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  color: string;
  requiresAuth?: boolean;
  allowedRoles?: string[];
}

const QuickActions: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  // Force rebuild - updated design system

  // Using Tailwind CSS classes for professional styling

  const driverActions: QuickAction[] = [
    {
      id: 'find-parking',
      title: 'Find Parking',
      description: 'Search for available driveways',
      icon: 'search',
      link: '/driver-dashboard',
      color: '#276EF1',
      requiresAuth: true,
      allowedRoles: ['driver']
    },
    {
      id: 'my-bookings',
      title: 'My Bookings',
      description: 'View your booking history',
      icon: 'calendar',
      link: '/driver-dashboard?tab=bookings',
      color: '#00D4AA',
      requiresAuth: true,
      allowedRoles: ['driver']
    },
    {
      id: 'favorites',
      title: 'Favorites',
      description: 'Your saved driveways',
      icon: 'heart',
      link: '/driver-dashboard?tab=favorites',
      color: '#FFB800',
      requiresAuth: true,
      allowedRoles: ['driver']
    },
    {
      id: 'help',
      title: 'Get Help',
      description: 'Find answers and support',
      icon: 'help-circle',
      link: '/help',
      color: '#9C27B0'
    }
  ];

  const ownerActions: QuickAction[] = [
    {
      id: 'add-driveway',
      title: 'Add Driveway',
      description: 'List a new driveway',
      icon: 'plus',
      link: '/owner-dashboard?action=add',
      color: '#00D4AA',
      requiresAuth: true,
      allowedRoles: ['owner']
    },
    {
      id: 'manage-driveways',
      title: 'Manage Driveways',
      description: 'Edit your listings',
      icon: 'home',
      link: '/owner-dashboard?tab=driveways',
      color: '#276EF1',
      requiresAuth: true,
      allowedRoles: ['owner']
    },
    {
      id: 'earnings',
      title: 'View Earnings',
      description: 'Check your income',
      icon: 'dollar-sign',
      link: '/owner-dashboard?tab=analytics',
      color: '#FFB800',
      requiresAuth: true,
      allowedRoles: ['owner']
    },
    {
      id: 'help',
      title: 'Get Help',
      description: 'Find answers and support',
      icon: 'help-circle',
      link: '/help',
      color: '#9C27B0'
    }
  ];

  const generalActions: QuickAction[] = [
    {
      id: 'register',
      title: 'Sign Up',
      description: 'Create your account',
      icon: 'user-plus',
      link: '/register',
      color: '#276EF1'
    },
    {
      id: 'login',
      title: 'Sign In',
      description: 'Access your account',
      icon: 'log-in',
      link: '/login',
      color: '#00D4AA'
    },
    {
      id: 'help',
      title: 'Get Help',
      description: 'Find answers and support',
      icon: 'help-circle',
      link: '/help',
      color: '#9C27B0'
    }
  ];

  const getActionsForUser = (): QuickAction[] => {
    if (!isAuthenticated || !user) {
      return generalActions;
    }

    const actions: QuickAction[] = [];
    
    // Add driver actions
    if (user.roles?.includes('driver')) {
      actions.push(...driverActions.filter(action => 
        !action.requiresAuth || (action.allowedRoles && action.allowedRoles.some(role => user.roles?.includes(role)))
      ));
    }
    
    // Add owner actions
    if (user.roles?.includes('owner')) {
      actions.push(...ownerActions.filter(action => 
        !action.requiresAuth || (action.allowedRoles && action.allowedRoles.some(role => user.roles?.includes(role)))
      ));
    }

    // Remove duplicates (like help)
    const uniqueActions = actions.filter((action, index, self) => 
      index === self.findIndex(a => a.id === action.id)
    );

    // Ensure we have a balanced grid by limiting to 6 actions max
    return uniqueActions.slice(0, 6);
  };

  const actions = getActionsForUser();

  return (
    <section className="section-spacing bg-gray-800">
      <div className="container-spacing">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Quick Actions</h2>
          <p className="text-lg text-gray-400 font-medium">Jump to the most common tasks</p>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map(action => (
            <Link
              key={action.id}
              to={action.link}
              className="group bg-gray-700 rounded-xl hover:bg-gray-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden border border-gray-600"
            >
              <div className="flex items-center gap-4 p-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: action.color }}
                >
                  <Icon name={action.icon} size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-gray-200 transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    {action.description}
                  </p>
                </div>
                <div className="text-gray-500 group-hover:text-gray-300 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </div>
              </div>
              <div 
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, ${action.color}, ${action.color}80)` }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActions;

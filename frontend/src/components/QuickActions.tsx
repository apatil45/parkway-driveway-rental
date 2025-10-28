import React from 'react';
import { Link } from 'react-router-dom';

const quickActions = [
  {
    title: 'Find Parking',
    description: 'Search for available driveways',
    icon: '🔍',
    href: '/',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    title: 'My Bookings',
    description: 'View your reservations',
    icon: '📋',
    href: '/bookings',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    title: 'Add Driveway',
    description: 'List your space',
    icon: '🏠',
    href: '/owner/dashboard',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    title: 'Profile',
    description: 'Manage account',
    icon: '👤',
    href: '/profile',
    color: 'bg-gray-500 hover:bg-gray-600'
  },
  {
    title: 'Payment',
    description: 'Payment methods',
    icon: '💳',
    href: '/payments',
    color: 'bg-indigo-500 hover:bg-indigo-600'
  },
  {
    title: 'Help',
    description: 'Get support',
    icon: '❓',
    href: '/help',
    color: 'bg-orange-500 hover:bg-orange-600'
  }
];

const QuickActions: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          return (
            <Link
              key={action.title}
              to={action.href}
              className={`${action.color} text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 group`}
            >
              <span className="text-2xl">{action.icon}</span>
              <div>
                <div className="font-semibold">{action.title}</div>
                <div className="text-sm text-gray-600">{action.description}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
import { Link } from 'react-router-dom'
import { ShoppingCart, BarChart3, Settings, HelpCircle, CreditCard, User, DollarSign, FileText } from 'lucide-react'

const quickActions = [
  {
    title: 'Find Parking',
    description: 'Search for available driveways',
    icon: ShoppingCart,
    href: '/',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    title: 'My Bookings',
    description: 'View your reservations',
    icon: FileText,
    href: '/bookings',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    title: 'Add Driveway',
    description: 'List your space',
    icon: BarChart3,
    href: '/owner/dashboard',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    title: 'Profile',
    description: 'Manage account',
    icon: User,
    href: '/profile',
    color: 'bg-gray-500 hover:bg-gray-600'
  },
  {
    title: 'Payment',
    description: 'Payment methods',
    icon: CreditCard,
    href: '/payments',
    color: 'bg-indigo-500 hover:bg-indigo-600'
  },
  {
    title: 'Help',
    description: 'Get support',
    icon: HelpCircle,
    href: '/help',
    color: 'bg-orange-500 hover:bg-orange-600'
  }
]

const QuickActions: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const IconComponent = action.icon
          return (
            <Link
              key={action.title}
              to={action.href}
              className={`${action.color} text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 group`}
            >
              <IconComponent className="w-6 h-6" />
              <div>
                <div className="font-semibold">{action.title}</div>
                <div className="text-sm text-gray-600">{action.description}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default QuickActions;
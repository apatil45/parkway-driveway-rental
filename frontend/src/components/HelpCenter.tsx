import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    'help-circle': (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    car: (
      <svg {...iconProps}>
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 9.3c-.3-.8-1-1.3-1.9-1.3H7.5c-.9 0-1.6.5-1.9 1.3L4.5 11.1C3.7 11.3 3 12.1 3 13v3c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    ),
    home: (
      <svg {...iconProps}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
    'credit-card': (
      <svg {...iconProps}>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    settings: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    user: (
      <svg {...iconProps}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    )
  };

  return icons[name] || icons['help-circle'];
};

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'driver' | 'owner' | 'payment' | 'technical';
}

const HelpCenter: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqData: FAQItem[] = [
    // General FAQs
    {
      id: '1',
      question: 'What is Parkway?',
      answer: 'Parkway is a platform that connects drivers with homeowners who have available driveways for rent. We make finding and booking parking spots easy, secure, and convenient.',
      category: 'general'
    },
    {
      id: '2',
      question: 'How do I get started?',
      answer: 'Simply sign up for an account, choose whether you want to be a driver (find parking) or owner (rent out your driveway), and start using our platform right away.',
      category: 'general'
    },
    {
      id: '3',
      question: 'Is Parkway safe to use?',
      answer: 'Yes! All payments are processed securely through Stripe, and we have safety measures in place. All transactions are tracked and recorded for your protection.',
      category: 'general'
    },

    // Driver FAQs
    {
      id: '4',
      question: 'How do I find parking near me?',
      answer: 'Use the search function on the driver dashboard. You can search by location, set your arrival time, and filter by price and car size compatibility.',
      category: 'driver'
    },
    {
      id: '5',
      question: 'Can I cancel my booking?',
      answer: 'Yes, you can cancel your booking up to 2 hours before your scheduled time. Cancellation policies may vary by driveway owner.',
      category: 'driver'
    },
    {
      id: '6',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and digital wallets through our secure Stripe payment system.',
      category: 'driver'
    },

    // Owner FAQs
    {
      id: '7',
      question: 'How do I list my driveway?',
      answer: 'Go to your owner dashboard and click "Add New Driveway". Fill in your driveway details, set your availability, and pricing. Your listing will be live immediately.',
      category: 'owner'
    },
    {
      id: '8',
      question: 'How much can I earn?',
      answer: 'Earnings depend on your location, driveway size, and pricing. Most owners earn $50-200 per month, but popular locations can earn much more.',
      category: 'owner'
    },
    {
      id: '9',
      question: 'When do I get paid?',
      answer: 'Payments are processed automatically after each successful booking. You can track your earnings in your owner dashboard.',
      category: 'owner'
    },

    // Payment FAQs
    {
      id: '10',
      question: 'Are there any fees?',
      answer: 'We charge a small service fee (typically 5-10%) to cover payment processing and platform maintenance. This is deducted from the total booking amount.',
      category: 'payment'
    },
    {
      id: '11',
      question: 'What if my payment fails?',
      answer: 'If your payment fails, your booking will not be confirmed. Please check your payment method and try again. Contact support if the issue persists.',
      category: 'payment'
    },

    // Technical FAQs
    {
      id: '12',
      question: 'The app is not working properly. What should I do?',
      answer: 'Try refreshing the page or clearing your browser cache. If the issue persists, contact our technical support team.',
      category: 'technical'
    },
    {
      id: '13',
      question: 'How do I update my profile information?',
      answer: 'Go to your profile page from the navigation menu. You can update your personal information, payment methods, and notification preferences there.',
      category: 'technical'
    }
  ];

  const categories = [
    { id: 'general', name: 'General', icon: 'help-circle' },
    { id: 'driver', name: 'For Drivers', icon: 'car' },
    { id: 'owner', name: 'For Owners', icon: 'home' },
    { id: 'payment', name: 'Payments', icon: 'credit-card' },
    { id: 'technical', name: 'Technical', icon: 'settings' }
  ];

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Find answers to common questions and get support</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-12"
            />
          </div>
        </div>

        {/* Contact Support Section */}
        <div className="card mb-12">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Contact Support</h2>
                <p className="text-gray-600">Get personalized help from our support team</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Support */}
              <div className="card-compact">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Email Support</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Send us an email and we'll respond within 24 hours</p>
                  <a href="mailto:support@parkway.com" className="btn btn-secondary btn-sm">
                    Send Email
                  </a>
                </div>
              </div>

              {/* Live Chat */}
              <div className="card-compact">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Live Chat</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Chat with our support team in real-time</p>
                  <button className="btn btn-secondary btn-sm">
                    Start Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveCategory('all')}
          >
            All Questions
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              className={`btn ${activeCategory === category.id ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="flex items-center gap-2">
                <Icon name={category.icon} size={16} />
                {category.name}
              </span>
            </button>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map(faq => (
                <div key={faq.id} className="card">
                  <div className="card-body p-0">
                    <button
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      onClick={() => toggleFAQ(faq.id)}
                      aria-expanded={expandedFAQ === faq.id}
                    >
                      <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`text-gray-400 transition-transform ${expandedFAQ === faq.id ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6,9 12,15 18,9"/>
                      </svg>
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="px-6 pb-6">
                        <div className="border-t border-gray-200 pt-4">
                          <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="card text-center py-12">
                <div className="card-body">
                  <p className="text-gray-600 mb-4">No questions found matching your search.</p>
                  <button onClick={() => setSearchQuery('')} className="btn btn-outline btn-sm">
                    Clear Search
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-compact">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started Guide</h3>
                <p className="text-gray-600 mb-4">Step-by-step guide for new users</p>
                <Link to="/help/getting-started" className="btn btn-outline btn-sm w-full">
                  Read Guide →
                </Link>
              </div>
            </div>
            
            <div className="card-compact">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Safety & Security</h3>
                <p className="text-gray-600 mb-4">Learn about our safety measures</p>
                <Link to="/help/safety" className="btn btn-outline btn-sm w-full">
                  Learn More →
                </Link>
              </div>
            </div>
            
            <div className="card-compact">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms of Service</h3>
                <p className="text-gray-600 mb-4">Read our terms and conditions</p>
                <Link to="/help/terms" className="btn btn-outline btn-sm w-full">
                  View Terms →
                </Link>
              </div>
            </div>
            
            <div className="card-compact">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Policy</h3>
                <p className="text-gray-600 mb-4">How we protect your data</p>
                <Link to="/help/privacy" className="btn btn-outline btn-sm w-full">
                  View Policy →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* User-specific help */}
        {isAuthenticated && (
          <div className="card">
            <div className="card-body">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personalized Help</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {user?.roles?.includes('driver') && (
                  <Link to="/driver-dashboard" className="card-compact hover:shadow-lg transition-shadow">
                    <div className="card-body">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Icon name="car" size={20} />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Driver Dashboard</h4>
                      </div>
                      <p className="text-gray-600">Manage your bookings and find parking</p>
                    </div>
                  </Link>
                )}
                
                {user?.roles?.includes('owner') && (
                  <Link to="/owner-dashboard" className="card-compact hover:shadow-lg transition-shadow">
                    <div className="card-body">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Icon name="home" size={20} />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Owner Dashboard</h4>
                      </div>
                      <p className="text-gray-600">Manage your driveways and earnings</p>
                    </div>
                  </Link>
                )}
                
                <Link to="/profile" className="card-compact hover:shadow-lg transition-shadow">
                  <div className="card-body">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Icon name="user" size={20} />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Profile Settings</h4>
                    </div>
                    <p className="text-gray-600">Update your account information</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpCenter;

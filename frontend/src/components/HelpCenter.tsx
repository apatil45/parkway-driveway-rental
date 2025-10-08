import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HelpCenter.css';

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
    <div className="help-center">
      <div className="help-header">
        <h1>Help Center</h1>
        <p>Find answers to common questions and get support</p>
      </div>

      {/* Search Bar */}
      <div className="help-search">
        <div className="search-container">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-help-actions">
        <div className="help-action-card">
          <div className="action-icon">📞</div>
          <h3>Contact Support</h3>
          <p>Get personalized help from our support team</p>
          <button className="action-button">Contact Us</button>
        </div>
        
        <div className="help-action-card">
          <div className="action-icon">📧</div>
          <h3>Email Support</h3>
          <p>Send us an email and we'll respond within 24 hours</p>
          <a href="mailto:support@parkway.com" className="action-button">Send Email</a>
        </div>
        
        <div className="help-action-card">
          <div className="action-icon">💬</div>
          <h3>Live Chat</h3>
          <p>Chat with our support team in real-time</p>
          <button className="action-button">Start Chat</button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="help-categories">
        <button
          className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All Questions
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            <span className="category-icon">
              <Icon name={category.icon} size={18} />
            </span>
            {category.name}
          </button>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map(faq => (
              <div key={faq.id} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleFAQ(faq.id)}
                  aria-expanded={expandedFAQ === faq.id}
                >
                  <span className="faq-text">{faq.question}</span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`faq-arrow ${expandedFAQ === faq.id ? 'expanded' : ''}`}
                  >
                    <polyline points="6,9 12,15 18,9"/>
                  </svg>
                </button>
                {expandedFAQ === faq.id && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No questions found matching your search.</p>
              <button onClick={() => setSearchQuery('')} className="clear-search">
                Clear Search
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="additional-resources">
        <h2>Additional Resources</h2>
        <div className="resources-grid">
          <div className="resource-card">
            <h3>Getting Started Guide</h3>
            <p>Step-by-step guide for new users</p>
            <Link to="/help/getting-started" className="resource-link">
              Read Guide →
            </Link>
          </div>
          
          <div className="resource-card">
            <h3>Safety & Security</h3>
            <p>Learn about our safety measures</p>
            <Link to="/help/safety" className="resource-link">
              Learn More →
            </Link>
          </div>
          
          <div className="resource-card">
            <h3>Terms of Service</h3>
            <p>Read our terms and conditions</p>
            <Link to="/help/terms" className="resource-link">
              View Terms →
            </Link>
          </div>
          
          <div className="resource-card">
            <h3>Privacy Policy</h3>
            <p>How we protect your data</p>
            <Link to="/help/privacy" className="resource-link">
              View Policy →
            </Link>
          </div>
        </div>
      </div>

      {/* User-specific help */}
      {isAuthenticated && (
        <div className="user-specific-help">
          <h2>Personalized Help</h2>
          <div className="user-help-actions">
            {user?.roles?.includes('driver') && (
              <Link to="/driver-dashboard" className="user-help-link">
                <span className="help-icon">
                  <Icon name="car" size={20} />
                </span>
                <div>
                  <h4>Driver Dashboard</h4>
                  <p>Manage your bookings and find parking</p>
                </div>
              </Link>
            )}
            
            {user?.roles?.includes('owner') && (
              <Link to="/owner-dashboard" className="user-help-link">
                <span className="help-icon">
                  <Icon name="home" size={20} />
                </span>
                <div>
                  <h4>Owner Dashboard</h4>
                  <p>Manage your driveways and earnings</p>
                </div>
              </Link>
            )}
            
            <Link to="/profile" className="user-help-link">
              <span className="help-icon">
                <Icon name="user" size={20} />
              </span>
              <div>
                <h4>Profile Settings</h4>
                <p>Update your account information</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpCenter;

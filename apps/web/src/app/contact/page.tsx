'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui';
import api from '@/lib/api';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  type: 'general' | 'support' | 'sales' | 'technical';
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage('');

    try {
      // In a real app, you'd send this to your backend API
      // For now, we'll simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // TODO: Replace with actual API endpoint
      // const response = await api.post('/contact', formData);
      
      setSubmitStatus('success');
      setSubmitMessage('Thank you for contacting us! We\'ll get back to you within 24 hours.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general',
      });
    } catch (error: any) {
      setSubmitStatus('error');
      setSubmitMessage(
        error.response?.data?.message || 
        'Unable to send your message. Please try again or email us directly at support@parkway.com'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      title: 'Email Us',
      content: 'support@parkway.com',
      link: 'mailto:support@parkway.com',
    },
    {
      icon: PhoneIcon,
      title: 'Call Us',
      content: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
    {
      icon: MapPinIcon,
      title: 'Visit Us',
      content: '123 Parking Street, City, State 12345',
      link: '#',
    },
    {
      icon: ClockIcon,
      title: 'Business Hours',
      content: 'Monday - Friday: 9:00 AM - 6:00 PM EST',
      link: '#',
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Get in Touch
              </h1>
              <p className="text-xl md:text-2xl text-primary-100 mb-8">
                We're here to help. Reach out with any questions or concerns.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Send us a Message
                  </h2>
                  
                  {submitStatus && (
                    <div
                      className={`mb-6 p-4 rounded-md flex items-start ${
                        submitStatus === 'success'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      {submitStatus === 'success' ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircleIcon className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                      )}
                      <p
                        className={
                          submitStatus === 'success'
                            ? 'text-green-800'
                            : 'text-red-800'
                        }
                      >
                        {submitMessage}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="type"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Inquiry Type *
                      </label>
                      <select
                        id="type"
                        name="type"
                        required
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="support">Support Request</option>
                        <option value="sales">Sales Question</option>
                        <option value="technical">Technical Issue</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Subject *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="What is this regarding?"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Tell us more about your inquiry..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Contact Information
                  </h3>
                  <div className="space-y-6">
                    {contactInfo.map((info, index) => {
                      const Icon = info.icon;
                      return (
                        <div key={index}>
                          <div className="flex items-start">
                            <div className="p-2 bg-primary-100 rounded-lg mr-4">
                              <Icon className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {info.title}
                              </h4>
                              {info.link !== '#' ? (
                                <a
                                  href={info.link}
                                  className="text-gray-600 hover:text-primary-600 transition-colors"
                                >
                                  {info.content}
                                </a>
                              ) : (
                                <p className="text-gray-600">{info.content}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-6 bg-primary-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Need Immediate Help?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    For urgent issues, please call our support line or check our help center.
                  </p>
                  <div className="space-y-2">
                    <Link
                      href="/about"
                      className="block text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      Visit Help Center →
                    </Link>
                    <a
                      href="tel:+15551234567"
                      className="block text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      Call Support: (555) 123-4567 →
                    </a>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Quick Links */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Common Questions
                </h2>
                <p className="text-xl text-gray-600">
                  Find quick answers to frequently asked questions
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    How do I list my driveway?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Creating a listing is free and takes just a few minutes. Click the button below to get started.
                  </p>
                  <Link
                    href="/driveways/new"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    List Your Driveway →
                  </Link>
                </Card>
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    How do I find parking?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Search for available driveways near your destination. Filter by price, distance, and amenities.
                  </p>
                  <Link
                    href="/search"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Search Driveways →
                  </Link>
                </Card>
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    What are the fees?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    We have transparent pricing with no hidden fees. Check out our pricing page for details.
                  </p>
                  <Link
                    href="/pricing"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    View Pricing →
                  </Link>
                </Card>
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Is my payment secure?
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Yes! All payments are processed securely through Stripe, a leading payment processor.
                  </p>
                  <Link
                    href="/about"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Learn More →
                  </Link>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

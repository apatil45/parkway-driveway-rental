'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { Card, Button, Input, Select, Textarea } from '@/components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactInput } from '@/lib/validations';
import api from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const inquiryTypeOptions = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Support Request' },
  { value: 'sales', label: 'Sales Question' },
  { value: 'technical', label: 'Technical Issue' },
];

const contactInfo = [
  { icon: EnvelopeIcon, title: 'Email Us', content: 'parkwayhelp@gmail.com', link: 'mailto:parkwayhelp@gmail.com' },
  { icon: PhoneIcon, title: 'Call Us', content: '+1 (555) 123-4567', link: 'tel:+15551234567' },
  { icon: MapPinIcon, title: 'Visit Us', content: '70 Lincoln Street, Jersey City, New Jersey, 07307', link: '#' },
  { icon: ClockIcon, title: 'Business Hours', content: 'Monday - Friday: 9:00 AM - 6:00 PM EST', link: '#' },
];

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { type: 'general' },
  });

  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [submitMessage, setSubmitMessage] = useState('');
  const { showToast } = useToast();

  const onSubmit = async (data: ContactInput) => {
    setSubmitStatus(null);
    setSubmitMessage('');
    try {
      await api.post('/contact', data);
      setSubmitStatus('success');
      setSubmitMessage("Thank you for contacting us! We'll get back to you within 24 hours.");
      showToast("Message sent! We'll get back to you within 24 hours.", 'success');
      reset();
    } catch (error: any) {
      setSubmitStatus('error');
      setSubmitMessage(
        error.response?.data?.message ||
          "We couldn't send your message. Please check your connection and try again, or email us directly at parkwayhelp@gmail.com"
      );
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white page-section">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="section-heading text-white mb-3">Get in Touch</h1>
              <p className="text-lg md:text-xl text-primary-100 section-subheading text-white/90">
                We're here to help. Reach out with any questions or concerns.
              </p>
            </div>
          </div>
        </section>

        <section className="page-section">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="lg:col-span-2">
                <Card className="p-6 sm:p-8 shadow-md">
                  <h2 className="section-heading text-xl sm:text-2xl mb-6">Send us a Message</h2>

                  {submitStatus && (
                    <div
                      className={`mb-6 ${submitStatus === 'success' ? 'alert-success' : 'alert-error'}`}
                      role="alert"
                    >
                      {submitStatus === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm leading-relaxed">{submitMessage}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <Input
                        label="Name"
                        placeholder="Your name"
                        error={errors.name?.message}
                        aria-required="true"
                        {...register('name')}
                      />
                      <Input
                        label="Email"
                        type="email"
                        placeholder="your.email@example.com"
                        error={errors.email?.message}
                        aria-required="true"
                        {...register('email')}
                      />
                    </div>

                    <Select
                      label="Inquiry Type"
                      options={inquiryTypeOptions}
                      error={errors.type?.message}
                      {...register('type')}
                    />

                    <Input
                      label="Subject"
                      placeholder="What is this regarding?"
                      error={errors.subject?.message}
                      aria-required="true"
                      {...register('subject')}
                    />

                    <Textarea
                      label="Message"
                      placeholder="Tell us more about your inquiry..."
                      rows={5}
                      error={errors.message?.message}
                      aria-required="true"
                      {...register('message')}
                    />

                    <Button type="submit" disabled={isSubmitting} loading={isSubmitting} fullWidth size="lg">
                      Send Message
                    </Button>
                  </form>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-6 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-5">Contact Information</h3>
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
                              <h4 className="font-semibold text-gray-900 mb-1">{info.title}</h4>
                              {info.link !== '#' ? (
                                <a href={info.link} className="text-gray-600 hover:text-primary-600 transition-colors">
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

                <Card className="p-6 bg-primary-50/80 border-primary-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Immediate Help?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    For urgent issues, please call our support line or check our help center.
                  </p>
                  <div className="space-y-2">
                    <Link href="/help" className="block text-primary-600 hover:text-primary-700 font-medium text-sm">
                      Visit Help Center →
                    </Link>
                    <a href="tel:+15551234567" className="block text-primary-600 hover:text-primary-700 font-medium text-sm">
                      Call Support: (555) 123-4567 →
                    </a>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="page-section bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="section-heading mb-2">Common Questions</h2>
                <p className="section-subheading text-lg">Find quick answers to frequently asked questions</p>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <Card className="p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I list my driveway?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Creating a listing is free and takes just a few minutes. Click the button below to get started.
                  </p>
                  <Link href="/driveways/new" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                    List Your Driveway →
                  </Link>
                </Card>
                <Card className="p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I find parking?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Search for available driveways near your destination. Filter by price, distance, and amenities.
                  </p>
                  <Link href="/search" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                    Search Driveways →
                  </Link>
                </Card>
                <Card className="p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What are the fees?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    We have transparent pricing with no hidden fees. Check out our pricing page for details.
                  </p>
                  <Link href="/pricing" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                    View Pricing →
                  </Link>
                </Card>
                <Card className="p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Is my payment secure?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Yes! All payments are processed securely through Stripe, a leading payment processor.
                  </p>
                  <Link href="/about" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
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

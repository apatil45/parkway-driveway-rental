import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createApiError } from '@parkway/shared';

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  type: 'general' | 'support' | 'sales' | 'technical';
}

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Test transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email transporter ready to send messages');
  }
});

export async function POST(request: NextRequest) {
  try {
    // Contact form requires email configuration
    if (!process.env.EMAIL_FROM || !process.env.EMAIL_TO || !process.env.EMAIL_HOST) {
      return NextResponse.json(
        createApiError('Contact form is temporarily unavailable. Please email us directly.', 503, 'SERVICE_UNAVAILABLE'),
        { status: 503 }
      );
    }

    const body: ContactRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        createApiError('Missing required fields: name, email, subject, and message are required', 400, 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Email to you (admin)
    const adminEmail = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: `New Contact Form: ${body.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Type:</strong> ${body.type}</p>
        <p><strong>Subject:</strong> ${body.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${body.message.replace(/\n/g, '<br>')}</p>
      `,
    };

    // Confirmation email to user
    const userEmail = {
      from: process.env.EMAIL_FROM,
      to: body.email,
      subject: 'We received your message - Parkway Driveway Rental',
      html: `
        <h2>Thank you for contacting us!</h2>
        <p>Hello ${body.name},</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <br>
        <p><strong>Your Message:</strong></p>
        <p>${body.message.replace(/\n/g, '<br>')}</p>
        <br>
        <p>Best regards,<br>Parkway Driveway Rental Team</p>
      `,
    };

    await transporter.sendMail(adminEmail);
    await transporter.sendMail(userEmail);

    return NextResponse.json(
      createApiResponse({}, 'Email sent successfully'),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    return NextResponse.json(
      createApiError('Failed to send email. Please try again or email us directly.', 500, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}
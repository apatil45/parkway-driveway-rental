import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

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
    console.log('📧 Contact form received');
    const body: ContactRequest = await request.json();
    console.log('📧 Form data:', { name: body.name, email: body.email, subject: body.subject });

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      console.error('❌ Missing fields:', { name: body.name, email: body.email, subject: body.subject, message: body.message });
      return NextResponse.json(
        { message: 'Missing required fields' },
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

    // Send both emails
    console.log('Sending admin email to:', process.env.EMAIL_TO);
    await transporter.sendMail(adminEmail);
    console.log('Admin email sent successfully');
    
    console.log('Sending user confirmation email to:', body.email);
    await transporter.sendMail(userEmail);
    console.log('User confirmation email sent successfully');

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ EMAIL ERROR:', error.message);
    console.error('Full error:', error);
    return NextResponse.json(
      { message: 'Failed to send email: ' + error.message },
      { status: 500 }
    );
  }
}
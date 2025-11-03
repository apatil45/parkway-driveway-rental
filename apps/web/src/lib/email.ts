/**
 * Email Service
 * 
 * This service handles sending emails for various notifications.
 * Currently supports Resend API (free tier: 3,000 emails/month)
 * 
 * To use:
 * 1. Sign up at https://resend.com
 * 2. Get your API key
 * 3. Add RESEND_API_KEY to your environment variables
 * 4. Set RESEND_FROM_EMAIL to your verified domain email
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@parkway.app';

  // If Resend is not configured, log the email instead
  if (!apiKey) {
    console.log('📧 Email would be sent (Resend not configured):', {
      to: options.to,
      subject: options.subject,
      html: options.html
    });
    return true; // Return true for development
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '')
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

// Email Templates
export const emailTemplates = {
  bookingConfirmation: (booking: {
    drivewayTitle: string;
    address: string;
    startTime: string;
    endTime: string;
    totalPrice: number;
    bookingId: string;
  }) => ({
    subject: 'Booking Confirmed - Parkway',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #2563eb, #1e40af); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Parkway</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Booking Confirmed!</h2>
            <p>Your booking has been confirmed. Here are the details:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Driveway:</strong> ${booking.drivewayTitle}</p>
              <p><strong>Address:</strong> ${booking.address}</p>
              <p><strong>Start Time:</strong> ${new Date(booking.startTime).toLocaleString()}</p>
              <p><strong>End Time:</strong> ${new Date(booking.endTime).toLocaleString()}</p>
              <p><strong>Total Price:</strong> $${booking.totalPrice.toFixed(2)}</p>
              <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            </div>
            <p style="margin-top: 30px;">Thank you for using Parkway!</p>
          </div>
        </body>
      </html>
    `
  }),

  paymentReceived: (booking: {
    drivewayTitle: string;
    totalPrice: number;
    bookingId: string;
  }) => ({
    subject: 'Payment Received - Parkway',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #10b981, #059669); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Parkway</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Payment Received!</h2>
            <p>You have received payment for your driveway booking:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Driveway:</strong> ${booking.drivewayTitle}</p>
              <p><strong>Amount:</strong> $${booking.totalPrice.toFixed(2)}</p>
              <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            </div>
            <p style="margin-top: 30px;">The payment has been processed successfully.</p>
          </div>
        </body>
      </html>
    `
  }),

  bookingReminder: (booking: {
    drivewayTitle: string;
    address: string;
    startTime: string;
  }) => ({
    subject: 'Booking Reminder - Parkway',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #f59e0b, #d97706); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Parkway</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Reminder: Upcoming Booking</h2>
            <p>This is a reminder about your upcoming booking:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Driveway:</strong> ${booking.drivewayTitle}</p>
              <p><strong>Address:</strong> ${booking.address}</p>
              <p><strong>Start Time:</strong> ${new Date(booking.startTime).toLocaleString()}</p>
            </div>
            <p style="margin-top: 30px;">Don't forget to arrive on time!</p>
          </div>
        </body>
      </html>
    `
  })
};


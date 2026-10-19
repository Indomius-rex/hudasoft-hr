import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, employeeName, requestType, requestDetails, reviewLink } = body;

    if (!to || !employeeName) {
      console.log('Missing fields:', { to, employeeName });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Sending email to:', to);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Hudasoft HR" <${process.env.SMTP_USER}>`,
      to: to,
      subject: `New ${requestType} Request from ${employeeName}`,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #0165FF;">Hudasoft HRMS</h2>
        <p>You have a new <strong>${requestType}</strong> request from <strong>${employeeName}</strong>.</p>
        <div style="background: #f5f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p>${requestDetails}</p>
        </div>
        <a href="${reviewLink}" style="display: inline-block; background: #0165FF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Review Request</a>
      </div>`,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SMTP Error Details:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
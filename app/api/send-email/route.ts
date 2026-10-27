import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const maxDuration = 60; // Vercel par function ko 60 second tak chalne dein

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, employeeName, requestType, requestDetails, reviewLink } = body;

    if (!to || !employeeName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check karein ke environment variables load hue hain ya nahi
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS_NEW) {
      console.error("❌ SMTP Credentials Missing in .env file!");
      return NextResponse.json({ error: 'Server configuration error: SMTP keys missing' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465, // Default 465 kar diya hai
      secure: Number(process.env.SMTP_PORT) === 465 || Number(process.env.SMTP_PORT) === 465, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS_NEW, // Yahan naam wahi rakhein jo .env mein hai
      },
      connectionTimeout: 10000, // 10 sec timeout
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
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    // YEH SABSE ZAROORI HAI: Terminal mein asal error dikhane ke liye
    console.error('❌ SMTP Error Details:', error.message); 
    return NextResponse.json({ error: 'Failed to send email', details: error.message }, { status: 500 });
  }
}
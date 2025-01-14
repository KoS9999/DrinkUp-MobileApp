const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendTestEmail = async () => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'ngongocthong1211@gmail.com',
      subject: 'Test Email',
      text: 'This is a test email sent using Nodemailer.',
    });
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
};

sendTestEmail();

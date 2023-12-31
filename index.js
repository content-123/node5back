// server.js

const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = 3000;

// MongoDB setup
// const User = mongoose.model('User', { email: String, password: String, resetToken: String, resetTokenExpiry: Date });
mongoose.connect('mongodb://localhost/Database1', { useNewUrlParser: true, useUnifiedTopology: true });
const User = mongoose.model('User', { email: String, password: String, resetToken: String, resetTokenExpiry: Date });

// Middleware
app.use(express.json());
app.use(cors());

// Routes

app.post('/create-user', async (req, res) => {
  try {
    const { email, password, resetToken, resetTokenExpiry } = req.body;

    // Create a new user
    const newUser = new User({
      email,
      password,
      resetToken,
      resetTokenExpiry,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/forgot-password', async (req, res) => {
  console.log('Reached /forgot-password route');
  try {
    const { email } = req.body;
    console.log('Received email:', email); 

    const existingUser = await User.findOne({ email });
    console.log('Found user:', User);

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate random token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // Token expires in 1 hour

    // Update user with reset token and expiry
    await User.updateOne({ email }, { $set: { resetToken, resetTokenExpiry } });

    // Send email with reset link
    const transporter = nodemailer.createTransport({
      
      host: 'smtp.mail.gmail.com', // Replace with your email service SMTP server
      port: 587, // Replace with your email service SMTP port
      secure: false,
      auth: {
        user: 'keerthanakk10@gmail.com',
        pass: 'Liyas@2019',
      },
    });

    const mailOptions = {
      from: 'keerthanakk10@gmail.com',
      to: 'surji73@gmail.com',
      subject: 'Password Reset',
      text: `Click the following link to reset your password: http://localhost:3000/reset-password/${resetToken}`,
    };

    transporter.sendMail(mailOptions, (error) => {
      // if (error) {
      //   return res.status(500).json({ error: 'Error sending email' });
      // }

      res.json({ message: 'Email sent with reset instructions' });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  const existingUser = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });

  if (!existingUser) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  res.json({ message: 'Token verified' });
});

app.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  const existingUser = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });

  if (!existingUser) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  await User.updateOne({ resetToken: token }, { $set: { password, resetToken: null, resetTokenExpiry: null } });

  res.json({ message: 'Password reset successfully' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

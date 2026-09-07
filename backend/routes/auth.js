const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, contactNumber, password } = req.body;

    if (!firstName || !lastName || !contactNumber || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ contactNumber });
    if (existingUser) {
      return res.status(409).json({ error: 'Contact number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      contactNumber,
      password: hashedPassword,
    });

    res.status(201).json({ message: 'User created successfully', userId: newUser._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { contactNumber, password } = req.body;

    const user = await User.findOne({ contactNumber });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, firstName: user.firstName },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token, firstName: user.firstName });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  // With JWT, logout is handled client-side by simply discarding the token.
  // This endpoint exists mainly for a consistent API and future extensibility (e.g., token blocklisting).
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
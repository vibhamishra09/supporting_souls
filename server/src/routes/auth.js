const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { PrismaClient } = require('../../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();

// Initialize the OAuth2Client with Google Client ID
const oauth = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Auth endpoint
router.post('/google', async (req, res) => {
  try {
    // Extract the id_token from the request body
    const { id_token } = req.body;

    // If id_token is missing, respond with an error
    if (!id_token) {
      return res.status(400).json({ error: 'Missing id_token' });
    }

    // Verify the id_token with Google
    const ticket = await oauth.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,  // Ensure the audience matches your Google Client ID
    });

    // Get the payload (user info) from the verified ticket
    const payload = ticket.getPayload();

    // If the email is not verified by Google, respond with an error
    if (!payload.email_verified) {
      return res.status(401).json({ error: 'Email not verified by Google' });
    }

    // Prepare user data for database
    const userData = {
      email: payload.email,
      fullName: payload.name || null,
      picture: payload.picture || null,
      googleId: payload.sub,
      authProvider: 'GOOGLE',
    };

    // Look for an existing user based on Google ID or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: payload.sub },
          { email: payload.email },
        ],
      },
    });

    // If user doesn't exist, create a new one
    if (!user) {
      user = await prisma.user.create({
        data: userData,
      });
    } else {
      // If user exists, update their information
      user = await prisma.user.update({
        where: { id: user.id },
        data: userData,
      });
    }

    // Generate a JWT token for the user
    const token = jwt.sign(
      { uid: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    // Send the response with the token and user info
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        picture: user.picture,
      },
    });
  } catch (e) {
    // Log the error and respond with a generic error message
    console.error('Google auth error:', e?.message || e);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

module.exports = router;

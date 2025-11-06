// /api/auth/google.js

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../../generated/prisma');

// Initialize Prisma client to interact with the database
const prisma = new PrismaClient();

// Google OAuth2 Client
const oauth = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// API handler for the POST request to authenticate with Google
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Extract the id_token from the request body
      const { id_token } = req.body;
      if (!id_token) return res.status(400).json({ error: 'Missing id_token' });

      // Verify the id_token with Google
      const ticket = await oauth.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,  // Make sure this matches your Google Client ID
      });

      // Get the payload (user data) from the Google token
      const payload = ticket.getPayload();

      // Check if the email is verified by Google
      if (!payload.email_verified) {
        return res.status(401).json({ error: 'Email not verified by Google' });
      }

      // Prepare the user data for saving in the database
      const userData = {
        email: payload.email,
        fullName: payload.name || null,
        picture: payload.picture || null,
        googleId: payload.sub,
        authProvider: 'GOOGLE',
      };

      // Find an existing user by Google ID or email
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleId: payload.sub },
            { email: payload.email },
          ],
        },
      });

      // If the user doesn't exist, create a new one
      if (!user) {
        user = await prisma.user.create({ data: userData });
      } else {
        // If the user exists, update their information
        user = await prisma.user.update({
          where: { id: user.id },
          data: userData,
        });
      }

      // Generate a JWT token for the authenticated user
      const token = jwt.sign(
        { uid: user.id, email: user.email },
        process.env.JWT_SECRET || 'dev-secret',  // Use a proper secret in production
        { expiresIn: '7d' }
      );

      // Send the token and user details in the response
      res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          picture: user.picture,
        },
      });
    } catch (error) {
      // Log the error and send a response with the error message
      console.error('Google Auth error:', error.message || error);
      res.status(401).json({ error: 'Invalid Google token' });
    }
  } else {
    // If the request method is not POST, return 405 Method Not Allowed
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}

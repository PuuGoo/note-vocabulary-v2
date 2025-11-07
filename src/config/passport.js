// =====================================================
// Passport Authentication Configuration
// =====================================================

const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');

module.exports = (passport, prisma) => {
  // =====================================================
  // Local Strategy (Email/Password)
  // =====================================================
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          if (!user.passwordHash) {
            return done(null, false, { message: 'Please use Google Sign-In' });
          }

          const isMatch = await bcrypt.compare(password, user.passwordHash);

          if (!isMatch) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // =====================================================
  // Google OAuth Strategy
  // =====================================================
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await prisma.user.findUnique({
              where: { googleId: profile.id },
            });

            if (!user) {
              // Check if email exists
              const existingUser = await prisma.user.findUnique({
                where: { email: profile.emails[0].value.toLowerCase() },
              });

              if (existingUser) {
                // Link Google account to existing user
                user = await prisma.user.update({
                  where: { id: existingUser.id },
                  data: {
                    googleId: profile.id,
                    emailVerified: true,
                  },
                });
              } else {
                // Create new user
                user = await prisma.user.create({
                  data: {
                    email: profile.emails[0].value.toLowerCase(),
                    name: profile.displayName,
                    googleId: profile.id,
                    emailVerified: true,
                    role: 'USER',
                  },
                });
              }
            }

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  // =====================================================
  // Serialize/Deserialize User
  // =====================================================
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          settings: true,
          emailVerified: true,
        },
      });
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};

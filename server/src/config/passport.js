import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/api/auth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = null;
        if (profile.emails && profile.emails.length > 0) {
          email = profile.emails[0].value;
        }

        if (!email) {
          return done(new Error('No email found associated with GitHub account'), null);
        }

        let user = await User.findOne({ email });

        if (user) {
          if (!user.githubId) {
            user.githubId = profile.id;
            if (!user.avatarUrl && profile.photos && profile.photos.length > 0) {
              user.avatarUrl = profile.photos[0].value;
            }
            await user.save();
          }
          return done(null, user);
        }

        user = await User.create({
          name: profile.displayName || profile.username,
          email: email,
          githubId: profile.id,
          avatarUrl: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;

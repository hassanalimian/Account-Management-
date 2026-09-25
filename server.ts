import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword, verifyPassword } from './server/db.ts';
import { getPhpSourceFiles } from './server/phpSource.ts';
import { User } from './server/types.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // In-memory token session mapping
  const tokenStore = new Map<string, number>();

  // In-memory OAuth state storage for CSRF protection (15 minute TTL)
  const oauthStates = new Map<
    string,
    {
      createdAt: number;
      redirectUri: string;
      action?: 'login' | 'link';
      userId?: number;
    }
  >();

  const cleanExpiredOauthStates = () => {
    const now = Date.now();
    for (const [key, val] of oauthStates.entries()) {
      if (now - val.createdAt > 15 * 60 * 1000) {
        oauthStates.delete(key);
      }
    }
  };

  const getAppOrigin = (req: Request): string => {
    if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
      return process.env.APP_URL.replace(/\/$/, '');
    }
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'] || 'localhost:3000';
    return `${proto}://${host}`;
  };

  // Auth Middleware
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.substring(7);
    const userId = tokenStore.get(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    }
    const user = db.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    (req as any).user = user;
    (req as any).token = token;
    next();
  };

  const businessAccessMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const businessId = parseInt(req.params.businessId || req.body.businessId, 10);
    if (isNaN(businessId)) {
      return res.status(400).json({ error: 'Invalid business ID' });
    }
    const business = db.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const user: User = (req as any).user;
    if (user.role !== 'admin' && business.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this business' });
    }
    (req as any).business = business;
    next();
  };

  // --- HEALTH CHECK ---
  app.get('/api/health', (req, res) => {
    return res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- AUTH ROUTES ---
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = hashPassword(password);
    const user = db.createUser(name, email, passwordHash, 'user');
    const token = `session_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    tokenStore.set(token, user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        auth_provider: user.auth_provider || 'email',
        google_id: user.google_id || null,
        profile_image: user.profile_image || null,
        email_verified: Boolean(user.email_verified),
        has_password: Boolean(user.password_hash),
        business_limit: user.business_limit,
      },
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email);
    if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
      if (user && !user.password_hash) {
        return res.status(401).json({
          error:
            'This account was created with Google Sign-In. Please click "Continue with Google" or set a password in Account Settings.',
        });
      }
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = `session_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    tokenStore.set(token, user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        auth_provider: user.auth_provider || 'email',
        google_id: user.google_id || null,
        profile_image: user.profile_image || null,
        email_verified: Boolean(user.email_verified),
        has_password: Boolean(user.password_hash),
        business_limit: user.business_limit,
      },
    });
  });

  // --- GOOGLE OAUTH 2.0 ROUTES ---
  app.get('/api/auth/google/url', (req, res) => {
    cleanExpiredOauthStates();
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const appOrigin = getAppOrigin(req);
    const redirectUri = `${appOrigin}/api/auth/google/callback`;
    const state = crypto.randomBytes(24).toString('hex');
    const action = (req.query.action as string) === 'link' ? 'link' : 'login';

    let userId: number | undefined;
    if (action === 'link') {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        userId = tokenStore.get(token);
      }
    }

    oauthStates.set(state, {
      createdAt: Date.now(),
      redirectUri,
      action,
      userId,
    });

    const isConfigured = Boolean(
      clientId &&
        clientId.trim() &&
        clientId !== 'MY_GOOGLE_CLIENT_ID' &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_CLIENT_SECRET !== 'MY_GOOGLE_CLIENT_SECRET'
    );

    const googleAuthUrl =
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'offline',
        prompt: 'select_account',
      }).toString();

    return res.json({
      url: googleAuthUrl,
      state,
      redirect_uri: redirectUri,
      is_configured: isConfigured,
      client_id: clientId,
      app_url: appOrigin,
    });
  });

  const handleGoogleCallback = async (req: Request, res: Response) => {
    cleanExpiredOauthStates();
    const { code, state, error, error_description } = req.query;

    const renderPopupHtml = (payload: any) => {
      const isSuccess = payload.type === 'GOOGLE_AUTH_SUCCESS';
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>${isSuccess ? 'Authentication Succeeded' : 'Authentication Error'}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #020617;
                color: #f8fafc;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
              }
              .box {
                background: #0f172a;
                border: 1px solid #1e293b;
                padding: 2.25rem;
                border-radius: 1rem;
                text-align: center;
                max-width: 420px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
              }
              .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #6366f1;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto 1.25rem;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
              h3 { margin: 0 0 0.5rem; font-size: 1.15rem; color: #fff; }
              p { margin: 0; color: #94a3b8; font-size: 0.875rem; line-height: 1.5; }
              .error-box { color: #f87171; }
            </style>
          </head>
          <body>
            <div class="box">
              ${isSuccess ? '<div class="spinner"></div>' : '<div style="font-size:2.5rem; margin-bottom:0.75rem;">⚠️</div>'}
              <h3 class="${isSuccess ? '' : 'error-box'}">${isSuccess ? 'Authentication Successful' : 'Authentication Failed'}</h3>
              <p>${payload.error ? payload.error : 'Completing sign in and redirecting to Business Dashboard...'}</p>
            </div>
            <script>
              const authData = ${JSON.stringify(payload)};
              if (window.opener) {
                window.opener.postMessage(authData, '*');
                setTimeout(() => window.close(), ${isSuccess ? 350 : 2500});
              } else {
                setTimeout(() => { window.location.href = '/'; }, 1000);
              }
            </script>
          </body>
        </html>
      `);
    };

    if (error) {
      return renderPopupHtml({
        type: 'GOOGLE_AUTH_ERROR',
        error: String(error_description || error || 'Google sign-in was cancelled or encountered an error'),
      });
    }

    if (!code || !state) {
      return renderPopupHtml({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'Missing OAuth authorization code or state token.',
      });
    }

    const stateEntry = oauthStates.get(String(state));
    if (!stateEntry) {
      return renderPopupHtml({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'Invalid or expired OAuth state parameter (CSRF protection failed).',
      });
    }
    oauthStates.delete(String(state));

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return renderPopupHtml({
        type: 'GOOGLE_AUTH_ERROR',
        error: 'Google OAuth Client ID or Client Secret is not configured in the application environment.',
      });
    }

    try {
      // Exchange code for token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: stateEntry.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error('Google token exchange error:', errText);
        return renderPopupHtml({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'Failed to exchange authorization code with Google token endpoint.',
        });
      }

      const tokenJson = await tokenRes.json();
      const accessToken = tokenJson.access_token;

      // Fetch user profile from Google UserInfo
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileRes.ok) {
        return renderPopupHtml({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'Failed to retrieve verified user profile from Google.',
        });
      }

      const googleUser = await profileRes.json();
      const googleId = googleUser.sub;
      const email = googleUser.email;
      const name = googleUser.name || email.split('@')[0];
      const picture = googleUser.picture || null;

      if (!googleId || !email) {
        return renderPopupHtml({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'Google profile did not contain required ID or verified email.',
        });
      }

      // Check if linking to existing session
      if (stateEntry.action === 'link' && stateEntry.userId) {
        const linkResult = db.linkGoogleAccount(stateEntry.userId, googleId, email, picture);
        if (!linkResult.success || !linkResult.user) {
          return renderPopupHtml({
            type: 'GOOGLE_AUTH_ERROR',
            error: linkResult.error || 'Failed to link Google account',
          });
        }
        return renderPopupHtml({
          type: 'GOOGLE_AUTH_SUCCESS',
          action: 'link',
          user: {
            id: linkResult.user.id,
            name: linkResult.user.name,
            email: linkResult.user.email,
            role: linkResult.user.role,
            auth_provider: linkResult.user.auth_provider,
            google_id: linkResult.user.google_id,
            profile_image: linkResult.user.profile_image,
            email_verified: Boolean(linkResult.user.email_verified),
            has_password: Boolean(linkResult.user.password_hash),
          },
        });
      }

      // Login, Link, or Create New Google User
      const authResult = db.createOrLoginGoogleUser({
        googleId,
        email,
        name,
        profileImage: picture,
      });

      const token = `session_${authResult.user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      tokenStore.set(token, authResult.user.id);

      return renderPopupHtml({
        type: 'GOOGLE_AUTH_SUCCESS',
        token,
        is_new: authResult.isNew,
        linked: authResult.linked,
        user: {
          id: authResult.user.id,
          name: authResult.user.name,
          email: authResult.user.email,
          role: authResult.user.role,
          auth_provider: authResult.user.auth_provider,
          google_id: authResult.user.google_id,
          profile_image: authResult.user.profile_image,
          email_verified: Boolean(authResult.user.email_verified),
          has_password: Boolean(authResult.user.password_hash),
        },
      });
    } catch (err: any) {
      console.error('Google OAuth callback error:', err);
      return renderPopupHtml({
        type: 'GOOGLE_AUTH_ERROR',
        error: err.message || 'Server error during Google authentication processing',
      });
    }
  };

  app.get('/api/auth/google/callback', handleGoogleCallback);
  app.get('/api/auth/google/callback/', handleGoogleCallback);

  app.post('/api/auth/google/verify', async (req, res) => {
    const { credential, testUser } = req.body;

    if (credential) {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );
        if (!verifyRes.ok) {
          return res.status(400).json({ error: 'Invalid Google credential token' });
        }
        const tokenInfo = await verifyRes.json();
        const googleId = tokenInfo.sub;
        const email = tokenInfo.email;
        const name = tokenInfo.name || email.split('@')[0];
        const picture = tokenInfo.picture || null;

        const authResult = db.createOrLoginGoogleUser({
          googleId,
          email,
          name,
          profileImage: picture,
        });

        const token = `session_${authResult.user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        tokenStore.set(token, authResult.user.id);

        return res.json({
          token,
          is_new: authResult.isNew,
          linked: authResult.linked,
          user: {
            id: authResult.user.id,
            name: authResult.user.name,
            email: authResult.user.email,
            role: authResult.user.role,
            auth_provider: authResult.user.auth_provider,
            google_id: authResult.user.google_id,
            profile_image: authResult.user.profile_image,
            email_verified: Boolean(authResult.user.email_verified),
            has_password: Boolean(authResult.user.password_hash),
          },
        });
      } catch (e: any) {
        return res.status(500).json({ error: 'Failed to verify Google token: ' + e.message });
      }
    }

    if (testUser && testUser.email) {
      const email = testUser.email.trim().toLowerCase();
      const name = testUser.name || email.split('@')[0];
      const googleId =
        testUser.googleId ||
        `google_${crypto.createHash('md5').update(email).digest('hex').substring(0, 16)}`;
      const profileImage =
        testUser.profileImage ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80`;

      const authResult = db.createOrLoginGoogleUser({
        googleId,
        email,
        name,
        profileImage,
      });

      const token = `session_${authResult.user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      tokenStore.set(token, authResult.user.id);

      return res.json({
        token,
        is_new: authResult.isNew,
        linked: authResult.linked,
        user: {
          id: authResult.user.id,
          name: authResult.user.name,
          email: authResult.user.email,
          role: authResult.user.role,
          auth_provider: authResult.user.auth_provider,
          google_id: authResult.user.google_id,
          profile_image: authResult.user.profile_image,
          email_verified: Boolean(authResult.user.email_verified),
          has_password: Boolean(authResult.user.password_hash),
        },
      });
    }

    return res.status(400).json({ error: 'No Google credential or test profile provided' });
  });

  app.post('/api/auth/google/link', authMiddleware, (req, res) => {
    const user: User = (req as any).user;
    const { googleId, email, profileImage } = req.body;

    if (!googleId) {
      return res.status(400).json({ error: 'Google ID is required' });
    }

    const result = db.linkGoogleAccount(user.id, googleId, email || user.email, profileImage);
    if (!result.success || !result.user) {
      return res.status(400).json({ error: result.error || 'Failed to link Google account' });
    }

    return res.json({
      success: true,
      message: 'Google account linked successfully',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        auth_provider: result.user.auth_provider,
        google_id: result.user.google_id,
        profile_image: result.user.profile_image,
        email_verified: Boolean(result.user.email_verified),
        has_password: Boolean(result.user.password_hash),
      },
    });
  });

  app.post('/api/auth/google/unlink', authMiddleware, (req, res) => {
    const user: User = (req as any).user;
    const result = db.unlinkGoogleAccount(user.id);
    if (!result.success || !result.user) {
      return res.status(400).json({ error: result.error || 'Failed to unlink Google account' });
    }

    return res.json({
      success: true,
      message: 'Google account unlinked successfully',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        auth_provider: result.user.auth_provider,
        google_id: result.user.google_id,
        profile_image: result.user.profile_image,
        email_verified: Boolean(result.user.email_verified),
        has_password: Boolean(result.user.password_hash),
      },
    });
  });

  app.post('/api/auth/set-password', authMiddleware, (req, res) => {
    const user: User = (req as any).user;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const passwordHash = hashPassword(password);
    const result = db.setUserPassword(user.id, passwordHash);
    if (!result.success || !result.user) {
      return res.status(400).json({ error: result.error || 'Failed to set password' });
    }

    return res.json({
      success: true,
      message: 'Account password created successfully',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        auth_provider: result.user.auth_provider,
        google_id: result.user.google_id,
        profile_image: result.user.profile_image,
        email_verified: Boolean(result.user.email_verified),
        has_password: Boolean(result.user.password_hash),
      },
    });
  });

  app.get('/api/auth/me', authMiddleware, (req, res) => {
    const user: User = (req as any).user;
    const effectiveLimit = db.getUserEffectiveLimit(user.id);
    const businesses = db.getBusinessesByUserId(user.id);
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        auth_provider: user.auth_provider || 'email',
        google_id: user.google_id || null,
        profile_image: user.profile_image || null,
        email_verified: Boolean(user.email_verified),
        has_password: Boolean(user.password_hash),
        business_limit: user.business_limit,
        effective_limit: effectiveLimit,
        business_count: businesses.length,
        remaining_slots: Math.max(0, effectiveLimit - businesses.length),
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  });

  app.post('/api/auth/logout', authMiddleware, (req, res) => {
    const token = (req as any).token;
    if (token) tokenStore.delete(token);
    return res.json({ success: true });
  });

  // --- ADMIN ROUTES ---
  app.get('/api/admin/overview', authMiddleware, (req, res) => {
    const user: User = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required' });
    }

    const globalLimit = db.getGlobalBusinessLimit();
    const users = db.getUsers();
    const allBusinesses = db.getAllBusinesses();

    const userOverviews = users.map((u) => {
      const owned = allBusinesses.filter((b) => b.user_id === u.id);
      const effectiveLimit = db.getUserEffectiveLimit(u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        auth_provider: u.auth_provider || 'email',
        google_id: u.google_id || null,
        profile_image: u.profile_image || null,
        email_verified: Boolean(u.email_verified),
        has_password: Boolean(u.password_hash),
        assigned_limit: u.business_limit,
        effective_limit: effectiveLimit,
        current_count: owned.length,
        remaining_slots: Math.max(0, effectiveLimit - owned.length),
        businesses: owned,
        created_at: u.created_at,
        updated_at: u.updated_at,
      };
    });

    return res.json({
      global_limit: globalLimit,
      users: userOverviews,
      total_businesses: allBusinesses.length,
    });
  });

  app.post('/api/admin/global-limit', authMiddleware, (req, res) => {
    const user: User = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required' });
    }
    const limit = parseInt(req.body.limit, 10);
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({ error: 'Global limit must be at least 1' });
    }
    db.setGlobalBusinessLimit(limit);
    return res.json({ success: true, global_limit: limit });
  });

  app.post('/api/admin/user-limit', authMiddleware, (req, res) => {
    const user: User = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required' });
    }
    const targetUserId = parseInt(req.body.userId, 10);
    const limit = req.body.limit === null || req.body.limit === undefined || req.body.limit === '' ? null : parseInt(req.body.limit, 10);

    const updated = db.updateUserLimit(targetUserId, limit);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ success: true, user: updated });
  });

  app.post('/api/admin/business-status', authMiddleware, (req, res) => {
    const user: User = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required' });
    }
    const businessId = parseInt(req.body.businessId, 10);
    const status = req.body.status === 'inactive' ? 'inactive' : 'active';
    const updated = db.updateBusinessStatus(businessId, status);
    if (!updated) return res.status(404).json({ error: 'Business not found' });
    return res.json({ success: true, business: updated });
  });

  // --- BUSINESS ROUTES ---
  app.get('/api/businesses', authMiddleware, (req, res) => {
    const user: User = (req as any).user;
    const businesses = db.getBusinessesByUserId(user.id);
    const effectiveLimit = db.getUserEffectiveLimit(user.id);
    return res.json({
      businesses,
      effective_limit: effectiveLimit,
      current_count: businesses.length,
      remaining_slots: Math.max(0, effectiveLimit - businesses.length),
    });
  });

  app.post('/api/businesses', authMiddleware, (req, res) => {
    const user: User = (req as any).user;
    const { name, logo, icon, address, phone, email, currency, tax_number } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    const result = db.createBusiness({
      userId: user.id,
      name,
      logo,
      icon,
      address,
      phone,
      email,
      currency,
      taxNumber: tax_number,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({ success: true, business: result.business });
  });

  app.get('/api/businesses/:businessId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const business = (req as any).business;
    return res.json({ business });
  });

  app.put('/api/businesses/:businessId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { name, logo, icon, address, phone, email, currency, tax_number, status } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Business name cannot be empty' });
    }

    const updated = db.updateBusiness(businessId, {
      name,
      logo,
      icon,
      address,
      phone,
      email,
      currency,
      tax_number,
      status,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Business not found' });
    }

    return res.json({ success: true, business: updated });
  });

  app.get('/api/businesses/:businessId/salaries', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const salaries = db.getSalaryPayments(businessId);
    return res.json({ salaries });
  });

  app.post('/api/businesses/:businessId/salaries', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const {
      employee_id,
      employee_name,
      month,
      salary_amount,
      bonus,
      deduction,
      payment_method,
      payment_date,
      reference_no,
      notes,
    } = req.body;

    if (!employee_id || !month || salary_amount === undefined) {
      return res.status(400).json({ error: 'Employee, month, and salary amount are required' });
    }

    const payment = db.createSalaryPayment(businessId, {
      employeeId: parseInt(employee_id, 10),
      employeeName: employee_name,
      month,
      salaryAmount: Number(salary_amount) || 0,
      bonus: Number(bonus) || 0,
      deduction: Number(deduction) || 0,
      paymentMethod: payment_method || 'Bank Transfer',
      paymentDate: payment_date,
      referenceNo: reference_no,
      notes,
    });
    return res.json({ success: true, salary: payment });
  });

  // --- CATEGORIES ---
  app.get('/api/businesses/:businessId/categories', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const categories = db.getCategories(businessId);
    return res.json({ categories });
  });

  app.post('/api/businesses/:businessId/categories', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const category = db.createProductCategory(businessId, name, description);
    return res.json({ success: true, category });
  });

  app.put('/api/businesses/:businessId/categories/:catId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const catId = parseInt(req.params.catId, 10);
    const { name, description } = req.body;
    const cat = db.updateProductCategory(catId, businessId, name, description);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    return res.json({ success: true, category: cat });
  });

  app.delete('/api/businesses/:businessId/categories/:catId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const catId = parseInt(req.params.catId, 10);
    const reassignToId = req.query.reassign_to_category_id
      ? parseInt(req.query.reassign_to_category_id as string, 10)
      : req.body?.reassign_to_category_id
      ? parseInt(req.body.reassign_to_category_id, 10)
      : undefined;
    const result = db.deleteProductCategory(catId, businessId, reassignToId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  });

  // --- PRODUCTS ---
  app.get('/api/businesses/:businessId/products', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const products = db.getProducts(businessId);
    return res.json({ products });
  });

  app.post('/api/businesses/:businessId/products', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { name, category_id, sku, purchase_price, selling_price, weight, image, opening_stock } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Product name is required' });
    if (!category_id) return res.status(400).json({ error: 'Product category is required' });

    const product = db.createProduct({
      businessId,
      categoryId: parseInt(category_id, 10),
      name,
      sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
      purchasePrice: parseFloat(purchase_price) || 0,
      sellingPrice: parseFloat(selling_price) || 0,
      weight: weight || '',
      image,
      openingStock: parseInt(opening_stock, 10) || 0,
    });

    return res.json({ success: true, product });
  });

  app.put('/api/businesses/:businessId/products/:prodId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const prodId = parseInt(req.params.prodId, 10);
    const updated = db.updateProduct(prodId, businessId, req.body);
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    return res.json({ success: true, product: updated });
  });

  app.delete('/api/businesses/:businessId/products/:prodId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const prodId = parseInt(req.params.prodId, 10);
    const ok = db.deleteProduct(prodId, businessId);
    return res.json({ success: ok });
  });

  // Dedicated Product / Business Image Upload Endpoint
  app.post('/api/businesses/:businessId/upload-image', authMiddleware, businessAccessMiddleware, (req, res) => {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    return res.json({ success: true, url: image });
  });

  // --- UNIFIED PARTIES (CUSTOMERS & SUPPLIERS) ---
  app.get('/api/businesses/:businessId/parties', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const parties = db.getUnifiedParties(businessId);
    return res.json({ parties });
  });

  app.get('/api/businesses/:businessId/parties/:partyKey/profile', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const profile = db.getUnifiedPartyProfile(businessId, req.params.partyKey);
    if (!profile) return res.status(404).json({ error: 'Party not found' });
    return res.json({ party: profile });
  });

  app.get('/api/businesses/:businessId/parties/:partyKey/ledger', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const fromDate = req.query.from as string;
    const toDate = req.query.to as string;
    const ledgerData = db.getUnifiedPartyLedger(businessId, req.params.partyKey, fromDate, toDate);
    if (!ledgerData) return res.status(404).json({ error: 'Party not found' });
    return res.json(ledgerData);
  });

  app.post('/api/businesses/:businessId/parties/toggle-role', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { partyKey, role, action } = req.body;
    if (!partyKey || !role || !action) {
      return res.status(400).json({ error: 'Party key, role (customer/supplier), and action (add/remove) are required' });
    }
    const result = db.togglePartyRole(businessId, { partyKey, role, action });
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json(result);
  });

  app.post('/api/businesses/:businessId/parties/delete', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { partyKey, forceDelete } = req.body;
    if (!partyKey) return res.status(400).json({ error: 'Party key is required' });
    const result = db.deleteUnifiedParty(businessId, partyKey, forceDelete);
    if (!result.success) return res.status(400).json({ error: result.error, hasTransactions: result.hasTransactions });
    return res.json(result);
  });

  // --- CUSTOMERS ---
  app.get('/api/businesses/:businessId/customers', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const customers = db.getCustomers(businessId);
    return res.json({ customers });
  });

  app.post('/api/businesses/:businessId/customers', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { name, company_name, phone, email, address, city, tax_number, notes, opening_balance, also_supplier } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Customer name is required' });

    const result = db.createCustomer({
      businessId,
      name,
      company_name: company_name || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      city: city || '',
      tax_number: tax_number || '',
      notes: notes || '',
      openingBalance: parseFloat(opening_balance) || 0,
      alsoAsSupplier: Boolean(also_supplier),
    });
    return res.json({ success: true, customer: result.customer, supplier: result.supplier, unifiedParty: result.unifiedParty });
  });

  app.put('/api/businesses/:businessId/customers/:custId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const custId = parseInt(req.params.custId, 10);
    const updated = db.updateCustomer(custId, businessId, req.body);
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    return res.json({ success: true, customer: updated });
  });

  app.post('/api/businesses/:businessId/customers/:custId/designate-supplier', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const custId = parseInt(req.params.custId, 10);
    const result = db.designateCustomerAsSupplier(custId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json(result);
  });

  app.post('/api/businesses/:businessId/customers/:custId/remove-role', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const custId = parseInt(req.params.custId, 10);
    const result = db.removeCustomerRole(custId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json(result);
  });

  app.delete('/api/businesses/:businessId/customers/:custId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const custId = parseInt(req.params.custId, 10);
    const result = db.deleteCustomer(custId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error, hasTransactions: result.hasTransactions });
    return res.json(result);
  });

  app.get('/api/businesses/:businessId/customers/:custId/ledger', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const custId = parseInt(req.params.custId, 10);
    const customer = db.getCustomerById(custId, businessId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const fromDate = req.query.from as string;
    const toDate = req.query.to as string;

    // Use unified ledger if customer has a party_id or linked supplier
    const partyKey = customer.party_id ? String(customer.party_id) : `c_${custId}`;
    const unified = db.getUnifiedPartyLedger(businessId, partyKey, fromDate, toDate);
    if (unified) {
      return res.json({ customer, ...unified });
    }

    const ledger = db.getLedger(businessId, 'customer', custId, fromDate, toDate);
    return res.json({ customer, ...ledger });
  });

  // --- SUPPLIERS ---
  app.get('/api/businesses/:businessId/suppliers', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const suppliers = db.getSuppliers(businessId);
    return res.json({ suppliers });
  });

  app.post('/api/businesses/:businessId/suppliers', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { name, company_name, phone, email, address, city, tax_number, notes, opening_balance, also_customer } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Supplier name is required' });

    const result = db.createSupplier({
      businessId,
      name,
      company_name: company_name || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      city: city || '',
      tax_number: tax_number || '',
      notes: notes || '',
      openingBalance: parseFloat(opening_balance) || 0,
      alsoAsCustomer: Boolean(also_customer),
    });
    return res.json({ success: true, supplier: result.supplier, customer: result.customer, unifiedParty: result.unifiedParty });
  });

  app.put('/api/businesses/:businessId/suppliers/:suppId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const suppId = parseInt(req.params.suppId, 10);
    const updated = db.updateSupplier(suppId, businessId, req.body);
    if (!updated) return res.status(404).json({ error: 'Supplier not found' });
    return res.json({ success: true, supplier: updated });
  });

  app.post('/api/businesses/:businessId/suppliers/:suppId/designate-customer', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const suppId = parseInt(req.params.suppId, 10);
    const result = db.designateSupplierAsCustomer(suppId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json(result);
  });

  app.post('/api/businesses/:businessId/suppliers/:suppId/remove-role', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const suppId = parseInt(req.params.suppId, 10);
    const result = db.removeSupplierRole(suppId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json(result);
  });

  app.delete('/api/businesses/:businessId/suppliers/:suppId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const suppId = parseInt(req.params.suppId, 10);
    const result = db.deleteSupplier(suppId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error, hasTransactions: result.hasTransactions });
    return res.json(result);
  });

  app.get('/api/businesses/:businessId/suppliers/:suppId/ledger', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const suppId = parseInt(req.params.suppId, 10);
    const supplier = db.getSupplierById(suppId, businessId);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    const fromDate = req.query.from as string;
    const toDate = req.query.to as string;

    // Use unified ledger if supplier has a party_id or linked customer
    const partyKey = supplier.party_id ? String(supplier.party_id) : `s_${suppId}`;
    const unified = db.getUnifiedPartyLedger(businessId, partyKey, fromDate, toDate);
    if (unified) {
      return res.json({ supplier, ...unified });
    }

    const ledger = db.getLedger(businessId, 'supplier', suppId, fromDate, toDate);
    return res.json({ supplier, ...ledger });
  });

  // --- BANK ACCOUNTS & MULTI-BUSINESS ---
  app.get('/api/businesses/:businessId/bank-accounts', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const accounts = db.getBankAccountsForBusiness(businessId);
    return res.json({ accounts });
  });

  app.post('/api/businesses/:businessId/bank-accounts', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const user: User = (req as any).user;
    const {
      bank_name,
      account_title,
      account_number,
      account_type,
      opening_balance,
      scope,
      connected_business_ids,
    } = req.body;

    if (!bank_name || !account_title || !account_number) {
      return res.status(400).json({ error: 'Bank name, account title, and account number are required' });
    }

    const account = db.createBankAccount({
      userId: user.id,
      primaryBusinessId: businessId,
      bankName: bank_name,
      accountTitle: account_title,
      accountNumber: account_number,
      accountType: account_type || 'Checking',
      openingBalance: parseFloat(opening_balance) || 0,
      scope: scope === 'multiple' ? 'multiple' : 'individual',
      connectedBusinessIds: connected_business_ids || [businessId],
    });

    return res.json({ success: true, account });
  });

  app.post('/api/businesses/:businessId/bank-accounts/:accId/convert', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const accId = parseInt(req.params.accId, 10);
    const user: User = (req as any).user;
    const { target_scope, target_business_id, additional_business_ids } = req.body;

    const result = db.convertBankAccountScope({
      bankAccountId: accId,
      userId: user.id,
      targetScope: target_scope,
      targetBusinessId: target_business_id ? parseInt(target_business_id, 10) : businessId,
      additionalBusinessIds: additional_business_ids,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({ success: true, account: result.account });
  });

  app.get('/api/businesses/:businessId/bank-accounts/:accId/statement', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const accId = parseInt(req.params.accId, 10);
    const scopeType = req.query.scope === 'combined' ? 'combined' : 'business';
    const fromDate = req.query.from as string;
    const toDate = req.query.to as string;

    try {
      const statement = db.getBankStatement(accId, {
        scopeType,
        businessId,
        fromDate,
        toDate,
      });
      return res.json(statement);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  app.put('/api/businesses/:businessId/bank-accounts/:accId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const accId = parseInt(req.params.accId, 10);
    const { bank_name, account_title, account_number, account_type } = req.body;

    const result = db.updateBankAccount(accId, businessId, {
      bankName: bank_name,
      accountTitle: account_title,
      accountNumber: account_number,
      accountType: account_type,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({ success: true, account: result.account });
  });

  app.delete('/api/businesses/:businessId/bank-accounts/:accId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const accId = parseInt(req.params.accId, 10);

    const result = db.deleteBankAccount(accId, businessId);
    if (!result.success) {
      return res.status(400).json({ error: result.error, transactionCount: result.transactionCount });
    }
    return res.json({ success: true });
  });

  // --- SALES ORDERS ---
  app.get('/api/businesses/:businessId/sales-orders', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const orders = db.getSalesOrders(businessId);
    return res.json({ orders });
  });

  app.post('/api/businesses/:businessId/sales-orders', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { customer_id, order_date, discount, tax, notes, items, warehouse_id } = req.body;

    if (!customer_id) return res.status(400).json({ error: 'Customer is required' });
    if (!items || !items.length) return res.status(400).json({ error: 'Sales order must contain at least one item' });

    const result = db.createSalesOrder({
      businessId,
      customerId: parseInt(customer_id, 10),
      orderDate: order_date,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      notes: notes || '',
      warehouseId: warehouse_id ? parseInt(warehouse_id, 10) : undefined,
      items,
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, order: result.order });
  });

  app.put('/api/businesses/:businessId/sales-orders/:orderId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const orderId = parseInt(req.params.orderId, 10);
    const { customer_id, order_date, discount, tax, notes, items, warehouse_id } = req.body;

    const result = db.updateSalesOrder(orderId, businessId, {
      customerId: customer_id ? parseInt(customer_id, 10) : undefined,
      orderDate: order_date,
      discount: discount !== undefined ? parseFloat(discount) : undefined,
      tax: tax !== undefined ? parseFloat(tax) : undefined,
      notes,
      warehouseId: warehouse_id !== undefined ? parseInt(warehouse_id, 10) : undefined,
      items,
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, order: result.order });
  });

  app.patch('/api/businesses/:businessId/sales-orders/:orderId/status', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const orderId = parseInt(req.params.orderId, 10);
    const { status } = req.body;

    const validStatuses = ['In Process', 'Approved', 'Rejected', 'Complete'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = db.updateSalesOrderStatus(orderId, businessId, status);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, order: result.order });
  });

  app.delete('/api/businesses/:businessId/sales-orders/:orderId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const orderId = parseInt(req.params.orderId, 10);
    const result = db.deleteSalesOrder(orderId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // --- INVOICES / SALES ---
  app.get('/api/businesses/:businessId/invoices', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const invoices = db.getInvoices(businessId);
    return res.json({ invoices });
  });

  app.post('/api/businesses/:businessId/invoices', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { customer_id, invoice_date, discount, tax, notes, items, sales_order_id, warehouse_id } = req.body;

    if (!customer_id) return res.status(400).json({ error: 'Customer is required' });
    if (!items || !items.length) return res.status(400).json({ error: 'Invoice must contain at least one item' });

    const result = db.createInvoice({
      businessId,
      customerId: parseInt(customer_id, 10),
      invoiceDate: invoice_date,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      notes: notes || '',
      salesOrderId: sales_order_id ? parseInt(sales_order_id, 10) : undefined,
      warehouseId: warehouse_id ? parseInt(warehouse_id, 10) : undefined,
      items,
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, invoice: result.invoice });
  });

  app.post('/api/businesses/:businessId/invoices/:invId/cancel', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const invId = parseInt(req.params.invId, 10);
    const result = db.cancelInvoice(invId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  app.put('/api/businesses/:businessId/invoices/:invId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const invId = parseInt(req.params.invId, 10);
    const result = db.updateInvoice(invId, businessId, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, invoice: result.invoice });
  });

  app.delete('/api/businesses/:businessId/invoices/:invId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const invId = parseInt(req.params.invId, 10);
    const result = db.deleteInvoice(invId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // --- RECEIPTS / CUSTOMER PAYMENTS ---
  app.get('/api/businesses/:businessId/receipts', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const receipts = db.getReceipts(businessId);
    return res.json({ receipts });
  });

  app.post('/api/businesses/:businessId/receipts', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { customer_id, bank_account_id, amount, payment_date, reference_number, notes } = req.body;

    if (!customer_id) return res.status(400).json({ error: 'Customer is required' });
    if (!bank_account_id) return res.status(400).json({ error: 'Bank account is required' });
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Valid payment amount is required' });

    const result = db.createReceipt({
      businessId,
      customerId: parseInt(customer_id, 10),
      bankAccountId: parseInt(bank_account_id, 10),
      amount: parseFloat(amount),
      paymentDate: payment_date,
      referenceNumber: reference_number || '',
      notes: notes || '',
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, receipt: result.receipt });
  });

  app.put('/api/businesses/:businessId/receipts/:rcptId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const rcptId = parseInt(req.params.rcptId, 10);
    const result = db.updateReceipt(rcptId, businessId, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, receipt: result.receipt });
  });

  app.delete('/api/businesses/:businessId/receipts/:rcptId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const rcptId = parseInt(req.params.rcptId, 10);
    const result = db.deleteReceipt(rcptId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // --- PURCHASE ORDERS ---
  app.get('/api/businesses/:businessId/purchase-orders', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const orders = db.getPurchaseOrders(businessId);
    return res.json({ orders });
  });

  app.post('/api/businesses/:businessId/purchase-orders', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { supplier_id, order_date, tax, notes, items, warehouse_id } = req.body;

    if (!supplier_id) return res.status(400).json({ error: 'Supplier is required' });
    if (!items || !items.length) return res.status(400).json({ error: 'Purchase order must contain at least one item' });

    const result = db.createPurchaseOrder({
      businessId,
      supplierId: parseInt(supplier_id, 10),
      orderDate: order_date,
      tax: parseFloat(tax) || 0,
      notes: notes || '',
      warehouseId: warehouse_id ? parseInt(warehouse_id, 10) : undefined,
      items,
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, order: result.order });
  });

  app.put('/api/businesses/:businessId/purchase-orders/:orderId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const orderId = parseInt(req.params.orderId, 10);
    const { supplier_id, order_date, tax, notes, items, warehouse_id } = req.body;

    const result = db.updatePurchaseOrder(orderId, businessId, {
      supplierId: supplier_id ? parseInt(supplier_id, 10) : undefined,
      orderDate: order_date,
      tax: tax !== undefined ? parseFloat(tax) : undefined,
      notes,
      warehouseId: warehouse_id !== undefined ? parseInt(warehouse_id, 10) : undefined,
      items,
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, order: result.order });
  });

  app.patch('/api/businesses/:businessId/purchase-orders/:orderId/status', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const orderId = parseInt(req.params.orderId, 10);
    const { status } = req.body;

    const validStatuses = ['In Process', 'Approved', 'Rejected', 'Complete'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const result = db.updatePurchaseOrderStatus(orderId, businessId, status);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, order: result.order });
  });

  app.delete('/api/businesses/:businessId/purchase-orders/:orderId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const orderId = parseInt(req.params.orderId, 10);
    const result = db.deletePurchaseOrder(orderId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // --- BILLS / PURCHASES ---
  app.get('/api/businesses/:businessId/bills', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const bills = db.getBills(businessId);
    return res.json({ bills });
  });

  app.post('/api/businesses/:businessId/bills', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { supplier_id, bill_date, tax, notes, items, purchase_order_id, warehouse_id } = req.body;

    if (!supplier_id) return res.status(400).json({ error: 'Supplier is required' });
    if (!items || !items.length) return res.status(400).json({ error: 'Bill must contain at least one item' });

    const result = db.createBill({
      businessId,
      supplierId: parseInt(supplier_id, 10),
      billDate: bill_date,
      tax: parseFloat(tax) || 0,
      notes: notes || '',
      purchaseOrderId: purchase_order_id ? parseInt(purchase_order_id, 10) : undefined,
      warehouseId: warehouse_id ? parseInt(warehouse_id, 10) : undefined,
      items,
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, bill: result.bill });
  });

  app.put('/api/businesses/:businessId/bills/:billId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const billId = parseInt(req.params.billId, 10);
    const result = db.updateBill(billId, businessId, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, bill: result.bill });
  });

  app.delete('/api/businesses/:businessId/bills/:billId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const billId = parseInt(req.params.billId, 10);
    const result = db.deleteBill(billId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // --- PAYMENTS / SUPPLIER PAYMENTS ---
  app.get('/api/businesses/:businessId/payments', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const payments = db.getPayments(businessId);
    return res.json({ payments });
  });

  app.post('/api/businesses/:businessId/payments', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { supplier_id, bank_account_id, amount, payment_date, reference_number, notes } = req.body;

    if (!supplier_id) return res.status(400).json({ error: 'Supplier is required' });
    if (!bank_account_id) return res.status(400).json({ error: 'Bank account is required' });
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Valid payment amount is required' });

    const result = db.createPayment({
      businessId,
      supplierId: parseInt(supplier_id, 10),
      bankAccountId: parseInt(bank_account_id, 10),
      amount: parseFloat(amount),
      paymentDate: payment_date,
      referenceNumber: reference_number || '',
      notes: notes || '',
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, payment: result.payment });
  });

  app.put('/api/businesses/:businessId/payments/:payId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const payId = parseInt(req.params.payId, 10);
    const result = db.updatePayment(payId, businessId, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, payment: result.payment });
  });

  app.delete('/api/businesses/:businessId/payments/:payId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const payId = parseInt(req.params.payId, 10);
    const result = db.deletePayment(payId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // --- WAREHOUSES ---
  app.get('/api/businesses/:businessId/warehouses', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const warehouses = db.getWarehouses(businessId);
    return res.json({ warehouses });
  });

  app.get('/api/businesses/:businessId/warehouses/:warehouseId/stock', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const warehouseId = parseInt(req.params.warehouseId, 10);
    const warehouse = db.getWarehouseById(warehouseId, businessId);
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
    const inventory = db.getWarehouseInventory(businessId, warehouseId);
    return res.json({ warehouse, inventory });
  });

  app.post('/api/businesses/:businessId/warehouses', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { name, code, address, city, phone, email, manager, capacity, notes, status, is_default } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Warehouse name is required' });

    const warehouse = db.createWarehouse({
      businessId,
      name,
      code,
      address,
      city,
      phone,
      email,
      manager,
      capacity,
      notes,
      status: status || 'active',
      is_default: !!is_default,
    });

    return res.json({ success: true, warehouse });
  });

  app.put('/api/businesses/:businessId/warehouses/:warehouseId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const warehouseId = parseInt(req.params.warehouseId, 10);
    const updated = db.updateWarehouse(warehouseId, businessId, req.body);
    if (!updated) return res.status(404).json({ error: 'Warehouse not found' });
    return res.json({ success: true, warehouse: updated });
  });

  app.delete('/api/businesses/:businessId/warehouses/:warehouseId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const warehouseId = parseInt(req.params.warehouseId, 10);
    const result = db.deleteWarehouse(warehouseId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // --- STOCK TRANSFERS ---
  app.get('/api/businesses/:businessId/stock-transfers', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const transfers = db.getStockTransfers(businessId);
    return res.json({ transfers });
  });

  app.post('/api/businesses/:businessId/stock-transfers', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const {
      from_warehouse_id,
      to_warehouse_id,
      items,
      product_id,
      quantity,
      transfer_date,
      reference,
      notes,
      destination_business_id,
    } = req.body;

    const result = db.createStockTransfer({
      businessId,
      fromWarehouseId: from_warehouse_id ? parseInt(from_warehouse_id, 10) : 0,
      toWarehouseId: to_warehouse_id ? parseInt(to_warehouse_id, 10) : 0,
      items: items && Array.isArray(items)
        ? items.map((i: any) => ({ productId: parseInt(i.product_id, 10), quantity: parseFloat(i.quantity) }))
        : product_id
        ? [{ productId: parseInt(product_id, 10), quantity: parseFloat(quantity) }]
        : [],
      transferDate: transfer_date,
      reference: reference || '',
      notes: notes || '',
      sourceBusinessId: businessId,
      destinationBusinessId: destination_business_id ? parseInt(destination_business_id, 10) : undefined,
      productId: product_id ? parseInt(product_id, 10) : undefined,
      quantity: quantity ? parseFloat(quantity) : undefined,
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, transfer: result.transfer });
  });

  app.put('/api/businesses/:businessId/stock-transfers/:trfId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const trfId = parseInt(req.params.trfId, 10);
    const result = db.updateStockTransfer(trfId, businessId, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, transfer: result.transfer });
  });

  app.delete('/api/businesses/:businessId/stock-transfers/:trfId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const trfId = parseInt(req.params.trfId, 10);
    const result = db.deleteStockTransfer(trfId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // --- STOCK ADJUSTMENTS ---
  app.get('/api/businesses/:businessId/stock-adjustments', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const adjustments = db.getStockAdjustments(businessId);
    return res.json({ adjustments });
  });

  app.post('/api/businesses/:businessId/stock-adjustments', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { product_id, adjustment_type, quantity, reason, notes, adjustment_date } = req.body;

    if (!product_id) return res.status(400).json({ error: 'Product is required' });
    if (!adjustment_type || !['increase', 'decrease'].includes(adjustment_type)) {
      return res.status(400).json({ error: 'Adjustment type must be either increase or decrease' });
    }
    if (!quantity || parseFloat(quantity) <= 0) return res.status(400).json({ error: 'Valid quantity is required' });

    const result = db.createStockAdjustment({
      businessId,
      productId: parseInt(product_id, 10),
      adjustmentType: adjustment_type,
      quantity: parseFloat(quantity),
      reason: reason || 'Inventory Count Variance',
      notes: notes || '',
      adjustmentDate: adjustment_date,
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, adjustment: result.adjustment });
  });

  app.put('/api/businesses/:businessId/stock-adjustments/:adjId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const adjId = parseInt(req.params.adjId, 10);
    const result = db.updateStockAdjustment(adjId, businessId, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, adjustment: result.adjustment });
  });

  app.delete('/api/businesses/:businessId/stock-adjustments/:adjId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const adjId = parseInt(req.params.adjId, 10);
    const result = db.deleteStockAdjustment(adjId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // --- OTHER PAYMENTS ---
  app.get('/api/businesses/:businessId/other-payments', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const payments = db.getOtherPayments(businessId);
    return res.json({ payments });
  });

  app.post('/api/businesses/:businessId/other-payments', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { bank_account_id, amount, payment_date, payee, category, reference_number, notes } = req.body;

    if (!bank_account_id) return res.status(400).json({ error: 'Bank account is required' });
    if (!payee) return res.status(400).json({ error: 'Payee name is required' });
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Valid amount is required' });

    const result = db.createOtherPayment({
      businessId,
      bankAccountId: parseInt(bank_account_id, 10),
      amount: parseFloat(amount),
      paymentDate: payment_date,
      payee,
      category: category || 'General Expense',
      referenceNumber: reference_number || '',
      notes: notes || '',
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, payment: result.payment });
  });

  app.put('/api/businesses/:businessId/other-payments/:id', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const id = parseInt(req.params.id, 10);
    const result = db.updateOtherPayment(id, businessId, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, payment: result.payment });
  });

  app.delete('/api/businesses/:businessId/other-payments/:id', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const id = parseInt(req.params.id, 10);
    const result = db.deleteOtherPayment(id, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // --- OTHER RECEIPTS ---
  app.get('/api/businesses/:businessId/other-receipts', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const receipts = db.getOtherReceipts(businessId);
    return res.json({ receipts });
  });

  app.post('/api/businesses/:businessId/other-receipts', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { bank_account_id, amount, receipt_date, payer, category, reference_number, notes } = req.body;

    if (!bank_account_id) return res.status(400).json({ error: 'Bank account is required' });
    if (!payer) return res.status(400).json({ error: 'Payer name is required' });
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Valid amount is required' });

    const result = db.createOtherReceipt({
      businessId,
      bankAccountId: parseInt(bank_account_id, 10),
      amount: parseFloat(amount),
      receiptDate: receipt_date,
      payer,
      category: category || 'General Income',
      referenceNumber: reference_number || '',
      notes: notes || '',
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, receipt: result.receipt });
  });

  app.put('/api/businesses/:businessId/other-receipts/:id', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const id = parseInt(req.params.id, 10);
    const result = db.updateOtherReceipt(id, businessId, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, receipt: result.receipt });
  });

  app.delete('/api/businesses/:businessId/other-receipts/:id', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const id = parseInt(req.params.id, 10);
    const result = db.deleteOtherReceipt(id, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // --- BANK TRANSFERS ---
  app.get('/api/businesses/:businessId/bank-transfers', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const transfers = db.getBankTransfers(businessId);
    return res.json({ transfers });
  });

  app.post('/api/businesses/:businessId/bank-transfers', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { from_account_id, to_account_id, amount, transfer_date, reference, notes } = req.body;

    if (!from_account_id || !to_account_id) return res.status(400).json({ error: 'Both from and to accounts are required' });
    if (from_account_id === to_account_id) return res.status(400).json({ error: 'From and to accounts must be different' });
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Valid transfer amount is required' });

    const result = db.createBankTransfer({
      businessId,
      fromAccountId: parseInt(from_account_id, 10),
      toAccountId: parseInt(to_account_id, 10),
      amount: parseFloat(amount),
      transferDate: transfer_date,
      reference: reference || '',
      notes: notes || '',
    });

    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, transfer: result.transfer });
  });

  app.put('/api/businesses/:businessId/bank-transfers/:id', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const id = parseInt(req.params.id, 10);
    const result = db.updateBankTransfer(id, businessId, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, transfer: result.transfer });
  });

  app.delete('/api/businesses/:businessId/bank-transfers/:id', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const id = parseInt(req.params.id, 10);
    const result = db.deleteBankTransfer(id, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // --- REPORTS ---
  app.get('/api/businesses/:businessId/reports/summary', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const fromDate = req.query.from as string;
    const toDate = req.query.to as string;

    const customers = db.getCustomers(businessId);
    const suppliers = db.getSuppliers(businessId);
    const bankAccounts = db.getBankAccountsForBusiness(businessId);
    const products = db.getProducts(businessId);

    let invoices = db.getInvoices(businessId).filter((i) => i.status !== 'cancelled');
    let bills = db.getBills(businessId).filter((b) => b.status !== 'cancelled');
    let receipts = db.getReceipts(businessId).filter((r) => r.status !== 'cancelled');
    let payments = db.getPayments(businessId).filter((p) => p.status !== 'cancelled');

    if (fromDate) {
      invoices = invoices.filter((i) => i.invoice_date >= fromDate);
      bills = bills.filter((b) => b.bill_date >= fromDate);
      receipts = receipts.filter((r) => r.payment_date >= fromDate);
      payments = payments.filter((p) => p.payment_date >= fromDate);
    }
    if (toDate) {
      invoices = invoices.filter((i) => i.invoice_date <= toDate);
      bills = bills.filter((b) => b.bill_date <= toDate);
      receipts = receipts.filter((r) => r.payment_date <= toDate);
      payments = payments.filter((p) => p.payment_date <= toDate);
    }

    const totalSales = invoices.reduce((acc, i) => acc + i.grand_total, 0);
    const totalPurchases = bills.reduce((acc, b) => acc + b.grand_total, 0);
    const totalReceipts = receipts.reduce((acc, r) => acc + r.amount, 0);
    const totalPayments = payments.reduce((acc, p) => acc + p.amount, 0);

    const totalReceivables = customers.reduce((acc, c) => acc + (c.current_balance > 0 ? c.current_balance : 0), 0);
    const totalPayables = suppliers.reduce((acc, s) => acc + (s.current_balance > 0 ? s.current_balance : 0), 0);
    const totalBankBalance = bankAccounts.reduce((acc, b) => acc + b.current_balance, 0);
    const totalInventoryValue = products.reduce((acc, p) => acc + p.current_stock * p.purchase_price, 0);

    return res.json({
      total_sales: totalSales,
      total_purchases: totalPurchases,
      total_receipts: totalReceipts,
      total_payments: totalPayments,
      total_receivables: totalReceivables,
      total_payables: totalPayables,
      total_bank_balance: totalBankBalance,
      total_inventory_value: totalInventoryValue,
      invoices_count: invoices.length,
      bills_count: bills.length,
      receipts_count: receipts.length,
      payments_count: payments.length,
    });
  });

  app.get('/api/businesses/:businessId/reports/stock-movement', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const productId = req.query.productId ? parseInt(req.query.productId as string, 10) : undefined;
    const movements = db.getStockMovements(businessId, productId);
    return res.json({ movements });
  });

  // =========================================================================
  // HR MANAGEMENT & PAYROLL API ENDPOINTS
  // =========================================================================

  // Employees CRUD
  app.get('/api/businesses/:businessId/employees', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const employees = db.getEmployees(businessId);
    return res.json({ employees });
  });

  app.get('/api/businesses/:businessId/employees/:employeeId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const employeeId = parseInt(req.params.employeeId, 10);
    const employee = db.getEmployeeById(employeeId, businessId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    return res.json({ employee });
  });

  app.post('/api/businesses/:businessId/employees', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const result = db.createEmployee({
      business_id: businessId,
      ...req.body,
    });
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, employee: result.employee });
  });

  app.put('/api/businesses/:businessId/employees/:employeeId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const employeeId = parseInt(req.params.employeeId, 10);
    const result = db.updateEmployee(employeeId, businessId, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, employee: result.employee });
  });

  app.delete('/api/businesses/:businessId/employees/:employeeId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const employeeId = parseInt(req.params.employeeId, 10);
    const result = db.deleteEmployee(employeeId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // Attendance
  app.get('/api/businesses/:businessId/attendances', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const month = req.query.month as string;
    const date = req.query.date as string;
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
    const attendances = db.getAttendances(businessId, month, date, employeeId);
    return res.json({ attendances });
  });

  app.post('/api/businesses/:businessId/attendances', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { employee_id, date, status, check_in, check_out, standard_hours, worked_hours, overtime_hours, short_hours, notes } = req.body;
    if (!employee_id || !date || !status) {
      return res.status(400).json({ error: 'Employee ID, date, and status are required' });
    }
    const result = db.saveAttendance({
      businessId,
      employeeId: parseInt(employee_id, 10),
      date,
      status,
      checkIn: check_in,
      checkOut: check_out,
      standardHours: standard_hours !== undefined ? parseFloat(standard_hours) : undefined,
      workedHours: worked_hours !== undefined ? parseFloat(worked_hours) : undefined,
      overtimeHours: overtime_hours !== undefined ? parseFloat(overtime_hours) : undefined,
      shortHours: short_hours !== undefined ? parseFloat(short_hours) : undefined,
      notes,
    });
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, attendance: result.attendance });
  });

  app.post('/api/businesses/:businessId/attendances/bulk', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { date, records } = req.body;
    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Valid date and records array are required' });
    }
    const result = db.saveBulkAttendance(
      businessId,
      date,
      records.map((r: any) => ({
        employeeId: parseInt(r.employee_id, 10),
        status: r.status,
        checkIn: r.check_in,
        checkOut: r.check_out,
        workedHours: r.worked_hours !== undefined ? parseFloat(r.worked_hours) : undefined,
        overtimeHours: r.overtime_hours !== undefined ? parseFloat(r.overtime_hours) : undefined,
        shortHours: r.short_hours !== undefined ? parseFloat(r.short_hours) : undefined,
        notes: r.notes,
      }))
    );
    return res.json(result);
  });

  // Public Holidays
  app.get('/api/businesses/:businessId/public-holidays', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const holidays = db.getPublicHolidays(businessId);
    return res.json({ holidays });
  });

  app.post('/api/businesses/:businessId/public-holidays', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const { name, date, is_paid, is_special, recurring, notes } = req.body;
    const result = db.createPublicHoliday({
      businessId,
      name,
      date,
      isPaid: Boolean(is_paid),
      isSpecial: Boolean(is_special),
      recurring: Boolean(recurring),
      notes,
    });
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, holiday: result.holiday });
  });

  app.put('/api/businesses/:businessId/public-holidays/:holidayId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const holidayId = parseInt(req.params.holidayId, 10);
    const result = db.updatePublicHoliday(holidayId, businessId, req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, holiday: result.holiday });
  });

  app.delete('/api/businesses/:businessId/public-holidays/:holidayId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const holidayId = parseInt(req.params.holidayId, 10);
    const result = db.deletePublicHoliday(holidayId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // Kharchas (Employee Expenses)
  app.get('/api/businesses/:businessId/kharchas', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
    const month = req.query.month as string;
    const kharchas = db.getKharchas(businessId, employeeId, month);
    return res.json({ kharchas });
  });

  app.post('/api/businesses/:businessId/kharchas', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const user: User = (req as any).user;
    const { employee_id, amount, date, payment_account_id, payment_method, description, reference_no, payroll_month } = req.body;
    if (!employee_id || !amount || !payment_account_id) {
      return res.status(400).json({ error: 'Employee, amount, and payment account are required' });
    }
    const result = db.createKharcha({
      businessId,
      employeeId: parseInt(employee_id, 10),
      amount: parseFloat(amount),
      date,
      paymentAccountId: parseInt(payment_account_id, 10),
      paymentMethod: payment_method || 'Cash',
      description: description || 'Employee Kharcha',
      referenceNo: reference_no,
      enteredBy: user.name,
      payrollMonth: payroll_month,
    });
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, kharcha: result.kharcha });
  });

  app.post('/api/businesses/:businessId/kharchas/bulk', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const user: User = (req as any).user;
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Valid items array required' });
    const result = db.createBulkKharcha(
      businessId,
      items.map((it: any) => ({
        employeeId: parseInt(it.employee_id, 10),
        amount: parseFloat(it.amount),
        paymentAccountId: parseInt(it.payment_account_id, 10),
        paymentMethod: it.payment_method || 'Cash',
        note: it.note || 'Bulk Kharcha',
        date: it.date,
        enteredBy: user.name,
      }))
    );
    return res.json(result);
  });

  app.delete('/api/businesses/:businessId/kharchas/:kharchaId', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const kharchaId = parseInt(req.params.kharchaId, 10);
    const result = db.deleteKharcha(kharchaId, businessId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // Advances & Loans
  app.get('/api/businesses/:businessId/advances', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
    const advances = db.getAdvances(businessId, employeeId);
    return res.json({ advances });
  });

  app.post('/api/businesses/:businessId/advances', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const user: User = (req as any).user;
    const { employee_id, advance_amount, date, payment_account_id, payment_method, reason, monthly_deduction, start_month } = req.body;
    if (!employee_id || !advance_amount || !payment_account_id) {
      return res.status(400).json({ error: 'Employee, advance amount, and payment account are required' });
    }
    const result = db.createAdvance({
      businessId,
      employeeId: parseInt(employee_id, 10),
      advanceAmount: parseFloat(advance_amount),
      date,
      paymentAccountId: parseInt(payment_account_id, 10),
      paymentMethod: payment_method || 'Bank Transfer',
      reason: reason || 'Staff Advance',
      monthlyDeduction: parseFloat(monthly_deduction || advance_amount),
      startMonth: start_month,
      enteredBy: user.name,
    });
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, advance: result.advance });
  });

  app.post('/api/businesses/:businessId/advances/:advanceId/settle', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const advanceId = parseInt(req.params.advanceId, 10);
    const amount = req.body.amount ? parseFloat(req.body.amount) : undefined;
    const result = db.settleAdvance(advanceId, businessId, amount);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  });

  // Bonuses
  app.get('/api/businesses/:businessId/bonuses', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
    const month = req.query.month as string;
    const bonuses = db.getBonuses(businessId, employeeId, month);
    return res.json({ bonuses });
  });

  app.post('/api/businesses/:businessId/bonuses', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const user: User = (req as any).user;
    const { employee_id, bonus_type, amount, date, payment_account_id, payment_method, note, payroll_month } = req.body;
    if (!employee_id || !amount || !payment_account_id) {
      return res.status(400).json({ error: 'Employee, amount, and payment account are required' });
    }
    const result = db.createBonus({
      businessId,
      employeeId: parseInt(employee_id, 10),
      bonusType: bonus_type || 'Special Bonus',
      amount: parseFloat(amount),
      date,
      paymentAccountId: parseInt(payment_account_id, 10),
      paymentMethod: payment_method || 'Bank Transfer',
      note: note || 'Staff bonus',
      payrollMonth: payroll_month,
      enteredBy: user.name,
    });
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, bonus: result.bonus });
  });

  app.post('/api/businesses/:businessId/bonuses/bulk', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const user: User = (req as any).user;
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Valid items array required' });
    const result = db.createBulkBonus(
      businessId,
      items.map((it: any) => ({
        employeeId: parseInt(it.employee_id, 10),
        bonusType: it.bonus_type || 'Special Bonus',
        amount: parseFloat(it.amount),
        paymentAccountId: parseInt(it.payment_account_id, 10),
        paymentMethod: it.payment_method || 'Bank Transfer',
        note: it.note || 'Bulk bonus disbursement',
        date: it.date,
        enteredBy: user.name,
      }))
    );
    return res.json(result);
  });

  // Other Deductions
  app.get('/api/businesses/:businessId/other-deductions', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
    const month = req.query.month as string;
    const deductions = db.getOtherDeductions(businessId, employeeId, month);
    return res.json({ deductions });
  });

  app.post('/api/businesses/:businessId/other-deductions', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const user: User = (req as any).user;
    const { employee_id, deduction_type, amount, date, reason, payroll_month } = req.body;
    if (!employee_id || !amount) {
      return res.status(400).json({ error: 'Employee and deduction amount are required' });
    }
    const result = db.createOtherDeduction({
      businessId,
      employeeId: parseInt(employee_id, 10),
      deductionType: deduction_type || 'Other',
      amount: parseFloat(amount),
      date,
      reason: reason || 'Salary deduction',
      authorizedBy: user.name,
      payrollMonth: payroll_month,
    });
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, deduction: result.deduction });
  });

  // Monthly Payroll Calculation, Finalization, and Disbursement
  app.get('/api/businesses/:businessId/payroll', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const data = db.getMonthlyPayroll(businessId, month);
    return res.json(data);
  });

  app.post('/api/businesses/:businessId/payroll/calculate', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const month = req.body.month || new Date().toISOString().slice(0, 7);
    const result = db.calculateMonthlyPayroll(businessId, month);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, payroll: result.payroll, items: result.items });
  });

  app.post('/api/businesses/:businessId/payroll/finalize', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const user: User = (req as any).user;
    const { month } = req.body;
    if (!month) return res.status(400).json({ error: 'Month is required' });
    const result = db.finalizeMonthlyPayroll(businessId, month, user.name);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, payroll: result.payroll });
  });

  app.post('/api/businesses/:businessId/payroll/reopen', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const user: User = (req as any).user;
    const { month } = req.body;
    if (!month) return res.status(400).json({ error: 'Month is required' });
    const result = db.reopenMonthlyPayroll(businessId, month, user.name);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, payroll: result.payroll });
  });

  app.post('/api/businesses/:businessId/payroll/pay', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const user: User = (req as any).user;
    const { payroll_item_id, payment_account_id, payment_method, reference_no, notes } = req.body;
    if (!payroll_item_id || !payment_account_id) {
      return res.status(400).json({ error: 'Payroll item and payment account are required' });
    }
    const result = db.paySalary({
      businessId,
      payrollItemId: parseInt(payroll_item_id, 10),
      paymentAccountId: parseInt(payment_account_id, 10),
      paymentMethod: payment_method || 'Bank Transfer',
      referenceNo: reference_no,
      notes,
      paidBy: user.name,
    });
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, item: result.item });
  });

  app.post('/api/businesses/:businessId/payroll/pay-bulk', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const user: User = (req as any).user;
    const { month, payment_account_id, payment_method, item_ids } = req.body;
    if (!payment_account_id || !Array.isArray(item_ids) || item_ids.length === 0) {
      return res.status(400).json({ error: 'Payment account and item IDs are required' });
    }
    const result = db.payBulkSalaries({
      businessId,
      month: month || new Date().toISOString().slice(0, 7),
      paymentAccountId: parseInt(payment_account_id, 10),
      paymentMethod: payment_method || 'Bank Transfer',
      itemIds: item_ids.map((id: any) => parseInt(id, 10)),
      paidBy: user.name,
    });
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json(result);
  });

  // Employee Statement & Ledger
  app.get('/api/businesses/:businessId/employees/:employeeId/statement', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const employeeId = parseInt(req.params.employeeId, 10);
    const fromDate = req.query.from as string;
    const toDate = req.query.to as string;
    try {
      const statement = db.getEmployeeStatement(businessId, employeeId, fromDate, toDate);
      return res.json(statement);
    } catch (e: any) {
      return res.status(404).json({ error: e.message || 'Statement error' });
    }
  });

  // HR Summary & Audit Logs
  app.get('/api/businesses/:businessId/hr-summary', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const month = req.query.month as string;
    const summary = db.getHRReportSummary(businessId, month);
    return res.json(summary);
  });

  app.get('/api/businesses/:businessId/hr-audit-logs', authMiddleware, businessAccessMiddleware, (req, res) => {
    const businessId = parseInt(req.params.businessId, 10);
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
    const logs = db.getHRAuditLogs(businessId, employeeId);
    return res.json({ logs });
  });

  // --- PHP EXPORT & CODE SOURCE ---
  app.get('/api/php-export/files', (req, res) => {
    const files = getPhpSourceFiles();
    return res.json({ files });
  });

  // --- VITE MIDDLEWARE (DEV) & STATIC FILES (PROD) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Multi-Business Accounting System running on port ${PORT}`);
  });
}

startServer();

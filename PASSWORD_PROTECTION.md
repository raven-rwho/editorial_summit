# Password Protection Setup

This guide explains how to enable password protection for your website, ensuring only users with the correct password can access your content.

## 🔒 Features

- Simple password-based authentication
- Session-based (7-day cookie validity)
- Protects all pages except login and API routes
- Easy to enable/disable
- Clean, responsive login page

## 🚀 Setup

### 1. Configure Environment Variables

Add these variables to your `.env` file:

```bash
# Enable password protection
SITE_PASSWORD_ENABLED='true'

# Set your site password
SITE_PASSWORD='your_secure_password_here'
```

**Important**: Choose a strong password!

### 2. Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
# or
yarn dev
```

### 3. Test the Protection

1. Navigate to your site: `http://localhost:3000`
2. You should be redirected to `/login`
3. Enter your password
4. You should be redirected to the homepage
5. You'll stay logged in for 7 days (or until you clear cookies)

## 🔧 Configuration Options

### Enable/Disable Protection

To **enable** protection:
```bash
SITE_PASSWORD_ENABLED='true'
```

To **disable** protection (open access):
```bash
SITE_PASSWORD_ENABLED='false'
```

### Change Password

Simply update the `SITE_PASSWORD` in your `.env` file and restart the server:
```bash
SITE_PASSWORD='new_password_here'
```

### Session Duration

By default, users stay logged in for 7 days. To change this, edit:

`app/api/auth/login/route.ts`
```typescript
maxAge: 60 * 60 * 24 * 7, // 7 days (in seconds)
```

## 🌐 Deployment (Vercel)

### Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - `SITE_PASSWORD_ENABLED` = `true`
   - `SITE_PASSWORD` = `your_secure_password`
4. Redeploy your site

### Important Security Notes

- ⚠️ **Never commit your actual password** to version control
- ✅ Always use environment variables
- ✅ The `.env` file is already in `.gitignore`
- ✅ Use different passwords for development and production

## 📝 How It Works

### Authentication Flow

1. **Visitor accesses site** → Middleware checks for `site-auth` cookie
2. **No valid cookie** → Redirect to `/login`
3. **User enters password** → POST to `/api/auth/login`
4. **Password correct** → Set secure cookie, redirect to home
5. **Password incorrect** → Show error message
6. **Cookie valid** → Allow access to all pages

### Protected Routes

All routes are protected **except**:
- `/login` (login page)
- `/api/auth/*` (authentication endpoints)
- Public files (images, CSS, etc.)
- Next.js internal routes (`/_next/*`)

### Logout

To add a logout button, make a POST request to `/api/auth/logout`:

```typescript
const handleLogout = async () => {
  await fetch('/api/auth/logout', { method: 'POST' })
  router.push('/login')
  router.refresh()
}
```

## 🎨 Customizing the Login Page

The login page is located at: `app/login/page.tsx`

You can customize:
- Colors and styling (uses Tailwind CSS)
- Title and description text
- Logo/branding
- Form validation

## 🐛 Troubleshooting

### "Site password not configured" error

**Solution**: Add `SITE_PASSWORD` to your `.env` file and restart the server.

### Still can access site without password

**Possible causes**:
1. `SITE_PASSWORD_ENABLED` is not set to `'true'`
2. Server wasn't restarted after changing `.env`
3. You have a valid cookie from a previous login

**Solution**:
- Check `.env` file
- Restart server
- Clear browser cookies for your site

### Redirected to login but password is correct

**Solution**: Check that `SITE_PASSWORD` in `.env` exactly matches what you're typing (no extra spaces, correct case).

### Cookie not persisting

**Solution**: In development, make sure you're using `http://localhost` not `http://127.0.0.1` (cookies may not work across these).

## 📊 Multiple Users / Roles

This implementation uses a single password for all users. If you need:
- Multiple user accounts
- Different permission levels
- User registration
- Email-based authentication

Consider using a full authentication solution like:
- [NextAuth.js](https://next-auth.js.org/)
- [Clerk](https://clerk.com/)
- [Auth0](https://auth0.com/)

## 🔐 Security Considerations

### Current Security Level

This implementation provides **basic password protection**:
- ✅ Protects against casual visitors
- ✅ Simple to set up and maintain
- ⚠️ Not suitable for highly sensitive data
- ⚠️ Single shared password

### For Enhanced Security

If you need stronger security:
1. Implement rate limiting for login attempts
2. Add CAPTCHA to prevent brute force
3. Use individual user accounts
4. Implement 2FA (two-factor authentication)
5. Add login attempt logging
6. Use JWT tokens instead of simple cookies

## 📚 Files Created/Modified

- `app/login/page.tsx` - Login page UI
- `app/api/auth/login/route.ts` - Login endpoint
- `app/api/auth/logout/route.ts` - Logout endpoint
- `middleware.ts` - Authentication middleware
- `.env` - Environment variables (not in git)
- `.env.example` - Template for environment variables

## 🎯 Next Steps

1. Set a strong password in `.env`
2. Test the login flow locally
3. Deploy to Vercel with environment variables
4. Share the password securely with authorized users
5. Consider implementing logout button in your UI

---

**Questions?** Check the main [README.md](README.md) or open an issue.

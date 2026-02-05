# Instagram Real-Time Feed Setup Guide

This guide will help you set up real-time Instagram photos on your website using Instagram Basic Display API.

## Current Status

✅ **Instagram username updated to:** `justees.official`  
⏳ **Real-time feed:** Requires API setup (using fallback images currently)

## Quick Setup (5 minutes)

### Step 1: Create Facebook Developer Account

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"Get Started"** and log in with your Facebook account
3. Complete the registration process

### Step 2: Create a New App

1. Go to [My Apps](https://developers.facebook.com/apps/)
2. Click **"Create App"**
3. Select **"Consumer"** as the app type
4. Fill in the app details:
   - **App Name:** Justees Website
   - **App Contact Email:** Your email
5. Click **"Create App"**

### Step 3: Add Instagram Basic Display

1. In your app dashboard, click **"Add Product"**
2. Find **"Instagram Basic Display"** and click **"Set Up"**
3. In the Instagram Basic Display settings, click **"Create New App"**
4. Fill in the required fields:
   - **Valid OAuth Redirect URIs:** `https://localhost/`
   - **Deauthorize Callback URL:** `https://localhost/`
   - **Data Deletion Request URL:** `https://localhost/`
5. Click **"Save Changes"**

### Step 4: Add Instagram Test User

1. Go to **Roles → Roles** in your app dashboard
2. Scroll to **"Instagram Testers"**
3. Click **"Add Instagram Testers"**
4. Enter the Instagram username: `justees.official`
5. Click **"Submit"**

### Step 5: Accept Tester Invitation

1. Log in to Instagram as `justees.official`
2. Go to Settings → Apps and Websites → Tester Invites
3. Accept the invitation from your Facebook app

### Step 6: Generate Access Token

1. Go back to your app dashboard
2. Navigate to **Products → Instagram Basic Display → Basic Display**
3. Under **"User Token Generator"**, find your test user
4. Click **"Generate Token"**
5. Log in and authorize the app when prompted
6. **Copy the access token** (it will look like a long string)

### Step 7: Get Your Instagram User ID

When you generate the token, you'll also see your **Instagram User ID**. Copy it as well.

### Step 8: Add to Environment Variables

1. In your project root, create or edit the `.env` file
2. Add these lines (replace with your actual values):

```env
VITE_INSTAGRAM_ACCESS_TOKEN=your_access_token_here
VITE_INSTAGRAM_USER_ID=your_instagram_user_id_here
```

3. Save the file
4. Restart your development server:
   ```bash
   npm run dev
   ```

### Step 9: Deploy Environment Variables (for Production)

If using **Vercel**:
1. Go to your project on Vercel dashboard
2. Navigate to **Settings → Environment Variables**
3. Add both variables:
   - `VITE_INSTAGRAM_ACCESS_TOKEN`
   - `VITE_INSTAGRAM_USER_ID`
4. Redeploy your site

If using **Firebase Hosting**:
- Environment variables are bundled during build, so rebuild and redeploy after adding to `.env`

---

## Features

✨ **Automatic Fallback:** If the API is not configured, the website shows placeholder images  
✨ **Live Indicator:** When real-time feed is active, a green "Live Feed" indicator appears  
✨ **Hover Effects:** Instagram icon appears on hover instead of generic message icon  
✨ **Direct Links:** Each photo links to the actual Instagram post  
✨ **Captions:** Post captions are shown as tooltips on hover

---

## Important Notes

⚠️ **Token Expiration:**
- Access tokens expire after **60 days**
- You'll need to regenerate tokens periodically
- Consider implementing automatic token refresh for production

⚠️ **Rate Limits:**
- Instagram Basic Display API has rate limits
- The website caches posts to minimize API calls

⚠️ **Alternative Solution:**
If you prefer not to set up the API, you can manually update the fallback images:

1. Open `src/services/instagram.service.js`
2. Find the `FALLBACK_IMAGES` array
3. Replace the URLs with your actual Instagram post image URLs
4. Save and redeploy

---

## Troubleshooting

### "Instagram API not configured" message in console
- Make sure you've added the environment variables to `.env`
- Restart the development server after adding variables
- Check that variable names start with `VITE_` prefix

### Access token expired
- Go to Facebook Developer Console
- Regenerate the token following Step 6
- Update the `.env` file with the new token
- Restart/redeploy

### Photos not updating
- Clear browser cache
- Check browser console for error messages
- Verify token and user ID are correct
- Make sure the Instagram account has public posts

---

## API Costs

✅ **FREE:** Instagram Basic Display API is completely free to use!

---

## Support

Need help? Check the [Instagram Basic Display API Documentation](https://developers.facebook.com/docs/instagram-basic-display-api)

// Instagram Service
// To get real-time Instagram photos, you need to:
// 1. Create a Facebook Developer account: https://developers.facebook.com/
// 2. Create an app and get Instagram Basic Display API access
// 3. Get your User Access Token
// 4. Add your access token and user ID in the .env file

const INSTAGRAM_USERNAME = 'justees.official';

// Configuration - Add these to your .env file
const INSTAGRAM_ACCESS_TOKEN = import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN || '';
const INSTAGRAM_USER_ID = import.meta.env.VITE_INSTAGRAM_USER_ID || '';

// Display images - clothing and fashion related
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80', // Men's shirts on rack
  'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=80', // Fashion clothing display
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80', // Folded t-shirts
  'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=400&q=80', // Stylish shirts
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80', // Men's fashion outfit
  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&q=80', // Clothing store display
];

/**
 * Fetch Instagram posts using Instagram Basic Display API
 * @param {number} limit - Number of posts to fetch (default: 6)
 * @returns {Promise<Object>} - Object with success status and posts array
 */
export const getInstagramPosts = async (limit = 6) => {
  try {
    // Check if API is configured
    if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
      // console.log('Instagram API not configured. Using fallback images.');
      return {
        success: true,
        posts: FALLBACK_IMAGES.map((url, index) => ({
          id: `fallback-${index}`,
          media_url: url,
          permalink: `https://instagram.com/${INSTAGRAM_USERNAME}`,
          caption: 'Justees Official',
          media_type: 'IMAGE',
        })),
        isRealTime: false,
      };
    }

    // Fetch from Instagram Basic Display API
    const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
    const url = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}&limit=${limit}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Filter only images and videos
    const posts = data.data
      .filter(post => post.media_type === 'IMAGE' || post.media_type === 'VIDEO' || post.media_type === 'CAROUSEL_ALBUM')
      .slice(0, limit)
      .map(post => ({
        id: post.id,
        media_url: post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url,
        permalink: post.permalink,
        caption: post.caption || '',
        media_type: post.media_type,
        timestamp: post.timestamp,
      }));

    return {
      success: true,
      posts,
      isRealTime: true,
    };
  } catch (error) {
    // console.error('Error fetching Instagram posts:', error);
    
    // Return fallback images on error
    return {
      success: true,
      posts: FALLBACK_IMAGES.map((url, index) => ({
        id: `fallback-${index}`,
        media_url: url,
        permalink: `https://instagram.com/${INSTAGRAM_USERNAME}`,
        caption: 'Justees Official',
        media_type: 'IMAGE',
      })),
      isRealTime: false,
      error: error.message,
    };
  }
};

/**
 * Get the Instagram profile URL
 * @returns {string} - Instagram profile URL
 */
export const getInstagramProfileUrl = () => {
  return `https://instagram.com/${INSTAGRAM_USERNAME}`;
};

/**
 * Get the Instagram username
 * @returns {string} - Instagram username
 */
export const getInstagramUsername = () => {
  return INSTAGRAM_USERNAME;
};

/**
 * Get formatted Instagram handle for display
 * @returns {string} - Formatted handle (e.g., @justees.official)
 */
export const getInstagramHandle = () => {
  return `@${INSTAGRAM_USERNAME}`;
};

// Instructions for setting up Instagram API:
/*
SETUP INSTRUCTIONS:

1. Create a Facebook Developer Account:
   - Go to https://developers.facebook.com/
   - Click "Get Started" and complete the registration

2. Create a New App:
   - Go to https://developers.facebook.com/apps/
   - Click "Create App"
   - Select "Consumer" as app type
   - Fill in app details and create

3. Add Instagram Basic Display:
   - In your app dashboard, click "Add Product"
   - Find "Instagram Basic Display" and click "Set Up"
   - Click "Create New App" in the Instagram Basic Display section

4. Configure Basic Display:
   - Add Instagram Test User
   - Go to Roles > Roles and add an Instagram tester
   - The Instagram account holder must accept the invitation

5. Get Access Token:
   - Go to Instagram Basic Display > Basic Display
   - Under "User Token Generator", click "Generate Token" next to your test user
   - Authorize the app when prompted
   - Copy the access token

6. Add to Environment Variables:
   - Create/edit the .env file in your project root
   - Add these lines:
     VITE_INSTAGRAM_ACCESS_TOKEN=your_access_token_here
     VITE_INSTAGRAM_USER_ID=your_instagram_user_id_here
   - Restart your development server

Note: Access tokens expire after 60 days. You'll need to refresh them periodically.
For production, consider implementing automatic token refresh.

Alternative: For a simpler solution without API setup, you can manually update 
the FALLBACK_IMAGES array with your actual Instagram post URLs.
*/

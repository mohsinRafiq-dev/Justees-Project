// Meta (Facebook) Pixel helper
// Requires VITE_META_PIXEL_ID to be set in environment variables.

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

// Install pixel script if not already present
export const initMetaPixel = () => 
  {
  if (!PIXEL_ID) {
    console.warn('[MetaPixel] VITE_META_PIXEL_ID is not set; tracking disabled.');
    return;
  }

  if (window.fbq) {
    return; // already initialized
  }

  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
};

export const trackEvent = (event, params = {}) => {
  if (!window.fbq) return;
  window.fbq('track', event, params);
};

export const trackAddToCart = ({ value, currency = 'PKR', content_ids, content_type = 'product', contents }) => {
  trackEvent('AddToCart', {
    value,
    currency,
    content_ids,
    content_type,
    contents,
  });
};

export const trackPurchase = ({ value, currency = 'PKR', content_ids, content_type = 'product', contents, num_items }) => {
  trackEvent('Purchase', {
    value,
    currency,
    content_ids,
    content_type,
    contents,
    num_items,
  });
};

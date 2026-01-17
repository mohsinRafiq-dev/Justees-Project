import { WHATSAPP_NUMBER, BUSINESS_NAME } from './constants';

/**
 * Generate WhatsApp order link
 * @param {Object} product - Product object
 * @param {Object} options - Additional options (size, color, quantity)
 * @returns {string} WhatsApp URL
 */
export const generateWhatsAppOrderLink = (product, options = {}) => {
  const { size = 'M', color = 'N/A', quantity = 1 } = options;
  
  // Format price in Indian format
  const formatPrice = (price) => `Rs. ${price.toLocaleString('en-IN')}`;
  
  // Construct the message
  const message = `Hi ${BUSINESS_NAME}! I'm interested in ordering:

*Product:* ${product.name}
*Price:* ${formatPrice(product.price)}
*Size:* ${size}
*Color:* ${color}
*Quantity:* ${quantity}
*Total:* ${formatPrice(product.price * quantity)}

Please let me know the next steps!`;

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Generate WhatsApp URL
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  
  return whatsappUrl;
};

/**
 * Generate WhatsApp inquiry link (general inquiry without specific product)
 * @param {string} customMessage - Custom message (optional)
 * @returns {string} WhatsApp URL
 */
export const generateWhatsAppInquiryLink = (customMessage = '') => {
  const defaultMessage = `Hi ${BUSINESS_NAME}! I have a question about your products.`;
  const message = customMessage || defaultMessage;
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
};

/**
 * Open WhatsApp order in new tab
 * @param {Object} product - Product object
 * @param {Object} options - Additional options
 */
export const openWhatsAppOrder = (product, options = {}) => {
  const url = generateWhatsAppOrderLink(product, options);
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Open WhatsApp inquiry in new tab
 * @param {string} customMessage - Custom message
 */
export const openWhatsAppInquiry = (customMessage = '') => {
  const url = generateWhatsAppInquiryLink(customMessage);
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Validate WhatsApp number format
 * @param {string} number - Phone number
 * @returns {boolean} Is valid
 */
export const isValidWhatsAppNumber = (number) => {
  // Remove all non-digit characters
  const cleanNumber = number.replace(/\D/g, '');
  
  // Check if it's between 10 and 15 digits (international format)
  return cleanNumber.length >= 10 && cleanNumber.length <= 15;
};

export default {
  generateWhatsAppOrderLink,
  generateWhatsAppInquiryLink,
  openWhatsAppOrder,
  openWhatsAppInquiry,
  isValidWhatsAppNumber,
};

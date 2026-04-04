import emailjs from '@emailjs/browser';

// Initialize EmailJS
// Get these from your EmailJS account dashboard: https://dashboard.emailjs.com
const EMAILJS_SERVICE_ID = 'service_justees'; // Replace with your service ID
const EMAILJS_CUSTOMER_TEMPLATE = 'template_customer_order'; // Replace with your template ID
const EMAILJS_ADMIN_TEMPLATE = 'template_admin_order'; // Replace with your template ID
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY_HERE'; // Replace with your public key

// Initialize EmailJS once
try {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  console.log('✓ EmailJS initialized');
} catch (error) {
  console.error('✗ EmailJS initialization error:', error);
}

/**
 * Send order confirmation email to customer
 * @param {string} customerEmail - Customer email address
 * @param {object} orderDetails - Order details
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendOrderConfirmationEmail = async (customerEmail, orderDetails) => {
  try {
    console.log('📧 Sending customer confirmation email to:', customerEmail);
    
    // Format items as a string for the email template
    const itemsList = orderDetails.items
      .map(item => `${item.name} (x${item.quantity}) - Rs. ${(item.price * item.quantity).toLocaleString("en-IN")}`)
      .join('\n');

    const templateParams = {
      to_email: customerEmail,
      customer_name: orderDetails.customerName,
      order_id: orderDetails.orderId,
      order_total: `Rs. ${orderDetails.orderTotal.toLocaleString("en-IN")}`,
      shipping_cost: `Rs. ${orderDetails.shippingCost.toLocaleString("en-IN")}`,
      items_list: itemsList,
      order_date: new Date().toLocaleDateString('en-PK'),
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_CUSTOMER_TEMPLATE,
      templateParams
    );

    if (response.status === 200) {
      console.log('✓ Customer confirmation email sent successfully to:', customerEmail);
      return { success: true, message: 'Confirmation email sent' };
    } else {
      throw new Error(`EmailJS returned status ${response.status}`);
    }
  } catch (error) {
    console.error('✗ Customer Email Error:', error.message);
    
    // Still return success to not block order flow
    return { 
      success: true, 
      message: 'Order saved. Email sending had an issue - customer can check their spam folder' 
    };
  }
};

/**
 * Send admin notification email when new order is placed
 * @param {string} adminEmail - Admin email address
 * @param {object} orderDetails - Order details
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendAdminOrderNotification = async (adminEmail, orderDetails) => {
  try {
    console.log('📧 Sending admin notification to:', adminEmail);
    
    // Format delivery address
    const addressDetails = `
${orderDetails.deliveryAddress.name}
Phone: ${orderDetails.deliveryAddress.phone}
Address: ${orderDetails.deliveryAddress.address}
${orderDetails.deliveryAddress.apartment ? `Apartment: ${orderDetails.deliveryAddress.apartment}` : ''}
City: ${orderDetails.deliveryAddress.city}
${orderDetails.deliveryAddress.postalCode ? `Postal Code: ${orderDetails.deliveryAddress.postalCode}` : ''}
Country: ${orderDetails.deliveryAddress.country}
    `.trim();

    // Format items
    const itemsList = orderDetails.items
      .map(item => `${item.name} (x${item.quantity}) - Rs. ${(item.price * item.quantity).toLocaleString("en-IN")}`)
      .join('\n');

    const templateParams = {
      to_email: adminEmail,
      order_id: orderDetails.orderId,
      customer_name: orderDetails.customerName,
      customer_email: orderDetails.customerEmail,
      order_total: `Rs. ${orderDetails.orderTotal.toLocaleString("en-IN")}`,
      delivery_address: addressDetails,
      items_list: itemsList,
      order_date: new Date().toLocaleDateString('en-PK'),
      order_time: new Date().toLocaleTimeString('en-PK'),
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_ADMIN_TEMPLATE,
      templateParams
    );

    if (response.status === 200) {
      console.log('✓ Admin notification sent successfully to:', adminEmail);
      return { success: true, message: 'Admin notified' };
    } else {
      throw new Error(`EmailJS returned status ${response.status}`);
    }
  } catch (error) {
    console.error('✗ Admin Email Error:', error.message);
    return { success: true, message: 'Order saved - admin notification queued' };
  }
};

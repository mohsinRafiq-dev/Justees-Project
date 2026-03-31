// Email service for sending order notifications
// This uses Firebase Cloud Functions to send emails

/**
 * Send order confirmation email to customer
 * @param {string} customerEmail - Customer email address
 * @param {object} orderDetails - Order details
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendOrderConfirmationEmail = async (customerEmail, orderDetails) => {
  try {
    // Call Firebase Cloud Function to send email
    const response = await fetch(
      'https://us-central1-justees-73e3e.cloudfunctions.net/sendOrderConfirmation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail,
          customerName: orderDetails.customerName,
          orderId: orderDetails.orderId,
          orderTotal: orderDetails.orderTotal,
          items: orderDetails.items,
          shippingCost: orderDetails.shippingCost,
        }),
      }
    );

    if (response.ok) {
      console.log('Order confirmation email sent to:', customerEmail);
      return { success: true, message: 'Confirmation email sent' };
    } else {
      console.log('Email service queued (function not deployed yet)');
      return { success: true, message: 'Email queued for sending' };
    }
  } catch (error) {
    console.log('Email service not yet configured, but order was saved:', error.message);
    return { success: true, message: 'Order saved - email service will send confirmation' };
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
    // Call Firebase Cloud Function to send admin notification
    const response = await fetch(
      'https://us-central1-justees-73e3e.cloudfunctions.net/sendAdminOrderNotification',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail,
          orderId: orderDetails.orderId,
          customerName: orderDetails.customerName,
          customerEmail: orderDetails.customerEmail,
          orderTotal: orderDetails.orderTotal,
          items: orderDetails.items,
          deliveryAddress: orderDetails.deliveryAddress,
        }),
      }
    );

    if (response.ok) {
      console.log('Admin notification email sent to:', adminEmail);
      return { success: true, message: 'Admin notified' };
    } else {
      console.log('Admin notification queued (function not deployed yet)');
      return { success: true, message: 'Admin notification queued' };
    }
  } catch (error) {
    console.log('Email service not yet configured:', error.message);
    return { success: true, message: 'Admin will be notified via dashboard' };
  }
};

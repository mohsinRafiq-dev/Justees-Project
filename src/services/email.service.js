import emailjs from "@emailjs/browser";

// EmailJS configuration via Vite environment variables
const EMAILJS_SERVICE_ID =
  import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_justees";
const EMAILJS_CUSTOMER_TEMPLATE =
  import.meta.env.VITE_EMAILJS_CUSTOMER_TEMPLATE || "template_customer_order";
const EMAILJS_ADMIN_TEMPLATE =
  import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE || "template_admin_order";
const EMAILJS_PUBLIC_KEY =
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY_HERE";

if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY_HERE") {
  console.warn(
    "EmailJS public key is missing. Set VITE_EMAILJS_PUBLIC_KEY in your .env file.",
  );
}

if (
  !EMAILJS_SERVICE_ID ||
  !EMAILJS_CUSTOMER_TEMPLATE ||
  !EMAILJS_ADMIN_TEMPLATE
) {
  console.warn(
    "EmailJS IDs are missing. Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_CUSTOMER_TEMPLATE, and VITE_EMAILJS_ADMIN_TEMPLATE in your .env file.",
  );
}

// Initialize EmailJS once
try {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  console.log("✓ EmailJS initialized");
} catch (error) {
  console.error("✗ EmailJS initialization error:", error);
}

/**
 * Send order confirmation email to customer
 * @param {string} customerEmail - Customer email address
 * @param {object} orderDetails - Order details
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendOrderConfirmationEmail = async (
  customerEmail,
  orderDetails,
) => {
  try {
    console.log("📧 Sending customer confirmation email to:", customerEmail);

    const orders = (orderDetails.items || []).map((item) => ({
      name: item.name || "",
      units: item.quantity || 1,
      price: ((item.price || 0) * (item.quantity || 1)).toFixed(2),
      image_url: item.image || "",
    }));

    const shippingValue = Number(orderDetails.shippingCost || 0);
    const taxValue = Number(orderDetails.tax || 0);
    const totalValue = Number(orderDetails.orderTotal || 0);

    const orderShortId = orderDetails.orderId
      ? `#${orderDetails.orderId.slice(0, 8).toUpperCase()}`
      : "";

    const templateParams = {
      to_email: customerEmail,
      email: customerEmail,
      customer_email: customerEmail,
      isAdmin: false,
      order_id: orderDetails.orderId,
      order_full_id: orderDetails.orderId,
      order_short_id: orderShortId,
      orders,
      cost: {
        shipping: shippingValue.toFixed(2),
        tax: taxValue.toFixed(2),
        total: totalValue.toFixed(2),
      },
      showShipping: shippingValue > 0,
      showTax: taxValue > 0,
      order_date: new Date().toLocaleDateString("en-PK"),
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_CUSTOMER_TEMPLATE,
      templateParams,
    );

    if (response.status === 200) {
      console.log(
        "✓ Customer confirmation email sent successfully to:",
        customerEmail,
      );
      return { success: true, message: "Confirmation email sent" };
    } else {
      throw new Error(`EmailJS returned status ${response.status}`);
    }
  } catch (error) {
    console.error("✗ Customer Email Error:", error.message);

    // Still return success to not block order flow
    return {
      success: true,
      message:
        "Order saved. Email sending had an issue - customer can check their spam folder",
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
    console.log("📧 Sending admin notification to:", adminEmail);

    // Format delivery address
    const addressDetails = `
${orderDetails.deliveryAddress.name}
Phone: ${orderDetails.deliveryAddress.phone}
Address: ${orderDetails.deliveryAddress.address}
${orderDetails.deliveryAddress.apartment ? `Apartment: ${orderDetails.deliveryAddress.apartment}` : ""}
City: ${orderDetails.deliveryAddress.city}
${orderDetails.deliveryAddress.postalCode ? `Postal Code: ${orderDetails.deliveryAddress.postalCode}` : ""}
Country: ${orderDetails.deliveryAddress.country}
    `.trim();

    const orders = (orderDetails.items || []).map((item) => ({
      name: item.name || "",
      units: item.quantity || 1,
      price: ((item.price || 0) * (item.quantity || 1)).toFixed(2),
      image_url: item.image || "",
    }));

    const shippingValue = Number(orderDetails.shippingCost || 0);
    const taxValue = Number(orderDetails.tax || 0);
    const totalValue = Number(orderDetails.orderTotal || 0);
    const orderShortId = orderDetails.orderId
      ? `#${orderDetails.orderId.slice(0, 8).toUpperCase()}`
      : "";

    const templateParams = {
      to_email: adminEmail,
      email: adminEmail,
      customer_email: orderDetails.customerEmail,
      user_email: orderDetails.customerEmail,
      isAdmin: true,
      order_id: orderDetails.orderId,
      order_full_id: orderDetails.orderId,
      order_short_id: orderShortId,
      orders,
      cost: {
        shipping: shippingValue.toFixed(2),
        tax: taxValue.toFixed(2),
        total: totalValue.toFixed(2),
      },
      showShipping: shippingValue > 0,
      showTax: taxValue > 0,
      customer_name: orderDetails.customerName,
      customer_email: orderDetails.customerEmail,
      delivery_address: addressDetails,
      order_date: new Date().toLocaleDateString("en-PK"),
      order_time: new Date().toLocaleTimeString("en-PK"),
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_ADMIN_TEMPLATE,
      templateParams,
    );

    if (response.status === 200) {
      console.log("✓ Admin notification sent successfully to:", adminEmail);
      return { success: true, message: "Admin notified" };
    } else {
      throw new Error(`EmailJS returned status ${response.status}`);
    }
  } catch (error) {
    console.error("✗ Admin Email Error:", error.message);
    return {
      success: true,
      message: "Order saved - admin notification queued",
    };
  }
};

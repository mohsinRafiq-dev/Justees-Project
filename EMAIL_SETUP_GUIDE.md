# EmailJS Setup Guide for Justees

This guide will help you configure EmailJS to send order confirmation and admin notification emails.

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click **"Sign Up"** and create a free account
3. Verify your email

## Step 2: Add Email Service

1. Go to **Admin Dashboard** → **Email Services**
2. Click **"Create New Service"**
3. Choose an email provider:
   - **Gmail** (recommended for testing)
   - **SendGrid**
   - **Mailgun**
   - or other providers
4. Follow the steps to connect your email account
5. Copy your **Service ID** (looks like: `service_abc123xyz`)

## Step 3: Create Email Templates

You need to create 2 templates:

### Template 1: Customer Order Confirmation

1. Go to **Email Templates**
2. Click **"Create New Template"**
3. Name it: `Customer Order Confirmation`
4. Set the **To Email** to: `{{to_email}}`
5. Set **Subject** to: `Your Justees Order #{{order_id}} - Confirmation`
6. Copy this HTML into the **Content** section:

```html
<h2>Order Confirmation</h2>

<p>Hi {{customer_name}},</p>

<p>Thank you for your order! We've received it and will start processing it shortly.</p>

<h3>Order Details:</h3>
<p><strong>Order ID:</strong> {{order_id}}</p>
<p><strong>Order Date:</strong> {{order_date}}</p>

<h3>Items:</h3>
<pre>{{items_list}}</pre>

<h3>Pricing:</h3>
<ul>
  <li><strong>Shipping:</strong> {{shipping_cost}}</li>
  <li><strong>Total:</strong> {{order_total}}</li>
</ul>

<h3>What's Next?</h3>
<p>We'll send you a confirmation email with tracking details within 24 hours.</p>

<p>If you had any issues with payment, please reply to this email or contact us on WhatsApp: <strong>03291526285</strong></p>

<p>Thank you for shopping with Justees!</p>
```

7. Click **"Create Template"**
8. Copy the **Template ID** (looks like: `template_abc123xyz`)

### Template 2: Admin Order Notification

1. Click **"Create New Template"**
2. Name it: `Admin Order Notification`
3. Set the **To Email** to: `{{to_email}}`
4. Set **Subject** to: `NEW ORDER #{{order_id}} - {{customer_name}}`
5. Copy this HTML into the **Content** section:

```html
<h2>🆕 New Order Received</h2>

<h3>Customer Information:</h3>
<ul>
  <li><strong>Name:</strong> {{customer_name}}</li>
  <li><strong>Email:</strong> {{customer_email}}</li>
</ul>

<h3>Order Details:</h3>
<p><strong>Order ID:</strong> {{order_id}}</p>
<p><strong>Order Date:</strong> {{order_date}}</p>
<p><strong>Order Time:</strong> {{order_time}}</p>

<h3>Items:</h3>
<pre>{{items_list}}</pre>

<h3>Pricing:</h3>
<p><strong>Total:</strong> {{order_total}}</p>

<h3>Delivery Address:</h3>
<pre>{{delivery_address}}</pre>

<hr>
<p>Log in to your Justees dashboard to manage this order.</p>
```

6. Click **"Create Template"**
7. Copy the **Template ID** 

## Step 4: Get Your Public Key

1. Go to **Account** → **API Keys**
2. Copy your **Public Key** (starts with `pk_` or similar)

## Step 5: Update Configuration

Edit the file: `src/services/email.service.js`

Replace these three values at the top of the file:

```javascript
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // Replace with step 2
const EMAILJS_CUSTOMER_TEMPLATE = 'YOUR_CUSTOMER_TEMPLATE_ID'; // Replace with Template 1
const EMAILJS_ADMIN_TEMPLATE = 'YOUR_ADMIN_TEMPLATE_ID'; // Replace with Template 2
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Replace with step 4
```

**Example:**
```javascript
const EMAILJS_SERVICE_ID = 'service_abc123xyz';
const EMAILJS_CUSTOMER_TEMPLATE = 'template_customer_abc123';
const EMAILJS_ADMIN_TEMPLATE = 'template_admin_abc123';
const EMAILJS_PUBLIC_KEY = 'pk_87abc123xyz456';
```

## Step 6: Test It

1. Save the file
2. Go to your Justees site
3. Add a product to cart
4. Go to checkout
5. Fill in all details with a test email
6. Place order
7. Check email inbox (and spam folder)

## Troubleshooting

### Emails not sending?

1. **Check browser console** (F12 → Console tab)
2. Look for messages starting with `✓` or `✗`
3. Check your EmailJS account:
   - Is the service connected?
   - Do templates exist?
   - Is quota available?

### Common Issues:

| Issue | Solution |
|-------|----------|
| "403 Forbidden" | Check your Public Key is correct |
| "Service not found" | Check Service ID matches exactly |
| "Template not found" | Check Template IDs are correct |
| Emails in spam | Poor email reputation - send test emails to warm up |
| Rate limiting | EmailJS free plan has limits - upgrade if needed |

## Monitoring

EmailJS provides a **Dashboard** where you can:
- ✅ See sent emails
- ❌ See failed emails
- 📊 Track statistics
- 🔧 Debug issues

## Support

- EmailJS Docs: https://www.emailjs.com/docs/
- Free tier includes up to 200 emails/month
- Premium plans available for higher volume

---

Once configured, emails will be sent automatically whenever a customer places an order! 🚀

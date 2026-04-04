import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Copy } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";
import Navbar from "../components/common/Navbar";
import LazyImage from "../components/common/LazyImage";
import { createOrder } from "../services/orders.service";
import { createNotification } from "../services/notifications.service";
import { sendAdminOrderNotification, sendOrderConfirmationEmail } from "../services/email.service";

const Checkout = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { cartItems, getDeliveryFee, getCartTotal, getCartFinalTotal, clearCart } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  
  // Contact form state
  const [contact, setContact] = useState({
    email: "",
    subscribe: false,
  });
  
  // Delivery form state
  const [delivery, setDelivery] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    postalCode: "",
    country: "Pakistan",
  });
  
  // Order state
  const [order, setOrder] = useState(null);
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("cod");
  
  const subtotal = getCartTotal();
  const shippingCost = getDeliveryFee();
  const total = getCartFinalTotal();
  
  // Check if cart is empty
  useEffect(() => {
    // Give cart a moment to load from context
    const timer = setTimeout(() => {
      // Only navigate if cart is empty AND order hasn't been placed
      if (cartItems.length === 0 && !orderPlaced) {
        navigate("/products");
      }
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [cartItems.length, navigate, orderPlaced]);
  
  // Scroll to top when order is placed
  useEffect(() => {
    if (orderPlaced) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [orderPlaced]);
  
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    // Email validation
    if (!contact.email) {
      toast.error("Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    // Delivery field validation
    if (!delivery.firstName || !delivery.firstName.trim()) {
      toast.error("Please enter your first name");
      return;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(delivery.firstName)) {
      toast.error("First name should only contain letters");
      return;
    }
    
    if (!delivery.lastName || !delivery.lastName.trim()) {
      toast.error("Please enter your last name");
      return;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(delivery.lastName)) {
      toast.error("Last name should only contain letters");
      return;
    }
    
    if (!delivery.phone || !delivery.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    const phoneRegex = /^(\+92|0)[0-9]{10}$/;
    if (!phoneRegex.test(delivery.phone.replace(/\s|-/g, ''))) {
      toast.error("Please enter a valid Pakistani phone number (e.g., +92300 1234567 or 03001234567)");
      return;
    }
    
    if (!delivery.address || !delivery.address.trim()) {
      toast.error("Please enter your address");
      return;
    }
    if (delivery.address.trim().length < 5) {
      toast.error("Please enter a complete address");
      return;
    }
    
    if (!delivery.city || !delivery.city.trim()) {
      toast.error("Please enter your city");
      return;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(delivery.city)) {
      toast.error("City name should only contain letters");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Prepare order data - only include fields with values
      const orderData = {
        contact: {
          email: contact.email || '',
          subscribe: contact.subscribe || false,
        },
        delivery: {
          firstName: delivery.firstName || '',
          lastName: delivery.lastName || '',
          phone: delivery.phone || '',
          address: delivery.address || '',
          city: delivery.city || '',
          country: delivery.country || 'Pakistan',
          ...(delivery.apartment && { apartment: delivery.apartment }),
          ...(delivery.postalCode && { postalCode: delivery.postalCode }),
        },
        items: cartItems.map(item => ({
          id: item.id || '',
          name: item.name || '',
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.image || '',
          selectedSize: item.selectedSize || '',
          selectedColor: item.selectedColor || '',
        })),
        subtotal: subtotal || 0,
        shippingCost: shippingCost || 0,
        total: total || 0,
        paymentMethod: paymentMethod || 'cod',
        status: "pending",
      };
      
      const orderRes = await createOrder(orderData);

      if (orderRes.success) {
        const OrderDisplay = { ...orderData, id: orderRes.orderId };
        
        // --- CORE ACTIONS (IMMEDIATE) ---
        // 1. Show confirmation page
        setOrder(OrderDisplay);
        setOrderPlaced(true);
        
        // 2. Clear the cart
        clearCart();
        
        // 3. Show success message
        toast.success("Order placed successfully!");

        // --- BACKGROUND ACTIONS (NON-BLOCKING) ---
        // This will run in the background and not block the UI
        const runBackgroundTasks = async () => {
          try {
            // 1. Create in-app notification
            await createNotification({
              title: `New Order #${orderRes.orderId?.slice(0, 8)}`,
              message: `Order from ${delivery.firstName} ${delivery.lastName} - Rs. ${total.toLocaleString('en-IN')}`,
              type: 'order',
              orderId: orderRes.orderId,
              customerName: `${delivery.firstName} ${delivery.lastName}`,
              customerEmail: contact.email,
              orderTotal: total,
            });

            // 2. Send customer confirmation email
            await sendOrderConfirmationEmail(contact.email, {
              customerName: `${delivery.firstName} ${delivery.lastName}`,
              orderId: orderRes.orderId,
              orderTotal: total,
              items: orderData.items,
              shippingCost: orderData.shippingCost,
            });

            // 3. Send admin notification email
            await sendAdminOrderNotification('justees.online@gmail.com', {
              orderId: orderRes.orderId,
              customerName: `${delivery.firstName} ${delivery.lastName}`,
              customerEmail: contact.email,
              orderTotal: total,
              items: orderData.items,
              deliveryAddress: {
                name: `${delivery.firstName} ${delivery.lastName}`,
                phone: delivery.phone,
                address: delivery.address,
                apartment: delivery.apartment,
                city: delivery.city,
                postalCode: delivery.postalCode,
                country: delivery.country,
              },
            });
          } catch (err) {
            console.log("Background task error:", err);
          }
        };

        runBackgroundTasks();
        
      } else {
        toast.error(orderRes.error || "Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("An error occurred while placing your order");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };
  
  return (
    <>
      <Navbar />
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} pt-20 pb-12`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className={`text-center`}>
              <div className={`animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4`}></div>
              <p className={isDark ? "text-gray-300" : "text-gray-700"}>Loading checkout...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => navigate("/products")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {orderPlaced ? "Order Confirmed" : "Checkout"}
              </h1>
            </div>
            
            {!orderPlaced ? (
              // Checkout Form
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - 2 columns */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Contact Section */}
                  <div className={`${isDark ? "bg-gray-800" : "bg-white"} p-8 rounded-lg shadow-md`}>
                    <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
                      Contact Information
                    </h2>
                    
                    <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={contact.email}
                        onChange={(e) => setContact({ ...contact, email: e.target.value })}
                        placeholder="your@email.com"
                        pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                        }`}
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="subscribe"
                        checked={contact.subscribe}
                        onChange={(e) => setContact({ ...contact, subscribe: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      <label htmlFor="subscribe" className={`ml-3 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Email me with news and offers
                      </label>
                    </div>
                  </div>
                  
                  {/* Delivery Section */}
                  <div className={`${isDark ? "bg-gray-800" : "bg-white"} p-8 rounded-lg shadow-md`}>
                    <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
                      Delivery Address
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                          Country/Region
                        </label>
                        <select
                          value={delivery.country}
                          onChange={(e) => setDelivery({ ...delivery, country: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                          }`}
                        >
                          <option>Pakistan</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                          First name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={delivery.firstName}
                          onChange={(e) => setDelivery({ ...delivery, firstName: e.target.value })}
                          placeholder="First name"
                          pattern="[a-zA-Z\s'-]+"
                          title="First name should only contain letters"
                          className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                          Last name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={delivery.lastName}
                          onChange={(e) => setDelivery({ ...delivery, lastName: e.target.value })}
                          placeholder="Last name"
                          pattern="[a-zA-Z\s'-]+"
                          title="Last name should only contain letters"
                          className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                          }`}
                        />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={delivery.phone}
                        onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })}
                        placeholder="+92 300 1234567"
                        title="Enter a valid Pakistani number: +92300 1234567 or 03001234567"
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                        }`}
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={delivery.address}
                        onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                        placeholder="Enter your complete address"
                        minLength="5"
                        title="Please enter a complete address (at least 5 characters)"
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                        }`}
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Apartment, suite, etc. (optional)
                      </label>
                      <input
                        type="text"
                        value={delivery.apartment}
                        onChange={(e) => setDelivery({ ...delivery, apartment: e.target.value })}
                        placeholder="Apartment, suite, etc."
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                        }`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={delivery.city}
                          onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                          placeholder="City"
                          pattern="[a-zA-Z\s'-]+"
                          title="City name should only contain letters"
                          className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                          Postal code (optional)
                        </label>
                        <input
                          type="text"
                          value={delivery.postalCode}
                          onChange={(e) => setDelivery({ ...delivery, postalCode: e.target.value })}
                          placeholder="Postal code"
                          className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Details Section */}
                  <div className={`${isDark ? "bg-gray-800" : "bg-white"} p-8 rounded-lg shadow-md`}>
                    <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
                      Payment Details
                    </h2>
                    
                    {/* Payment Method Selection */}
                    <div className="mb-6">
                      <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                        Select Payment Method
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition-all" 
                          style={paymentMethod === "cod" ? 
                            {borderColor: isDark ? "#3b82f6" : "#2563eb", backgroundColor: isDark ? "#1e3a8a" : "#eff6ff"} :
                            {borderColor: isDark ? "#374151" : "#e5e7eb", backgroundColor: isDark ? "#1f2937" : "#f9fafb"}
                          }
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={paymentMethod === "cod"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Cash on Delivery (COD)</span>
                        </label>
                        
                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border-2 transition-all"
                          style={paymentMethod === "online" ? 
                            {borderColor: isDark ? "#3b82f6" : "#2563eb", backgroundColor: isDark ? "#1e3a8a" : "#eff6ff"} :
                            {borderColor: isDark ? "#374151" : "#e5e7eb", backgroundColor: isDark ? "#1f2937" : "#f9fafb"}
                          }
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="online"
                            checked={paymentMethod === "online"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Online Payment</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* COD Section */}
                    {paymentMethod === "cod" && (
                      <div className={`p-6 rounded-lg ${isDark ? "bg-green-900" : "bg-green-50"} border-2 ${isDark ? "border-green-700" : "border-green-200"}`}>
                        <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-green-300" : "text-green-700"}`}>
                          Cash on Delivery
                        </h3>
                        <p className={`${isDark ? "text-green-200" : "text-green-600"}`}>
                          Your order will be delivered and you can pay the full amount (Rs. {total.toLocaleString('en-IN')}) to the delivery person.
                        </p>
                      </div>
                    )}
                    
                    {/* Online Payment Section */}
                    {paymentMethod === "online" && (
                      <>
                        <div className={`p-4 rounded-lg ${isDark ? "bg-yellow-900" : "bg-yellow-50"} mb-6 border-2 ${isDark ? "border-yellow-700" : "border-yellow-200"}`}>
                          <p className={`text-sm ${isDark ? "text-yellow-200" : "text-yellow-700"}`}>
                            <strong>FREE DELIVERY Options:</strong>
                          </p>
                          <ul className={`text-sm ${isDark ? "text-yellow-200" : "text-yellow-700"} list-disc pl-5 mt-2 space-y-1`}>
                            <li>💳 Advance payment of <strong>Rs. 500</strong> qualifies for FREE DELIVERY</li>
                            <li>📦 Orders above <strong>Rs. 5000</strong> also qualify for FREE DELIVERY</li>
                            <li>📸 Share screenshot via WhatsApp to confirm</li>
                          </ul>
                        </div>

                        {/* Two Payment Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {/* Option 1: Mobile Account */}
                          <div className={`p-4 rounded-lg border-2 ${isDark ? "bg-emerald-900 border-emerald-700" : "bg-emerald-50 border-emerald-200"}`}>
                            <h3 className={`text-sm font-bold mb-3 ${isDark ? "text-emerald-200" : "text-emerald-700"}`}>
                              📱 Mobile Account
                            </h3>
                            
                            <div className="space-y-2">
                              <div>
                                <label className={`text-xs font-medium block mb-1 ${isDark ? "text-emerald-300" : "text-emerald-600"}`}>
                                  Account Holder
                                </label>
                                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                                  Muhammad Afaq Ahmad
                                </p>
                              </div>
                              
                              <div>
                                <label className={`text-xs font-medium block mb-1 ${isDark ? "text-emerald-300" : "text-emerald-600"}`}>
                                  Account Number
                                </label>
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                                    03173442303
                                  </p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText("03173442303");
                                      toast.success("Account number copied!");
                                    }}
                                    className={`p-1 rounded ${isDark ? "bg-emerald-700 hover:bg-emerald-600" : "bg-emerald-200 hover:bg-emerald-300"} transition-colors`}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div>
                                <label className={`text-xs font-medium block mb-1 ${isDark ? "text-emerald-300" : "text-emerald-600"}`}>
                                  Payment Methods
                                </label>
                                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                                  EasyPaisa / Nayapay
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Option 2: Bank Deposit */}
                          <div className={`p-4 rounded-lg border-2 ${isDark ? "bg-blue-900 border-blue-700" : "bg-blue-50 border-blue-200"}`}>
                            <h3 className={`text-sm font-bold mb-3 ${isDark ? "text-blue-200" : "text-blue-700"}`}>
                              🏦 Bank Deposit
                            </h3>
                            
                            <div className="space-y-2">
                              <div>
                                <label className={`text-xs font-medium block mb-1 ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                                  Bank Name
                                </label>
                                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                                  Bank Islami
                                </p>
                              </div>
                              
                              <div>
                                <label className={`text-xs font-medium block mb-1 ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                                  Account Holder
                                </label>
                                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                                  Malik Zeeshan Ali
                                </p>
                              </div>
                              
                              <div>
                                <label className={`text-xs font-medium block mb-1 ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                                  Account Number
                                </label>
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                                    210800319500001
                                  </p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText("210800319500001");
                                      toast.success("Account number copied!");
                                    }}
                                    className={`p-1 rounded ${isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-200 hover:bg-blue-300"} transition-colors`}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div>
                                <label className={`text-xs font-medium block mb-1 ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                                  IBAN
                                </label>
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                                    PK96BKIP0210800319500001
                                  </p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText("PK96BKIP0210800319500001");
                                      toast.success("IBAN copied!");
                                    }}
                                    className={`p-1 rounded ${isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-200 hover:bg-blue-300"} transition-colors`}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* WhatsApp Confirmation */}
                        <div className="mb-6">
                          <h4 className={`text-sm font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                            📲 Send Proof via WhatsApp
                          </h4>
                          <div className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-green-50"} flex items-center justify-between`}>
                            <div>
                              <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}>WhatsApp Only</p>
                              <p className={`text-lg font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
                                03291526285
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText("03291526285");
                                toast.success("WhatsApp number copied!");
                              }}
                              className={`p-2 rounded-lg ${isDark ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-200 hover:bg-gray-300"} transition-colors`}
                            >
                              <Copy className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Required Fields Note */}
                  <div className={`p-4 rounded-lg ${isDark ? "bg-blue-900/20 border border-blue-700" : "bg-blue-50 border border-blue-200"}`}>
                    <p className={`text-sm ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                      <span className="font-semibold">Fields marked with <span className="text-red-500">*</span> are required</span> and must be filled with correct information
                    </p>
                  </div>
                  
                  {/* Place Order Button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    style={{ backgroundColor: isProcessing ? "#ccc" : "#d3d1ce" }}
                    className="w-full text-gray-900 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? "Processing..." : "Place Order"}
                  </button>
                </div>                
                {/* Order Summary Sidebar */}
                <div className="lg:col-span-1">
                  <div className={`${isDark ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow-md sticky top-24`}>
                    <h3 className={`text-lg font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
                      Order Summary
                    </h3>
                    
                    {/* Items */}
                    <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <LazyImage
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                              {item.name}
                            </h4>
                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                              Qty: {item.quantity}
                            </p>
                            <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                              Rs. {(item.price * item.quantity).toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Totals */}
                    <div className={`border-t ${isDark ? "border-gray-700" : "border-gray-200"} pt-4 space-y-3`}>
                      <div className="flex justify-between">
                        <span className={isDark ? "text-gray-400" : "text-gray-600"}>Subtotal</span>
                        <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                          Rs. {subtotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? "text-gray-400" : "text-gray-600"}>Shipping</span>
                        <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                          {shippingCost === 0 ? "FREE" : `Rs. ${shippingCost}`}
                        </span>
                      </div>
                      <div className={`border-t ${isDark ? "border-gray-700" : "border-gray-200"} pt-3 flex justify-between`}>
                        <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Total</span>
                        <span className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                          Rs. {total.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Order Confirmation Page - Enhanced
              <div className={`max-w-4xl mx-auto ${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-2xl overflow-hidden`}>
                {/* Success Header */}
                <div className={`text-center p-12 ${isDark ? "bg-gradient-to-br from-green-900 to-green-800" : "bg-gradient-to-br from-green-50 to-green-100"} border-b ${isDark ? "border-green-700" : "border-green-200"}`}>
                  <div className="mb-6 animate-bounce">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${isDark ? "bg-green-700" : "bg-green-500"} shadow-lg`}>
                      <span className="text-6xl">✓</span>
                    </div>
                  </div>
                  <h1 className={`text-4xl md:text-5xl font-bold mb-3 ${isDark ? "text-white" : "text-green-900"}`}>
                    Order Confirmed!
                  </h1>
                  <p className={`text-lg ${isDark ? "text-green-200" : "text-green-700"}`}>
                    Thank you for your order. We're processing it now.
                  </p>
                </div>

                {/* Main Content */}
                <div className="p-8 space-y-8">
                  {/* Order Number - Prominent */}
                  {order?.id && (
                    <div className={`relative p-8 rounded-xl border-2 ${isDark ? "bg-gray-700 border-green-600" : "bg-green-50 border-green-400"}`}>
                      <div className="absolute -top-3 left-6">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDark ? "bg-green-600 text-white" : "bg-green-500 text-white"}`}>
                          ORDER NUMBER
                        </span>
                      </div>
                      <p className={`text-4xl font-black tracking-widest ${isDark ? "text-green-400" : "text-green-600"} mb-2`}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Full ID: {order.id}
                      </p>
                      <button
                        onClick={() => copyToClipboard(order.id.slice(0, 8).toUpperCase())}
                        className={`mt-3 px-4 py-2 text-sm rounded ${isDark ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-200 hover:bg-gray-300"} transition-colors`}
                      >
                        Copy Order #
                      </button>
                    </div>
                  )}

                  {/* Delivery Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Delivery Address */}
                    <div className={`p-6 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"} border ${isDark ? "border-gray-600" : "border-gray-200"}`}>
                      <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                        📍 Delivery Address
                      </h3>
                      <div className={`space-y-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        <p className="font-semibold">{order?.delivery?.firstName} {order?.delivery?.lastName}</p>
                        {order?.delivery?.phone && <p className="font-medium text-blue-600">📞 {order?.delivery?.phone}</p>}
                        <p>{order?.delivery?.address}</p>
                        {order?.delivery?.apartment && <p>{order?.delivery?.apartment}</p>}
                        <p>{order?.delivery?.city}, {order?.delivery?.country}</p>
                        {order?.delivery?.postalCode && <p>{order?.delivery?.postalCode}</p>}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className={`p-6 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"} border ${isDark ? "border-gray-600" : "border-gray-200"}`}>
                      <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                        📧 Contact Information
                      </h3>
                      <div className={`space-y-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        <div>
                          <p className="text-sm font-semibold mb-1">Email</p>
                          <p className={isDark ? "text-gray-200" : "text-gray-900"}>{order?.contact?.email}</p>
                        </div>
                        <div className={`p-3 rounded ${isDark ? "bg-blue-900/30 border border-blue-700" : "bg-blue-50 border border-blue-200"}`}>
                          <p className="text-xs font-semibold mb-1">A confirmation email has been sent</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status & Next Steps */}
                  <div className={`p-6 rounded-lg border-l-4 ${isDark ? "bg-amber-900/20 border-amber-600" : "bg-yellow-50 border-yellow-400"}`}>
                    <h3 className={`text-lg font-bold mb-3 ${isDark ? "text-amber-400" : "text-yellow-800"}`}>
                      ⏳ Payment Status
                    </h3>
                    <p className={`${isDark ? "text-amber-200" : "text-yellow-700"} mb-4`}>
                      <span className="font-bold">Pending:</span> {order?.paymentMethod === "cod" ? "Pay on delivery" : "Awaiting payment confirmation"}
                    </p>
                    
                    {order?.paymentMethod === "online" && (
                      <div className="space-y-4 mt-4">
                        <div className={`p-4 rounded-lg ${isDark ? "bg-green-900/30 border border-green-700" : "bg-green-50 border border-green-300"}`}>
                          <p className={`text-sm font-bold ${isDark ? "text-green-300" : "text-green-700"} mb-2`}>
                            💰 Qualify for FREE DELIVERY:
                          </p>
                          <ul className={`text-sm ${isDark ? "text-green-200" : "text-green-600"} list-disc pl-5 space-y-1`}>
                            <li>Pay <strong>Rs. 500</strong> as advance payment OR</li>
                            <li>Order total is above <strong>Rs. 5000</strong></li>
                            <li><strong>Share screenshot</strong> via WhatsApp to confirm</li>
                          </ul>
                        </div>
                        
                        {/* Payment Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Mobile Account */}
                          <div className={`p-4 rounded-lg ${isDark ? "bg-green-900/30 border border-green-700" : "bg-green-50 border border-green-300"}`}>
                            <p className={`text-sm font-bold mb-2 ${isDark ? "text-green-400" : "text-green-700"}`}>💳 Mobile Account</p>
                            <p className={`text-xs mb-2 ${isDark ? "text-green-300" : "text-green-600"}`}>03173442303</p>
                            <button
                              onClick={() => copyToClipboard("03173442303")}
                              className={`w-full px-3 py-1 text-xs rounded ${isDark ? "bg-green-700 hover:bg-green-600" : "bg-green-600 hover:bg-green-700"} text-white`}
                            >
                              Copy
                            </button>
                          </div>

                          {/* Bank */}
                          <div className={`p-4 rounded-lg ${isDark ? "bg-blue-900/30 border border-blue-700" : "bg-blue-50 border border-blue-300"}`}>
                            <p className={`text-sm font-bold mb-2 ${isDark ? "text-blue-400" : "text-blue-700"}`}>🏦 Bank Account</p>
                            <p className={`text-xs mb-2 ${isDark ? "text-blue-300" : "text-blue-600"}`}>210800319500001</p>
                            <button
                              onClick={() => copyToClipboard("210800319500001")}
                              className={`w-full px-3 py-1 text-xs rounded ${isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"} text-white`}
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        {/* WhatsApp CTA */}
                        <div className={`p-4 rounded-lg ${isDark ? "bg-green-600" : "bg-green-500"} text-white text-center`}>
                          <p className="font-semibold mb-2">📲 WhatsApp: 03291526285</p>
                          <button
                            onClick={() => copyToClipboard("03291526285")}
                            className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors text-sm font-semibold"
                          >
                            Copy WhatsApp Number
                          </button>
                        </div>
                      </div>
                    )}

                    {order?.paymentMethod === "cod" && (
                      <div className={`p-4 rounded-lg ${isDark ? "bg-green-900/30 border border-green-700" : "bg-green-50 border border-green-300"}`}>
                        <p className={`${isDark ? "text-green-300" : "text-green-700"}`}>
                          💰 Pay the full amount (Rs. {(order.total || 0).toLocaleString("en-IN")}) to the delivery person when they arrive.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Order Status Timeline */}
                  <div className={`p-6 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                    <h3 className={`text-lg font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
                      📈 Order Timeline
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Step 1: Confirmed */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-green-500`}>
                            ✓
                          </div>
                          <div className={`w-1 h-12 ${isDark ? "bg-gray-600" : "bg-gray-300"}`}></div>
                        </div>
                        <div className="pb-6">
                          <p className={`font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>Order Confirmed</p>
                          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Just now</p>
                        </div>
                      </div>

                      {/* Step 2: Payment Pending */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isDark ? "bg-blue-600" : "bg-blue-500"}`}>
                            ⏳
                          </div>
                          <div className={`w-1 h-12 ${isDark ? "bg-gray-600" : "bg-gray-300"}`}></div>
                        </div>
                        <div className="pb-6">
                          <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Payment Pending</p>
                          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{order?.paymentMethod === "cod" ? "Will be collected at delivery" : "Awaiting payment confirmation"}</p>
                        </div>
                      </div>

                      {/* Step 3: Processing */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-500 border-2 ${isDark ? "border-gray-600" : "border-gray-300"}`}>
                            📦
                          </div>
                          <div className={`w-1 h-12 ${isDark ? "bg-gray-600" : "bg-gray-300"}`}></div>
                        </div>
                        <div className="pb-6">
                          <p className={`font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Processing</p>
                          <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-600"}`}>Coming soon</p>
                        </div>
                      </div>

                      {/* Step 4: Shipped */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-500 border-2 ${isDark ? "border-gray-600" : "border-gray-300"}`}>
                            🚚
                          </div>
                          <div className={`w-1 h-12 ${isDark ? "bg-gray-600" : "bg-gray-300"}`}></div>
                        </div>
                        <div className="pb-6">
                          <p className={`font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Shipped</p>
                          <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-600"}`}>Tracking info will be updated</p>
                        </div>
                      </div>

                      {/* Step 5: Delivered */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-500 border-2 ${isDark ? "border-gray-600" : "border-gray-300"}`}>
                            ✓
                          </div>
                        </div>
                        <div>
                          <p className={`font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Delivered</p>
                          <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-600"}`}>Estimated in 3-5 business days</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className={`p-6 rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                    <h3 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                      📦 Order Items
                    </h3>
                    <div className="space-y-3 mb-4">
                      {order?.items?.map((item) => (
                        <div key={item.id} className={`flex justify-between items-center pb-3 border-b ${isDark ? "border-gray-600" : "border-gray-200"} last:border-0`}>
                          <div className="flex-1">
                            <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{item.name}</p>
                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                              Qty: {item.quantity} × Rs. {item.price.toLocaleString("en-IN")}
                            </p>
                          </div>
                          <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                            Rs. {(item.price * item.quantity).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Order Totals */}
                    <div className={`border-t ${isDark ? "border-gray-600" : "border-gray-200"} pt-4 space-y-2`}>
                      <div className="flex justify-between text-sm">
                        <span className={isDark ? "text-gray-400" : "text-gray-600"}>Subtotal:</span>
                        <span className={isDark ? "text-white" : "text-gray-900"}>
                          Rs. {(order?.subtotal || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={isDark ? "text-gray-400" : "text-gray-600"}>Shipping:</span>
                        <span className={isDark ? "text-white" : "text-gray-900"}>
                          Rs. {(order?.shippingCost || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className={`flex justify-between font-bold text-lg pt-2 border-t ${isDark ? "border-gray-600" : "border-gray-200"}`}>
                        <span className={`${isDark ? "text-white" : "text-gray-900"}`}>Total:</span>
                        <span className="text-green-600">Rs. {(order?.total || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => window.print()}
                      className={`px-6 py-3 rounded-lg font-semibold border-2 transition-all hover:shadow-lg ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
                    >
                      🖨️ Print Receipt
                    </button>
                    <button
                      onClick={() => navigate("/products")}
                      className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
                      style={{ backgroundColor: "#d3d1ce", color: "#1f2937" }}
                    >
                      ➜ Continue Shopping
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Checkout;

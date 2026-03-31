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
import { sendAdminOrderNotification } from "../services/email.service";

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
      if (cartItems.length === 0) {
        navigate("/products");
      }
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [cartItems.length, navigate]);
  
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    if (!contact.email) {
      toast.error("Please enter your email");
      return;
    }
    
    if (!delivery.firstName || !delivery.lastName || !delivery.address || !delivery.city) {
      toast.error("Please fill all required delivery fields");
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
            await createNotification({
              title: `New Order #${orderRes.orderId?.slice(0, 8)}`,
              message: `Order from ${delivery.firstName} ${delivery.lastName} - Rs. ${total.toLocaleString('en-IN')}`,
              type: 'order',
              orderId: orderRes.orderId,
              customerName: `${delivery.firstName} ${delivery.lastName}`,
              customerEmail: contact.email,
              orderTotal: total,
            });
          } catch (err) {
            console.log("Background notification creation error:", err);
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
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={contact.email}
                        onChange={(e) => setContact({ ...contact, email: e.target.value })}
                        placeholder="your@email.com"
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
                          First name
                        </label>
                        <input
                          type="text"
                          required
                          value={delivery.firstName}
                          onChange={(e) => setDelivery({ ...delivery, firstName: e.target.value })}
                          placeholder="First name"
                          className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                          Last name
                        </label>
                        <input
                          type="text"
                          required
                          value={delivery.lastName}
                          onChange={(e) => setDelivery({ ...delivery, lastName: e.target.value })}
                          placeholder="Last name"
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
                        Address
                      </label>
                      <input
                        type="text"
                        required
                        value={delivery.address}
                        onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                        placeholder="Address"
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
                          City
                        </label>
                        <input
                          type="text"
                          required
                          value={delivery.city}
                          onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                          placeholder="City"
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
                            <strong>Note:</strong> Rs. 250 advance payment required for delivery. After placing your order, send payment proof via WhatsApp.
                          </p>
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
                                03361076840
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText("03361076840");
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
              // Order Confirmation Page
              <div className={`max-w-2xl mx-auto ${isDark ? "bg-gray-800" : "bg-white"} p-12 rounded-lg shadow-lg text-center`}>
                {/* Success Icon */}
                <div className="mb-8">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${isDark ? "bg-green-900/30" : "bg-green-100"} mb-4`}>
                    <span className="text-4xl">✓</span>
                  </div>
                </div>

                {/* Thank You Message */}
                <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Thank You!
                </h1>
                <p className={`text-lg mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Your order has been successfully placed
                </p>

                {/* Order Number - Prominent Display */}
                {order?.id && (
                  <div className={`mb-8 p-6 rounded-lg ${isDark ? "bg-green-900/30 border border-green-700" : "bg-green-50 border border-green-300"}`}>
                    <p className={`text-sm font-semibold ${isDark ? "text-green-400" : "text-green-600"} mb-2`}>
                      YOUR ORDER NUMBER
                    </p>
                    <p className={`text-3xl font-bold ${isDark ? "text-green-300" : "text-green-600"} tracking-wider`}>
                      {order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className={`text-xs ${isDark ? "text-green-400" : "text-green-600"} mt-2`}>
                      Full ID: {order.id}
                    </p>
                  </div>
                )}

                {/* Next Steps */}
                <div className={`mb-8 p-6 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
                  <h2 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                    📋 Next Steps
                  </h2>
                  <p className={`text-lg ${isDark ? "text-gray-300" : "text-gray-700"} mb-4`}>
                    <strong>Payment Required:</strong> Rs. 250
                  </p>
                  <p className={`${isDark ? "text-gray-400" : "text-gray-600"} mb-4`}>
                    To confirm your order, please send the payment to the account below and share proof via WhatsApp
                  </p>

                  {/* Payment Instructions */}
                  {order?.paymentMethod === "online" ? (
                    <div className="space-y-4 mt-6">
                      {/* Mobile Account */}
                      <div className={`p-4 rounded-lg ${isDark ? "bg-green-900/30 border border-green-700" : "bg-green-50 border border-green-300"}`}>
                        <h3 className={`font-bold mb-3 ${isDark ? "text-green-400" : "text-green-700"}`}>
                          💳 Mobile Account
                        </h3>
                        <div className={`text-left space-y-2 ${isDark ? "text-green-300" : "text-green-700"}`}>
                          <p><strong>Name:</strong> Muhammad Afaq Ahmad</p>
                          <p><strong>Account:</strong> 03173442303</p>
                          <p><strong>Methods:</strong> EasyPaisa / Nayapay</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard("03173442303")}
                          className={`mt-3 px-4 py-2 rounded ${isDark ? "bg-green-700 hover:bg-green-600" : "bg-green-600 hover:bg-green-700"} text-white text-sm`}
                        >
                          Copy Account Number
                        </button>
                      </div>

                      {/* Bank Deposit */}
                      <div className={`p-4 rounded-lg ${isDark ? "bg-blue-900/30 border border-blue-700" : "bg-blue-50 border border-blue-300"}`}>
                        <h3 className={`font-bold mb-3 ${isDark ? "text-blue-400" : "text-blue-700"}`}>
                          🏦 Bank Deposit
                        </h3>
                        <div className={`text-left space-y-2 ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                          <p><strong>Bank:</strong> Bank Islami</p>
                          <p><strong>Account Holder:</strong> Malik Zeeshan Ali</p>
                          <p><strong>Account No:</strong> 210800319500001</p>
                          <p><strong>IBAN:</strong> PK96BKIP0210800319500001</p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => copyToClipboard("210800319500001")}
                            className={`flex-1 px-4 py-2 rounded ${isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"} text-white text-sm`}
                          >
                            Copy Account
                          </button>
                          <button
                            onClick={() => copyToClipboard("PK96BKIP0210800319500001")}
                            className={`flex-1 px-4 py-2 rounded ${isDark ? "bg-blue-700 hover:bg-blue-600" : "bg-blue-600 hover:bg-blue-700"} text-white text-sm`}
                          >
                            Copy IBAN
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Your order will be delivered and you can pay the full amount to the delivery person.
                    </p>
                  )}

                  {/* WhatsApp Section */}
                  <div className={`mt-6 p-4 rounded-lg ${isDark ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-300"}`}>
                    <p className={`${isDark ? "text-gray-300" : "text-gray-700"} mb-3`}>
                      Send payment proof via WhatsApp:
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                        03361076840
                      </span>
                      <button
                        onClick={() => copyToClipboard("03361076840")}
                        className={`p-2 rounded ${isDark ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-200 hover:bg-gray-300"} transition-colors`}
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                {order && (
                  <div className={`mb-8 p-6 rounded-lg ${isDark ? "bg-gray-700/50" : "bg-gray-50"} border ${isDark ? "border-gray-600" : "border-gray-200"}`}>
                    <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                      📦 Order Summary
                    </h3>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div className="flex-1">
                            <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                              {item.name}
                            </span>
                            <span className={`ml-2 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                              x {item.quantity}
                            </span>
                          </div>
                          <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                            Rs. {(item.price * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className={`border-t ${isDark ? "border-gray-600" : "border-gray-300"} mt-4 pt-4`}>
                      <div className="flex justify-between font-bold text-lg mb-2">
                        <span className={isDark ? "text-gray-300" : "text-gray-700"}>Subtotal:</span>
                        <span className={isDark ? "text-white" : "text-gray-900"}>
                          Rs. {(order.subtotal || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg mb-3">
                        <span className={isDark ? "text-gray-300" : "text-gray-700"}>Shipping:</span>
                        <span className={isDark ? "text-white" : "text-gray-900"}>
                          Rs. {(order.shippingCost || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-xl pt-3 border-t border-gray-400">
                        <span className={`${isDark ? "text-white" : "text-gray-900"} text-green-600`}>Total:</span>
                        <span className={`${isDark ? "text-white" : "text-gray-900"} text-green-600`}>
                          Rs. {(order.total || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => navigate("/products")}
                  style={{ backgroundColor: "#d3d1ce" }}
                  className="w-full text-gray-900 px-6 py-4 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 text-lg"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Checkout;

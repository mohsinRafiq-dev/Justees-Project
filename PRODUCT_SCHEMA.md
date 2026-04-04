# Product Management Schema for Justees Clothing Shop

## Product Document Structure

### Core Fields
```javascript
{
  // Basic Information
  id: String,                    // Auto-generated document ID
  name: String,                  // Product name (required)
  slug: String,                  // URL-friendly name (auto-generated)
  description: String,           // Product description (required)
  shortDescription: String,      // Brief description for listings
  
  // Pricing
  price: Number,                 // Current price (required)
  originalPrice: Number,         // Original price (for sale items)
  salePrice: Number,             // Sale price if on sale
  costPrice: Number,             // Cost price (admin only)
  
  // Media
  images: [{
    id: String,                  // Unique image ID
    url: String,                 // Firebase Storage URL
    alt: String,                 // Alt text for accessibility
    isPrimary: Boolean,          // Primary image flag
    order: Number                // Display order
  }],
  
  // Category and Tags
  category: String,              // Main category (required)
  subcategory: String,           // Subcategory (optional)
  tags: [String],                // Search tags
  brand: String,                 // Brand name (optional)
  
  // Variants and Options
  variants: [{
    id: String,                  // Variant ID
    sku: String,                 // Stock keeping unit
    size: String,                // Size (XS, S, M, L, XL, XXL)
    color: String,               // Color name
    colorHex: String,            // Color hex code
    material: String,            // Material type
    stock: Number,               // Available quantity
    price: Number,               // Variant-specific price (optional)
    images: [String],            // Variant-specific image URLs
    weight: Number,              // Weight in grams
    dimensions: {
      length: Number,
      width: Number, 
      height: Number
    }
  }],
  
  // Inventory
  totalStock: Number,            // Total available stock across variants
  minStockLevel: Number,         // Minimum stock alert level
  trackInventory: Boolean,       // Whether to track inventory
  allowBackorder: Boolean,       // Allow orders when out of stock
  
  // Status and Visibility
  status: String,                // 'active', 'inactive', 'draft'
  isVisible: Boolean,            // Show on frontend
  isFeatured: Boolean,           // Featured product flag
  badge: String,                 // Badge text ('New', 'Sale', 'Limited', etc.)
  
  // SEO and Marketing
  seoTitle: String,              // SEO page title
  seoDescription: String,        // SEO meta description
  seoKeywords: [String],         // SEO keywords
  
  // Specifications
  specifications: {
    material: String,            // Primary material
    careInstructions: String,    // Washing/care instructions
    origin: String,              // Country of origin
    season: String,              // Season (Summer, Winter, All Season)
    style: String,               // Style category
    fit: String                  // Fit type (Slim, Regular, Oversized)
  },
  
  // Shipping
  shipping: {
    weight: Number,              // Shipping weight
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    shippingClass: String,       // Shipping class for rates
    freeShipping: Boolean        // Free shipping eligible
  },
  
  // Timestamps and Metadata
  createdAt: Timestamp,          // Created date
  updatedAt: Timestamp,          // Last updated date
  createdBy: String,             // Admin user ID
  updatedBy: String,             // Last updated by user ID
  
  // Analytics and Performance
  views: Number,                 // Product page views
  sales: Number,                 // Number of times sold
  rating: Number,                // Average rating
  reviewCount: Number,           // Number of reviews
  
  // Additional Features
  relatedProducts: [String],     // Related product IDs
  crossSellProducts: [String],   // Cross-sell product IDs
  upSellProducts: [String],      // Up-sell product IDs
  
  // Custom Fields (extensible)
  customFields: {
    [key: String]: any           // Custom fields for specific needs
  }
}
```

## Firestore Collections Structure

### Primary Collections:
1. **products** - Main product documents
2. **categories** - Product categories
3. **inventory** - Inventory tracking
4. **product_reviews** - Product reviews
5. **product_analytics** - Analytics data

### Subcollections:
- **products/{productId}/variants** - Product variants
- **products/{productId}/reviews** - Product reviews
- **products/{productId}/analytics** - Product analytics

## Category Document Structure
```javascript
{
  id: String,                    // Category ID
  name: String,                  // Category name
  slug: String,                  // URL slug
  description: String,           // Category description
  image: String,                 // Category image URL
  parentId: String,              // Parent category ID (for subcategories)
  order: Number,                 // Display order
  isActive: Boolean,             // Active status
  seoTitle: String,              // SEO title
  seoDescription: String,        // SEO description
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Inventory Tracking Document
```javascript
{
  productId: String,             // Product reference
  variantId: String,             // Variant reference
  sku: String,                   // Stock keeping unit
  currentStock: Number,          // Current stock level
  reservedStock: Number,         // Reserved for pending orders
  availableStock: Number,        // Available for sale
  stockMovements: [{
    type: String,                // 'in', 'out', 'adjustment'
    quantity: Number,            // Quantity changed
    reason: String,              // Reason for change
    timestamp: Timestamp,
    userId: String               // User who made the change
  }],
  lastRestocked: Timestamp,      // Last restock date
  nextRestockDate: Timestamp     // Expected restock date
}
```

## Security Rules Considerations
- Products can be read by anyone
- Only authenticated admins can create/update/delete products
- Product reviews can be created by authenticated users
- Inventory data is admin-only
- Analytics data is admin-only

## Indexing Strategy
- Composite indexes for category + status + featured
- Index on price for sorting
- Index on tags for search
- Index on createdAt for chronological sorting
- Full-text search on name and description
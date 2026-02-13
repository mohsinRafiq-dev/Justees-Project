import { useState, useEffect } from 'react';
import { X, Upload, Trash2, Plus, Save, Eye } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-hot-toast';
import {
  createProduct,
  updateProduct
} from '../../services/products.service';
import {
  uploadMultipleProductImages,
  deleteProductImage
} from '../../services/storage.service';
import {
  validateProductForm,
  validateVariants,
  validateImages
} from '../../utils/validation';
import { CATEGORIES, SIZES as DEFAULT_SIZES, COLORS as DEFAULT_COLORS } from '../../utils/constants';
import { getSizes, getColors, getCategories } from '../../services/products.service';
import { useAuth } from '../../hooks/useAuth';

const ProductForm = ({ product, onSave, onCancel, loading: externalLoading }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: CATEGORIES?.[0] || 'T-Shirts',
    // We keep both originalPrice and salePrice. `price` will be set to effective price on save.
    price: '',
    originalPrice: '',
    onSale: false,
    salePrice: '',
    badge: '',
    tags: [],
    status: 'active',
    isVisible: true,
    isFeatured: false,
    trackInventory: false,
    specifications: {
      material: '',
      careInstructions: '',
      fit: 'Regular'
    },
    stockStatus: 'in_stock'
  });

  const [variants, setVariants] = useState([]);
  const [colorImages, setColorImages] = useState({}); // { colorName: [imageFiles] }
  const [existingImages, setExistingImages] = useState({}); // { colorName: [imageUrls] }
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [availableColors, setAvailableColors] = useState(DEFAULT_COLORS || []);
  const [availableSizes, setAvailableSizes] = useState(DEFAULT_SIZES || []);
  const [availableCategories, setAvailableCategories] = useState(CATEGORIES || []);
  // Colors and sizes selected for this specific product (checkboxes in UI)
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [newColorInput, setNewColorInput] = useState('');

  // Load admin-defined sizes/colors (if any) and keep defaults as fallback
  const loadAttributes = async () => {
    try {
      const [sizesRes, colorsRes, categoriesRes] = await Promise.all([getSizes(), getColors(), getCategories()]);
      if (sizesRes.success && sizesRes.sizes) {
        setAvailableSizes(sizesRes.sizes.map((s) => s.name));
      }
      if (colorsRes.success && colorsRes.colors) {
        setAvailableColors(colorsRes.colors.map((c) => c.name));
      }
      if (categoriesRes.success && categoriesRes.categories) {
        setAvailableCategories(categoriesRes.categories.map(cat => cat.name));
      }

      // If no category is selected, default to first available
      setFormData(prev => ({
        ...prev,
        stockStatus: prev.stockStatus || 'in_stock',
        category: prev.category || (categoriesRes.success && categoriesRes.categories && categoriesRes.categories.length > 0 ? categoriesRes.categories[0].name : (CATEGORIES?.[0] || ''))
      }));
    } catch (err) {
      // console.error('Error loading sizes/colors/categories:', err);
    }
  };

  useEffect(() => {
    loadAttributes();

    const onAttributesChanged = () => loadAttributes();
    window.addEventListener('productAttributes:changed', onAttributesChanged);
    return () => window.removeEventListener('productAttributes:changed', onAttributesChanged);
  }, []);

  // Initialize form with existing product data
  useEffect(() => {
    if (product) {
      // console.log('[ProductForm] Loading product for edit:', product);
      // console.log('[ProductForm] Product images:', product.images);

      setFormData(prevFormData => ({
        ...prevFormData,
        ...product,
        price: product.price?.toString() || '',
        originalPrice: product.originalPrice?.toString() || '',
        onSale: product.onSale || false,
        salePrice: product.salePrice?.toString() || '',
        tags: product.tags || [],
        specifications: {
          ...prevFormData.specifications,
          ...product.specifications
        }
      }));

      setVariants(product.variants || []);

      // Set available colors from existing variants (but keep master list intact)
      if (product.variants && product.variants.length > 0) {
        const colors = [...new Set(product.variants.map(v => v.color))];
        // Pre-select colors present on product
        setSelectedColors(colors);
      }

      // Set selected sizes from existing variants
      if (product.variants && product.variants.length > 0) {
        const sizes = [...new Set(product.variants.map(v => v.size))];
        setSelectedSizes(sizes);
      }

      // Set existing images grouped by color
      if (product.images) {
        // console.log('[ProductForm] Processing images for colors...');
        const imagesByColor = {};
        product.images.forEach(img => {
          // console.log('[ProductForm] Processing image:', img);
          const color = img.color || 'default';
          if (!imagesByColor[color]) {
            imagesByColor[color] = [];
          }
          imagesByColor[color].push(img.url);
        });
        // console.log('[ProductForm] Images by color:', imagesByColor);
        setExistingImages(imagesByColor);
      } else {
        // console.log('[ProductForm] No images found in product data');
      }
    }
  }, [product]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleStockChange = (size, color, stock) => {
    const stockValue = parseInt(stock) || 0;

    setVariants(prev => {
      const existingIndex = prev.findIndex(v => v.size === size && v.color === color);

      if (stockValue === 0) {
        // Remove variant if stock is 0
        return existingIndex >= 0 ? prev.filter((_, i) => i !== existingIndex) : prev;
      } else {
        // Update existing or add new variant
        if (existingIndex >= 0) {
          return prev.map((variant, i) =>
            i === existingIndex ? { ...variant, stock: stockValue } : variant
          );
        } else {
          return [...prev, {
            id: `${size}-${color}`,
            size,
            color,
            stock: stockValue
          }];
        }
      }
    });
  };

  const handleBulkStock = (stockValue) => {
    if (stockValue === 0) {
      setVariants([]);
    } else {
      const newVariants = [];
      selectedSizes.forEach(size => {
        selectedColors.forEach(color => {
          newVariants.push({
            id: `${size}-${color}`,
            size,
            color,
            stock: stockValue
          });
        });
      });
      setVariants(newVariants);
    }
  };

  const toggleColorSelection = (color) => {
    setSelectedColors(prev => {
      if (prev.includes(color)) {
        // Removing color: remove variants and images for that color
        setVariants(vprev => vprev.filter(v => v.color !== color));
        setColorImages(prevImgs => {
          const updated = { ...prevImgs };
          delete updated[color];
          return updated;
        });
        return prev.filter(c => c !== color);
      } else {
        // Add color and ensure variants exist for selected sizes with stock 0
        setVariants(vprev => {
          const updated = [...vprev];
          selectedSizes.forEach(size => {
            const exists = updated.some(v => v.size === size && v.color === color);
            if (!exists) {
              updated.push({ id: `${size}-${color}`, size, color, stock: 0 });
            }
          });
          return updated;
        });
        return [...prev, color];
      }
    });
  };

  const toggleSizeSelection = (size) => {
    setSelectedSizes(prev => {
      if (prev.includes(size)) {
        // Removing size: remove variants with this size
        setVariants(vprev => vprev.filter(v => v.size !== size));
        return prev.filter(s => s !== size);
      } else {
        // Add size and ensure variants exist for selected colors with stock 0
        setVariants(vprev => {
          const updated = [...vprev];
          selectedColors.forEach(color => {
            const exists = updated.some(v => v.size === size && v.color === color);
            if (!exists) {
              updated.push({ id: `${size}-${color}`, size, color, stock: 0 });
            }
          });
          return updated;
        });
        return [...prev, size];
      }
    });
  };



  // Image handling functions
  const handleImageUpload = (color, files) => {
    const fileArray = Array.from(files);

    // Validate file types and sizes
    const validFiles = fileArray.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

      if (!isValidType) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setColorImages(prev => ({
        ...prev,
        [color]: [...(prev[color] || []), ...validFiles]
      }));
    }
  };

  const handleRemoveNewImage = (color, imageIndex) => {
    setColorImages(prev => ({
      ...prev,
      [color]: prev[color]?.filter((_, index) => index !== imageIndex) || []
    }));
  };

  const handleRemoveExistingImage = (color, imageUrl) => {
    setImagesToRemove(prev => [...prev, imageUrl]);
    setExistingImages(prev => ({
      ...prev,
      [color]: prev[color]?.filter(url => url !== imageUrl) || []
    }));
  };

  const validateForm = () => {
    const formValidation = validateProductForm(formData);
    const variantValidation = validateVariants(variants);



    const allErrors = {
      ...(formValidation.errors || formValidation),
      ...(variantValidation.errors || variantValidation)
    };

    // Validate any new image files per color
    const imageErrors = [];
    Object.entries(colorImages).forEach(([color, files]) => {
      const validation = validateImages(files);
      if (!validation.valid) {
        imageErrors.push(`${color}: ${validation.errors.join('; ')}`);
      }
    });

    if (imageErrors.length > 0) {
      allErrors.images = imageErrors.join(' | ');
    }

    // console.log('All errors:', allErrors);
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // console.log('Form submission started');
    // console.log('User:', user);

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (!user?.uid) {
      toast.error('Authentication required. Please login again.');
      return;
    }

    setLoading(true);

    try {
      // console.log('Preparing product data...');
      // Prepare product data
      const productData = {
        ...formData,
        // Persist both originalPrice and salePrice (if any). `price` is the effective selling price used across the app.
        originalPrice: parseFloat(formData.originalPrice),
        salePrice: formData.onSale && formData.salePrice ? parseFloat(formData.salePrice) : null,
        onSale: !!formData.onSale,
        price: formData.onSale && formData.salePrice ? parseFloat(formData.salePrice) : parseFloat(formData.originalPrice),
        variants: variants.map(variant => ({
          ...variant,
          stock: parseInt(variant.stock) || 0,
          weight: variant.weight ? parseFloat(variant.weight) : null
        }))
      };

      // Calculate total stock
      productData.totalStock = variants.reduce((sum, variant) => sum + (parseInt(variant.stock) || 0), 0);

      // Prepare images data for upload
      const allNewImageFiles = [];
      const imageColorMapping = [];

      Object.entries(colorImages).forEach(([color, files]) => {
        files.forEach(file => {
          allNewImageFiles.push(file);
          imageColorMapping.push(color);
        });
      });

      // console.log('Image files prepared:', allNewImageFiles.length);
      // console.log('Image color mapping:', imageColorMapping);

      let result;

      if (product) {
        // console.log('Updating existing product:', product.id);
        // Update existing product
        result = await updateProduct(
          product.id,
          productData,
          allNewImageFiles,
          imagesToRemove,
          user?.uid,
          imageColorMapping
        );
      } else {
        // console.log('Creating new product');
        // Create new product
        result = await createProduct(
          productData,
          allNewImageFiles,
          user?.uid,
          imageColorMapping
        );
      }

      // console.log('Service result:', result);

      if (result.success) {
        toast.success(product ? 'Product updated successfully!' : 'Product created successfully!');

        // Clear form state if creating a new product
        if (!product) {
          setColorImages({});
          setExistingImages({});
          setImagesToRemove([]);
          setVariants([]);
          setAvailableColors([]);
        }

        onSave(result.product || { ...product, ...productData });
      } else {
        // Show general error
        toast.error(result.error || 'Failed to save product');

        // Show upload-specific errors if present
        if (result.uploadErrors && result.uploadErrors.length > 0) {
          result.uploadErrors.forEach(err => toast.error(err.message || err));
        }

        // Legacy `errors` array handling
        if (result.errors) {
          // errors may be strings or objects
          result.errors.forEach(error => {
            if (typeof error === 'string') {
              toast.error(error);
            } else if (error && error.message) {
              toast.error(`${error.message} ${error.code ? `(${error.code})` : ''}`);
            }
          });
        }
      }

    } catch (error) {
      // console.error('Error saving product:', error);
      toast.error('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: '📝' },
    { id: 'variants', name: 'Variants & Stock', icon: '📦' },
    { id: 'images', name: 'Images', icon: '🖼️' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${isDark ? "bg-gray-800 border-gray-700 shadow-2xl" : "bg-white shadow-2xl"} rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex items-center space-x-4">
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tabs */}
          <div className={`border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <div className="flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-500'
                    : isDark ? 'border-transparent text-gray-500 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full rounded-lg px-4 py-2 outline-none transition-all ${
                        isDark 
                          ? `bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50 ${errors.name ? 'border-red-500/50' : ''}` 
                          : `bg-white border-gray-300 focus:ring-blue-500 ${errors.name ? 'border-red-500' : ''}`
                      } border focus:ring-2`}
                      placeholder="Enter product name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={`w-full rounded-lg px-4 py-2 outline-none transition-all ${
                        isDark 
                          ? `bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50 ${errors.category ? 'border-red-500/50' : ''}` 
                          : `bg-white border-gray-300 focus:ring-blue-500 ${errors.category ? 'border-red-500' : ''}`
                      } border focus:ring-2`}
                    >
                      <option value="" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Select Category</option>
                      {availableCategories && availableCategories.length > 0 ? (
                        availableCategories.map(category => (
                          <option key={category} value={category} className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>{category}</option>
                        ))
                      ) : (
                        CATEGORIES.map(category => (
                          <option key={category} value={category} className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>{category}</option>
                        ))
                      )}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                    )}
                  </div>

                  {/* Original Price (required) */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Original Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.originalPrice}
                      onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                      className={`w-full rounded-lg px-4 py-2 outline-none transition-all ${
                        isDark 
                          ? `bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50 ${errors.originalPrice ? 'border-red-500/50' : ''}` 
                          : `bg-white border-gray-300 focus:ring-blue-500 ${errors.originalPrice ? 'border-red-500' : ''}`
                      } border focus:ring-2`}
                      placeholder="0.00"
                    />
                    {errors.originalPrice && (
                      <p className="text-red-500 text-sm mt-1">{errors.originalPrice}</p>
                    )}
                  </div>

                  {/* On Sale toggle + Sale Price */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        On Sale
                      </label>
                      <input
                        type="checkbox"
                        checked={formData.onSale}
                        onChange={(e) => handleInputChange('onSale', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    {formData.onSale && (
                      <div className="mt-2">
                        <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                          Sale Price *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.salePrice}
                          onChange={(e) => handleInputChange('salePrice', e.target.value)}
                          className={`w-full rounded-lg px-4 py-2 outline-none transition-all ${
                            isDark 
                              ? `bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50 ${errors.salePrice ? 'border-red-500/50' : ''}` 
                              : `bg-white border-gray-300 focus:ring-blue-500 ${errors.salePrice ? 'border-red-500' : ''}`
                          } border focus:ring-2`}
                          placeholder="0.00"
                        />
                        {errors.salePrice && (
                          <p className="text-red-500 text-sm mt-1">{errors.salePrice}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Badge */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Badge
                    </label>
                    <select
                      value={formData.badge}
                      onChange={(e) => handleInputChange('badge', e.target.value)}
                      className={`w-full rounded-lg px-4 py-2 outline-none transition-all ${
                        isDark ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50" : "bg-white border-gray-300 focus:ring-blue-500 text-gray-900"
                      } border focus:ring-2`}
                    >
                      <option value="" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>No Badge</option>
                      <option value="New" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>New</option>
                      <option value="Sale" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Sale</option>
                      <option value="Hot" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Hot</option>
                      <option value="Limited" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Limited</option>
                      <option value="Bestseller" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Bestseller</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={`w-full rounded-lg px-4 py-2 outline-none transition-all resize-none ${
                        isDark 
                          ? `bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50 ${errors.description ? 'border-red-500/50' : ''}` 
                          : `bg-white border-gray-300 focus:ring-blue-500 ${errors.description ? 'border-red-500' : ''}`
                      } border focus:ring-2`}
                    placeholder="Enter product description"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Short Description */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    className={`w-full rounded-lg px-4 py-2 outline-none transition-all ${
                      isDark ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50" : "bg-white border-gray-300 focus:ring-blue-500 text-gray-900"
                    } border focus:ring-2`}
                    placeholder="Brief description for product listing"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-400 hover:text-blue-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className={`flex-1 rounded-l-lg px-4 py-2 outline-none transition-all ${
                        isDark ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50" : "bg-white border-gray-300 focus:ring-blue-500 text-gray-900"
                      } border focus:ring-2`}
                      placeholder="Add a tag"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-gray-600 text-white px-4 py-2 rounded-r-lg hover:bg-gray-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Status Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isVisible"
                      checked={formData.isVisible}
                      onChange={(e) => handleInputChange('isVisible', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isVisible" className={`ml-2 block text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Visible in store
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isFeatured" className={`ml-2 block text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Featured product
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="trackInventory"
                      checked={formData.trackInventory}
                      onChange={(e) => handleInputChange('trackInventory', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="trackInventory" className={`ml-2 block text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Track inventory
                    </label>
                  </div>
                </div>

                {/* Stock Status */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Stock Status
                  </label>
                  <select
                    value={formData.stockStatus}
                    onChange={(e) => handleInputChange('stockStatus', e.target.value)}
                    className={`w-full rounded-lg px-4 py-2 outline-none transition-all ${
                        isDark ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50" : "bg-white border-gray-300 focus:ring-blue-500 text-gray-900"
                      } border focus:ring-2`}
                  >
                    <option value="in_stock" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>In Stock</option>
                    <option value="out_of_stock" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>Out of Stock</option>
                  </select>
                </div>
              </div>
            )}

            {/* Add other tab contents here... */}

            {/* Variants Tab */}
            {activeTab === 'variants' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Stock Management</h3>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>Add colors and set stock levels for different sizes</p>

                {/* Color & Size Selection (choose from admin-managed lists) */}
                <div className={`border rounded-lg p-4 ${isDark ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-white"}`}>
                  <h4 className={`font-medium mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>Select Colors for this Product</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {availableColors.length > 0 ? availableColors.map(color => (
                      <label key={color} className={`flex items-center gap-2 px-3 py-1 border rounded transition-colors cursor-pointer ${
                          selectedColors.includes(color) 
                            ? (isDark ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700') 
                            : (isDark ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300')
                        }`}>
                        <input type="checkbox" checked={selectedColors.includes(color)} onChange={() => toggleColorSelection(color)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm font-medium">{color}</span>
                      </label>
                    )) : (
                      <p className="text-gray-500 text-sm">No colors available. Add colors on the Sizes & Colors page.</p>
                    )}
                  </div>

                  <h4 className={`font-medium mb-3 mt-4 ${isDark ? "text-white" : "text-gray-900"}`}>Select Sizes for this Product</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.length > 0 ? availableSizes.map(size => (
                      <label key={size} className={`flex items-center gap-2 px-3 py-1 border rounded transition-all cursor-pointer ${
                          selectedSizes.includes(size) 
                            ? (isDark ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700') 
                            : (isDark ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300')
                        }`}>
                        <input type="checkbox" checked={selectedSizes.includes(size)} onChange={() => toggleSizeSelection(size)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm font-medium">{size}</span>
                      </label>
                    )) : (
                      <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No sizes available. Add sizes on the Sizes & Colors page.</p>
                    )}
                  </div>
                </div>

                {/* Size & Color Stock Grid */}
                {selectedColors.length > 0 && selectedSizes.length > 0 && (
                  <div className={`border rounded-lg p-4 ${isDark ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-white"}`}>
                    <div className="overflow-x-auto">
                      <div className="grid gap-2 text-sm" style={{ gridTemplateColumns: `1fr repeat(${selectedColors.length}, minmax(80px, 1fr))` }}>
                        {/* Header */}
                        <div className={`font-medium ${isDark ? "text-gray-400" : "text-gray-700"}`}>Size/Color</div>
                        {selectedColors.map(color => (
                          <div key={color} className={`font-medium text-center ${isDark ? "text-gray-400" : "text-gray-700"}`}>{color}</div>
                        ))}

                        {/* Stock Grid */}
                        {selectedSizes.map(size => (
                          <div key={size} className="contents">
                            <div className={`font-medium ${isDark ? "text-gray-400" : "text-gray-700"}`}>{size}</div>
                            {selectedColors.map(color => {
                              const existingVariant = variants.find(v => v.size === size && v.color === color);
                              return (
                                <input
                                  key={color}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={existingVariant?.stock || ''}
                                  onChange={(e) => handleStockChange(size, color, e.target.value)}
                                  className={`w-full border rounded px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-blue-500/50 ${
                                    isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
                                  }`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(!selectedColors.length || !selectedSizes.length) && (
                  <div className={`border rounded-lg p-4 text-sm ${
                      isDark ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" : "bg-yellow-50 border-yellow-200 text-yellow-800"
                    }`}>
                    Select at least one color and one size above to manage stock for this product.
                  </div>
                )}

                {/* Quick Stock Actions */}
                {selectedColors.length > 0 && selectedSizes.length > 0 && (
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => handleBulkStock(10)}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium border ${
                        isDark ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20" : "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                      }`}
                    >
                      Set All to 10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkStock(0)}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium border ${
                        isDark ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20" : "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                      }`}
                    >
                      Clear All Stock
                    </button>
                  </div>
                )}

                {/* Variants Summary */}
                <div className={`rounded-lg p-4 ${isDark ? "bg-white/5 border border-white/10" : "bg-gray-50"}`}>
                  <h4 className={`font-medium mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Stock Summary</h4>
                  <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Total Variants: {variants.length} | 
                    Total Stock: {variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)} units
                  </div>
                </div>
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="space-y-6">
                <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Product Images</h3>
                <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>Upload images for each color variant. You can add multiple images per color.</p>
                {errors.images && (
                  <p className="text-red-500 text-sm mt-2">{errors.images}</p>
                )}

                {selectedColors.length === 0 ? (
                  <div className={`text-center py-8 rounded-lg border-2 border-dashed ${isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-300"}`}>
                    <div className="text-gray-500 mb-2 text-2xl">📦</div>
                    <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>Please select colors in the "Variants & Stock" tab first</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('variants')}
                      className="mt-2 text-blue-500 hover:text-blue-400 transition-colors font-medium"
                    >
                      Go to Variants & Stock
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedColors.map(color => (
                      <div key={color} className={`border rounded-lg p-4 ${isDark ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-white"}`}>
                        <h4 className={`font-medium mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                          <div
                            className={`w-4 h-4 rounded border ${isDark ? "border-white/20" : "border-gray-300"}`}
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                          {color} Images
                        </h4>

                        {/* Image Upload */}
                        <div className="mb-4">
                          <input
                            type="file"
                            id={`images-${color}`}
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(color, e.target.files)}
                            className="hidden"
                          />
                          <label
                            htmlFor={`images-${color}`}
                            className={`flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                              isDark ? "bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300" : "bg-gray-50 border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700"
                            }`}
                          >
                            <div className="text-center">
                              <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                              <p className="text-sm font-medium">
                                Click to upload images for {color}
                              </p>
                              <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                PNG, JPG, WEBP up to 5MB each
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* Existing Images */}
                        {existingImages[color] && existingImages[color].length > 0 && (
                          <div className="mb-4">
                            <h5 className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Current Images</h5>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              {existingImages[color].map((imageUrl, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={imageUrl}
                                    alt={`${color} ${index + 1}`}
                                    className={`w-full h-20 object-cover rounded-lg border ${isDark ? "border-gray-700" : "border-gray-300"}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExistingImage(color, imageUrl)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* New Images Preview */}
                        {colorImages[color] && colorImages[color].length > 0 && (
                          <div>
                            <h5 className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>New Images</h5>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              {colorImages[color].map((file, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`${color} new ${index + 1}`}
                                    className={`w-full h-20 object-cover rounded-lg border ${isDark ? "border-gray-700" : "border-gray-300"}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveNewImage(color, index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`border-t px-6 py-4 ${isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className={`px-6 py-2 border rounded-lg transition-colors font-medium ${
                  isDark ? "border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || externalLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
              >
                {loading || externalLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{product ? 'Update Product' : 'Create Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Upload, X, Edit3, Image, Film } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { isAdminUser } from '../../utils/validation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getSlides,
  addSlide,
  updateSlide,
  deleteSlide,
} from '../../services/slides.service';
import { getCategories } from '../../services/products.service';
import { uploadSlideMedia } from '../../services/storage/upload';

const SlidesManagement = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    type: 'image', // image | video
    mediaUrl: '',
    order: 0,
    isVisible: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  useEffect(() => {
    if (!isAdminUser(user)) return;
    loadSlides();
    loadCategories();
  }, [user]);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      if (res.success) setCategories(res.categories || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadSlides = async () => {
    setLoading(true);
    try {
      const res = await getSlides({ limitCount: 50 });
      if (res.success) setSlides(res.slides);
      else toast.error(res.error || 'Failed to load slides');
    } catch (err) {
      console.error(err);
      toast.error('Error loading slides');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate basic size/type in UI (upload will validate too)
    if (file.type.startsWith('image/') && file.size > 6 * 1024 * 1024) {
      toast.error('Image is too large (max ~5MB)');
      return;
    }
    if (file.type.startsWith('video/') && file.size > 90 * 1024 * 1024) {
      toast.error('Video is too large (max ~80MB)');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      // For video show object URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    // Set type automatically
    setFormData(prev => ({ ...prev, type: file.type.startsWith('video/') ? 'video' : 'image' }));
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData(prev => ({ ...prev, mediaUrl: '' }));
  };

  const openModal = (slide = null) => {
    if (slide) {
      setEditingId(slide.id);
      setFormData({
        title: slide.title || '',
        subtitle: slide.subtitle || '',
        description: slide.description || '',
        type: slide.type || (slide.url && slide.url.includes('.mp4') ? 'video' : 'image'),
        mediaUrl: slide.url || '',
        order: slide.order || 0,
        isVisible: slide.isVisible ?? true,
      });
      setPreviewUrl(slide.url || '');
    } else {
      setEditingId(null);
      setFormData({ title: '', subtitle: '', description: '', type: 'image', mediaUrl: '', order: 0, isVisible: true });
      setPreviewUrl('');
    }
    setSelectedFile(null);
    setCategorySearch(slide ? slide.title : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: '', subtitle: '', description: '', type: 'image', mediaUrl: '', order: 0, isVisible: true });
    setSelectedFile(null);
    setCategorySearch('');
    setPreviewUrl('');
  };

  const handleSave = async () => {
    if (!selectedFile && !formData.mediaUrl) {
      toast.error('Please provide media (Image or Video)');
      return;
    }

    try {
      setLoading(true);

      let mediaUrl = formData.mediaUrl;

      if (selectedFile) {
        const uploadRes = await uploadSlideMedia(selectedFile);
        if (uploadRes.success) {
          mediaUrl = uploadRes.data.url;
        } else {
          toast.error('Failed to upload media: ' + (uploadRes.error || ''));
          setLoading(false);
          return;
        }
      }

    const payload = {
        title: (formData.title || '').trim(),
        subtitle: (formData.subtitle || '').trim(),
        description: (formData.description || '').trim(),
        type: formData.type,
        url: mediaUrl,
        order: Number(formData.order) || 0,
        isVisible: !!formData.isVisible,
      };

      let res;
      if (editingId) {
        res = await updateSlide(editingId, payload);
      } else {
        res = await addSlide(payload);
      }

      if (res.success) {
        toast.success(editingId ? 'Slide updated' : 'Slide added');
        closeModal();
        loadSlides();
      } else {
        toast.error(res.error || `Failed to ${editingId ? 'update' : 'add'} slide`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error ${editingId ? 'updating' : 'adding'} slide`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirm({ open: true, id });
  };

  const confirmDelete = async () => {
    const id = confirm.id;
    setConfirm({ open: false, id: null });
    try {
      const res = await deleteSlide(id);
      if (res.success) {
        toast.success('Slide deleted');
        loadSlides();
      } else {
        toast.error(res.error || 'Failed to delete slide');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting slide');
    }
  };

  if (!isAdminUser(user)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-white"}`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Access Denied</h2>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Slides</h2>
          <p className={`text-sm sm:text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}>Add and manage hero slides (images/videos)</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slide</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Slide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl my-8 border`}>
            <div className={`sticky top-0 border-b px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl z-10 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h3 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{editingId ? 'Edit Slide' : 'Add New Slide'}</h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Media Upload */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Image / Video</label>
                <div className="flex items-center justify-center w-full">
                  {previewUrl ? (
                    <div className={`relative w-full h-48 rounded-lg overflow-hidden border ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                      {formData.type === 'video' || (selectedFile && selectedFile.type.startsWith('video/')) ? (
                        <video src={previewUrl} className="w-full h-full object-cover" controls />
                      ) : (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      )}
                      <button onClick={clearFile} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDark 
                        ? "border-gray-700 bg-gray-900/50 hover:bg-gray-900" 
                        : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                    }`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>Click to upload image or video</p>
                        <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Images (JPG/PNG/WebP) max 5MB, Videos (MP4/WebM/MOV) max ~80MB</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              {/* Category (Title) Select */}
              <div className="relative">
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Category (Title) <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <input
                    className={`w-full rounded-lg px-4 py-2 outline-none transition-all ${
                      isDark 
                        ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50" 
                        : "bg-white border-gray-300 focus:ring-blue-500"
                    } border focus:ring-2`}
                    placeholder="Search and select category..."
                    value={categorySearch}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setShowCategoryDropdown(true);
                    }}
                  />
                  
                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <div className={`absolute z-50 w-full mt-1 border rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto ${
                        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                      }`}>
                        {categories
                          .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                          .map(category => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, title: category.name });
                                setCategorySearch(category.name);
                                setShowCategoryDropdown(false);
                              }}
                              className={`w-full px-4 py-2 text-left transition-colors text-sm border-b last:border-0 ${
                                isDark 
                                  ? "text-gray-300 hover:bg-gray-700 border-gray-700" 
                                  : "text-gray-700 hover:bg-gray-50 border-gray-100"
                              }`}
                            >
                              {category.name}
                            </button>
                          ))}
                        {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500 italic">No categories found</div>
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
                {formData.title && (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Linked: {formData.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, title: '' });
                        setCategorySearch('');
                      }}
                      className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      Unlink Category
                    </button>
                  </div>
                )}
              </div>

              {/* Subtitle */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Subtitle <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input 
                  className={`w-full rounded-lg px-4 py-2 outline-none transition-all ${
                    isDark 
                      ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50" 
                      : "bg-white border-gray-300 focus:ring-blue-500"
                  } border focus:ring-2`}
                  placeholder="e.g., Elevate Your Style"
                  value={formData.subtitle} 
                  onChange={(e) => setFormData({...formData, subtitle: e.target.value})} 
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                <textarea 
                  className={`w-full rounded-lg px-4 py-2 outline-none transition-all resize-none ${
                    isDark 
                      ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50" 
                      : "bg-white border-gray-300 focus:ring-blue-500"
                  } border focus:ring-2`}
                  placeholder="Brief description for the slide..."
                  rows={3} 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Order</label>
                  <input 
                    type="number" 
                    min="0"
                    className={`w-full rounded-lg px-4 py-2 outline-none transition-all ${
                      isDark 
                        ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50" 
                        : "bg-white border-gray-300 focus:ring-blue-500"
                    } border focus:ring-2`}
                    placeholder="0"
                    value={formData.order} 
                    onChange={(e) => setFormData({...formData, order: e.target.value})} 
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Visible</label>
                  <div className="mt-2">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className={`rounded focus:ring-blue-500 ${isDark ? "bg-gray-900 border-gray-700 text-blue-500" : "border-gray-300 text-blue-600"}`}
                        checked={formData.isVisible} 
                        onChange={(e) => setFormData({...formData, isVisible: e.target.checked})} 
                      />
                      <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Show on homepage</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions - Sticky bottom */}
            <div className={`sticky bottom-0 border-t px-4 sm:px-6 py-3 sm:py-4 rounded-b-2xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={closeModal} 
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-600 hover:bg-gray-100"
                  }`} 
                  disabled={loading}
                >
                  Cancel
                </button>
                <button onClick={handleSave} disabled={loading || (!formData.title.trim() && !previewUrl)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-70 transition-colors">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"/> 
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 inline-block mr-2" /> 
                      {editingId ? 'Update' : 'Add'} Slide
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-xl shadow-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        {loading && !isModalOpen ? (
          <div className="p-12"><LoadingSpinner /></div>
        ) : slides.length === 0 ? (
          <div className="p-12 text-center">
            <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>No slides found.</p>
          </div>
        ) : (
          <ul className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}>
            {slides.map((s) => (
              <li key={s.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 hover:bg-black/5 px-4 sm:px-6 transition-colors gap-3 sm:gap-0`}>
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-20 h-12 rounded overflow-hidden border flex-shrink-0 ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-200"}`}>
                    {s.type === 'video' ? (
                      <video src={s.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={s.url} alt={s.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${isDark ? "text-gray-100" : "text-gray-900"}`}>{s.title || 'Untitled'}</h3>
                    <p className={`text-sm line-clamp-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{s.subtitle}</p>
                    <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>Order: {s.order ?? 0} • {s.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button onClick={() => openModal(s)} className={`p-2 rounded-full transition-colors ${isDark ? "text-blue-400 hover:bg-blue-500/10" : "text-blue-600 hover:bg-blue-50"}`} title="Edit"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className={`p-2 rounded-full transition-colors ${isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"}`} title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirm.open}
        title="Delete Slide"
        message="Are you sure you want to delete this slide?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </div>
  );
};

export default SlidesManagement;
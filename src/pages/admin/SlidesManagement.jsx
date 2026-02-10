import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Upload, X, Edit3, Image, Film } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isAdminUser } from '../../utils/validation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getSlides,
  addSlide,
  updateSlide,
  deleteSlide,
} from '../../services/slides.service';
import { uploadSlideMedia } from '../../services/storage/upload';

const SlidesManagement = () => {
  const { user } = useAuth();
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

  const [confirm, setConfirm] = useState({ open: false, id: null });

  useEffect(() => {
    if (!isAdminUser(user)) return;
    loadSlides();
  }, [user]);

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
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: '', subtitle: '', description: '', type: 'image', mediaUrl: '', order: 0, isVisible: true });
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleSave = async () => {
    if (!formData.title.trim() && !selectedFile && !formData.mediaUrl) {
      toast.error('Please provide a title and media');
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
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim(),
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Slides</h2>
          <p className="text-gray-600">Add and manage hero slides (images/videos)</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slide</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Slide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
              <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Slide' : 'Add New Slide'}</h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image / Video</label>
                <div className="flex items-center justify-center w-full">
                  {previewUrl ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
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
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="text-sm text-gray-500 font-semibold">Click to upload image or video</p>
                        <p className="text-xs text-gray-500 mt-1">Images (JPG/PNG/WebP) max 5MB, Videos (MP4/WebM/MOV) max ~80MB</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                  placeholder="e.g., Premium Quality"
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                  placeholder="e.g., Elevate Your Style"
                  value={formData.subtitle} 
                  onChange={(e) => setFormData({...formData, subtitle: e.target.value})} 
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" 
                  placeholder="Brief description for the slide..."
                  rows={3} 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                    placeholder="0"
                    value={formData.order} 
                    onChange={(e) => setFormData({...formData, order: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visible</label>
                  <div className="mt-2">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={formData.isVisible} 
                        onChange={(e) => setFormData({...formData, isVisible: e.target.checked})} 
                      />
                      <span className="text-sm text-gray-600">Show on homepage</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions - Sticky bottom */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <div className="flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" disabled={loading}>
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

      <div className="bg-white rounded-lg shadow p-4">
        {loading && !isModalOpen ? (
          <LoadingSpinner />
        ) : slides.length === 0 ? (
          <p className="text-gray-600">No slides found.</p>
        ) : (
          <ul className="space-y-2">
            {slides.map((s) => (
              <li key={s.id} className="flex items-center justify-between border-b py-3 last:border-0 hover:bg-gray-50 px-2 rounded transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-20 h-12 rounded overflow-hidden bg-gray-100 border">
                    {s.type === 'video' ? (
                      <video src={s.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={s.url} alt={s.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-medium">{s.title || 'Untitled'}</h3>
                    <p className="text-gray-500 text-sm line-clamp-1">{s.subtitle}</p>
                    <p className="text-gray-400 text-xs">Order: {s.order ?? 0} • {s.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Edit"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
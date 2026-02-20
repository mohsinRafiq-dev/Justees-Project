import { useState, useEffect } from "react";

import { toast } from "react-hot-toast";
import { Plus, Trash2, Upload, X, Edit3, Image } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../contexts/ThemeContext";
import { isAdminUser } from "../../utils/validation";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import {
  getProductPhotos,
  addProductPhoto,
  updateProductPhoto,
  deleteProductPhoto,
} from "../../services/productPhotos.service";
import { uploadSlideMedia } from "../../services/storage/upload";

const ProductPhotosManagement = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    order: 0,
    isVisible: true,
    url: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [confirm, setConfirm] = useState({ open: false, id: null });

  useEffect(() => {
    if (!isAdminUser(user)) return;
    loadPhotos();
  }, [user]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const res = await getProductPhotos({ limitCount: 50 });
      if (res.success) setPhotos(res.photos);
      else toast.error(res.error || "Failed to load photos");
    } catch (err) {
      console.error(err);
      toast.error("Error loading photos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only images are allowed");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Image is too large (max ~5MB)");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setFormData((prev) => ({ ...prev, url: "" }));
  };

  const openModal = (photo = null) => {
    if (photo) {
      setEditingId(photo.id);
      setFormData({
        title: photo.title || "",
        order: photo.order || 0,
        isVisible: photo.isVisible ?? true,
        url: photo.url || "",
      });
      setPreviewUrl(photo.url || "");
    } else {
      setEditingId(null);
      setFormData({ title: "", order: 0, isVisible: true, url: "" });
      setPreviewUrl("");
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", order: 0, isVisible: true, url: "" });
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const handleSave = async () => {
    if (!selectedFile && !formData.url) {
      toast.error("Please provide an image");
      return;
    }

    try {
      setLoading(true);
      let mediaUrl = formData.url;
      if (selectedFile) {
        const uploadRes = await uploadSlideMedia(selectedFile);
        if (uploadRes.success) mediaUrl = uploadRes.data.url;
        else {
          toast.error("Upload failed: " + (uploadRes.error || ""));
          setLoading(false);
          return;
        }
      }

      const payload = {
        title: (formData.title || "").trim(),
        url: mediaUrl,
        order: Number(formData.order) || 0,
        isVisible: !!formData.isVisible,
      };

      let res;
      if (editingId) res = await updateProductPhoto(editingId, payload);
      else res = await addProductPhoto(payload);

      if (res.success) {
        toast.success(editingId ? "Photo updated" : "Photo added");
        closeModal();
        loadPhotos();
      } else {
        toast.error(res.error || "Failed to save photo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving photo");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => setConfirm({ open: true, id });
  const confirmDelete = async () => {
    const id = confirm.id;
    setConfirm({ open: false, id: null });
    try {
      const res = await deleteProductPhoto(id);
      if (res.success) {
        toast.success("Photo deleted");
        loadPhotos();
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting photo");
    }
  };

  if (!isAdminUser(user)) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-white"}`}
      >
        <div className="text-center">
          <h2
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Access Denied
          </h2>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2
            className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Product Page Photos Management
          </h2>
          <p
            className={`text-sm sm:text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Add and manage images that appear on the Products page
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photo</span>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl my-8 border`}
          >
            <div
              className={`sticky top-0 border-b px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl z-10 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <h3
                className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {editingId ? "Edit Photo" : "Add New Photo"}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Image
                </label>
                <div className="flex items-center justify-center w-full">
                  {previewUrl ? (
                    <div
                      className={`relative w-full h-48 rounded-lg overflow-hidden border ${isDark ? "border-gray-700" : "border-gray-200"}`}
                    >
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={clearFile}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label
                      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDark ? "border-gray-700 bg-gray-900/50 hover:bg-gray-900" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p
                          className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          Click to upload image
                        </p>
                        <p
                          className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                        >
                          Images (JPG/PNG/WebP) max 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Title{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  className={`w-full rounded-lg px-4 py-2 outline-none transition-all ${isDark ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50" : "bg-white border-gray-300 focus:ring-blue-500"} border focus:ring-2`}
                  placeholder="Short title (optional)"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`w-full rounded-lg px-4 py-2 outline-none transition-all ${isDark ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50" : "bg-white border-gray-300 focus:ring-blue-500"} border focus:ring-2`}
                    placeholder="0"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Visible
                  </label>
                  <div className="mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className={`rounded focus:ring-blue-500 ${isDark ? "bg-gray-900 border-gray-700 text-blue-500" : "border-gray-300 text-blue-600"}`}
                        checked={formData.isVisible}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isVisible: e.target.checked,
                          })
                        }
                      />
                      <span
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Show on products page
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`sticky bottom-0 border-t px-4 sm:px-6 py-3 sm:py-4 rounded-b-2xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className={`px-4 py-2 rounded-lg transition-colors ${isDark ? "text-gray-400 hover:bg-gray-700 hover:text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || (!formData.title.trim() && !previewUrl)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-70 transition-colors"
                >
                  {loading ? "Saving..." : editingId ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`rounded-xl shadow-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        {loading && !isModalOpen ? (
          <div className="p-12">
            <LoadingSpinner />
          </div>
        ) : photos.length === 0 ? (
          <div className="p-12 text-center">
            <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
              No photos found.
            </p>
          </div>
        ) : (
          <ul
            className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}
          >
            {photos.map((p) => (
              <li
                key={p.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 hover:bg-black/5 px-4 sm:px-6 transition-colors gap-3 sm:gap-0`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`w-28 h-16 rounded overflow-hidden border flex-shrink-0 ${isDark ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-200"}`}
                  >
                    <img
                      src={p.url}
                      alt={p.title || "Photo"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium truncate ${isDark ? "text-gray-100" : "text-gray-900"}`}
                    >
                      {p.title || "Untitled"}
                    </h3>
                    <p
                      className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Order: {p.order ?? 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => openModal(p)}
                    className={`p-2 rounded-full transition-colors ${isDark ? "text-blue-400 hover:bg-blue-500/10" : "text-blue-600 hover:bg-blue-50"}`}
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className={`p-2 rounded-full transition-colors ${isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"}`}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirm.open}
        title="Delete Photo"
        message="Are you sure you want to delete this photo?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </div>
  );
};

export default ProductPhotosManagement;

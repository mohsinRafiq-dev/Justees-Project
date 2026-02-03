import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isAdminUser } from '../../utils/validation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getSizes,
  createSize,
  deleteSize,
  getColors,
  createColor,
  deleteColor,
} from '../../services/products.service';

const SizesManagement = () => {
  const { user } = useAuth();
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null, type: null });

  useEffect(() => {
    if (!isAdminUser(user)) return;
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sizesRes, colorsRes] = await Promise.all([getSizes(), getColors()]);
      if (sizesRes.success) setSizes(sizesRes.sizes);
      if (colorsRes.success) setColors(colorsRes.colors);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sizes/colors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSize = async () => {
    if (!newSize.trim()) return;
    try {
      const res = await createSize(newSize.trim());
      if (res.success) {
        toast.success('Size added');
        setNewSize('');
        loadAll();
      } else toast.error(res.error || 'Failed to add size');
    } catch (err) {
      console.error(err);
      toast.error('Error adding size');
    }
  };

  const handleAddColor = async () => {
    if (!newColor.trim()) return;
    try {
      const res = await createColor(newColor.trim());
      if (res.success) {
        toast.success('Color added');
        setNewColor('');
        loadAll();
      } else toast.error(res.error || 'Failed to add color');
    } catch (err) {
      console.error(err);
      toast.error('Error adding color');
    }
  };

  const handleDelete = (id, type) => {
    setConfirm({ open: true, id, type });
  };

  const confirmDelete = async () => {
    const { id, type } = confirm;
    setConfirm({ open: false, id: null, type: null });
    try {
      let res;
      if (type === 'size') res = await deleteSize(id);
      else res = await deleteColor(id);

      if (res.success) {
        toast.success('Deleted');
        loadAll();
      } else toast.error(res.error || 'Failed to delete');
    } catch (err) {
      console.error(err);
      toast.error('Error deleting');
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sizes & Colors</h2>
        <p className="text-gray-600">Manage product sizes and available colors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Sizes</h3>
            <div className="flex items-center space-x-2">
              <input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="e.g. XS"
              />
              <button onClick={handleAddSize} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center space-x-2">
                <Plus className="w-4 h-4" /> <span>Add</span>
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : sizes.length === 0 ? (
            <p className="text-gray-600">No sizes defined.</p>
          ) : (
            <ul className="space-y-2">
              {sizes.map((s) => (
                <li key={s.id} className="flex items-center justify-between border-b py-2">
                  <span>{s.name}</span>
                  <button onClick={() => handleDelete(s.id, 'size')} className="text-red-600 flex items-center">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Colors</h3>
            <div className="flex items-center space-x-2">
              <input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="e.g. Burgundy"
              />
              <button onClick={handleAddColor} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center space-x-2">
                <Plus className="w-4 h-4" /> <span>Add</span>
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : colors.length === 0 ? (
            <p className="text-gray-600">No colors defined.</p>
          ) : (
            <ul className="space-y-2">
              {colors.map((c) => (
                <li key={c.id} className="flex items-center justify-between border-b py-2">
                  <span>{c.name}</span>
                  <button onClick={() => handleDelete(c.id, 'color')} className="text-red-600 flex items-center">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm.open}
        title="Confirm Delete"
        message="Are you sure you want to delete this item?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, id: null, type: null })}
      />
    </div>
  );
};

export default SizesManagement;

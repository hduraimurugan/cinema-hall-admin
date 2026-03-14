import { useState, useEffect } from 'react';
import { Megaphone, Plus, Pencil, Trash2, MousePointerClick, X, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { adsAPI } from '../services/api';

const EMPTY_FORM = {
  title: '',
  image_url: '',
  click_url: '',
  placement: 'banner',
  start_date: '',
  end_date: '',
  is_active: true,
};

const placementLabel = (p) => (p === 'banner' ? 'Banner' : 'Side');
const placementColor = (p) =>
  p === 'banner'
    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30';

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function AdsManagement() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  // Clicks modal
  const [clicksOpen, setClicksOpen] = useState(false);
  const [clicksAd, setClicksAd] = useState(null);
  const [clicks, setClicks] = useState([]);
  const [clicksLoading, setClicksLoading] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadAds = async () => {
    setLoading(true);
    try {
      const data = await adsAPI.getAll();
      setAds(data.ads);
    } catch (err) {
      toast.error(err.message || 'Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const openCreate = () => {
    setEditingAd(null);
    setFormData(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      image_url: ad.image_url,
      click_url: ad.click_url || '',
      placement: ad.placement,
      start_date: ad.start_date?.slice(0, 10) || '',
      end_date: ad.end_date?.slice(0, 10) || '',
      is_active: ad.is_active,
    });
    setFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingAd) {
        await adsAPI.update(editingAd.id, formData);
        toast.success('Ad updated');
      } else {
        await adsAPI.create(formData);
        toast.success('Ad created');
      }
      setFormOpen(false);
      loadAds();
    } catch (err) {
      toast.error(err.error || err.message || 'Failed to save ad');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adsAPI.delete(deleteTarget.id);
      toast.success('Ad deleted');
      setDeleteTarget(null);
      loadAds();
    } catch (err) {
      toast.error(err.message || 'Failed to delete ad');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openClicks = async (ad) => {
    setClicksAd(ad);
    setClicksOpen(true);
    setClicksLoading(true);
    try {
      const data = await adsAPI.getClicks(ad.id);
      setClicks(data.clicks);
    } catch (err) {
      toast.error(err.message || 'Failed to load clicks');
    } finally {
      setClicksLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Megaphone className="size-7 text-primary" />
            Ads Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage banner and sidebar advertisements
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          New Ad
        </Button>
      </div>

      {/* Ads Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card animate-pulse">
              <div className="h-40 bg-muted rounded-t-xl" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Megaphone className="size-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No ads yet. Create your first ad.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <div key={ad.id} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
              {/* Image preview */}
              <div className="relative h-40 bg-muted overflow-hidden">
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                {/* Placement badge */}
                <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${placementColor(ad.placement)}`}>
                  {placementLabel(ad.placement)}
                </span>
                {/* Active indicator */}
                <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${ad.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                  {ad.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div>
                  <h3 className="font-semibold text-foreground truncate">{ad.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(ad.start_date)} – {formatDate(ad.end_date)}
                  </p>
                  {ad.click_url && (
                    <a
                      href={ad.click_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 truncate"
                    >
                      <ExternalLink className="size-3 shrink-0" />
                      <span className="truncate">{ad.click_url}</span>
                    </a>
                  )}
                </div>

                {/* Click count */}
                <button
                  onClick={() => openClicks(ad)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                  <MousePointerClick className="size-4 text-primary" />
                  <span><strong className="text-foreground">{ad.click_count}</strong> click{ad.click_count !== 1 ? 's' : ''}</span>
                </button>

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => openEdit(ad)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                    onClick={() => setDeleteTarget(ad)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAd ? 'Edit Ad' : 'New Ad'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                required
                placeholder="Summer Sale"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Image URL *</label>
              <input
                name="image_url"
                value={formData.image_url}
                onChange={handleFormChange}
                required
                placeholder="https://example.com/banner.jpg"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="preview"
                  className="mt-2 h-24 w-full object-cover rounded-md border border-border"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Click-through URL</label>
              <input
                name="click_url"
                value={formData.click_url}
                onChange={handleFormChange}
                placeholder="https://example.com/offer"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Placement *</label>
              <select
                name="placement"
                value={formData.placement}
                onChange={handleFormChange}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="banner">Banner (Movies page carousel)</option>
                <option value="side">Side (Movie detail page sidebar)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">End Date *</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setFormData((p) => ({ ...p, is_active: !p.is_active }))}
                  className="relative"
                >
                  {formData.is_active
                    ? <ToggleRight className="size-8 text-primary cursor-pointer" />
                    : <ToggleLeft className="size-8 text-muted-foreground cursor-pointer" />
                  }
                </div>
                <span className="text-sm font-medium text-foreground">Active</span>
              </label>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : editingAd ? 'Save Changes' : 'Create Ad'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Ad</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            Are you sure you want to delete <strong className="text-foreground">"{deleteTarget?.title}"</strong>?
            This will also remove all click-through records.
          </p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Click-through Details Modal */}
      <Dialog open={clicksOpen} onOpenChange={setClicksOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MousePointerClick className="size-5 text-primary" />
              Click-throughs — {clicksAd?.title}
            </DialogTitle>
          </DialogHeader>

          {clicksLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : clicks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">No clicks recorded yet.</div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <p className="text-xs text-muted-foreground mb-3">{clicks.length} total click{clicks.length !== 1 ? 's' : ''}</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Customer</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Email</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Phone</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2">Clicked At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clicks.map((click) => (
                    <tr key={click.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-foreground">
                        {click.customer_name || <span className="text-muted-foreground italic">Anonymous</span>}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {click.customer_email || '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {click.customer_phone || '—'}
                      </td>
                      <td className="py-2.5 text-muted-foreground text-xs">
                        {formatDateTime(click.clicked_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

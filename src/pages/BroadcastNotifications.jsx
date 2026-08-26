import { useState, useEffect, useCallback } from 'react';
import { Send, Plus, Users, Building2, X, Clock, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { broadcastAPI, customersAPI, adminsAPI } from '../services/api';
import { uploadImageToCloudinary } from '../services/cloudinary';

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const EMPTY_FORM = {
  title: '',
  body: '',
  imageUrl: '',
  audienceType: 'all_customers',
  people: [],
  delivery: 'now',
  scheduledFor: '',
};

const AUDIENCE_CHOICES = [
  { value: 'all_customers', label: 'All customers', icon: Users },
  { value: 'all_admins', label: 'All admins', icon: Building2 },
  { value: 'custom', label: 'Pick people', icon: Plus },
];

const audienceLabel = (b) => {
  if (b.audience_type === 'all_customers') return 'All customers';
  if (b.audience_type === 'all_admins') return 'All admins';
  const n = (b.recipient_customer_ids?.length || 0) + (b.recipient_admin_ids?.length || 0);
  return `${n} ${n === 1 ? 'person' : 'people'}`;
};

const statusBadge = (status) => {
  if (status === 'sent') return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Sent</Badge>;
  if (status === 'scheduled') return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">Scheduled</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function BroadcastNotifications() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [peopleQuery, setPeopleQuery] = useState('');
  const [peopleResults, setPeopleResults] = useState([]);
  const [peopleSearching, setPeopleSearching] = useState(false);
  const [personDevices, setPersonDevices] = useState({}); // `${type}:${id}` -> { loading, tokens }
  const [expandedPerson, setExpandedPerson] = useState(null); // `${type}:${id}` currently expanded, or null

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadBroadcasts = async () => {
    setLoading(true);
    try {
      const data = await broadcastAPI.list();
      setBroadcasts(data.broadcasts);
    } catch (err) {
      toast.error(err.error || err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const openCreate = () => {
    setFormData(EMPTY_FORM);
    setPeopleQuery('');
    setPeopleResults([]);
    setPersonDevices({});
    setExpandedPerson(null);
    setFormOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImageToCloudinary(file);
      setFormData((prev) => ({ ...prev, imageUrl: result.url }));
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const searchPeople = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setPeopleResults([]);
        return;
      }
      setPeopleSearching(true);
      try {
        const [customersRes, adminsRes] = await Promise.all([
          customersAPI.getAll({ search: query, limit: 6 }),
          adminsAPI.getAll({ search: query, limit: 6 }),
        ]);
        setPeopleResults([
          ...customersRes.customers.map((c) => ({ type: 'customer', id: c.id, name: c.name, email: c.email })),
          ...adminsRes.admins.map((a) => ({ type: 'admin', id: a.id, name: a.name, email: a.email })),
        ]);
      } catch {
        // Search box — a failed lookup isn't worth a toast per keystroke.
      } finally {
        setPeopleSearching(false);
      }
    }, 400),
    []
  );

  const handlePeopleQueryChange = (e) => {
    const val = e.target.value;
    setPeopleQuery(val);
    searchPeople(val);
  };

  const addPerson = (person) => {
    setFormData((prev) =>
      prev.people.some((p) => p.type === person.type && p.id === person.id)
        ? prev
        : { ...prev, people: [...prev.people, { ...person, deviceTokenIds: null }] }
    );
    setPeopleQuery('');
    setPeopleResults([]);
  };

  const removePerson = (person) => {
    setFormData((prev) => ({
      ...prev,
      people: prev.people.filter((p) => !(p.type === person.type && p.id === person.id)),
    }));
  };

  // deviceTokenIds === null means "every device this person has registered"
  // (the default). Opening the picker loads their devices lazily, once.
  const toggleDevicePicker = async (person) => {
    const key = `${person.type}:${person.id}`;
    if (expandedPerson === key) {
      setExpandedPerson(null);
      return;
    }
    setExpandedPerson(key);
    if (personDevices[key]) return;

    setPersonDevices((prev) => ({ ...prev, [key]: { loading: true, tokens: [] } }));
    try {
      const data = await broadcastAPI.getDeviceTokens(person.type, person.id);
      setPersonDevices((prev) => ({ ...prev, [key]: { loading: false, tokens: data.tokens } }));
    } catch (err) {
      toast.error(err.error || err.message || 'Failed to load devices');
      setPersonDevices((prev) => ({ ...prev, [key]: { loading: false, tokens: [] } }));
    }
  };

  const toggleDeviceToken = (person, tokenId, allTokenIds) => {
    setFormData((prev) => ({
      ...prev,
      people: prev.people.map((p) => {
        if (p.type !== person.type || p.id !== person.id) return p;
        const current = p.deviceTokenIds === null ? allTokenIds : p.deviceTokenIds;
        const next = current.includes(tokenId) ? current.filter((id) => id !== tokenId) : [...current, tokenId];
        // Every device checked again collapses back to "all" (null).
        return { ...p, deviceTokenIds: next.length === allTokenIds.length ? null : next };
      }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.audienceType === 'custom' && formData.people.length === 0) {
      toast.error('Pick at least one person');
      return;
    }
    const emptyDeviceSelection = formData.people.find((p) => p.deviceTokenIds !== null && p.deviceTokenIds.length === 0);
    if (emptyDeviceSelection) {
      toast.error(`${emptyDeviceSelection.name} has no devices selected — pick at least one or remove them`);
      return;
    }
    if (formData.delivery === 'schedule' && !formData.scheduledFor) {
      toast.error('Choose a date and time to schedule for');
      return;
    }

    setFormLoading(true);
    try {
      const deviceTokenFilter = {};
      formData.people.forEach((p) => {
        if (p.deviceTokenIds !== null) deviceTokenFilter[`${p.type}:${p.id}`] = p.deviceTokenIds;
      });

      const payload = {
        title: formData.title,
        body: formData.body,
        imageUrl: formData.imageUrl || undefined,
        audienceType: formData.audienceType,
        customerIds: formData.people.filter((p) => p.type === 'customer').map((p) => p.id),
        adminIds: formData.people.filter((p) => p.type === 'admin').map((p) => p.id),
        deviceTokenFilter,
        scheduledFor: formData.delivery === 'schedule' ? new Date(formData.scheduledFor).toISOString() : undefined,
      };
      const data = await broadcastAPI.create(payload);
      if (data.broadcast.status === 'sent') {
        toast.success(`Sent — ${data.broadcast.sent_count} delivered, ${data.broadcast.failed_count} failed`);
      } else {
        toast.success(`Scheduled for ${formatDateTime(data.broadcast.scheduled_for)}`);
      }
      setFormOpen(false);
      loadBroadcasts();
    } catch (err) {
      toast.error(err.error || err.message || 'Failed to send notification');
    } finally {
      setFormLoading(false);
    }
  };

  const openDetail = async (broadcast) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const data = await broadcastAPI.get(broadcast.id);
      setDetail(data);
    } catch (err) {
      toast.error(err.error || err.message || 'Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Send className="size-7 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Compose and send push notifications to customers and admins
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          New Notification
        </Button>
      </div>

      {/* History table */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
          <div className="h-10 bg-muted" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-muted/50 border-t border-border" />
          ))}
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Send className="size-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No notifications sent yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">Title</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">Audience</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">Delivered / Failed</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">When</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openDetail(b)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-[160px]">
                        {b.image_url && (
                          <img
                            src={b.image_url}
                            alt=""
                            className="size-10 rounded-md object-cover border border-border shrink-0 bg-muted"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-foreground line-clamp-1">{b.title}</p>
                          {b.body && <p className="text-xs text-muted-foreground line-clamp-1">{b.body}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{audienceLabel(b)}</td>
                    <td className="px-4 py-3">{statusBadge(b.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-green-500 font-medium">{b.sent_count}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-destructive font-medium">{b.failed_count}</span>
                      <span className="text-muted-foreground"> of {b.target_count}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {b.status === 'scheduled' ? formatDateTime(b.scheduled_for) : formatDateTime(b.sent_at || b.created_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{b.created_by_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent side="right" className="sm:max-w-xl overflow-hidden flex flex-col p-0" overlayClassName="backdrop-blur-sm">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>New Notification</SheetTitle>
            <SheetDescription>Compose a push notification and choose who receives it.</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto flex-1 px-6 py-4">
            <form id="broadcast-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  required
                  placeholder="New movie added!"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Message *</label>
                <Textarea
                  value={formData.body}
                  onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
                  required
                  rows={3}
                  placeholder="Check out the latest release now showing..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Image</label>
                <div className="flex items-center gap-2">
                  <input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="Paste an image URL, or upload one"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <label className={`shrink-0 rounded-md border border-input px-3 py-2 text-sm font-medium cursor-pointer hover:bg-muted/60 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                    {uploading ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  </label>
                </div>
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="preview"
                    className="mt-2 h-28 w-full object-cover rounded-md border border-border"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Audience *</label>
                <div className="grid grid-cols-3 gap-2">
                  {AUDIENCE_CHOICES.map(({ value, label, icon }) => {
                    const Icon = icon
                    return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setFormData((p) => ({ ...p, audienceType: value }))}
                      className={`flex flex-col items-center gap-1.5 rounded-md border px-2 py-3 text-xs font-medium transition-colors ${
                        formData.audienceType === value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input text-muted-foreground hover:bg-muted/60'
                      }`}
                    >
                      <Icon className="size-4" />
                      {label}
                    </button>
                    )
                  })}
                </div>

                {formData.audienceType === 'custom' && (
                  <div className="mt-3 relative">
                    <input
                      value={peopleQuery}
                      onChange={handlePeopleQueryChange}
                      placeholder="Search customers or admins by name/email..."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {peopleQuery.trim() && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-56 overflow-y-auto">
                        {peopleSearching ? (
                          <p className="px-3 py-2 text-xs text-muted-foreground">Searching...</p>
                        ) : peopleResults.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>
                        ) : (
                          peopleResults.map((person) => (
                            <button
                              type="button"
                              key={`${person.type}-${person.id}`}
                              onClick={() => addPerson(person)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 flex items-center justify-between gap-2"
                            >
                              <span className="truncate">
                                <span className="font-medium text-foreground">{person.name}</span>
                                <span className="text-muted-foreground"> · {person.email}</span>
                              </span>
                              <Badge variant="outline" className="shrink-0 capitalize">{person.type}</Badge>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {formData.people.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.people.map((person) => {
                          const key = `${person.type}:${person.id}`;
                          const devState = personDevices[key];
                          const isExpanded = expandedPerson === key;
                          const selectedCount = person.deviceTokenIds === null ? null : person.deviceTokenIds.length;

                          return (
                            <div key={key} className="rounded-md border border-border overflow-hidden">
                              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/30">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{person.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{person.email}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge variant="outline" className="capitalize">{person.type}</Badge>
                                  <button
                                    type="button"
                                    onClick={() => toggleDevicePicker(person)}
                                    className="text-xs text-primary hover:underline whitespace-nowrap"
                                  >
                                    {selectedCount === null ? 'All devices' : `${selectedCount} device${selectedCount === 1 ? '' : 's'}`}
                                  </button>
                                  <button type="button" onClick={() => removePerson(person)} className="text-muted-foreground hover:text-destructive">
                                    <X className="size-3.5" />
                                  </button>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-3 py-2 border-t border-border space-y-1.5">
                                  {devState?.loading ? (
                                    <p className="text-xs text-muted-foreground">Loading devices...</p>
                                  ) : !devState || devState.tokens.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No registered devices — they haven't enabled push yet.</p>
                                  ) : (
                                    devState.tokens.map((t) => {
                                      const allIds = devState.tokens.map((x) => x.id);
                                      const checked = person.deviceTokenIds === null || person.deviceTokenIds.includes(t.id);
                                      return (
                                        <label key={t.id} className="flex items-center gap-2 text-xs cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleDeviceToken(person, t.id, allIds)}
                                            className="accent-primary"
                                          />
                                          <span className="font-medium text-foreground capitalize">{t.platform}</span>
                                          <span className="text-muted-foreground">· last seen {formatDateTime(t.last_seen_at)}</span>
                                        </label>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Delivery *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, delivery: 'now' }))}
                    className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                      formData.delivery === 'now' ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Zap className="size-4" />
                    Send Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, delivery: 'schedule' }))}
                    className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                      formData.delivery === 'schedule' ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Clock className="size-4" />
                    Schedule
                  </button>
                </div>
                {formData.delivery === 'schedule' && (
                  <input
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData((p) => ({ ...p, scheduledFor: e.target.value }))}
                    required
                    className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              </div>
            </form>
          </div>
          <div className="shrink-0 border-t px-6 py-4 flex justify-end gap-3">
            <Button type="button" variant="outline" className="min-w-[100px]" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" form="broadcast-form" className="min-w-[140px]" disabled={formLoading || uploading}>
              {formLoading ? 'Sending...' : formData.delivery === 'schedule' ? 'Schedule Notification' : 'Send Now'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl md:min-w-2xl min-w-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="size-5 text-primary" />
              {detail?.broadcast?.title || 'Notification'}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : !detail ? null : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                {statusBadge(detail.broadcast.status)}
                <span>{audienceLabel(detail.broadcast)}</span>
                <span>·</span>
                <span>{detail.broadcast.sent_count} delivered, {detail.broadcast.failed_count} failed of {detail.broadcast.target_count}</span>
              </div>
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Recipient</th>
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Channel</th>
                      <th className="text-left text-xs font-medium text-muted-foreground pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {detail.recipients.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-muted-foreground text-xs">No dispatch records yet.</td>
                      </tr>
                    ) : (
                      detail.recipients.map((r) => (
                        <tr key={r.id}>
                          <td className="py-2.5 pr-4">
                            <p className="font-medium text-foreground">{r.recipient_name || '—'}</p>
                            <p className="text-xs text-muted-foreground">{r.recipient_email}</p>
                          </td>
                          <td className="py-2.5 pr-4 text-muted-foreground capitalize">{r.channel}</td>
                          <td className="py-2.5">
                            {r.status === 'sent' || r.status === 'delivered' ? (
                              <span className="inline-flex items-center gap-1 text-green-500"><CheckCircle2 className="size-3.5" /> {r.status}</span>
                            ) : r.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 text-destructive" title={r.error}><XCircle className="size-3.5" /> failed</span>
                            ) : (
                              <span className="text-muted-foreground">{r.status}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

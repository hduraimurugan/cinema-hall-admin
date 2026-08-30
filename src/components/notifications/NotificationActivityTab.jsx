import { useState, useEffect, useCallback } from 'react';
import { Radio, Tag, Megaphone as MegaphoneIcon, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { broadcastAPI } from '../../services/api';

const EVENT_OPTIONS = [
  { value: 'all', label: 'All events' },
  { value: 'booking_confirmed', label: 'Booking confirmed' },
  { value: 'booking_cancelled', label: 'Booking cancelled' },
  { value: 'refund_initiated', label: 'Refund initiated' },
  { value: 'refund_settled', label: 'Refund settled' },
  { value: 'refund_failed', label: 'Refund failed' },
  { value: 'show_cancelled', label: 'Show cancelled' },
  { value: 'show_reminder', label: 'Show reminder' },
  { value: 'security_alert', label: 'Security alert' },
  { value: 'team_role_changed', label: 'Team role changed' },
  { value: 'team_removed', label: 'Team removed' },
  { value: 'team_invite_accepted', label: 'Team invite accepted' },
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All sources' },
  { value: 'offer', label: 'Offers' },
  { value: 'ad', label: 'Ads' },
  { value: 'event', label: 'Events' },
];

const kindIcon = (row) => {
  if (row.source === 'offer') return <Tag className="size-4 text-violet-400" />;
  if (row.source === 'ad') return <MegaphoneIcon className="size-4 text-primary" />;
  return <Bell className="size-4 text-sky-400" />;
};

const statusBadge = (status) => {
  if (status === 'sent') return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Sent</Badge>;
  if (status === 'failed') return <Badge className="bg-destructive/20 text-destructive border border-destructive/30">Failed</Badge>;
  if (status === 'queued' || status === 'scheduled') return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">{status}</Badge>;
  if (status === 'in_app_only') return <Badge variant="outline">In-app only</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function NotificationActivityTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('all');
  const [event, setEvent] = useState('all');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await broadcastAPI.activity({ source, event: event === 'all' ? undefined : event });
      setRows(data.activity || []);
    } catch (err) {
      toast.error(err.error || err.message || 'Failed to load notification activity');
    } finally {
      setLoading(false);
    }
  }, [source, event]);

  useEffect(() => { load(); }, [load]);

  const openRow = async (row) => {
    if (row.kind === 'broadcast') {
      setDetailOpen(true);
      setDetail(null);
      setDetailLoading(true);
      try {
        const data = await broadcastAPI.get(row.origin_id);
        setDetail(data);
      } catch (err) {
        toast.error(err.error || err.message || 'Failed to load details');
      } finally {
        setDetailLoading(false);
      }
      return;
    }
    // Event rows already carry everything we show — no extra fetch needed.
    setDetail({ eventRow: row });
    setDetailOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={event} onValueChange={setEvent}>
          <SelectTrigger className="w-48 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
          <div className="h-10 bg-muted" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-muted/50 border-t border-border" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Radio className="size-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No system-triggered notifications yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">Notification</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">Trigger</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">Recipient(s)</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">Channels</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={`${row.kind}-${row.id}`} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openRow(row)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[160px]">
                        {kindIcon(row)}
                        <div className="min-w-0">
                          <p className="font-medium text-foreground line-clamp-1">{row.title}</p>
                          {row.body && <p className="text-xs text-muted-foreground line-clamp-1">{row.body}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">{row.event.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{row.recipient_label}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs capitalize whitespace-nowrap">
                      {(row.channels || []).map((c) => c.replace('_', '-')).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">{statusBadge(row.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDateTime(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl md:min-w-2xl min-w-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="size-5 text-primary" />
              {detail?.broadcast?.title || detail?.eventRow?.title || 'Notification'}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : !detail ? null : detail.eventRow ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">{detail.eventRow.body}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-muted-foreground">Recipient: </span><span className="text-foreground">{detail.eventRow.recipient_label}</span></div>
                <div><span className="text-muted-foreground">Status: </span>{statusBadge(detail.eventRow.status)}</div>
                <div><span className="text-muted-foreground">Channels: </span><span className="text-foreground capitalize">{(detail.eventRow.channels || []).join(', ')}</span></div>
                <div><span className="text-muted-foreground">When: </span><span className="text-foreground">{formatDateTime(detail.eventRow.created_at)}</span></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                {statusBadge(detail.broadcast.status)}
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
                      <tr><td colSpan={3} className="py-6 text-center text-muted-foreground text-xs">No dispatch records yet.</td></tr>
                    ) : (
                      detail.recipients.map((r) => (
                        <tr key={r.id}>
                          <td className="py-2.5 pr-4">
                            <p className="font-medium text-foreground">{r.recipient_name || '—'}</p>
                            <p className="text-xs text-muted-foreground">{r.recipient_email}</p>
                          </td>
                          <td className="py-2.5 pr-4 text-muted-foreground capitalize">{r.channel}</td>
                          <td className="py-2.5">{statusBadge(r.status)}</td>
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

import { Megaphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import ChannelPicker from './ChannelPicker';

// Shared "Notify users" block used by the offer create form, the ad create
// sheet, and the standalone Announce sheet on both list pages — keeping the
// three in lockstep instead of three near-duplicate forms.
//
// `value` shape: { enabled: boolean, channels: string[], title: string, body: string }
// `channels` only ever carries push/email — in-app is implicit, see ChannelPicker.
export default function NotifyBlock({ value, onChange, audienceLabel, titlePlaceholder, bodyPlaceholder, className = '' }) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="size-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Notify users</span>
        </div>
        <Switch checked={value.enabled} onCheckedChange={(enabled) => set({ enabled })} />
      </div>

      {value.enabled && (
        <div className="mt-4 space-y-4">
          {audienceLabel && (
            <p className="text-xs text-muted-foreground">
              Sends to <span className="font-medium text-foreground">{audienceLabel}</span>
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Channels</label>
            <ChannelPicker value={value.channels} onChange={(channels) => set({ channels })} />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Title (optional)</label>
            <input
              value={value.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder={titlePlaceholder || 'Auto-generated if left blank'}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Message (optional)</label>
            <Textarea
              value={value.body}
              onChange={(e) => set({ body: e.target.value })}
              rows={2}
              placeholder={bodyPlaceholder || 'Auto-generated if left blank'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export const EMPTY_NOTIFY = { enabled: false, channels: ['push', 'email'], title: '', body: '' };

// Trims the empty-string overrides down to the { enabled, channels, title?, body? }
// shape offers.Controller.js / ads.Controller.js / broadcastAPI expect.
export function notifyPayload(value) {
  if (!value.enabled) return { enabled: false };
  return {
    enabled: true,
    channels: value.channels,
    title: value.title.trim() || undefined,
    body: value.body.trim() || undefined,
  };
}

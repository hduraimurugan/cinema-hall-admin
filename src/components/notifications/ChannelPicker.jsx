import { Smartphone, Bell, Mail } from 'lucide-react';

// In-app is implicit and always fires (an admin_broadcasts row always writes
// a `notifications` row for every recipient — see sendBroadcastNow in the
// API), so it renders selected-and-disabled rather than as a real choice.
// `value` only ever carries the external channels (push/email) — see
// broadcastAPI.create / offersAPI.create / adsAPI.create callers.
const CHANNELS = [
  { value: 'in_app', label: 'In-app', icon: Bell, always: true },
  { value: 'push', label: 'Push', icon: Smartphone },
  { value: 'email', label: 'Email', icon: Mail },
];

export default function ChannelPicker({ value, onChange, className = '' }) {
  const toggle = (channel) => {
    if (channel.always) return;
    const next = value.includes(channel.value)
      ? value.filter((c) => c !== channel.value)
      : [...value, channel.value];
    onChange(next);
  };

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {CHANNELS.map((channel) => {
        const Icon = channel.icon;
        const active = channel.always || value.includes(channel.value);
        return (
          <button
            type="button"
            key={channel.value}
            onClick={() => toggle(channel)}
            disabled={channel.always}
            title={channel.always ? 'Always sent' : undefined}
            className={`flex flex-col items-center gap-1.5 rounded-md border px-2 py-3 text-xs font-medium transition-colors ${
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input text-muted-foreground hover:bg-muted/60'
            } ${channel.always ? 'cursor-default opacity-80' : ''}`}
          >
            <Icon className="size-4" />
            {channel.label}
            {channel.always && <span className="text-[10px] text-muted-foreground">always</span>}
          </button>
        );
      })}
    </div>
  );
}

import { SystemSettings } from '@/components/system-settings';

export function SystemSettingsPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        <SystemSettings />
      </div>
    </div>
  );
}

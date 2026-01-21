import { SystemSettings } from '@/components/system-settings';

export function SystemSettingsPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 pt-20 space-y-6">
        <SystemSettings />
      </div>
    </div>
  );
}

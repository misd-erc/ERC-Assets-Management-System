import { SystemSettings } from '@/components/system-settings';

export function SystemSettingsPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-2 pt-5 md:pt-20 space-y-6">
        <SystemSettings />
      </div>
    </div>
  );
}

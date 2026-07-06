import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const HEALTH_ENDPOINT = `${API_BASE_URL}/SystemStatus/system-environment`;
const CHECK_INTERVAL_MS = 90_000; // every 1-2 minutes

async function isCloudVerificationShowing(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_ENDPOINT, { cache: 'no-store' });

    // Cloudflare's interstitial (or a CORS/network failure caused by it sitting in front of
    // the API) can surface as a non-2xx status, a rejected fetch, or an HTML body instead of
    // the plain JSON the backend normally returns. Any of these means the backend isn't
    // actually reachable right now, so treat all of them as "needs a refresh".
    if (!res.ok) return true;

    const text = await res.text();
    try {
      JSON.parse(text);
      return false;
    } catch {
      return true;
    }
  } catch {
    // fetch() itself rejected — network error, CORS block, connection reset, etc.
    return true;
  }
}

/**
 * Pings the backend every 1-2 minutes. If the response turns out to be Cloudflare's
 * bot-verification interstitial instead of the real API response, the user has no way
 * of knowing the site went stale (every API call will just keep failing) — so we pop up
 * a blocking modal telling them to refresh, which lets Cloudflare complete its check.
 */
export function CloudVerificationWatcher() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const blocked = await isCloudVerificationShowing();
      if (cancelled) return;
      setShowModal(blocked);
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="size-5" />
            Please refresh the page
          </DialogTitle>
          <DialogDescription>
            The cloud provider's security check is blocking the connection to the server.
            The site will keep erroring out until it's refreshed. Please refresh the page
            to complete verification and get things working again.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-2">
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="size-4" />
            Refresh Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

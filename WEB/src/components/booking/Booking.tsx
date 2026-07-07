import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Package, HardHat, Boxes } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { PendingItemsList, PendingItemsListRef } from './PendingItemsList';
import { getBookingStatistics } from '@/api/booking/bookingApi';
import { BookingStatistics } from '@/types/booking';

// Consume a pending notification deep-link (from an "IAR approved" click) to open the matching tab.
const getInitialTab = (): string => {
  const raw = sessionStorage.getItem('_notifNav');
  if (!raw) return 'supply';
  sessionStorage.removeItem('_notifNav');
  try {
    const parsed = JSON.parse(raw);
    return ['supply', 'ppe', 'se'].includes(parsed.tab) ? parsed.tab : 'supply';
  } catch {
    return 'supply';
  }
};

export function Booking() {
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const supplyListRef = useRef<PendingItemsListRef>(null);
  const ppeListRef = useRef<PendingItemsListRef>(null);
  const seListRef = useRef<PendingItemsListRef>(null);

  const [statistics, setStatistics] = useState<BookingStatistics>({
    pendingSupply: 0,
    pendingPPE: 0,
    pendingSE: 0,
    totalPending: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStatistics = async () => {
    try {
      setStatsLoading(true);
      const stats = await getBookingStatistics();
      setStatistics(stats);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const handleBooked = () => {
    loadStatistics();
    supplyListRef.current?.reload();
    ppeListRef.current?.reload();
    seListRef.current?.reload();
  };

  return (
    <div className="p-2 pt-5 md:pt-20 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl">Asset Booking</h1>
        <p className="text-sm text-muted-foreground">
          Review items staged from approved IARs and book them into Supply, PPE, or SE asset records
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending Supply</p>
                <p className="text-lg sm:text-2xl mt-1">{statsLoading ? '...' : statistics.pendingSupply}</p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending PPE</p>
                <p className="text-lg sm:text-2xl mt-1">{statsLoading ? '...' : statistics.pendingPPE}</p>
              </div>
              <HardHat className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending SE</p>
                <p className="text-lg sm:text-2xl mt-1">{statsLoading ? '...' : statistics.pendingSE}</p>
              </div>
              <Boxes className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Pending</p>
                <p className="text-lg sm:text-2xl mt-1">{statsLoading ? '...' : statistics.totalPending}</p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Bookings</CardTitle>
          <CardDescription>
            Items are staged here once their IAR is approved. Book each item to finalize it into the main asset records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="supply">Supply</TabsTrigger>
              <TabsTrigger value="ppe">PPE</TabsTrigger>
              <TabsTrigger value="se">SE</TabsTrigger>
            </TabsList>

            <TabsContent value="supply" className="space-y-4">
              <PendingItemsList ref={supplyListRef} group="Supply" onBooked={handleBooked} />
            </TabsContent>

            <TabsContent value="ppe" className="space-y-4">
              <PendingItemsList ref={ppeListRef} group="PPE" onBooked={handleBooked} />
            </TabsContent>

            <TabsContent value="se" className="space-y-4">
              <PendingItemsList ref={seListRef} group="SE" onBooked={handleBooked} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

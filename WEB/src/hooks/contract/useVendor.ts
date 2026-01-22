import { useVendorStore } from "@/store/contract";

export const useVendor = () => {
  const store = useVendorStore();
  const totalVendors = store.vendors.length;
  return { ...store, totalVendors };
};



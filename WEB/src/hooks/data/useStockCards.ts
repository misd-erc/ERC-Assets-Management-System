import { useEffect } from 'react';
import { useSupplyStore } from '@/store/supply/useSupplyStore';
import * as svc from '@/api/supply/stockCardApi';

/**
 * Loads stock card entries from backend into store.
 */
export const useStockCards = () => {
  const { stockCards, setStockCards, addStockCard } = useSupplyStore();

  useEffect(() => {
    (async () => {
      try {
        const data = await svc.getStockCards();
        setStockCards(data);
      } catch (err) {
        console.warn('useStockCards: failed to load', err);
        setStockCards([]);
      }
    })();
  }, [setStockCards]);

  const createEntry = async (payload: Partial<any>) => {
    try {
      const created = await svc.createStockCardEntry(payload);
      addStockCard(created);
      return created;
    } catch (err) {
      console.warn('createEntry fallback', err);
      return null;
    }
  };

  return { stockCards, createEntry };
};


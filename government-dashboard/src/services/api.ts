import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { isDemoMode } from '../utils/demoMode';

export const api = {
  getDashboardStats: async () => {
    try {
      const fn = httpsCallable(functions, 'getDashboardStats');
      const res = await fn();
      if (!res.data || (res.data as any).totalBags === 0) throw new Error('No data');
      return res;
    } catch (e) {
      if (!isDemoMode()) throw e;
      console.warn('Using mock dashboard stats');
      return {
        data: {
          totalBags: 12500,
          redeemed: 8450,
          dispatched: 11200,
          inStock: 1300,
          flagged: 12,
          totalFarmers: 5400,
          activeDistributions: 4,
          redemptionRate: 75
        }
      };
    }
  },

  getDistrictsSummary: async () => {
    try {
      const fn = httpsCallable(functions, 'getDistrictsSummary');
      const res = await fn();
      if (!res.data || !(res.data as any).districts || (res.data as any).districts.length === 0) throw new Error('No data');
      return res;
    } catch (e) {
      if (!isDemoMode()) throw e;
      console.warn('Using mock districts summary');
      return {
        data: {
          districts: [
            { name: 'Harare', dispatched: 1500, redeemed: 1420, farmers: 680, gap: 80 },
            { name: 'Gweru', dispatched: 1200, redeemed: 980, farmers: 450, gap: 220 },
            { name: 'Mutare', dispatched: 2000, redeemed: 1850, farmers: 920, gap: 150 },
            { name: 'Masvingo', dispatched: 1800, redeemed: 1200, farmers: 580, gap: 600 },
            { name: 'Bulawayo', dispatched: 1100, redeemed: 1050, farmers: 510, gap: 50 },
            { name: 'Bindura', dispatched: 900, redeemed: 880, farmers: 410, gap: 20 },
            { name: 'Chinhoyi', dispatched: 1400, redeemed: 1100, farmers: 520, gap: 300 }
          ]
        }
      };
    }
  },

  getReconciliationReport: async (data: { district?: string; dateFrom?: string; dateTo?: string }) => {
    try {
      const fn = httpsCallable(functions, 'getReconciliationReport');
      return await fn(data);
    } catch (e) {
      if (!isDemoMode()) throw e;
      return {
        data: {
          summary: {
            totalBags: 5000,
            totalDispatched: 4500,
            totalRedeemed: 3800,
            totalFlagged: 5,
            uniqueFarmers: 1200,
            outstandingForPayment: 3800,
            unreturnedBags: 700,
            redemptionRate: 84
          },
          varietyBreakdown: [
            { variety: 'SC513', dispatched: 2000, redeemed: 1800 },
            { variety: 'SC637', dispatched: 2500, redeemed: 2000 }
          ],
          houseBreakdown: [
            { seedHouse: 'Seed Co', dispatched: 3000, redeemed: 2600 },
            { seedHouse: 'Pannar', dispatched: 2000, redeemed: 1200 }
          ],
          unreturnedBags: [],
          distributions: [],
          generatedAt: new Date().toISOString(),
          district: data.district || 'all'
        }
      };
    }
  },

  getBagDetails: async (bagId: string) => {
    try {
      const fn = httpsCallable(functions, 'getBagDetails');
      const res = await fn({ bagId });
      if (!res.data) throw new Error('No data');
      return res;
    } catch (e) {
      if (!isDemoMode()) throw e;
      console.warn('Using mock bag details');
      return {
        data: {
          bag: {
            id: bagId || 'SC513-2026-0001',
            qrCodeData: `agrilogix://verify/${bagId || 'SC513-2026-0001'}`,
            variety: 'SC513',
            batchNumber: 'BATCH-2026-001',
            certificationId: 'CERT-ZW-2026-0451',
            seedHouse: 'Seed Co Zimbabwe',
            condition: 'redeemed',
            isAuthentic: true,
            dispatchedTo: 'Mutare',
            farmerPhone: '+263771234567',
            redemptionTimestamp: '2026-04-15T10:30:00Z',
            redemptionLocation: { latitude: -18.9707, longitude: 32.6711 },
            createdAt: '2026-03-01T08:00:00Z',
          },
          chainOfCustody: [
            { action: 'generated', timestamp: '2026-03-01T08:00:00Z', performedBy: 'Seed Co Zimbabwe', location: null, hashReference: 'a1b2c3d4e5f6' },
            { action: 'dispatched', timestamp: '2026-03-15T09:00:00Z', performedBy: 'warehouse-staff-01', location: null, hashReference: 'b2c3d4e5f6a1' },
            { action: 'redeemed', timestamp: '2026-04-15T10:30:00Z', performedBy: '+263771234567', location: { latitude: -18.9707, longitude: 32.6711 }, hashReference: 'c3d4e5f6a1b2' },
          ]
        }
      };
    }
  },

  getBagJourney: async (bagId: string) => {
    try {
      const fn = httpsCallable(functions, 'getBagJourney');
      const res = await fn({ bagId });
      if (!res.data) throw new Error('No data');
      return res;
    } catch (e) {
      if (!isDemoMode()) throw e;
      console.warn('Using mock bag journey');
      return {
        data: {
          bag: {
            id: bagId || 'SC513-2026-0001',
            qrCodeData: `agrilogix://verify/${bagId || 'SC513-2026-0001'}`,
            variety: 'SC513',
            batchNumber: 'BATCH-2026-001',
            certificationId: 'CERT-ZW-2026-0451',
            seedHouse: 'Seed Co Zimbabwe',
            condition: 'redeemed',
            isAuthentic: true,
            dispatchedTo: 'Mutare',
            farmerPhone: '+263771234567',
            redemptionTimestamp: '2026-04-15T10:30:00Z',
            redemptionLocation: { latitude: -18.9707, longitude: 32.6711 },
            createdAt: '2026-03-01T08:00:00Z',
          },
          chainOfCustody: [
            { action: 'generated', timestamp: '2026-03-01T08:00:00Z', performedBy: 'Seed Co Zimbabwe', location: null, hashReference: 'a1b2c3d4e5f6' },
            { action: 'dispatched', timestamp: '2026-03-15T09:00:00Z', performedBy: 'warehouse-staff-01', location: null, hashReference: 'b2c3d4e5f6a1' },
            { action: 'redeemed', timestamp: '2026-04-15T10:30:00Z', performedBy: '+263771234567', location: { latitude: -18.9707, longitude: 32.6711 }, hashReference: 'c3d4e5f6a1b2' },
          ]
        }
      };
    }
  },

  flagCounterfeit: async (data: { bagId: string; reason: string }) => {
    try {
      const fn = httpsCallable(functions, 'flagCounterfeitBag');
      return await fn(data);
    } catch (e) {
      if (!isDemoMode()) throw e;
      console.warn('Mock: bag flagged locally');
      return { data: { success: true, message: 'Bag flagged (demo mode)' } };
    }
  },
};

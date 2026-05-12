import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export const api = {
  getDashboardStats: () => {
    const fn = httpsCallable(functions, 'getDashboardStats');
    return fn();
  },

  getDistrictsSummary: () => {
    const fn = httpsCallable(functions, 'getDistrictsSummary');
    return fn();
  },

  getReconciliationReport: (data: { district?: string; dateFrom?: string; dateTo?: string }) => {
    const fn = httpsCallable(functions, 'getReconciliationReport');
    return fn(data);
  },

  getBagDetails: (bagId: string) => {
    const fn = httpsCallable(functions, 'getBagDetails');
    return fn({ bagId });
  },

  getBagJourney: (bagId: string) => {
    const fn = httpsCallable(functions, 'getBagJourney');
    return fn({ bagId });
  },

  flagCounterfeit: (data: { bagId: string; reason: string }) => {
    const fn = httpsCallable(functions, 'flagCounterfeitBag');
    return fn(data);
  },
};

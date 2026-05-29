import { ZIMBABWE_PROVINCES, DISTRICTS_BY_PROVINCE } from '../utils/zimbabwe';

describe('Zimbabwe data', () => {
  it('has all 10 provinces', () => {
    expect(ZIMBABWE_PROVINCES.length).toBe(10);
  });

  it('each province has districts', () => {
    ZIMBABWE_PROVINCES.forEach((province: string) => {
      expect(DISTRICTS_BY_PROVINCE[province].length).toBeGreaterThan(0);
    });
  });

  it('all district names are non-empty strings', () => {
    ZIMBABWE_PROVINCES.forEach((province: string) => {
      DISTRICTS_BY_PROVINCE[province].forEach((district: string) => {
        expect(typeof district).toBe('string');
        expect(district.length).toBeGreaterThan(0);
      });
    });
  });
});

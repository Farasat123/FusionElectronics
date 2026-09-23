import { formatShortNumber, formatPrice, USD_TO_PKR_RATE } from '../utils/currency';

describe('currency utility', () => {
  test('conversion rate is 280', () => {
    expect(USD_TO_PKR_RATE).toBe(280);
  });

  describe('formatShortNumber', () => {
    test('formats numbers under 1000 properly', () => {
      expect(formatShortNumber(0)).toBe('0');
      expect(formatShortNumber(280)).toBe('280');
      expect(formatShortNumber(500)).toBe('500');
    });

    test('formats 1000 as 1k', () => {
      expect(formatShortNumber(1000)).toBe('1k');
    });

    test('formats thousands with k suffix and 1 decimal when applicable', () => {
      expect(formatShortNumber(1200)).toBe('1.2k');
      expect(formatShortNumber(1500)).toBe('1.5k');
      expect(formatShortNumber(2800)).toBe('2.8k');
      expect(formatShortNumber(10000)).toBe('10k');
      expect(formatShortNumber(28000)).toBe('28k');
      expect(formatShortNumber(307720)).toBe('307.7k');
    });

    test('formats millions with m suffix', () => {
      expect(formatShortNumber(1000000)).toBe('1m');
      expect(formatShortNumber(1100000)).toBe('1.1m');
    });

    test('handles null, undefined, and NaN gracefully', () => {
      expect(formatShortNumber(null)).toBe('0');
      expect(formatShortNumber(undefined)).toBe('0');
      expect(formatShortNumber(NaN)).toBe('0');
    });
  });

  describe('formatPrice', () => {
    test('converts USD to PKR and formats in compact Rs', () => {
      // 1 USD = 280 PKR -> Rs 280
      expect(formatPrice(1)).toBe('Rs 280');

      // 10 USD = 2800 PKR -> Rs 2.8k
      expect(formatPrice(10)).toBe('Rs 2.8k');

      // 100 USD = 28000 PKR -> Rs 28k
      expect(formatPrice(100)).toBe('Rs 28k');

      // 1099 USD = 307720 PKR -> Rs 307.7k
      expect(formatPrice(1099)).toBe('Rs 307.7k');

      // 3799 USD = 1063720 PKR -> Rs 1.1m
      expect(formatPrice(3799)).toBe('Rs 1.1m');
    });

    test('handles 0 and empty/falsy prices', () => {
      expect(formatPrice(0)).toBe('Rs 0');
      expect(formatPrice(null)).toBe('Rs 0');
      expect(formatPrice(undefined)).toBe('Rs 0');
    });
  });
});

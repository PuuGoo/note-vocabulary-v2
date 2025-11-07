// =====================================================
// Test: Spaced Repetition Algorithm
// =====================================================

const { calculateNextReview } = require('../src/utils/spacedRepetition');

describe('Spaced Repetition Algorithm (SM-2)', () => {
  test('should calculate correct values for perfect recall (quality=5)', () => {
    const result = calculateNextReview(5, 2.5, 1, 0);

    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.efactor).toBeGreaterThan(2.5);
  });

  test('should calculate correct values for good recall (quality=4)', () => {
    const result = calculateNextReview(4, 2.5, 1, 1);

    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  test('should reset on failed recall (quality=0)', () => {
    const result = calculateNextReview(0, 2.5, 6, 2);

    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  test('should maintain minimum efactor of 1.3', () => {
    const result = calculateNextReview(0, 1.3, 1, 0);

    expect(result.efactor).toBeGreaterThanOrEqual(1.3);
  });

  test('should increase interval based on efactor after 2 repetitions', () => {
    const result = calculateNextReview(4, 2.5, 6, 2);

    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(Math.round(6 * 2.5));
  });
});

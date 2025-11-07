// =====================================================
// Spaced Repetition Algorithm (SM-2)
// =====================================================

/**
 * Calculate next review using SM-2 algorithm
 * @param {number} quality - Quality of recall (0-5)
 * @param {number} efactor - Current easiness factor
 * @param {number} interval - Current interval in days
 * @param {number} repetitions - Number of successful repetitions
 * @returns {object} Updated review data
 */
function calculateNextReview(quality, efactor, interval, repetitions) {
  // Quality: 0-5
  // 0-1: Total blackout, incorrect response
  // 2: Incorrect but familiar
  // 3: Correct but difficult
  // 4: Correct after hesitation
  // 5: Perfect response

  let newEfactor = efactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality >= 3) {
    // Correct response
    newRepetitions += 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * efactor);
    }
  } else {
    // Incorrect response - reset
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update easiness factor
  newEfactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Minimum efactor is 1.3
  if (newEfactor < 1.3) {
    newEfactor = 1.3;
  }

  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + newInterval);

  return {
    efactor: Math.round(newEfactor * 100) / 100,
    interval: newInterval,
    repetitions: newRepetitions,
    dueDate,
  };
}

module.exports = {
  calculateNextReview,
};

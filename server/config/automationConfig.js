/**
 * Centralized Automation Config for Smart Hive Monitoring & Quality Testing
 * Aligned with Section 3 and Section 4 of implementation_plan.md
 */
module.exports = {
  temperature: {
    min: 32,
    max: 36,
    criticalMin: 30,
    criticalMax: 38
  },
  humidity: {
    min: 40,
    max: 70
  },
  weightDropKgThreshold: 3, // kg drop within 24h considered abnormal
  activityLevels: ['LOW', 'NORMAL', 'HIGH'],
  healthScoreBands: {
    EXCELLENT: { min: 90, max: 100 },
    HEALTHY: { min: 75, max: 89 },
    WARNING: { min: 50, max: 74 },
    CRITICAL: { min: 0, max: 49 }
  },
  // Phase 6: Deterministic Quality Grading Thresholds
  qualityGradeThresholds: {
    A: { minPurity: 95 },
    B: { minPurity: 85 },
    C: { minPurity: 70 },
    D: { minPurity: 0 }
  }
};

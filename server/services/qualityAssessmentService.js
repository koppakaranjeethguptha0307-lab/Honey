/**
 * Rule-Based Quality Assessment Service
 * Performs deterministic, threshold-based quality evaluation on honey lab test data.
 * NOTE: This module uses deterministic rule-based algorithms. It is NOT an AI/ML model.
 */
const automationConfig = require('../config/automationConfig');

const assessQuality = ({ purity_pct, moisture_pct, adulteration_check }) => {
  const purity = Number(purity_pct);
  const moisture = Number(moisture_pct);
  const adulteration = String(adulteration_check || '').toUpperCase().trim();

  let quality_grade = 'D';
  let recommendation = 'REJECT';
  let explanation = '';

  if (adulteration === 'FAILED') {
    quality_grade = 'D';
    recommendation = 'REJECT';
    explanation = `Adulteration check FAILED; honey grade assigned D and strongly recommended for rejection. (Purity: ${purity}%, Moisture: ${moisture}%)`;
  } else {
    // Grade assignment based on purity
    if (purity >= automationConfig.qualityGradeThresholds.A.minPurity) {
      quality_grade = 'A';
    } else if (purity >= automationConfig.qualityGradeThresholds.B.minPurity) {
      quality_grade = 'B';
    } else if (purity >= automationConfig.qualityGradeThresholds.C.minPurity) {
      quality_grade = 'C';
    } else {
      quality_grade = 'D';
    }

    // Recommendation assignment based on grade
    if (quality_grade === 'A' || quality_grade === 'B') {
      recommendation = 'APPROVE';
      explanation = `Purity ${purity}% (Moisture ${moisture}%) and adulteration check PASSED indicate Grade ${quality_grade} honey; recommended for approval.`;
    } else {
      recommendation = 'REVIEW';
      explanation = `Purity ${purity}% (Moisture ${moisture}%) indicates Grade ${quality_grade} honey; manual review recommended before approval.`;
    }
  }

  return {
    quality_grade,
    recommendation,
    explanation
  };
};

module.exports = {
  assessQuality
};

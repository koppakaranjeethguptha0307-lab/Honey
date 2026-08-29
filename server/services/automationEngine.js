/**
 * Smart Rule-Based Hive Automation & Health Scoring Engine
 * Uses deterministic threshold evaluation based on server/config/automationConfig.js
 * NOTE: This is a deterministic rule-based engine, not a machine learning model.
 */

const automationConfig = require('../config/automationConfig');
const alertsRepository = require('../repositories/alertsRepository');

/**
 * Smart Rule-Based Hive Health Score Calculation
 * Computes a score (0-100), status, and human-readable explanation from sensor readings.
 */
const calculateHealthScore = (reading, previousReading24hAgo = null) => {
  let score = 100;
  const explanations = [];

  const temp = Number(reading.temp);
  const humidity = Number(reading.humidity);
  const weight = Number(reading.weight);
  const activity = reading.activity ? String(reading.activity).toUpperCase().trim() : 'NORMAL';

  // 1. Temperature Scoring
  if (temp < automationConfig.temperature.criticalMin || temp > automationConfig.temperature.criticalMax) {
    score -= 35;
    explanations.push(`Critical Temperature (${temp}°C outside ${automationConfig.temperature.criticalMin}-${automationConfig.temperature.criticalMax}°C)`);
  } else if (temp < automationConfig.temperature.min || temp > automationConfig.temperature.max) {
    score -= 15;
    explanations.push(`Temperature (${temp}°C outside safe range ${automationConfig.temperature.min}-${automationConfig.temperature.max}°C)`);
  }

  // 2. Humidity Scoring
  if (humidity < automationConfig.humidity.min || humidity > automationConfig.humidity.max) {
    score -= 15;
    explanations.push(`Humidity (${humidity}% outside optimal range ${automationConfig.humidity.min}-${automationConfig.humidity.max}%)`);
  }

  // 3. Activity Scoring
  if (activity === 'LOW') {
    score -= 20;
    explanations.push('Colony activity level is LOW');
  }

  // 4. Weight Drop Scoring (compared to ~24h ago)
  if (previousReading24hAgo && previousReading24hAgo.weight !== null && previousReading24hAgo.weight !== undefined) {
    const weightDrop = Number(previousReading24hAgo.weight) - weight;
    if (weightDrop > automationConfig.weightDropKgThreshold) {
      score -= 25;
      explanations.push(`Weight dropped by ${weightDrop.toFixed(1)}kg in 24h (> ${automationConfig.weightDropKgThreshold}kg threshold)`);
    }
  }

  // Clamp score between 0 and 100
  const health_score = Math.max(0, Math.min(100, Math.round(score)));

  // Determine health_status based on healthScoreBands
  let health_status = 'CRITICAL';
  if (health_score >= automationConfig.healthScoreBands.EXCELLENT.min) {
    health_status = 'EXCELLENT';
  } else if (health_score >= automationConfig.healthScoreBands.HEALTHY.min) {
    health_status = 'HEALTHY';
  } else if (health_score >= automationConfig.healthScoreBands.WARNING.min) {
    health_status = 'WARNING';
  }

  const health_explanation = explanations.length > 0
    ? explanations.join('; ')
    : 'All parameters within optimal range';

  return {
    health_score,
    health_status,
    health_explanation
  };
};

/**
 * Evaluates automation rules on a sensor reading and creates deduplicated alerts.
 */
const evaluateAutomationRules = (hiveId, farmId, reading, previousReading24hAgo = null) => {
  const triggeredRules = [];

  const temp = Number(reading.temp);
  const humidity = Number(reading.humidity);
  const activity = reading.activity ? String(reading.activity).toUpperCase().trim() : 'NORMAL';

  // RULE 1: Temperature
  if (temp < automationConfig.temperature.criticalMin || temp > automationConfig.temperature.criticalMax) {
    triggeredRules.push({
      alert_type: 'TEMP_CRITICAL',
      severity: 'CRITICAL',
      title: 'Critical Temperature Alert',
      message: `Hive temperature (${temp}°C) is in critical range (<${automationConfig.temperature.criticalMin}°C or >${automationConfig.temperature.criticalMax}°C)`
    });
  } else if (temp < automationConfig.temperature.min || temp > automationConfig.temperature.max) {
    triggeredRules.push({
      alert_type: 'TEMP_WARNING',
      severity: 'WARNING',
      title: 'Temperature Warning',
      message: `Hive temperature (${temp}°C) is outside safe range (${automationConfig.temperature.min}-${automationConfig.temperature.max}°C)`
    });
  }

  // RULE 2: Humidity
  if (humidity < automationConfig.humidity.min || humidity > automationConfig.humidity.max) {
    triggeredRules.push({
      alert_type: 'HUMIDITY_WARNING',
      severity: 'WARNING',
      title: 'Humidity Warning',
      message: `Hive humidity (${humidity}%) is outside optimal range (${automationConfig.humidity.min}-${automationConfig.humidity.max}%)`
    });
  }

  // RULE 3: Weight Drop (> 3kg in 24h)
  if (previousReading24hAgo && previousReading24hAgo.weight !== null && previousReading24hAgo.weight !== undefined) {
    const weightDrop = Number(previousReading24hAgo.weight) - Number(reading.weight);
    if (weightDrop > automationConfig.weightDropKgThreshold) {
      triggeredRules.push({
        alert_type: 'WEIGHT_DROP_WARNING',
        severity: 'WARNING',
        title: 'Sudden Weight Drop Warning',
        message: `Hive weight dropped by ${weightDrop.toFixed(1)}kg within 24h (threshold: ${automationConfig.weightDropKgThreshold}kg)`
      });
    }
  }

  // RULE 4: Activity LOW
  if (activity === 'LOW') {
    triggeredRules.push({
      alert_type: 'ACTIVITY_LOW_WARNING',
      severity: 'WARNING',
      title: 'Low Activity Warning',
      message: `Hive colony activity level is LOW`
    });
  }

  // RULE 5: Multi-rule escalation (if 2+ rules trigger simultaneously, escalate ALL to CRITICAL)
  if (triggeredRules.length >= 2) {
    triggeredRules.forEach(rule => {
      rule.severity = 'CRITICAL';
    });
  }

  // Deduplication & Alert Creation
  const alerts_created = [];
  for (const rule of triggeredRules) {
    const existingUnresolved = alertsRepository.findUnresolvedAlertByTypeAndHive(hiveId, rule.alert_type);
    if (!existingUnresolved) {
      const createdAlert = alertsRepository.createAlert({
        hive_id: hiveId,
        farm_id: farmId,
        alert_type: rule.alert_type,
        severity: rule.severity,
        title: rule.title,
        message: rule.message,
        is_read: 0,
        created_at: new Date().toISOString()
      });
      alerts_created.push(createdAlert);
    }
  }

  return { alerts_created };
};

module.exports = {
  calculateHealthScore,
  evaluateAutomationRules
};

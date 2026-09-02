const express = require('express');
const router = express.Router();
const alertsRepository = require('../repositories/alertsRepository');
const { authorizeRole } = require('../middleware/authMiddleware');

// GET /api/alerts - List all alerts (optional ?severity=&hive_id=&is_read=)
router.get('/', (req, res) => {
  try {
    const { severity, hive_id, is_read } = req.query;
    const alerts = alertsRepository.getAllAlerts({ severity, hive_id, is_read });
    return res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching alerts'
    });
  }
});

// PATCH /api/alerts/:id/read - Mark alert as read (Protected: beekeeper, admin)
router.patch('/:id/read', authorizeRole(['beekeeper', 'admin']), (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert ID'
      });
    }

    const updatedAlert = alertsRepository.markAlertRead(id);
    if (!updatedAlert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedAlert
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while marking alert as read'
    });
  }
});

// PATCH /api/alerts/:id/unread - Mark alert as unread (Protected: beekeeper, admin)
router.patch('/:id/unread', authorizeRole(['beekeeper', 'admin']), (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert ID'
      });
    }

    const updatedAlert = alertsRepository.markAlertUnread(id);
    if (!updatedAlert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedAlert
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while marking alert as unread'
    });
  }
});

module.exports = router;

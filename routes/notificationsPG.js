const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticateToken: auth } = require('../middleware/auth');

// Mock notification data - in a real app, this would be stored in a database
let notifications = [
  {
    id: '1',
    userId: '0251da17-ac8e-4801-a857-8c88be02d2a6', // Test user ID
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your booking at 123 Main Street has been confirmed for tomorrow at 2:00 PM.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    actionUrl: '/driver-dashboard?tab=bookings',
    actionText: 'View Booking',
    priority: 'high'
  },
  {
    id: '2',
    userId: '0251da17-ac8e-4801-a857-8c88be02d2a6',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $15.00 for your driveway rental at 456 Oak Avenue.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: false,
    actionUrl: '/owner-dashboard?tab=analytics',
    actionText: 'View Earnings',
    priority: 'medium'
  },
  {
    id: '3',
    userId: '0251da17-ac8e-4801-a857-8c88be02d2a6',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    read: true,
    priority: 'low'
  },
  {
    id: '4',
    userId: '0251da17-ac8e-4801-a857-8c88be02d2a6',
    type: 'warning',
    title: 'Booking Reminder',
    message: 'Your parking session at 789 Pine Street ends in 30 minutes.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    read: true,
    actionUrl: '/driver-dashboard?tab=bookings',
    actionText: 'Extend Booking',
    priority: 'high'
  },
  {
    id: '5',
    userId: '0251da17-ac8e-4801-a857-8c88be02d2a6',
    type: 'success',
    title: 'Profile Updated',
    message: 'Your profile information has been successfully updated.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    actionUrl: '/profile',
    actionText: 'View Profile',
    priority: 'low'
  }
];

// @route   GET api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, unread_only } = req.query;

    let userNotifications = notifications.filter(n => n.userId === userId);

    // Filter by type if specified
    if (type && type !== 'all') {
      userNotifications = userNotifications.filter(n => n.type === type);
    }

    // Filter unread only if specified
    if (unread_only === 'true') {
      userNotifications = userNotifications.filter(n => !n.read);
    }

    // Sort by priority and timestamp
    userNotifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.json({
      success: true,
      notifications: userNotifications,
      unreadCount: userNotifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// @route   PUT api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = notifications.find(n => n.id === notificationId && n.userId === userId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    notification.read = true;

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// @route   PUT api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    notifications.forEach(notification => {
      if (notification.userId === userId) {
        notification.read = true;
      }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// @route   DELETE api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notificationIndex = notifications.findIndex(n => n.id === notificationId && n.userId === userId);
    
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    notifications.splice(notificationIndex, 1);

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// @route   POST api/notifications
// @desc    Create a new notification (for system use)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { userId, type, title, message, actionUrl, actionText, priority = 'medium' } = req.body;

    const newNotification = {
      id: Date.now().toString(),
      userId: userId || req.user.id,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      actionUrl,
      actionText,
      priority
    };

    notifications.push(newNotification);

    res.status(201).json({
      success: true,
      notification: newNotification,
      message: 'Notification created'
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
});

// @route   GET api/notifications/stats
// @desc    Get notification statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userNotifications = notifications.filter(n => n.userId === userId);

    const stats = {
      total: userNotifications.length,
      unread: userNotifications.filter(n => !n.read).length,
      byType: {
        booking: userNotifications.filter(n => n.type === 'booking').length,
        payment: userNotifications.filter(n => n.type === 'payment').length,
        system: userNotifications.filter(n => n.type === 'system').length,
        warning: userNotifications.filter(n => n.type === 'warning').length,
        success: userNotifications.filter(n => n.type === 'success').length,
        error: userNotifications.filter(n => n.type === 'error').length
      },
      byPriority: {
        high: userNotifications.filter(n => n.priority === 'high').length,
        medium: userNotifications.filter(n => n.priority === 'medium').length,
        low: userNotifications.filter(n => n.priority === 'low').length
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics'
    });
  }
});

module.exports = router;

// utils/notificationUtils.js
const Notification = require('../models/Notification');

const createNotification = async (user, userModel, message, link) => {
  try {
    if (!user || !userModel || !message || !link) return;
    await Notification.create({ user, userModel, message, link });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

module.exports = { createNotification };
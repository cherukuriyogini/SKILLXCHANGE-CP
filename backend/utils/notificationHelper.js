const Notification = require('../models/Notification');

/**
 * Creates a notification in the database and emits it via socket.io.
 * NOTE: This is intentionally non-fatal — a notification error must never
 * block the primary action (e.g. session creation, booking confirmation).
 */
const createAndEmitNotification = async (app, data) => {
  try {
    const notification = await Notification.create(data);
    
    const io = app.get('io');
    if (io) {
      io.to(data.recipient.toString()).emit('notification', notification);
    }
    
    return notification;
  } catch (err) {
    // Log but do NOT re-throw — notification errors are non-critical
    console.error('Notification Helper Error (non-fatal):', err.message);
    return null;
  }
};

module.exports = createAndEmitNotification;


const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.findByUser(req.user._id),
      Notification.countUnread(req.user._id),
    ]);

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.markAsRead(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countUnread(req.user._id);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

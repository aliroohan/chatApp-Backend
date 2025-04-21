const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Room = require('../models/Room');
const auth = require('../middleware/auth');

// Get all messages for a room
router.get('/:roomId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new room
router.post('/room', async (req, res) => {
  try {
    const { name } = req.body;


    // Create new room
    const newRoom = new Room({
      name

    });

    await newRoom.save();

    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { content, roomId } = req.body;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Create new message
    const newMessage = new Message({
      sender: req.user.id,
      content,
      room: roomId,
      readBy: [req.user.id]
    });

    await newMessage.save();

    // Update latest message in room
    room.latestMessage = newMessage._id;
    await room.save();

    // Populate sender info
    await newMessage.populate('sender', 'username avatar');

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});module.exports = router;

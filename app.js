const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Create an express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static HTML file
app.use(express.static(path.join(__dirname, 'public')));
let users = {};
app.post('/api/notifications/send', (req, res) => {
  const { target, userId, message, source, timestamp } = req.body;
  if (target === 'specific') {
      const targetUserSocketId = users[userId];
      
      if (targetUserSocketId) {
          io.to(targetUserSocketId).emit('notification', {
              message: message,
              source: source,
              timestamp: timestamp
          });
          return res.status(200).json({ success: true, message: 'Notification sent to the specific user.' });
      } else {
          return res.status(404).json({ success: false, message: 'User not found or not connected.' });
      }
  } else {
      return res.status(400).json({ success: false, message: 'Invalid target type.' });
  }
});
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('register', (user_id) => {
        console.log(`User registered with ID: ${user_id}`);
        users[user_id] = socket.id; 
    });
    socket.on('sendNotification', (data) => {
        console.log(`Notification for user ${data.user_id}: ${data.message}`);

        const targetUserSocketId = users[data.user_id];
        if (targetUserSocketId) {
            io.to(targetUserSocketId).emit('notification', data.message);
        } else {
            console.log('User not found or not connected.');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Optionally, you can remove the user from the users object
    });
});

// Start server
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Import Models
const User = require('./models/User'); // User model
const Message = require('./models/Message'); // Message model

// Initialize App
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://nicoleye301:XgHVNsrpmFTh2ZV6@cluster0.05bnf.mongodb.net/hermes-chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the password and save the user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    res.status(200).json({ message: 'Login successful', username });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Add a friend
app.post('/add-friend', async (req, res) => {
  const { username, friendUsername } = req.body;

  try {
    // Find both users
    const user = await User.findOne({ username });
    const friend = await User.findOne({ username: friendUsername });

    if (!user || !friend) {
      return res.status(404).json({ message: 'User or friend not found' });
    }

    // Check if already friends
    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Add each other as friends
    user.friends.push(friend._id);
    friend.friends.push(user._id);
    await user.save();
    await friend.save();

    res.status(200).json({ message: 'Friend added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding friend', error });
  }
});

// Get user's friends
app.get('/friends/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).populate('friends', 'username');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching friends', error });
  }
});

// Fetch messages between friends
app.get('/messages/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
});


// Send a message to a friend
app.post('/message', async (req, res) => {
  const { sender, receiver, content } = req.body;

  try {
    // Check if sender and receiver are friends
    const user = await User.findOne({ username: sender }).populate('friends', 'username');
    const isFriend = user.friends.some((friend) => friend.username === receiver);

    if (!isFriend) {
      return res.status(403).json({ message: 'You can only message your friends' });
    }

    // Save the message
    const newMessage = new Message({ sender, receiver, content });
    await newMessage.save();

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error });
  }
});

// Socket.IO for Real-Time Chat
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Listen for messages
  socket.on('sendMessage', async (messageData) => {
    try {
      const message = new Message(messageData);
      await message.save();
      io.emit('receiveMessage', messageData);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.put('/user/:username/bio', async (req, res) => {
  const { username } = req.params;
  const { bio } = req.body;
  try {
    // Update user's bio in the database
    const result = await User.updateOne({ username }, { bio });
    
    // Check if the update was actually successful
    if (result.modifiedCount > 0) {
      res.status(200).json({ 
        success: true,
        message: "Bio updated successfully" 
      });
    } else {
      res.status(404).json({ 
        success: false,
        message: "User not found or bio unchanged" 
      });
    }
  } catch (err) {
    console.error('Bio update error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to update bio",
      details: err.message 
    });
  }
});

app.put('/user/:username/nickname', async (req, res) => {
  const { username } = req.params;
  const { nickname } = req.body;
  try {
    // Update user's nickname in the database
    const result = await User.updateOne({ username }, { nickname });
    
    // Check if the update was actually successful
    if (result.modifiedCount > 0) {
      res.status(200).json({ 
        success: true,
        message: "Nickname updated successfully" 
      });
    } else {
      res.status(404).json({ 
        success: false,
        message: "User not found or nickname unchanged" 
      });
    }
  } catch (err) {
    console.error('Nickname update error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to update nickname",
      details: err.message 
    });
  }
});

// GET route to retrieve user's bio
app.get('/user/:username/bio', async (req, res) => {
  const { username } = req.params;
  
  try {
    // Find the user and retrieve only the bio field
    const user = await User.findOne({ username }, 'bio');
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    // Return the bio
    res.status(200).json({ 
      success: true,
      bio: user.bio || '' // Return empty string if bio is null/undefined
    });
  } catch (err) {
    console.error('Bio retrieval error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to retrieve bio",
      details: err.message 
    });
  }
});

// GET route to retrieve user's nickname
app.get('/user/:username/nickname', async (req, res) => {
  const { username } = req.params;
  
  try {
    // Find the user and retrieve only the nickname field
    const user = await User.findOne({ username }, 'nickname');
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    // Return the nickname
    res.status(200).json({ 
      success: true,
      nickname: user.nickname || '' // Return empty string if nickname is null/undefined
    });
  } catch (err) {
    console.error('Nickname retrieval error:', err);
    res.status(500).json({ 
      success: false,
      error: "Failed to retrieve nickname",
      details: err.message 
    });
  }
});
// Start Server
const PORT = process.env.PORT || 5003;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

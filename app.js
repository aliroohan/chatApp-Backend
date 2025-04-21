const express = require('express')
const mongoose = require('mongoose')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
require('dotenv').config()

// Import routes
const authRoutes = require('./routes/auth')
const messageRoutes = require('./routes/messages')

// Initialize Express app
const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err))

app.get('/', (req, res) => {
  res.send('Hello World!')
})
// Routes
app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected')

  socket.on('join', (room) => {
    socket.join(room)
    console.log(`User joined room: ${room}`)
  })

  socket.on('sendMessage', (data) => {
    io.to(data.room).emit('message', {
      user: data.user,
      text: data.text,
      createdAt: new Date()
    })
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected')
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

// Start server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
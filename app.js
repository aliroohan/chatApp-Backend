const express = require('express')
const mongoose = require('mongoose')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
require('dotenv').config()

// Import routes
const authRoutes = require('./routes/auth')
const messageRoutes = require('./routes/messages')

// Define allowed origins
const allowedOrigins = ['http://localhost:4200']

// Initialize Express app
const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.'
      return callback(new Error(msg), false)
    }
    return callback(null, true)
  },
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err))

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Credentials', true)

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  next()
})

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
require('dotenv').config()
const express = require('express')
const session = require('express-session');
const cors = require('cors')
const passport = require('./src/controllers/passportConfig')

const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');

const authRouter = require('./src/routes/auth')
const { checkAuth } = require('./src/controllers/authContr')

const prisma = new PrismaClient()
const prismaSession = new PrismaSessionStore(
  prisma,
  {
    checkPeriod: 2 * 60 * 1000,  // 2 hours in ms
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  }
)

const app = express()
app.use(express.json())
app.use(cors({
  origin: 'http://localhost:4000',
  credentials: true
}))
app.use(session({
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week in ms
  },
  secret: process.env.SESSION_SECRET,
  resave: false, // only resave on change
  saveUninitialized: false, // only save on user authentication
  store: prismaSession
}))
app.use(passport.session())

app.use('/user', authRouter)

app.get('/',
  (req, res, next) => {
    res.send('<h1>we made it</h1>')
  }
)

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res
    .status(500)
    .json({
      message: 'An error occurred',
      error: process.env.NODE_ENV === 'DEV' ?
        err.message : 'Internal server error'
    })
})

app.listen(3000)
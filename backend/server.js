require('dotenv').config()
const express = require('express')
const session = require('express-session');
const cors = require('cors')
const cookieParser = require('cookie-parser')
const passport = require('./src/controllers/passportConfig')
const debug = require('debug')('backend:server')

const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');

const authRouter = require('./src/routes/authRouter')
const fileRouter = require('./src/routes/fileRouter')
const folderRouter = require('./src/routes/folderRouter')

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
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week in ms
    sameSite: "lax",
    secure: false
  },
  secret: process.env.SESSION_SECRET,
  resave: false, // only resave on change
  saveUninitialized: false, // only save on user authentication
  store: prismaSession
}))
app.use(passport.session())
app.use(cookieParser())


app.use('/user', authRouter)
app.use('/file', fileRouter)
app.use('/folder', folderRouter)

app.get('/',
  (req, res, next) => {
    res.send('<h1>we made it</h1>')
  }
)

app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error(err.stack);
  res
    .status(500)
    .json({
      message: 'An error occurred',
      error: process.env.NODE_ENV === 'DEV' ?
        err.message : 'Internal server error'
    })
})

app.listen(3000)
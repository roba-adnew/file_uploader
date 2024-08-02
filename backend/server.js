require('dotenv').config({ path: "../.env" })
const express = require('express')
const expressSession = require('express-session');
const passport = require('./src/controllers/passportConfig')

const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');

const authRouter = require('./src/routes/auth')

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

app.use(expressSession({
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week in ms
  },
  secret: process.env.SESSION_SECRET,
  resave: false, // only resave on change
  saveUninitialized: false, // only save on user authentication
  store: prismaSession
}))
app.use(passport.initialize())
app.use(passport.session())

app.use('/user', authRouter)

app.get('/', (req, res, next) => {
  res.send('<h1> here are the sessions</h1>')
})

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res
    .status(500)
    .json({ 
      message: 'An error occurred', 
      error: process.env.NODE_ENV === 'development' ? 
        err.message : 'Internal server error' })

})

app.listen(3000)
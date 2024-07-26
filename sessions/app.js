require('dotenv').config({ path: "../.env" })
const express = require('express')
const expressSession = require('express-session');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');

const app = express(); 
const prisma = new PrismaClient()
const prismaSession  = new PrismaSessionStore(
    prisma, 
        {
            checkPeriod: 2 * 60 * 1000,  // 2 hours in ms
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined,
        }
);


app.use(express.json())
app.use(
  expressSession({
    cookie: {
     maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week in ms
    },
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: prismaSession
  })
);

app.get('/', (req, res, next) => {
    res.send('<h1> here are the sessions</h1>')
})

app.listen(3000)
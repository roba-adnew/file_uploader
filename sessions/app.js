require('dotenv').config({ path: "../.env" })
const express = require('express')
const expressSession = require('express-session');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');

const app = express(); 
const prismaSession  = new PrismaSessionStore();
const prisma = new PrismaClient()


app.use(
  expressSession({
    cookie: {
     maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week in ms
    },
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: prismaSession(
        prisma(), 
        {
            checkPeriod: 2 * 60 * 1000,  // 2 hours in ms
            dbRecordIdIsSessionId: true,
            dbRecordIdFunction: undefined,
        }
    )
  })
);


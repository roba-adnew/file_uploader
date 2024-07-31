require('dotenv').config()
const bcrypt = require('bcryptjs')
const debug = require('debug')('backend:passport')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await prisma.user.findUnique({
                where: { 
                    OR: 
                    [{ username: usernameOrEmail }, { email: usernameOrEmail }] 
                }
            })
            if (!user) {
                return done(null, false, { message: "username not found" })
            }
            const match = await bcrypt.compare(password, user.hashedPassword)
            if (!match) {
                return done(null, false, { message: "incorrect password" })
            }
            return done(null, user)
        } catch (err) {
            console.error(err)
            throw err
        }
    })
)

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = prisma.user.findUnique({
            where: {
                id: id
            }
        })
    } catch (err) {
        done(err)
    }
})

module.exports = passport
require('dotenv').config()
const bcrypt = require('bcryptjs')
const debug = require('debug')('backend:passport')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const fields = {
    usernameField: "usernameOrEmail"
}

passport.use(
    new LocalStrategy(fields, async (usernameOrEmail, password, done) => {
        try {
            const userResult = await prisma.user.findMany({
                where: { 
                    OR: 
                    [{ username: usernameOrEmail }, { email: usernameOrEmail }] 
                }
            })
            const user = userResult[0]
            debug('login user query: %O', user)
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
    debug('serializing user: %O', user)
    done(null, user.id.toString());
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: id } })
        debug('deserialized user: %O', user)
        done(null, user)
    } catch (err) {
        done(err)
    }
})

module.exports = passport
require('dotenv').config()
const bcrypt = require('bcryptjs')
const passport = require('passport')
const debug = require('debug')('backend:authContr')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

exports.signupPost = [
    async (req, res, next) => {
        debug('request body: %O', req.body)
        try {
            const usernameExists = await prisma.user.findUnique({
                where: { username: req.body.username }
            })
            const emailExists = await prisma.user.findUnique({
                where: { email: req.body.email }
            })

            if (emailExists) {
                return res
                    .status(409)
                    .send({ message: "email already associated with an account" })
            }

            if (usernameExists) {
                return res.status(409).send({ message: "username already exists" })
            }

            next();
        } catch (err) {
            console.error(err)
            throw err
        }
    },
    async (req, res, next) => {
        try {
            bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
                if (err) {
                    debug("issues hashing")
                    return next(err)
                }
                try {
                    const user = await prisma.user.create({
                        data: {
                            email: req.body.email,
                            username: req.body.username,
                            hashedPassword: hashedPassword
                        }
                    })
                    console.log("successful account creation", user)
                    res.redirect("/")
                } catch (err2) {
                    return next(err2)
                }
            })
        } catch (err) {
            console.error(err)
            next(err)
        }
    }
]

exports.loginPost = [
    passport.authenticate('local'),
    (req, res) => {
        res.send({ message: 'made it here' })
    }
]

exports.logoutGet = (req, res, next) => {
    if (!req.isAuthenticated()) {
        debug('User is not authenticated');
        return res.status(400).send({ message: "No user to log out" });
    }
    debug('req object: %O:', req)
    req.logout((err) => {
        if (err) { return next(err) }
        res.send({ message: "logout successful" })
    })
}
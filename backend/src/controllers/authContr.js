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
        if (req.isAuthenticated()) {
            debug('User after authentication:', req.user);
            debug('Session after authentication:', req.session);
            return res
                .status(200)
                .json({ user: req.session.user, message: "logged in" })
        }
        return res
            .status(403)
            .json({ message: "unauthorized" })
    }
]

exports.logoutGet = (req, res, next) => {
    debug('req session at logout', req.session)
    if (!req.isAuthenticated()) {
        debug('User is not logged in');
        return res.status(400).json({ message: "No user to log out" });
    }
    req.logout((err) => {
        if (err) return next(err)
        res.status(204).json({ message: "logout successful" })
    })
}

exports.checkAuthGet = (req, res, next) => {
    debug('current session state: %O', req.session)
    debug('current req user state: %O', req.user)
    debug('auth state is', req.isAuthenticated())
    const user = req.user;
    if (!user) return res.status(401).json({ message: "unauthorized" });
    return res.status(200);
}
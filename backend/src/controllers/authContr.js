require('dotenv').config()
const bcrypt = require('bcryptjs')
const passport = require('passport')
const debug = require('debug')('backend:authContr')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

exports.postSignup = [
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
                return res
                    .status(409)
                    .send({ message: "username already exists" })
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
                    const root = await prisma.folder.create({
                        data: {
                            name: "root",
                            isRoot: true,
                            owner: {
                                connect: {
                                    id: user.id
                                }
                            }
                        }
                    })
                    const trash = await prisma.folder.create({
                        data: {
                            name: "trash",
                            isTrash: true,
                            owner: {
                                connect: {
                                    id: user.id
                                }
                            }
                        }
                    })
                    debug("successful account creation", user)
                    debug("root and trash folders created", root, trash)
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

exports.postLogin = [
    passport.authenticate('local'),
    async (req, res) => {
        if (req.isAuthenticated()) {
            debug('User after authentication:', req.user);
            debug('Session after authentication:', req.session);
            try {
                const rootFolder = await prisma.folder.findFirst({
                    where: { userId: req.user.id, isRoot: true }
                })
                return res
                    .status(200)
                    .json({
                        user: req.user,
                        message: "logged in",
                        rootFolderId: rootFolder.id
                    })
            } catch (err) {
                console.error(err)
                throw (err)
            }
        }
        return res
            .status(403)
            .json({ message: "unauthorized" })
    }
]

exports.postLogout = (req, res, next) => {
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

exports.postAuthCheck = (req, res, next) => {
    debug('current session state: %O', req.session)
    debug('current req user state: %O', req.user)
    debug('auth stands at:', req.isAuthenticated())
    debug('body: %O', req.body)
    const { sendResponse } = req.body;
    const user = req.user;
    const authenticated = !!user && req.isAuthenticated();
    if (!authenticated) return res.status(401).json({ message: "unauthorized" });
    if (sendResponse) {
        return res.status(200).json({ message: "user is logged in", user })
    }
    next();
}
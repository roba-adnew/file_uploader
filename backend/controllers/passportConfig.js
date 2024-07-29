const passport = require('passport')
const asyncHandler = require('express-async-handler')
const LocalStrategy = require('passport-local').Strategy
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

signUpPost = asyncHandler(async (req, res, next) => {
    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) {
            console.log("nah, you had issues at the hash")
            return next(err);
        }
        try {
            const user = prisma.user.createAndReturn({
                data: {
                    email: req.body.email,
                    username: req.body.username,
                    password: hashedPassword
                }
            });
            console.log("successful account creation")
            res.redirect("/");
        } catch (err2) {
            return next(err2);
        };
    })
})

passport.use(
    new LocalStrategy(asyncHandler(async (username, password, done) => {
        const user = prisma.user.findUnique({
            where: { username: username }
        })
        if (!user) return done(null, false, { message: "username not found" })
        const match = await bcrypt.compare(password, user.hashedPassword)
        if (!match) return done(null, false, { message: "incorrect password" })
        return done(null, user)
    }))
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


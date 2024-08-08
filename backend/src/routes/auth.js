const express = require('express')
const router = express.Router();
const authController = require('../controllers/authContr')

router.post('/signup', authController.signupPost)

router.post('/login', authController.loginPost)

router.get('/logout', authController.logoutGet)

router.get('/check-auth', authController.checkAuthGet)

router.get('/protected', authController.checkAuthGet, 
    (req, res) => res.json({ message: "protected" })
)

module.exports = router
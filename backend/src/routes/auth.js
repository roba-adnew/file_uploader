const express = require('express')
const router = express.Router();
const authController = require('../controllers/authContr')

router.post('/signup', authController.signupPost)

router.post('/login', authController.loginPost)

router.get('/logout', authController.logoutGet)

router.get('/check-auth', authController.checkAuthGet)

router.get('/protected', (req, res) => {
    if (req.isAuthenticated()) { res.json({ message: "protected" }) }
    else { res.status(401).json({ message: "currently unauthorized" }) }
})

module.exports = router
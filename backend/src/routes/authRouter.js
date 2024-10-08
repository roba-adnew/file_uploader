const express = require('express')
const router = express.Router();
const authController = require('../controllers/authContr')

router.post('/signup', authController.postSignup)

router.post('/login', authController.postLogin)

router.post('/logout', authController.postLogout)

router.post('/check-auth', authController.postAuthCheck)

module.exports = router
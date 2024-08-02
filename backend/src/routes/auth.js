const express = require('express')
const router = express.Router();
const { signupPost, loginPost, logoutGet } = require('../controllers/authContr')

router.post('/signup', signupPost)

router.post('/login', loginPost)

router.get('/logout', logoutGet)

module.exports = router
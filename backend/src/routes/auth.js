const express = require('express')
const router = express.Router();
const { signupPost, loginPost, logoutPost } = require('../controllers/authContr')

router.post('/signup', signupPost)

router.post('/login', loginPost)

router.post('/logout', logoutPost)

module.exports = router
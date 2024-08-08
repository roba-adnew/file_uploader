const express = require('express')
const router = express.Router();
const authController = require('../controllers/authContr')

router.post('/signup', authController.signupPost)

router.post('/login', authController.loginPost)

router.get('/logout', authController.logoutGet)

router.get('/check-auth', authController.checkAuthGet)
<<<<<<< HEAD

router.get('/protected', authController.checkAuthGet, 
    (req, res) => res.json({ message: "protected" })
)
=======
>>>>>>> 9e009b80201b5ffcc263e1f6ad0b88ff06052d5e

module.exports = router
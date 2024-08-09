const express = require('express')
const managerContr = require('../controllers/managerContr')

const router = express.Router();

router.post('/file', managerContr.formUploadPost)

module.exports = router
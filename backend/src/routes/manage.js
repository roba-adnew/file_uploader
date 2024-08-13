const express = require('express')
const managerContr = require('../controllers/managerContr')

const router = express.Router();

router.post('/file', managerContr.fileUploadPost)

router.get('/file', managerContr.viewFileGet)

router.post('/folder', managerContr.createFolderPost)

module.exports = router
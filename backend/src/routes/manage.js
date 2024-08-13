const express = require('express')
const managerContr = require('../controllers/managerContr')

const router = express.Router();

router.get('/file', managerContr.viewFileGet)

router.post('/file', managerContr.fileUploadPost)

router.put('/file', managerContr.updateFileNamePut)

router.post('/folder', managerContr.createFolderPost)

module.exports = router
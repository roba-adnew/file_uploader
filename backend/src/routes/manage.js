const express = require('express')
const managerContr = require('../controllers/managerContr')

const router = express.Router();

// file management 
router.get('/file', managerContr.viewFileGet)

router.post('/file', managerContr.fileUploadPost)

router.put('/file/name', managerContr.updateFileNamePut)

router.put('/file/location', managerContr.updateFileLocationPut)

router.delete('/file', managerContr.deleteFileDelete)

// folder management 

router.post('/folder', managerContr.createFolderPost)

module.exports = router
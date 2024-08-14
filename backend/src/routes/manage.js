const express = require('express')
const managerContr = require('../controllers/managerContr')

const router = express.Router();

// file management 
router.get('/file', managerContr.viewFileGet)

router.post('/file', managerContr.fileUploadPost)

router.put('/file', managerContr.updateFileNamePut)

router.delete('/file', managerContr.deleteFileDelete)

// folder management 
router.get('/folder', )

router.post('/folder', managerContr.createFolderPost)

module.exports = router
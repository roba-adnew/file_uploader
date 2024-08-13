const express = require('express')
const managerContr = require('../controllers/managerContr')

const router = express.Router();

router.get('/file', managerContr.viewFileGet)

router.post('/file', managerContr.fileUploadPost)

<<<<<<< HEAD
router.put('/file', managerContr.updateFileNamePut)
=======
router.get('/file', managerContr.viewFileGet)
>>>>>>> 1656b0d715d3458325f0ff2ff029c80fec588aa3

router.post('/folder', managerContr.createFolderPost)

module.exports = router
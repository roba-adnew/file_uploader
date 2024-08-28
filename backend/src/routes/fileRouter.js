const express = require('express')
const fileContr = require('../controllers/fileContr')

const router = express.Router();

router.post('/download', fileContr.getFile)

router.post('/details', fileContr.getFileDetails)

router.post('/', fileContr.postFileUpload)

router.put('/name', fileContr.updateFileNamePut)

router.put('/location', fileContr.updateFileLocationPut)

router.delete('/', fileContr.deleteFile)

router.delete('/delete', fileContr.permanentlyDeleteFile)

module.exports = router
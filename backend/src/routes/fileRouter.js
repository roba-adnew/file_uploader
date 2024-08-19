const express = require('express')
const fileContr = require('../controllers/fileContr')

const router = express.Router();

router.get('/download', fileContr.getFile)

router.get('/', fileContr.getFileDetails)

router.post('/', fileContr.postFileUpload)

router.put('/name', fileContr.updateFileNamePut)

router.put('/location', fileContr.updateFileLocationPut)

router.delete('/', fileContr.deleteFile)

module.exports = router
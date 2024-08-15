const express = require('express')
const fileContr = require('../controllers/fileContr')

const router = express.Router();

router.get('/sb', fileContr.sbDownloadGet)

router.get('/', fileContr.readFileGet)

router.post('/', fileContr.fileUploadPost)

router.put('/name', fileContr.updateFileNamePut)

router.put('/location', fileContr.updateFileLocationPut)

router.delete('/', fileContr.deleteFileDelete)

module.exports = router
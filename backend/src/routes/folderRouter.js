const express = require('express')
const folderContr = require('../controllers/folderContr')

const router = express.Router();

router.post('/view', folderContr.getFolderContentsPost)

router.get('/trash', folderContr.getTrashContents)

router.post('/add', folderContr.postAddFolder)

router.put('/name', folderContr.updateFolderNamePut)

router.put('/location', folderContr.updateFolderLocationPut)

router.delete('/', folderContr.deleteFolderDelete)

module.exports = router
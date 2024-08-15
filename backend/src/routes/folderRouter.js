const express = require('express')
const folderContr = require('../controllers/folderContr')

const router = express.Router();

router.get('/', folderContr.readFolderContentsGet)

router.post('/', folderContr.createFolderPost)

router.put('/name', folderContr.updateFolderNamePut)

module.exports = router
const express = require('express')
const folderContr = require('../controllers/folderContr')

const router = express.Router();

router.post('/', folderContr.createFolderPost)

module.exports = router
require('dotenv').config()
const debug = require('debug')('backend:manager')
const multer = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        return cb(null, 'public')
    },
    filename: (req, file, cb) => {
        return cb(null, file.originalname) 
    }
})

const upload = multer({ storage })

exports.formUploadPost = [
    upload.single('uploaded_file'),
    (req, res, next) => {
        debug('file details', req.file)
        if (!req.isAuthenticated()) return res.status(401)
        next()
    }
]
import multer from 'multer'
import path from 'path'
import fs from 'fs'
const uploadDir = path.join(__dirname, '../../uploads')
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir)
}

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, uploadDir)
    },
    filename: function(req, file, cb){
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-');
        const uniqeSuffix = Date.now()
        cb(null, `${baseName}-${uniqeSuffix}${ext}`);
    }
})

export const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 5 },
})
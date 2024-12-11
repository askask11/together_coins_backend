const express = require('express');
const router = express.Router();
//const verify = require('../models/verify');
const multer = require('multer');
const responseJson = require('../models/responseJson');
const verify = require('../models/verify');

// const randomFilename = require("../models/utils").generateRandomString(6);
// let fullFilenames = [];

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Set upload folder
    },
    filename: function (req, file, cb) {
        if(!req.fullFileNames) req.fullFileNames = [];

        const ext = file.originalname.split('.').pop();
        const user = req.user;
        //const randomFilename = generateRandomString(6);
        const fullFilename = (user ? user.user_id : "") + "_" + require("../models/utils").generateRandomString(6) + '.' + ext;
        req.fullFileNames.push(fullFilename);
        cb(null, fullFilename); // Set unique file name
    }
});
const upload = multer({
    storage,
    /*fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    },*/
    limits: { fileSize: 3000000 } // 3MB
});

// Upload file
router.post("/upload", verify.checkLogin, upload.array("files", 20), function (req, resp, next) {
    // the user didn't upload any files
    if (!req.files || req.files.length === 0) {
        return resp.status(400).send(responseJson.noParamMsg("Please upload files!"));
    }
    //check if there is any error
    if (req.fileValidationError) {
        return resp.status(400).send(responseJson.err(req.fileValidationError));
    }

    // OK
    return resp.status(200).send(responseJson.ok(req.fullFileNames));
}, (error, req, res, next) => {
    // An error occurred when uploading
    if (error instanceof multer.MulterError) {
        return res.status(400).send(new responseJson('file_too_large', 'The file is too large, max 3MB'));
    }
    return res.status(500).send(responseJson.err(error.message));
});

module.exports = router;
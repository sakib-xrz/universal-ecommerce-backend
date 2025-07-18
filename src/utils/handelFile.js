const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const config = require('../config/index.js');

// Cloudinary configuration
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

// File type validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ico/;
    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(
            new Error(
                'Only images, PDFs, and DOC/DOCX files are allowed'
            )
        );
    }
};

// Multer configuration for storing files locally
const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        const uploadPath = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: function (_req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 30 * 1024 * 1024 } // 30 MB limit
});

// Function for uploading files to Cloudinary
const uploadToCloudinary = async (file, options = {}) => {
    return new Promise((resolve, reject) => {
        // Check if file exists
        if (!fs.existsSync(file.path)) {
            return reject(
                new Error(`File not found at path: ${file.path}`)
            );
        }

        // Upload to Cloudinary
        cloudinary.uploader.upload(
            file.path,
            {
                folder: options.folder || 'uploads',
                public_id:
                    options.public_id ||
                    path.basename(
                        file.originalname,
                        path.extname(file.originalname)
                    ),
                use_filename: true,
                overwrite: options.overwrite ?? true,
                invalidate: options.invalidate ?? true
            },
            (error, result) => {
                // Attempt to delete the local file
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path); // Delete the file if it exists
                    }
                } catch (unlinkError) {
                    console.error(
                        `Failed to delete local file: ${unlinkError.message}`
                    );
                }

                if (error) {
                    return reject(
                        new Error(
                            `Cloudinary upload failed: ${error.message}`
                        )
                    );
                }
                resolve(result);
            }
        );
    });
};

// Function for deleting files from Cloudinary
const deleteFromCloudinary = async publicIds => {
    return new Promise((resolve, reject) => {
        cloudinary.api.delete_resources(
            publicIds,
            (error, result) => {
                if (error) {
                    return reject(
                        new Error(
                            `Failed to delete from Cloudinary: ${error.message}`
                        )
                    );
                }
                resolve(result);
            }
        );
    });
};

const getCloudinaryIdFromUrl = url => {
    try {
        const urlParts = url.split('/');
        const uploadIndex = urlParts.findIndex(
            part => part === 'upload'
        );
        if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
            const publicIdWithExtension = urlParts
                .slice(uploadIndex + 2)
                .join('/');
            const publicId = publicIdWithExtension.replace(
                /\.[^/.]+$/,
                ''
            );
            return publicId;
        }
        return null;
    } catch (error) {
        console.log(
            'Error from cloudinary while extracting public id',
            error
        );
        return null;
    }
};

// Improved error handling and export
module.exports = {
    upload,
    uploadToCloudinary,
    deleteFromCloudinary,
    getCloudinaryIdFromUrl
};

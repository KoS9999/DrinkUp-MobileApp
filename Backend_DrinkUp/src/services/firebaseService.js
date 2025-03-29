const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs').promises;
const serviceAccount = require(path.resolve('C:/Users/THONG PC/Downloads/LTDDNC/drinkup-mobileapp-firebase-adminsdk-s573s-9c93f9d955.json'));
//const serviceAccount = require(path.resolve('D:/TotNghiep/drinkup-mobileapp-firebase-adminsdk-s573s-9c93f9d955.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "drinkup-mobileapp.firebasestorage.app"
});

const bucket = admin.storage().bucket();

/**
 * Upload hình ảnh lên Firebase Storage sử dụng firebase-admin
 */
const uploadImageToFirebase = async (file) => {
  try {
    const filePath = path.resolve(file.path);
    const fileName = `${Date.now()}_${file.originalname}`;
    const destination = `profileImages/${fileName}`;

    await bucket.upload(filePath, {
      destination,
      resumable: false,
      metadata: {
        metadata: {
          contentType: file.mimetype,
        }
      }
    });

    const [url] = await bucket.file(destination).getSignedUrl({
      action: 'read',
      expires: '03-01-2099'
    });

    await fs.unlink(filePath);

    return url;
  } catch (error) {
    console.error('Error uploading image to Firebase:', error);
    throw new Error('Failed to upload image');
  }
};

module.exports = {
  uploadImageToFirebase
};

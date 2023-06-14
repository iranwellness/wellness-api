const express = require('express');
const router = express.Router();
const productController = require('../controllers/products');
const multer = require('multer');
const checkAuth = require('../middleware/chcek-auth');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

router.get(`/`, productController.getAllProducts);

router.get(`/search`, productController.searchProducts);

router.post(`/`, upload.single('image'), productController.createProduct);

router.post(`/cart`, checkAuth, productController.newCart);

router.get(`/cart/`, checkAuth, productController.getMyCart);

router.delete(`/cart/:id`, checkAuth, productController.deleteCartItem);

router.patch(`/cart/:id`, checkAuth, productController.editCartItem);

router.get(`/:id`, productController.getAProduct);


module.exports = router;

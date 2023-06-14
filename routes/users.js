const express = require('express');
const router = express.Router();
const userController = require("../controllers/users");
const checkAuth = require("../middleware/chcek-auth");
const checkAdmin = require("../middleware/check-admin");
const multer = require('multer');


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // reject a file
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


router.post('/signup', userController.signup);

router.get('/', checkAuth, userController.getAllUsers);

router.get('/search', checkAuth, userController.search);

router.get('/checkLogin', checkAuth, userController.checkLogin);

router.delete('/:id', checkAuth, checkAdmin, userController.deleteUser);

router.post('/login', userController.login);

router.put('/updateMyProfile', upload.single('image'), checkAuth, userController.updateMyProfile);

router.put('/updatePassword', checkAuth, userController.updatePassword);

router.put('/:id', checkAuth, userController.updateUser);

router.post('/activation', userController.sendActivationCode);

router.post('/activate', userController.activateUser);

router.get('/getMyProfile', checkAuth, userController.getMyProfile);

router.post('/forgotPass', checkAuth, userController.forgotPassword);

router.post('/changeForgottenPass', checkAuth, userController.changeForgottenPass);


module.exports = router;

const express = require('express');
const router = express.Router();
const messageController = require("../controllers/messages");
const checkAuth = require('../middleware/chcek-auth');


router.get(`/`, checkAuth, messageController.getAllMessages);

router.get(`/:id`, checkAuth, messageController.getOneMessage);

router.post(`/`, checkAuth, messageController.createMessage);


module.exports = router;
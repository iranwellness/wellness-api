const { Message } = require('../models/messages');


exports.getOneMessage = (req, res) => {
    Message.find({ user: req.params.id }).populate("user sender").exec()
    .then(result => {
        if (result.length >= 1) {
            res.status(200).json({ success: true, data: result });
        } else {
            res.status(404).json({ success: false, message: "No content" });
        }
    })
    .catch(err => {
        res.status(404).json({ success: false, message: "Error getting the messages" });
    });
};



exports.getAllMessages = (req, res) => {
    Message.findAll()
        .exec()
        .then((messages) => {
            console.log(messages);
            if (messages) {
                res.status(200).json({ success: true, data: messages });
            } else {
                res.status(404).json({ success: false, message: "No valid entry found" });
            }
        }).catch((err) => {
            res.status(500).json({
                success: false,
                message: "error fetching the message",
                error: err
            });
        });
}

exports.createMessage = (req, res) => {
    console.log(req.body);
    const message = new Message({
        user: req.body.user,
        sender:req.userData.userId,
        message: req.body.message,
        date: req.body.date,
    });
    message.save().then(createdMessage => {
        res.status(201).json(createdMessage)
    }).catch(err => {
        console.log(req.body)
        res.status(500).json({
            error: err,
            success: false
        })
    });
};

exports.createOrder = (req, res) => {
    console.log(req.body)
    const createObj = {};
    for (const [objKey, value] of Object.entries(req.body)) {
        createObj[objKey] = value;
    }
    console.log(req.body)
    const order = new Order({
        user: req.body.user,
        items: req.body.items,
    });
    order.save().then(cratedMessage => {
        res.status(201).json(cratedMessage)
    }).catch(err => {
        console.log(req.body)
        res.status(500).json({
            error: err,
            success: false
        })
    });
};

// exports.deleteMessage = (req, res) => {
//     BraodcastMessage.findByIdAndRemove(req.params.id)
//         .then(message => {
//             if (message) {
//                 return res.status(200).json({ success: true, message: "The message is deleted" })
//             } else {
//                 return res.status(404).json({ success: false, message: "message not found" });;
//             }
//         }).catch(err => {
//             return res.status(500).json({ success: false, message: err })
//         })
// };

// exports.updateMessage = (req, res) => {
//     const updateOps = {};
//     for (const [objKey, value] of Object.entries(req.body)) {
//         updateOps[objKey] = value;
//     }
//     console.log(updateOps)
//     BraodcastMessage.findByIdAndUpdate({ _id: req.params.id }, { $set: updateOps }, { new: true })
//         .exec()
//         .then((doc) => {
//             res.status(200).json({ success: true, data: doc });
//         })
//         .catch((err) => {
//             res.status(500).json({ success: false, message: "error updating the message", error: err });
//         });
// };

exports.deliveredProduct = (req, res) => {
    console.log(req.userData.userId)
    const query = { "items._id": req.params.id }
    Order.findOneAndUpdate(query, { "items.$.status": true }, { new: true })
        .exec()
        .then((doc) => {
            res.status(200).json({ success: true, data: doc });
        })
        .catch((err) => {
            res.status(500).json({ success: false, message: "error updating the message", error: err });
        });
}
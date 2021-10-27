const { Notif } = require('../models/notifs');
const webpush = require('web-push');
const schedule = require('node-schedule');


require('dotenv/config');
const publicVapidKey = 'BPBc8omBrJ-NtB_XcIW0S_QS4pVe_dNVECdvRiDWH3DsIQF2CshhYYUgep2U9DWlu7Huns5dzkrlypdRIrIgp8Q';
const privateVapidKey = process.env.PRIVATE_KEY;


webpush.setVapidDetails(
    "mailto:test@test.com",
    publicVapidKey,
    privateVapidKey
);

exports.getMyNotifs = (req, res) => {
    Notif.find({ user: req.userData.userId }).then(result => {
        if (result.length >= 1) {
            return res.status(200).json({ success: true, data: result });
        } else {
            return res.status(404).json({ success: false, message: "No notifications" });
        }
    }).catch(err => {
        return res.status(500).json({ success: false, message: "Error getting notifications", error: err });
    });
};


exports.createNotif = (req, res) => {
    const subscription = req.body;
    console.log(subscription.minute)
    const notif = new Notif({
        user: req.userData.userId,
        endpoint: subscription.subscription,
        minute: subscription.minute,
        hour: subscription.hour,
    });
    notif.save().then(result => {
        // Get pushSubscription object
        const subscription = req.body;
        // console.log(subscription);
        // console.log(subscription.minute);
        // console.log(subscription.hour);
        // Send 201 - resource created


        // Create payload
        const payload = JSON.stringify({ title: "یادآوری" });

        // Pass object into sendNotification
        const job = schedule.scheduleJob(`${subscription.minute} ${subscription.hour} * * *`, function () {
            console.log('The answer to life, the universe, and everything!');
            webpush
                .sendNotification(JSON.parse(subscription.subscription), payload)
                .catch(err => console.error(err));

        });
        var list = schedule.scheduledJobs;
        console.log(list)
        res.status(201).json({ success: true, data: result })
    })
    // .catch(err => {
    //     res.status(500).json({ success: 'false', message: "Error createing a notif", error: err })
    // })
};


exports.deleteNotif = (req, res) => {
    Notif.deleteOne({ _id: req.params.id })
        .exec()
        .then(notif => {
            if (notif) {
                res.status(202).json({ success: true, message: 'Notif deleted successfuly ' })
            } else {
                res.status(404).json({ success: false, message: 'Notif id incorect' })
            }
        })
        // .catch(err => {
        //     res.status(500).json({ success: true, message: 'Error deleting Notif', error: err })
        // });
};
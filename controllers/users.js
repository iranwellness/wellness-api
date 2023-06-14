const { User, ActivationCode, ForgotPass } = require('../models/users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

var Kavenegar = require('kavenegar');
const sms = Kavenegar.KavenegarApi({ apikey: '75676D4E386278447765682F39417544755151306949735552684D397863587974634731777433685347553D' });
const Ghasedak = require("ghasedak");

const AWS = require("aws-sdk");
const s3 = new AWS.S3()
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// let sms = new Ghasedak("7f3529b3e37113c426541a10618a6b6e7483b9fd06345988b927765d4bddb0c3");
// let sms = new Ghasedak(process.env.API_URL);

async function getURL(items){
    for(let item of items){
        // console.log(item)
        if (item.image) {
            const signedUrlExpireSeconds = 60 * 5
             const data = s3.getSignedUrl('getObject', {
                Bucket: "cyclic-tame-rose-clownfish-ring-us-west-1",
                Key: item.image,
                Expires: signedUrlExpireSeconds
            });
            item.image = data;
        }
    };
  }

exports.signup = (req, res) => {
    User.find({ phone: req.body.phone }).exec().then(user => {
        if (user.length >= 1) {
            return res.status(409).json({ succes: false, message: "User already exist" });
        } else {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err) {
                    return res.status(500).json({ succes: false, message: 'Error hashing the password', error: err });
                } else {
                    const user = new User({
                        passwordHash: hash,
                        phone: req.body.phone,
                    });
                    user.save().then(doc => {
                        console.log(doc.phone)

                        jwt.sign({ phone: user.phone, userId: user.id, userType: user.userType },
                            process.env.JWT_KEY, {
                            expiresIn: "48h",
                        },
                            (err, token) => {
                                if (err) {
                                    return res.status(500).json({ success: false, message: "Authorization failed", error: err });
                                } else if (token) {
                                    return res
                                        .status(200)
                                        .json({ success: true, message: "Authorization succeeded", token: token, user: user });
                                }
                            }
                        );
                    })
                        .catch(err => {
                            res.status(500).json({ success: false, message: 'Signup failure', error: err });
                        })
                }
            })
        }
    })
        .catch(err => {
            res.status(500).json({ success: false, message: "Error while chekcing for user", error: err })
        });


};

exports.getAllUsers = (req, res) => {
    User.find().then(async (userList) => {
        if (userList.length < 1) {
            res.status(204).json({ success: false, message: 'No Content' });
        } else {
            await getURL(userList);
            res.status(200).json({ success: true, data: userList });
        }
    })
    .catch(err => {
        res.status(500).json({ success: false, message: err })
    });
};

exports.search = (req, res) => {
    console.log(req.query)
    User.find(req.query).lean().then(userList => {
        console.log(userList)
        if (userList.length < 1) {
            res.status(404).json({ success: false, message: 'No Content' });
        } else {
            getURL(userList);
            res.status(200).json({ success: true, data: userList });
        }
    }).catch(err => {
        res.status(500).json({ success: false, message: err })
    });
};

exports.deleteUser = (req, res) => {
    User.deleteOne({ _id: req.params.id }).exec().then(result => {
        res.status(200).json({ success: true, message: 'User removed' });
    }).catch(err => {
        res.status(500).json({ success: false, message: 'Failed to delete user', error: err });
    })
};

exports.login = (req, res) => {
    User.findOne({ phone: req.body.phone })
        .select("active _id passwordHash phone userType")
        .exec()
        .then((user) => {
            if (user) {
                bcrypt.compare(req.body.password, user.passwordHash, (err, result) => {
                    console.log(result);
                    if (err) {
                        return res.status(401).json({ success: false, message: "Authorization failed" });
                    } else if (result) {
                        jwt.sign({ phone: user.phone, userId: user.id, userType: user.userType },
                            process.env.JWT_KEY, {
                            expiresIn: "48h",
                        },
                            (err, token) => {
                                if (err) {
                                    return res.status(500).json({ success: false, message: "Authorization failed", error: err });
                                } else if (token) {
                                    return res
                                        .status(200)
                                        .json({ success: true, message: "Authorization succeeded", token: token, user: user });
                                }
                            }
                        );
                    } else {
                        return res.status(401).json({ success: false, message: "Authorization failed" });
                    }
                });
            } else {
                res.status(401).json({ success: false, message: "Authorization failed" });
            }
        })
        .catch((err) => {
            res.status(500).json({ success: false, error: err });
        });
};

exports.updateUser = (req, res) => {
    console.log('check')
    const updateOps = {};
    for (const [objKey, value] of Object.entries(req.body)) {
        updateOps[objKey] = value;
    }
    User.findOneAndUpdate({ _id: req.params.id }, { $set: updateOps }, { new: true })
        .exec()
        .then((doc) => {
            res.status(200).json({ success: true, data: doc });
        })
        .catch((err) => {
            res.status(500).json({ success: false, message: "error updating the category", error: err });
        });
};

exports.sendActivationCode = (req, res) => {
    console.log(req.body.userId)
    ActivationCode.find({ user: req.body.userId })
        .exec()
        .then(result => {
            if (result.length >= 1) {
                res.status(409).json({ success: false, message: "Wait before code expires" });
            } else {
                User.findOne({ _id: req.body.userId })
                    .select("active phone")
                    .exec()
                    .then((user) => {
                        console.log(user.active)
                        if (user.active == false) {
                            const activationCode = new ActivationCode({
                                user: req.body.userId,
                                authCode: Math.floor(Math.random() * (999999 - 100000)) + 100000
                            });
                            activationCode
                                .save()
                                .then(result => {
                                    sms.Send({
                                        message: "به مجموعه ی همیار ولنس خوش آمدید \n کد تایید شما: " + result.authCode,
                                        receptor: user.phone,
                                        linenumber: "10004346"
                                    },
                                        function (response, status) {
                                            console.log(response);
                                            console.log(status);
                                        })
                                    res.status(201).json({ success: true, message: "message sent" });
                                })
                                .catch(err => {
                                    res.status(500).json({ success: false, message: "error sending activation code", error: err });
                                })
                        } else {
                            res.status(409).json({ success: false, message: "User already activated" });
                        }
                    })
            }
        })
        .catch(err => {
            res.status(500).json({ success: false, message: "error sending activation code", error: err });
        })
};

exports.activateUser = (req, res) => {
    ActivationCode.find({ user: req.body.userId })
        .exec()
        .then(result => {
            if (req.body.avtivationCode == result.authCode) {
                User.findByIdAndUpdate({ _id: req.body.userId }, { active: true }, { new: true })
                    .exec()
                    .then(result => {
                        res.status(201).json({ success: true, message: "user activated", data: result });
                    })
                    .catch(err => {
                        res.status(500).json({ success: false, message: "error activating the user", error: err })
                    })
            } else {
                res.status(401).json({ success: false, message: "Wrong code" });
            }
        })
        .catch(err => {
            res.status(500).json({ success: false, message: "error activating the user", error: err })
        })
};

exports.getMyProfile = (req, res) => {
    User.findById(req.userData.userId)
        .exec()
        .then(result => {
            if (result.image) {
                const signedUrlExpireSeconds = 60 * 5
                 const data = s3.getSignedUrl('getObject', {
                    Bucket: "cyclic-tame-rose-clownfish-ring-us-west-1",
                    Key: result.image,
                    Expires: signedUrlExpireSeconds
                });
                result.image = data;
            }
            res.status(200).json({ success: true, data: result });
        })
        .catch(err => {
            res.status(500).json({ success: false, message: "error getting the user", error: err })
        })
};

exports.updateMyProfile = async (req, res) => {

    const updateOps = {};
    console.log(req.file);
    for (const [objKey, value] of Object.entries(req.body)) {
        if (objKey != "passwordHash" || objKey != "active" || objKey != "phone") {
            updateOps[objKey] = value;
        }
    }
    if (req.file) {
        const filename = Date.now() + req.file.originalname;
        await s3.putObject({
            Body: req.file.buffer,
            Bucket: "cyclic-tame-rose-clownfish-ring-us-west-1",
            Key: filename,
        }).promise()
        updateOps["image"] = filename
    }
    User.findByIdAndUpdate({ _id: req.userData.userId }, { $set: updateOps }, { new: true })
        .exec()
        .then((doc) => {
            res.status(200).json({ success: true, data: doc });
        })
        .catch((err) => {
            res.status(500).json({ success: false, message: "error updating the profile", error: err });
        });
};

exports.updatePassword = (req, res) => {
    User.findOne({ _id: req.userData.userId })
        .select("active _id passwordHash phone")
        .exec()
        .then((user) => {
            if (user) {
                bcrypt.compare(req.body.oldPassword, user.passwordHash, (err, result) => {
                    console.log(result);
                    if (err) {
                        return res.status(401).json({ success: false, message: "Authorization failed" });
                    } else if (result) {
                        bcrypt.hash(req.body.password, 10, (err, hash) => {
                            if (err) {
                                return res.status(500).json({ succes: false, message: 'Error hashing the password', error: err });
                            } else {
                                const pass = {
                                    passwordHash: hash,
                                };
                                User.findByIdAndUpdate({ _id: req.userData.userId }, { $set: pass }, { new: true })
                                    .exec()
                                    .then((doc) => {
                                        res.status(200).json({ success: true, data: doc });
                                    })
                                    .catch((err) => {
                                        res.status(500).json({ success: false, message: "error updating the password", error: err });
                                    });
                            }
                        })
                    } else {
                        return res.status(401).json({ success: false, message: "Authorization failed" });
                    }
                });
            } else {
                res.status(401).json({ success: false, message: "Authorization failed" });
            }
        })
        .catch((err) => {
            res.status(500).json({ success: false, error: err });
        });
}

exports.forgotPassword = (req, res) => {
    console.log(req.userData)
    ForgotPass.find({ user: req.userData.userId })
        .exec()
        .then(result => {
            if (result.length >= 1) {
                //send prev code
            } else {
                User.findOne({ _id: req.userData.userId })
                    .select("active phone")
                    .exec()
                    .then((user) => {
                        console.log(user.active)
                        const forgotenpass = new ForgotPass({
                            user: req.userData.userId,
                            authCode: Math.floor(Math.random() * (999999 - 100000)) + 100000
                        });
                        forgotenpass
                            .save()
                            .then(result => {
                                // sms.send({
                                //     message: "به مجموعه ی همیار ولنس خوش آمدید \n کد تایید شما: " + result.authCode,
                                //     receptor: user.phone,
                                //     linenumber: "10008566"
                                // });
                                res.status(201).json({ success: true, message: "message sent" });
                            })
                            .catch(err => {
                                res.status(500).json({ success: false, message: "error sending activation code", error: err });
                            })

                    })
            }
        })
        .catch(err => {
            res.status(500).json({ success: false, message: "error sending activation code", error: err });
        })
}

exports.changeForgottenPass = (req, res) => {
    ForgotPass.findOne({ user: req.userData.userId })
        .exec()
        .then((fp) => {
            if (fp.authCode == req.body.authCode) {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).json({ succes: false, message: 'Error hashing the password', error: err });
                    } else {
                        const pass = {
                            passwordHash: hash,
                        };
                        User.findByIdAndUpdate({ _id: req.userData.userId }, { $set: pass }, { new: true })
                            .exec()
                            .then((doc) => {
                                res.status(200).json({ success: true, data: doc });
                            })
                            .catch((err) => {
                                res.status(500).json({ success: false, message: "error updating the password", error: err });
                            });
                        ForgotPass.deleteOne({ _id: fp._id }).exec().then().catch(err => console.log(err))
                    }
                })
            } else {
                res.status(401).json({ success: false, message: "AuthCode is not correct" });
            }
        })
        .catch((err) => {
            res.status(500).json({ success: false, error: err });
        });
}

exports.checkLogin = (req, res) => {
    return (res.status(200).json({ success: true, msg: "you are logged in" }))
}

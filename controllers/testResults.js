const { TestResult } = require('../models/testResults');
const AWS = require("aws-sdk");
const s3 = new AWS.S3()
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


exports.createTestResult = async (req, res) => {
    console.log(req.file)
    const filename = Date.now() + req.file.originalname;
    await s3.putObject({
        Body: req.file.buffer,
        Bucket: "cyclic-tame-rose-clownfish-ring-us-west-1",
        Key: filename,
    }).promise()
    const testResult = new TestResult({
        customer: req.body.customer,
        uploader: req.body.uploader,
        testType: req.body.testType,
        resultFile: filename,
    });
    testResult
        .save()
        .then(result => {
            res.status(200).json({ success: true, data: result })
        })
        .catch(err => {
            res.status(500).json({ success: false, error: err })
        })
};

exports.getAllResults = (req, res) => {
    TestResult
        .find()
        .select('-__v')
        .populate('customer', 'firstname lastname _id')
        .populate('uploader', 'firstname lastname _id')
        .then(result => {
            if (result.length === 0) {
                res.status(404).json({ status: false, message: "No content" });
            } else {
                result.forEach(item => {
                    const signedUrlExpireSeconds = 60 * 5
                    const data = s3.getSignedUrl('getObject', {
                        Bucket: "cyclic-tame-rose-clownfish-ring-us-west-1",
                        Key: item.resultFile,
                        Expires: signedUrlExpireSeconds
                    });
                    item.resultFile = data;
                });
                res.status(200).json({ status: true, data: result });
            }
        })
};

exports.getOneResults = (req, res) => {
    console.log("check");
    TestResult
        .find({ customer: req.userData.userId })
        .select('-__v')
        .populate('customer', 'firstname lastname _id')
        .populate('uploader', 'firstname lastname _id')
        .then(result => {
            if (result.length === 0) {
                res.status(404).json({ status: false, message: "No content" });
            } else {
                result.forEach(item => {
                    const signedUrlExpireSeconds = 60 * 5
                    const data = s3.getSignedUrl('getObject', {
                        Bucket: "cyclic-tame-rose-clownfish-ring-us-west-1",
                        Key: item.resultFile,
                        Expires: signedUrlExpireSeconds
                    });
                    item.resultFile = data;
                });
                res.status(200).json({ status: true, data: result });
            }
        })
};

exports.deleteResult = (req, res) => {
    TestResult
        .deleteOne({ _id: req.params.id })
        .exec()
        .then(result => {
            if (result) {
                res.status(202).json({ success: true, message: 'Result deleted successfuly ' })
            } else {
                res.status(404).json({ success: false, message: 'Result id incorect' })
            }
        })
        .catch(err => {
            res.status(500).json({ success: false, message: 'Error deleting Result', error: err })
        });
};

exports.updateResult = async (req, res) => {
    console.log(req.file)
    const filename = Date.now() + req.file.originalname;
    await s3.putObject({
        Body: req.file.buffer,
        Bucket: "cyclic-tame-rose-clownfish-ring-us-west-1",
        Key: filename,
    }).promise()
    const updateOps = {
        customer: req.body.customer,
        uploader: req.body.uploader,
        resultFile: filename
    };
    TestResult.findByIdAndUpdate({ _id: req.params.id }, { $set: updateOps }, { new: true })
        .exec()
        .then((doc) => {
            res.status(200).json({ success: true, data: doc });
        })
        .catch((err) => {
            res.status(500).json({ success: false, message: "error updating the result", error: err });
        });
};

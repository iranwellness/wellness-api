const { Product } = require('../models/products');
const { CartProduct } = require('../models/cart');

const AWS = require("aws-sdk");
const s3 = new AWS.S3()
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


exports.getAllProducts = (req, res) => {
    Product.find().lean().then(productList => {
        if (productList.length > 0) {
            productList.forEach((product, index) => {
                const signedUrlExpireSeconds = 60 * 5
                const data = s3.getSignedUrl('getObject', {
                    Bucket: "cyclic-tame-rose-clownfish-ring-us-west-1",
                    Key: product.image,
                    Expires: signedUrlExpireSeconds
                });
                console.log(productList[index]);
                productList[index]['image'] = data;

            });
            res.status(200).json({ success: true, data: productList });
        } else {
            res.status(404).json({ success: false, message: 'No Content' });
        }
    }).catch(err => {
        res.status(500).json({ success: false, message: err })
    });
};

exports.createProduct = async (req, res) => {
    console.log(req.file);
    const imageName = Date.now() + req.file.originalname;
    await s3.putObject({
        Body: req.file.buffer,
        Bucket: "cyclic-tame-rose-clownfish-ring-us-west-1",
        Key: imageName,
    }).promise()


    const product = new Product({
        name: req.body.name,
        image: imageName,
        description: req.file.description,
        richDescription: req.file.richDescription,
        countInStock: req.body.countInStock,
        category: req.body.category,
        brand: req.body.brand,
        price: req.body.price,
        isFeatured: req.body.isFeatured,
    });
    product.save().then(createdProduct => {
        res.status(201).json(createdProduct)
    }).catch(err => {
        res.status(500).json({
            error: err,
            success: false
        })
    });
};

exports.getAProduct = (req, res) => {
    Product.find({ _id: req.params.id }).lean().then(productList => {
        console.log(productList)
        if (productList.length < 1) {
            res.status(404).json({ success: false, message: 'No Content' });
        } else {
            const signedUrlExpireSeconds = 60 * 5
                const data = s3.getSignedUrl('getObject', {
                    Bucket: "cyclic-tame-rose-clownfish-ring-us-west-1",
                    Key: product.image,
                    Expires: signedUrlExpireSeconds
                });
                console.log(productList[index]);
                productList[index]['image'] = data;

            res.status(200).json({ success: true, data: productList[0] });
        }
    }).catch(err => {
        res.status(500).json({ success: false, message: err })
    });
}

exports.searchProducts = (req, res) => {
    console.log(req.query)
    Product.find(req.query).lean().then(productList => {
        if (productList.length < 1) {
            res.status(404).json({ success: false, message: 'No Content' });
        } else {
            const signedUrlExpireSeconds = 60 * 5
                const data = s3.getSignedUrl('getObject', {
                    Bucket: "cyclic-tame-rose-clownfish-ring-us-west-1",
                    Key: product.image,
                    Expires: signedUrlExpireSeconds
                });
                console.log(productList[index]);
                productList[index]['image'] = data;

            res.status(200).json({ success: true, data: productList });
        }
    })
        .catch(err => {
            res.status(500).json({ success: false, message: err })
        });
};

exports.newCart = (req, res) => {
    const cart = new CartProduct({
        user: req.userData.userId,
        product: req.body.product,
        qty: req.body.qty,
    });
    cart.save().then(createdProduct => {
        res.status(201).json(createdProduct)
    }).catch(err => {
        res.status(500).json({
            error: err,
            success: false
        })
    });
}

exports.deleteCartItem = (req, res) => {
    CartProduct.deleteOne({ _id: req.params.id }).exec().then(result => {
        res.status(200).json({ success: true, message: 'item removed' });
    }).catch(err => {
        res.status(500).json({ success: false, message: 'Failed to item user', error: err });
    })
}

exports.editCartItem = (req, res) => {
    const updateOps = {};
    for (const [objKey, value] of Object.entries(req.body)) {
        updateOps[objKey] = value;
    }
    CartProduct.findByIdAndUpdate({ _id: req.params.id }, { $set: updateOps }, { new: true })
        .exec()
        .then((doc) => {
            res.status(200).json({ success: true, data: doc });
        })
        .catch((err) => {
            res.status(500).json({ success: false, message: "error updating the cart", error: err });
        });
}

exports.getMyCart = (req, res) => {
    CartProduct.find({ user: req.userData.userId })
        .populate('product')
        .exec()
        .then(result => {
            res.status(200).json({ success: true, data: result });
        })
        .catch(err => {
            res.status(500).json({ success: false, message: "error getting the cart", error: err })
        })
}

const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// Get all products
router.get('/', (req, res) => {
    Product.findAll({
        attributes: ['id', 'product_name', 'price', 'stock', 'category_id'],
        include: [
            {
                model: Category,
                attributes: ['id', 'category_name']
            },
            {
                model: Tag,
                attributes: ['id', 'tag_name']
            }
        ]
    }).then(dbProductData => res.json(dbProductData))
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
});

// Get one product
router.get('/:id', (req, res) => {
  
   
    Product.findOne({
        where: {
            id: req.params.id
        },
        attributes: ['id', 'product_name', 'price', 'stock', 'category_id'],
        include: [
            {
                model: Category,
                attributes: ['id', 'category_name']
            },
            {
                model: Tag,
                attributes: ['id', 'tag_name']
            }
        ]
    }) .then(dbProductData => {
            if (!dbProductData) {
                res.status(404).json({ message: 'No product found with this id' });
                return;
            }
            res.json(dbProductData);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
});

// POST a new product
router.post('/', (req, res) => {
    Product.create(req.body)
        .then((product) => {
            // if there's product tags, we need to create pairings to bulk create in the ProductTag model
            if (req.body.tagIds.length) {
                const productTagIdArr = req.body.tagIds.map((tag_id) => {
                    return {
                        product_id: product.id,
                        tag_id,
                    };
                });
                return ProductTag.bulkCreate(productTagIdArr);
            }
            // if no product tags, just respond
            res.status(200).json(product);
        })
        .then((productTagIds) => res.status(200).json(productTagIds))
        .catch((err) => {
            console.log(err);
            res.status(400).json(err);
        });
});

// PUT- Updates product
router.put('/:id', (req, res) => {
   
    Product.update(req.body, {
        where: {
            id: req.params.id,
        },
    }).then((product) => {
            // Finds associated Product Tag
            return ProductTag.findAll({ where: { product_id: req.params.id } });
        }).then((productTags) => {
            // Gets list of current id
            const productTagIds = productTags.map(({ tag_id }) => tag_id);
           //Filters list for ID
            const newProductTags = req.body.tagIds
                .filter((tag_id) => !productTagIds.includes(tag_id))
                .map((tag_id) => {
                    return {
                        product_id: req.params.id,
                        tag_id,
                    };
                });
            //Searches tag to remove
            const productTagsToRemove = productTags
                .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
                .map(({ id }) => id);


            return Promise.all([
                ProductTag.destroy({ where: { id: productTagsToRemove } }),
                ProductTag.bulkCreate(newProductTags),
            ]);
        })
        .then((updatedProductTags) => res.json(updatedProductTags))
        .catch((err) => {
            // console.log(err);
            res.status(400).json(err);
        });
});
//Deletes the Product
router.delete('/:id', (req, res) => {
    Product.destroy({
        where: {
            id: req.params.id
        }
    })
        .then(dbProductData => {
            if (!dbProductData) {
                res.status(404).json({ message: 'No product found with this id' });
                return;
            }
            res.json(dbProductData);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
});
module.exports = router;

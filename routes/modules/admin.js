const express = require('express')
const router = express.Router()

// 新增，載入 controller
const adminController = require('../../controllers/admin-controller')

// 新增
router.get('/restaurants', adminController.getRestaurants)
router.use('/', (req, res) => res.redirect('/admin/restaurants'))

module.exports = router
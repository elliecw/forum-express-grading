const express = require('express')
const router = express.Router()

// 新增，載入 controller
const adminController = require('../../controllers/admin-controller')
const upload = require('../../middleware/multer')

// 新增
router.get('/restaurants/create', adminController.createRestaurant)
router.get('/restaurants/:id/edit', adminController.editRestaurant)
router.get('/restaurants/:id', adminController.getRestaurant)
router.put('/restaurants/:id', upload.single('image'), adminController.putRestaurant)
router.delete('/restaurants/:id', adminController.deleteRestaurant)
router.get('/restaurants', adminController.getRestaurants)
router.post('/restaurants', upload.single('image'), adminController.postRestaurant)
router.get('/users/:id', adminController.getUser)
router.get('/users', adminController.getUsers)
router.use('/', (req, res) => res.redirect('/admin/restaurants'))

module.exports = router

const { Restaurant, Category, Comment, User } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')
const restaurantController = {
  getRestaurants: (req, res, next) => {
    const DEFAULT_LIMIT = 9
    const categoryId = Number(req.query.categoryId) || '' // 新增這裡，從網址上拿下來的參數是字串，先轉成 Number 再操作
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)
    return Promise.all([
      Restaurant.findAndCountAll({
        include: Category,
        where: { // 新增查詢條件
          ...categoryId ? { categoryId } : {} // 檢查 categoryId 是否為空值
        },
        limit,
        offset,
        nest: true,
        raw: true
      }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurants, categories]) => {
        const favoritedRestaurantsId = req.user && req.user.FavoritedRestaurants.map(fr => fr.id)
        const likedRestaurantsId = req.user && req.user.LikedRestaurants.map(fr => fr.id)
        const data = restaurants.rows.map(r => ({
          ...r,
          description: r.description.substring(0, 50),
          isFavorited: favoritedRestaurantsId.includes(r.id),
          isLiked: likedRestaurantsId.includes(r.id)
        }))
        return res.render('restaurants', {
          restaurants: data,
          categories,
          categoryId,
          pagination: getPagination(limit, page, restaurants.count) // 修改這裡，把 pagination 資料傳回樣板
        })
      })
      .catch(err => next(err))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ]
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        restaurant.increment('view_counts', { by: 1 })

        const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
        const isLiked = restaurant.LikedUsers.some(f => f.id === req.user.id)

        res.render('restaurant', {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: Category,
      nest: true,
      raw: true
    })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")
        res.render('dashboard', { restaurant })
      })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        res.render('feeds', {
          restaurants,
          comments
        })
      })
      .catch(err => next(err))
  },
  // getTopRestaurants: (req, res, next) => {
  //   return Restaurant.findAll({
  //     limit: 10,
  //     include: [{ model: User, as: 'FavoritedUsers' }]
  //   })
  //     .then(restaurants => {
  //       const result = restaurants
  //         .map(restaurant => ({
  //           ...restaurant.toJSON(),
  //           favoritedCount: restaurant.FavoritedUsers.length,
  //           description: restaurant.description.substring(0, 50),
  //           isFavorited: req.user && req.user.FavoritedRestaurants.some(fr => fr.id === restaurant.id)
  //         }))
  //         .sort((a, b) => b.favoritedCount - a.favoritedCount)
  //       res.render('top-restaurants', { restaurants: result })
  //     })
  //     .catch(err => next(err))
  // },
  getTopRestaurants: (req, res, next) => {
    return Restaurant.findAll({ // 撈出所有 User 與 restaurants 資料
      limit: 10,
      include: [{ model: User, as: 'FavoritedUsers' }]
    })
      .then(restaurants => {
        restaurants = restaurants.map(restaurant => ({ // 整理 restaurants 資料，把每個 restaurant 項目都拿出來處理一次，並把新陣列儲存在 users 裡
          ...restaurant.toJSON(), // 整理格式
          favoritedCount: restaurant.FavoritedUsers.length, // 計算收藏人數
          description: restaurant.description.substring(0, 50),
          isFavorited: req.user && req.user.FavoritedRestaurants.some(fr => fr.id === restaurant.id) // 判斷目前登入使用者是否已收藏該餐廳
        }))
        restaurants = restaurants.sort((a, b) => b.favoritedCount - a.favoritedCount)
        res.render('top-restaurants', { restaurants })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController

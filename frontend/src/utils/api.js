import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 从本地存储获取用户信息
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const { id, user_type } = JSON.parse(userInfo)
      config.headers['user-id'] = id
      config.headers['user-type'] = user_type
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    // 处理错误
    if (error.response) {
      // 提取后端返回的错误消息
      const errorMessage = error.response.data?.message || '请求失败'
      
      switch (error.response.status) {
        case 400:
          // 400错误通常是参数错误，将错误消息附加到error对象上
          error.message = errorMessage
          break
        case 401:
          // 未登录，跳转到登录页面
          // 但如果已经在登录页面，则不跳转，以便显示错误提示
          localStorage.removeItem('userInfo')
          // 检查当前页面是否已经是登录页面
          const currentPath = window.location.pathname
          if (currentPath !== '/login') {
            window.location.href = '/login'
          }
          error.message = errorMessage
          break
        case 403:
          // 权限不足
          console.error('权限不足')
          error.message = errorMessage
          break
        case 404:
          // 资源不存在
          console.error('请求的资源不存在')
          error.message = errorMessage
          break
        default:
          console.error('请求失败:', errorMessage)
          error.message = errorMessage
      }
    } else if (error.request) {
      console.error('网络错误，请检查网络连接')
      error.message = '网络错误，请检查网络连接'
    } else {
      console.error('请求配置错误:', error.message)
      // error.message 已经存在
    }
    return Promise.reject(error)
  }
)

// 用户管理相关API
// 用户注册
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/users/register', userData)
    return response
  } catch (error) {
    throw error
  }
}

// 用户登录
export const loginUser = async (loginData) => {
  try {
    const response = await api.post('/users/login', loginData)
    // 保存完整的用户信息到本地存储，包括user_type和avatar
    const userInfo = {
      id: response.user_id,
      username: response.username,
      email: response.email,
      avatar: response.avatar,
      user_type: response.user_type 
    }

    //将获取到的信息存到浏览器缓存
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
    return userInfo
  } catch (error) {
    throw error
  }
}

// 获取用户信息
export const getUserInfo = async () => {
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (!userInfo) {
      throw new Error('未登录')
    }
    const cached = JSON.parse(userInfo)
    try {
      const response = await api.get('/users/profile')
      const mergedInfo = { ...cached, ...response }
      localStorage.setItem('userInfo', JSON.stringify(mergedInfo))
      return mergedInfo
    } catch (error) {
      if (error.response?.status === 401) {
        throw error
      }
      console.error('刷新用户信息失败，使用本地缓存:', error)
      return cached
    }
  } catch (error) {
    throw error
  }
}

// 更新用户信息
export const updateUserInfo = async (userData) => {
  try {
    const response = await api.put('/users/profile', userData)
    // 更新本地存储的用户信息
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const updatedUserInfo = { ...JSON.parse(userInfo), ...userData }
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
    }
    return response
  } catch (error) {
    throw error
  }
}

// 用户登出
export const logout = async () => {
  try {
    // 清除本地存储的用户信息
    localStorage.removeItem('userInfo')
    return { message: '登出成功' }
  } catch (error) {
    throw error
  }
}

// 获取用户列表（管理员）
export const getUsers = async (params = {}) => {
  try {
    const response = await api.get('/users', { params })
    return response
  } catch (error) {
    throw error
  }
}

// 切换用户状态（启用/禁用）
export const toggleUserStatus = async (userId) => {
  try {
    const response = await api.put(`/users/${userId}/toggle`)
    return response
  } catch (error) {
    throw error
  }
}

// 商品管理相关API
// 创建商品
export const createProduct = async (productData) => {
  try {
    const response = await api.post('/products', productData)
    return response
  } catch (error) {
    throw error
  }
}

// 获取商品列表
export const getProducts = async (params = {}) => {
  try {
    const response = await api.get('/products', { params })
    return response
  } catch (error) {
    throw error
  }
}

// 获取商品详情
export const getProductDetail = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}`)
    return response
  } catch (error) {
    throw error
  }
}

// 更新商品
export const updateProduct = async (productId, productData) => {
  try {
    const response = await api.put(`/products/${productId}`, productData)
    return response
  } catch (error) {
    throw error
  }
}

// 删除商品
export const deleteProduct = async (productId) => {
  try {
    const response = await api.delete(`/products/${productId}`)
    return response
  } catch (error) {
    throw error
  }
}

// 禁用/启用商品（管理员）
export const toggleProductStatus = async (productId, payload = {}) => {
  try {
    const response = await api.put(`/products/${productId}/toggle`, payload)
    return response
  } catch (error) {
    throw error
  }
}

// 交易管理相关API
// 创建交易请求
export const createTransaction = async (transactionData) => {
  try {
    const response = await api.post('/transactions', transactionData)
    return response
  } catch (error) {
    throw error
  }
}

// 获取交易列表
export const getTransactions = async (params = {}) => {
  try {
    const response = await api.get('/transactions', { params })
    return response
  } catch (error) {
    throw error
  }
}

// 获取交易详情
export const getTransactionDetail = async (transactionId) => {
  try {
    const response = await api.get(`/transactions/${transactionId}`)
    return response
  } catch (error) {
    throw error
  }
}

// 接受交易
export const acceptTransaction = async (transactionId) => {
  try {
    const response = await api.put(`/transactions/${transactionId}/accept`)
    return response
  } catch (error) {
    throw error
  }
}

// 拒绝交易
export const rejectTransaction = async (transactionId, reason) => {
  try {
    const response = await api.put(`/transactions/${transactionId}/reject`, { reason })
    return response
  } catch (error) {
    throw error
  }
}

// 工具函数：获取交易状态的中文描述
export const getTransactionStatusText = (status) => {
  const statusMap = {
    'pending': '待处理',
    'completed': '交易成功',
    'cancelled': '交易失败'
  }
  return statusMap[status] || status
}

// 工具函数：获取商品状态的中文描述
export const getProductStatusText = (status) => {
  const statusMap = {
    'available': '可交易',
    'pending': '交易中',
    'sold': '已售出'
  }
  return statusMap[status] || status
}

// 工具函数：获取商品新旧程度的中文描述
export const getProductConditionText = (condition) => {
  const conditionMap = {
    'new': '全新',
    'like_new': '几乎全新',
    'good': '良好',
    'fair': '一般',
    'poor': '较差'
  }
  return conditionMap[condition] || condition
}

// 工具函数：格式化日期
export const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 工具函数：格式化价格
export const formatPrice = (price) => {
  return `¥${parseFloat(price).toFixed(2)}`
}

// 收藏相关API
// 添加收藏
export const addFavorite = async (productId) => {
  try {
    const response = await api.post('/favorites', { product_id: productId })
    return response
  } catch (error) {
    throw error
  }
}

// 取消收藏
export const removeFavorite = async (productId) => {
  try {
    const response = await api.delete(`/favorites/${productId}`)
    return response
  } catch (error) {
    throw error
  }
}

// 获取用户收藏列表
export const getFavorites = async () => {
  try {
    const response = await api.get('/favorites')
    return response
  } catch (error) {
    throw error
  }
}

// 检查商品是否已收藏
export const checkFavorite = async (productId) => {
  try {
    const response = await api.get(`/favorites/check/${productId}`)
    return response
  } catch (error) {
    return { is_favorite: false }
  }
}

// 联系卖家
export const contactSeller = async (productId, payload = {}) => {
  try {
    const response = await api.post('/contact-requests', { product_id: productId, ...payload })
    return response
  } catch (error) {
    throw error
  }
}

// 获取联系卖家的消息
export const getContactRequests = async (params = {}) => {
  try {
    const response = await api.get('/contact-requests', { params })
    return response
  } catch (error) {
    throw error
  }
}

// 卖家回复消息
export const replyContactRequest = async (contactId, replyMessage) => {
  try {
    const response = await api.put(`/contact-requests/${contactId}/reply`, { reply: replyMessage })
    return response
  } catch (error) {
    throw error
  }
}

// 标记消息为已读
export const markContactRequestRead = async (contactId) => {
  try {
    const response = await api.put(`/contact-requests/${contactId}/read`)
    return response
  } catch (error) {
    throw error
  }
}

// 获取未读消息数量
export const getUnreadCount = async (role = 'seller') => {
  try {
    const response = await api.get('/contact-requests/unread-count', { params: { role } })
    return response
  } catch (error) {
    throw error
  }
}

// 管理员统计信息
export const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/stats')
    return response
  } catch (error) {
    throw error
  }
}

// 导出api实例，以便在需要时直接使用
export default api
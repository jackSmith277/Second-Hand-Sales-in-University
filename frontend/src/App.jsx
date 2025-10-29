import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout, message } from 'antd'
const { Content, Footer } = Layout
import { HomeOutlined, UserOutlined, ShoppingOutlined, TransactionOutlined, LogoutOutlined } from '@ant-design/icons'
import CustomHeader from './components/Header.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import ProductList from './pages/ProductList.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import CreateProduct from './pages/CreateProduct.jsx'
import EditProduct from './pages/EditProduct.jsx'
import TransactionList from './pages/TransactionList.jsx'
import TransactionDetail from './pages/TransactionDetail.jsx'
import UserManagement from './pages/UserManagement.jsx'
import Favorites from './pages/Favorites.jsx'
import { getUserInfo, logout } from './utils/api.js'
import './App.css'

// 权限控制组件
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
  
  if (!userInfo) {
    message.error('请先登录')
    return <Navigate to="/login" replace />;
  }
  
  // 如果需要特定角色权限
  if (requiredRole && userInfo.user_type !== requiredRole) {
    message.error('没有权限访问此页面');
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// 管理员权限组件
const AdminRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
};



function App() {

  //绑定一些常见对象和方法
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedKeys, setSelectedKeys] = useState(['home'])//默认选中首页

  //这里存储当前用户信息的策略是采用localStorage，在浏览器中使用本地缓存
  // 加载用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // 优先从localStorage获取用户信息
        const storedUserInfo = localStorage.getItem('userInfo')
        if (storedUserInfo) {
          const userInfo = JSON.parse(storedUserInfo)
          setCurrentUser(userInfo)
          setLoading(false)
          return
        }
        
        // 如果localStorage中没有，尝试从API获取
        const userInfo = await getUserInfo()
        setCurrentUser(userInfo)
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }
    fetchUserInfo()
  }, [])

  // 处理退出登录
  const handleLogout = async () => {
    try {
      await logout()
      // 清除localStorage中的用户信息
      localStorage.removeItem('userInfo')
      localStorage.removeItem('isLoggedIn')
      setCurrentUser(null)
      window.location.href = '/login'
    } catch (error) {
      // 即使API调用失败，也清除本地存储并跳转
      localStorage.removeItem('userInfo')
      localStorage.removeItem('isLoggedIn')
      setCurrentUser(null)
      window.location.href = '/login'
      console.error('退出登录失败:', error)
    }
  }

  // 处理菜单点击
  const handleMenuClick = (e) => {
    setSelectedKeys([e.key])

  }



  // 渲染头部导航
  const renderHeader = () => (
    <CustomHeader currentUser={currentUser} onLogout={handleLogout} />
  )

  // 渲染内容区域
  const renderContent = () => (
    <Content className="main-content">
      <div className="container">
        <Routes>
            {/* 公开路由 */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            
            {/* 需要登录的路由 */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/create-product" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
            <Route path="/edit-product/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><TransactionList /></ProtectedRoute>} />
            <Route path="/transactions/:id" element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />
            
            {/* 管理员专属路由 */}
            <Route path="/user-management" element={<AdminRoute><UserManagement /></AdminRoute>} />
          </Routes>
      </div>
    </Content>
  )

  // 渲染底部
  const renderFooter = () => (
    <Footer className="footer">
      <div className="container">
        <p>© 2023 校园二手商品交易系统 版权所有</p>
      </div>
    </Footer>
  )

  if (loading) {
    return <div>加载中...</div>
  }

  return (
    <Router>
      <Layout className="layout">
        {renderHeader()}
        {renderContent()}
        {renderFooter()}
      </Layout>
    </Router>
  )
}

export default App
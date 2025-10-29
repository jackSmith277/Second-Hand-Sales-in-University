import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Avatar, Dropdown, Badge, Tag } from 'antd'
import { ShoppingOutlined, UserOutlined, HeartOutlined, HomeOutlined, BookOutlined, UserSwitchOutlined, LogoutOutlined } from '@ant-design/icons'
import styled from 'styled-components'

const { Header } = Layout

const CustomHeader = ({ currentUser, onLogout }) => {
  const [userInfo, setUserInfo] = useState(currentUser)
  const [selectedKeys, setSelectedKeys] = useState([])
  const location = useLocation()
  
  useEffect(() => {
    // 如果没有传入currentUser，从localStorage获取
    if (!currentUser) {
      const storedUser = localStorage.getItem('userInfo')
      if (storedUser) {
        setUserInfo(JSON.parse(storedUser))
      }
    } else {
      setUserInfo(currentUser)
    }
  }, [currentUser])
  
  // 监听路由变化，更新选中状态
  useEffect(() => {
    const pathname = location.pathname
    const search = location.search
    
    if (pathname === '/') {
      setSelectedKeys(['home'])
    } else if (pathname === '/products') {
      setSelectedKeys(['products'])
    } else if (pathname === '/user-management') {
      setSelectedKeys(['user-management'])
    } else if (pathname === '/transactions' && search.includes('view=all')) {
      // 管理员的交易管理页面
      setSelectedKeys(['transactions-admin'])
    } else if (pathname === '/transactions') {
      // 普通用户的交易页面
      setSelectedKeys(['transactions'])
    }
  }, [location.pathname, location.search])

  // 用户下拉菜单
    const userMenu = (
      <Menu>
        <Menu.Item key="my-profile" icon={<UserOutlined />}>
          <a href="/profile">个人中心</a>
        </Menu.Item>

        <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={onLogout}>
          退出登录
        </Menu.Item>
      </Menu>
    )

  return (
    <CustomHeaderContainer>
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <Link to="/">校园二手商品交易系统</Link>
          </div>
          <Menu 
            mode="horizontal" 
            className="main-menu"
            selectedKeys={selectedKeys}
          >
            <Menu.Item key="home" icon={<HomeOutlined />}>
              <Link to="/">首页</Link>
            </Menu.Item>
            <Menu.Item key="products" icon={<BookOutlined />}>
              <Link to="/products">商品列表</Link>
            </Menu.Item>
            {/* <Menu.Item key="create-product">
              <Link to="/create-product">发布商品</Link>
            </Menu.Item> */}
            {/*管理员管理交易*/}
            {userInfo && userInfo.user_type === 'admin' && (
              <>
              <Menu.Item key="transactions-admin" icon={<ShoppingOutlined />}>
                <Link to="/transactions?view=all">交易管理</Link>
              </Menu.Item>
              <Menu.Item key="user-management" icon={<UserSwitchOutlined />}>
                <Link to="/user-management">用户管理</Link>
              </Menu.Item>
              </>          
            )}

            {userInfo && userInfo.user_type !== 'admin' && (
              <Menu.Item key="transactions" icon={<ShoppingOutlined />}>
                <Link to="/transactions">我的交易</Link>
              </Menu.Item>
            )}
          </Menu>
        </div>
      
        <div className="header-right">
          {currentUser ? (
            <>
              <div className="nav-icon">
                <Link to="/favorites">
                  <HeartOutlined className="icon-large" />
                </Link>
              </div>
              <Dropdown overlay={userMenu} trigger={['click']}>
                <div className="user-info">
                  <Avatar size="large" src={userInfo?.avatar}>
                    {userInfo?.username?.[0] || 'U'}
                  </Avatar>
                  <span className="username">
                    {userInfo?.username}
                    {userInfo?.user_type === 'admin' && (
                      <Tag color="red" style={{ marginLeft: '8px' }}>管理员</Tag>
                    )}
                  </span>
                </div>
              </Dropdown>
            </>
          ) : (
            <>
              <Button className="login-btn">
                <Link to="/login">登录</Link>
              </Button>
              <Button type="primary" className="register-btn">
                <Link to="/register">注册</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </CustomHeaderContainer>
  )
}

// 样式组件
const CustomHeaderContainer = styled(Header)`
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 40px;
  }
  
  .logo {
    font-size: 24px;
    font-weight: bold;
    color: #1890ff;
  }
  
  .logo a {
    color: #1890ff;
    text-decoration: none;
  }
  
  .main-menu {
    border: none;
    background: transparent;
  }
  
  .main-menu .ant-menu-item {
    position: relative;
    transition: all 0.3s;
  }
  
  .main-menu .ant-menu-item-selected {
    color: #1890ff !important;
  }
  
  .main-menu .ant-menu-item-selected .anticon {
    color: #1890ff !important;
  }
  
  .main-menu .ant-menu-item-selected::after {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #1890ff;
    content: '';
    border: none;
  }
  

  
  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .nav-icon {
    font-size: 20px;
    cursor: pointer;
    padding: 8px;
    transition: all 0.3s;
  }
  
  .nav-icon:hover {
    color: #1890ff;
  }
  
  .icon-large {
    font-size: 20px;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .username {
    font-size: 14px;
    color: #333;
  }
  
  .login-btn {
    margin-right: 8px;
  }
  
  .login-btn a,
  .register-btn a {
    color: inherit;
    text-decoration: none;
  }
  
  @media (max-width: 1200px) {
    .header-center {
      max-width: 400px;
    }
  }
  
  @media (max-width: 768px) {
    padding: 0 12px;
    
    .header-content {
      flex-direction: row;
    }
    
    .header-left {
      gap: 16px;
    }
    
    .logo {
      font-size: 18px;
    }
    
    .main-menu {
      display: none;
    }
    
    .header-center {
      display: none;
    }
    
    .header-right {
      gap: 8px;
    }
    
    .nav-icon {
      display: none;
    }
    
    .username {
      display: none;
    }
  }
`

export default CustomHeader
import React, { useState, useEffect } from 'react'
import { Card, Tabs, Form, Input, Button, Avatar, message, Row, Col, Statistic, List, Divider, Tag } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined, EditOutlined, CheckOutlined, ShoppingOutlined, TransactionOutlined, HeartOutlined, UsergroupAddOutlined, TrophyOutlined } from '@ant-design/icons'
import { getUserInfo, updateUserInfo, getFavorites } from '../utils/api.js'
import styled from 'styled-components'

const { TabPane } = Tabs

const Profile = () => {
  const [form] = Form.useForm()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [stats, setStats] = useState({
    products: 0,
    transactions: 0,
    favorites: 0
  })

  // 初始空数据，将从API获取真实数据
  const defaultStats = {
    products: 0,
    transactions: 0,
    favorites: 0
  }

  // 加载用户信息和统计数据
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 获取用户信息
        const info = await getUserInfo()
        setUserInfo(info)
        form.setFieldsValue({
          username: info.username,
          email: info.email,
          phone: info.phone || '',
          avatar: info.avatar || ''
        })
        
        // 获取收藏统计数据
        try {
          const favoritesData = await getFavorites()
          // 更新收藏数量
          setStats(prev => ({
            ...prev,
            favorites: favoritesData.products?.length || 0
          }))
        } catch (error) {
          console.error('获取收藏统计失败:', error)
          // 继续使用默认值
          setStats(defaultStats)
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        message.error('获取用户信息失败，请重新登录')
      }
    }
    fetchUserData()
  }, [form])

  // 处理编辑
  const handleEdit = () => {
    setEditing(true)
  }

  // 处理取消编辑
  const handleCancel = () => {
    setEditing(false)
    if (userInfo) {
      form.setFieldsValue({
        username: userInfo.username,
        email: userInfo.email,
        phone: userInfo.phone,
        avatar: userInfo.avatar
      })
    }
  }

  // 处理保存
  const handleSave = async (values) => {
    setLoading(true)
    try {
      const response = await updateUserInfo(values)
      message.success('个人信息更新成功')
      setUserInfo({ ...userInfo, ...values })
      setEditing(false)
    } catch (error) {
      message.error(error.response?.data?.message || '更新失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 渲染个人信息表单
  const renderProfileForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
      className="profile-form"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8} className="profile-avatar-col">
          <div className="profile-avatar-section">
            <Avatar size={120} src={form.getFieldValue('avatar') || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} />
            <Form.Item name="avatar">
              <Input placeholder="头像URL" className="avatar-input" />
            </Form.Item>
          </div>
        </Col>
        <Col xs={24} md={16}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input disabled={!editing} placeholder="用户名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input disabled={!editing} placeholder="邮箱" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="手机号码"
            rules={[{ required: true, message: '请输入手机号码' }]}
          >
            <Input disabled={!editing} placeholder="手机号码" />
          </Form.Item>
          
          <div className="profile-actions">
            {editing ? (
              <>
                <Button type="primary" htmlType="submit" loading={loading}>
                  <CheckOutlined /> 保存
                </Button>
                <Button onClick={handleCancel} style={{ marginLeft: 8 }}>
                  取消
                </Button>
              </>
            ) : (
              <Button type="primary" onClick={handleEdit}>
                <EditOutlined /> 编辑资料
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </Form>
  )

  // 渲染统计信息
  const renderStatistics = () => {
    // 管理员统计信息
    if (userInfo?.user_type === 'admin') {
      return (
        <Row gutter={[16, 16]} className="profile-stats">
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="系统用户数量"
                value={stats.users || 250}
                prefix={<UsergroupAddOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="商品总数"
                value={stats.totalProducts || 1200}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="总交易量"
                value={stats.totalTransactions || 850}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#fa541c' }}
              />
            </Card>
          </Col>
        </Row>
      )
    }
    
    // 普通用户统计信息
    return (
      <Row gutter={[16, 16]} className="profile-stats">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="发布的商品"
              value={stats.products}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="交易记录"
              value={stats.transactions}
              prefix={<TransactionOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="收藏商品"
              value={stats.favorites}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>
    )
  }

  // 渲染我的商品
  const renderMyProducts = () => (
    <Card title="我的商品" extra={<a href="/products?my=1">查看全部</a>}>
      <List
        dataSource={[]} // 初始为空，后续可从API获取
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <a key="edit" href={`/edit-product/${item.id}`}>编辑</a>,
              <a key="view" href={`/products/${item.id}`}>查看</a>
            ]}
          >
            <List.Item.Meta
              title={<a href={`/products/${item.id}`}>{item.title}</a>}
              description={`发布时间: ${item.created_at} | 状态: ${item.status === 'available' ? '可交易' : item.status === 'pending' ? '交易中' : '已售出'}`}
            />
            <div className="product-price">¥{item.price}</div>
          </List.Item>
        )}
        locale={{ emptyText: <div className="empty-message">暂无发布的商品，<a href="/create-product">立即发布</a></div> }}
      />
    </Card>
  )

  // 渲染交易记录
  const renderTransactions = () => (
    <Card title="交易记录" extra={<a href="/transactions">查看全部</a>}>
      <List
        dataSource={[]} // 初始为空，后续可从API获取
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <a key="view" href={`/transactions/${item.id}`}>查看详情</a>
            ]}
          >
            <List.Item.Meta
              title={<a href={`/products?product_id=${item.id}`}>{item.product_title}</a>}
              description={`类型: ${item.type === 'buy' ? '购买' : '出售'} | 状态: ${getStatusText(item.status)}`}
            />
            <div className="product-price">¥{item.price}</div>
          </List.Item>
        )}
        locale={{ emptyText: <div className="empty-message">暂无交易记录</div> }}
      />
    </Card>
  )

  // 获取交易状态文本
  const getStatusText = (status) => {
    const statusMap = {
      'pending': '待处理',
      'accepted': '已接受',
      'completed': '已完成',
      'cancelled': '已取消'
    }
    return statusMap[status] || status
  }

  return (
    <ProfileContainer>
      <div className="profile-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1>{userInfo?.user_type === 'admin' ? '管理员中心' : '个人中心'}</h1>
          {userInfo && (
            <Tag color={userInfo.user_type === 'admin' ? 'red' : 'blue'}>
              {userInfo.user_type === 'admin' ? '管理员' : '学生'}
            </Tag>
          )}
        </div>
      </div>
      
      {renderStatistics()}
      
      <Divider />
      
      <Tabs defaultActiveKey="1" className="profile-tabs">
        <TabPane tab="基本信息" key="1">
          <Card className="profile-info-card">
            {renderProfileForm()}
          </Card>
        </TabPane>
        {userInfo?.user_type !== 'admin' && (
          <>
            <TabPane tab="我的商品" key="2">
              {renderMyProducts()}
            </TabPane>
            <TabPane tab="交易记录" key="3">
              {renderTransactions()}
            </TabPane>
          </>
        )}
        {userInfo?.user_type === 'admin' && (
          <TabPane tab="系统概览" key="4">
            <Card>
              <h3>管理员信息</h3>
              <p>欢迎使用管理员账号访问系统。作为管理员，您可以：</p>
              <ul>
                <li>管理所有用户账号</li>
                <li>查看全部交易记录</li>
                <li>监控系统运行状态</li>
              </ul>
              <Button type="primary" href="/user-management" style={{ marginTop: 16 }}>
                前往用户管理
              </Button>
              <Button href="/transactions?view=all" style={{ marginLeft: 8, marginTop: 16 }}>
                查看全部交易
              </Button>
            </Card>
          </TabPane>
        )}
      </Tabs>
    </ProfileContainer>
  )
}

// 样式组件
const ProfileContainer = styled.div`
  .profile-header {
    margin-bottom: 24px;
  }
  
  .profile-header h1 {
    font-size: 24px;
    font-weight: bold;
  }
  
  .profile-stats {
    margin-bottom: 24px;
  }
  
  .profile-info-card {
    margin-bottom: 24px;
  }
  
  .profile-avatar-col {
    display: flex;
    justify-content: center;
  }
  
  .profile-avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .avatar-input {
    margin-top: 16px;
    width: 200px;
  }
  
  .profile-actions {
    margin-top: 16px;
  }
  
  .profile-tabs {
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .product-price {
    font-size: 16px;
    font-weight: bold;
    color: #f5222d;
  }
  
  .empty-message {
    text-align: center;
    padding: 40px 0;
    color: #666;
  }
  
  @media (max-width: 768px) {
    .profile-avatar-col {
      margin-bottom: 20px;
    }
  }
`

export default Profile
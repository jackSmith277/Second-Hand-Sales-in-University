import React, { useState, useEffect } from 'react'
import { Descriptions, Card, Button, message, Tag, Timeline, Row, Col, Avatar, Divider, Spin } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, UserOutlined, ShoppingOutlined, CalendarOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons'
import { useParams, Link } from 'react-router-dom'
import { getTransactionDetail, cancelTransaction, formatPrice, formatDate, getTransactionStatusText, getProductConditionText } from '../utils/api.js'
import styled from 'styled-components'

const TransactionDetail = () => {
  const { id } = useParams()
  const [transaction, setTransaction] = useState(null)
  const [product, setProduct] = useState(null)
  const [buyer, setBuyer] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(false)
  const [timelineData, setTimelineData] = useState([])
  const [userInfo, setUserInfo] = useState(null)
  
  useEffect(() => {
    // 获取用户信息
    const storedUser = localStorage.getItem('userInfo')
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser))
    }
  }, [])

  // 模拟交易详情数据
  const mockTransactionDetail = {
    id: 't1',
    product_id: '1',
    product_title: '全新高等数学教材',
    buyer_id: 'b1',
    seller_id: 's1',
    price: 50,
    status: 'pending',
    created_at: '2023-10-18 14:30:00',
    updated_at: '2023-10-18 14:30:00',
    location: '一号教学楼大厅',
    remark: '希望尽快交易'
  }

  // 模拟商品数据
  const mockProduct = {
    id: '1',
    title: '全新高等数学教材',
    description: '全新未使用的高等数学教材，适合大一学生使用。这本书是高等教育出版社出版的最新版，内容全面，讲解清晰，是学习高等数学的必备教材。书中包含大量例题和习题，有助于巩固所学知识。由于我已经修完这门课程，所以现在低价转让给有需要的同学。',
    price: 50,
    category: '教材书籍',
    images: [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=book1'
    ],
    condition: 'new',
    created_at: '2023-10-15 10:30:00'
  }

  // 模拟买家数据
  const mockBuyer = {
    id: 'b1',
    username: '王同学',
    email: 'wang@school.edu',
    phone: '13800138002',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    created_at: '2023-09-01 08:00:00'
  }

  // 模拟卖家数据
  const mockSeller = {
    id: 's1',
    username: '李同学',
    email: 'li@school.edu',
    phone: '13800138001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
    created_at: '2023-08-15 10:00:00'
  }

  // 加载交易详情
  const loadTransactionDetail = async () => {
    setLoading(true)
    try {
      // 实际项目中应该从API获取数据
      // const response = await getTransactionDetail(id)
      // setTransaction(response.transaction)
      // setProduct(response.product)
      // setBuyer(response.buyer)
      // setSeller(response.seller)
      
      // 使用模拟数据
      setTransaction(mockTransactionDetail)
      setProduct(mockProduct)
      setBuyer(mockBuyer)
      setSeller(mockSeller)
      
      // 构建时间线数据
      buildTimelineData(mockTransactionDetail)
    } catch (error) {
      console.error('加载交易详情失败:', error)
      message.error('加载交易详情失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 构建时间线数据
  const buildTimelineData = (transactionData) => {
    const timeline = [
      {
        time: transactionData.created_at,
        title: '交易创建',
        description: '买家发起了交易请求'
      }
    ]
    
    if (transactionData.status === 'completed') {
      timeline.push({
        time: '2023-10-19 10:00:00', // 模拟确认时间
        title: '交易确认',
        description: '卖家确认了交易'
      })
      timeline.push({
        time: '2023-10-20 15:00:00', // 模拟完成时间
        title: '交易完成',
        description: '买家确认收货，交易已完成'
      })
    } else if (transactionData.status === 'canceled') {
      timeline.push({
        time: '2023-10-19 09:00:00', // 模拟取消时间
        title: '交易取消',
        description: '交易已取消'
      })
    }
    
    setTimelineData(timeline)
  }

  // 初始化加载
  useEffect(() => {
    loadTransactionDetail()
  }, [id])

  // 处理确认交易
  const handleConfirm = async () => {
    try {
      // 实际项目中应该调用确认交易的API
      // await confirmTransaction(transaction.id)
      message.success('交易已确认')
      // 更新本地状态
      setTransaction(prev => ({ ...prev, status: 'completed' }))
      // 重新构建时间线
      buildTimelineData({ ...mockTransactionDetail, status: 'completed' })
    } catch (error) {
      message.error('确认交易失败，请稍后重试')
    }
  }

  // 处理取消交易
  const handleCancel = async () => {
    try {
      // 实际项目中应该调用取消交易的API
      // await cancelTransaction(transaction.id)
      message.success('交易已取消')
      // 更新本地状态
      setTransaction(prev => ({ ...prev, status: 'canceled' }))
      // 重新构建时间线
      buildTimelineData({ ...mockTransactionDetail, status: 'canceled' })
    } catch (error) {
      message.error('取消交易失败，请稍后重试')
    }
  }
  
  // 检查当前用户是否有查看权限
  const hasViewPermission = () => {
    if (!userInfo || !transaction) return false
    
    // 管理员可以查看所有交易
    if (userInfo.user_type === 'admin') return true
    
    // 交易参与者可以查看交易
    if (transaction.buyer_id === userInfo.user_id || transaction.seller_id === userInfo.user_id) {
      return true
    }
    
    return false
  }
  
  // 检查当前用户是否有操作权限
  const hasOperationPermission = () => {
    if (!userInfo || !transaction) return false
    
    // 管理员有所有操作权限
    if (userInfo.user_type === 'admin') return true
    
    // 卖家可以接受/完成交易
    if (transaction.seller_id === userInfo.user_id && 
        (transaction.status === 'pending' || transaction.status === 'accepted')) {
      return true
    }
    
    // 买家可以取消交易
    if (transaction.buyer_id === userInfo.user_id && transaction.status === 'pending') {
      return true
    }
    
    return false
  }

  // 获取状态标签
  const getStatusTag = (status) => {
    let color = ''
    switch (status) {
      case 'pending':
        color = 'orange'
        break
      case 'completed':
        color = 'green'
        break
      case 'canceled':
        color = 'red'
        break
      default:
        color = 'blue'
    }
    return (
      <Tag color={color}>
        {getTransactionStatusText(status)}
      </Tag>
    )
  }

  return (
    <TransactionDetailContainer>
      <div className="breadcrumb">
        <Link to="/">首页</Link> &gt; 
        <Link to="/transactions">交易列表</Link> &gt; 
        <span>交易详情</span>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <Spin size="large" tip="加载中..." />
        </div>
      ) : transaction && product && buyer && seller ? (
        hasViewPermission() ? (
          <>
            <div className="page-header">
              <h1>交易详情</h1>
              <div className="transaction-status">
                {getStatusTag(transaction.status)}
              </div>
            </div>
            
            <Row gutter={[24, 24]}>
            <Col xs={24} md={16}>
              {/* 交易基本信息 */}
              <Card className="transaction-info-card" title="交易信息">
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="交易编号">{transaction.id}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{formatDate(transaction.created_at)}</Descriptions.Item>
                  <Descriptions.Item label="更新时间">{formatDate(transaction.updated_at)}</Descriptions.Item>
                  <Descriptions.Item label="交易金额">{formatPrice(transaction.price)}</Descriptions.Item>
                  <Descriptions.Item label="交易地点">{transaction.location}</Descriptions.Item>
                  <Descriptions.Item label="备注">{transaction.remark || '无'}</Descriptions.Item>
                </Descriptions>
              </Card>
              
              {/* 商品信息 */}
              <Card className="product-info-card" title="商品信息" style={{ marginTop: 24 }}>
                <div className="product-content">
                  <div className="product-image">
                    <img 
                      src={product.images && product.images.length > 0 ? product.images[0] : 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
                      alt={product.title} 
                    />
                  </div>
                  <div className="product-details">
                    <Descriptions column={1}>
                      <Descriptions.Item label="商品名称">
                        <Link to={`/products/${product.id}`}>{product.title}</Link>
                      </Descriptions.Item>
                      <Descriptions.Item label="商品分类">{product.category}</Descriptions.Item>
                      <Descriptions.Item label="新旧程度">{getProductConditionText(product.condition)}</Descriptions.Item>
                      <Descriptions.Item label="发布时间">{formatDate(product.created_at)}</Descriptions.Item>
                      <Descriptions.Item label="商品描述">{product.description}</Descriptions.Item>
                    </Descriptions>
                  </div>
                </div>
              </Card>
              
              {/* 交易时间线 */}
              <Card className="timeline-card" title="交易进度" style={{ marginTop: 24 }}>
                <Timeline
                  items={timelineData.map((item, index) => ({
                    color: index === timelineData.length - 1 ? 'green' : '#8c8c8c',
                    children: (
                      <div>
                        <div className="timeline-title">{item.title}</div>
                        <div className="timeline-time">{formatDate(item.time)}</div>
                        <div className="timeline-description">{item.description}</div>
                      </div>
                    )
                  }))}
                />
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              {/* 买家信息 */}
              <Card className="user-info-card" title="买家信息">
                <div className="user-content">
                  <Avatar size={64} src={buyer.avatar} />
                  <div className="user-details">
                    <div className="username">{buyer.username}</div>
                    <div className="contact-info">
                      <div className="contact-item">
                        <PhoneOutlined /> {buyer.phone}
                      </div>
                      <div className="contact-item">
                        <MailOutlined /> {buyer.email}
                      </div>
                      <div className="contact-item">
                        <CalendarOutlined /> 注册时间: {formatDate(buyer.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* 卖家信息 */}
              <Card className="user-info-card" title="卖家信息" style={{ marginTop: 24 }}>
                <div className="user-content">
                  <Avatar size={64} src={seller.avatar} />
                  <div className="user-details">
                    <div className="username">{seller.username}</div>
                    <div className="contact-info">
                      <div className="contact-item">
                        <PhoneOutlined /> {seller.phone}
                      </div>
                      <div className="contact-item">
                        <MailOutlined /> {seller.email}
                      </div>
                      <div className="contact-item">
                        <CalendarOutlined /> 注册时间: {formatDate(seller.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* 操作按钮 */}
              <Card className="action-buttons-card" style={{ marginTop: 24 }}>
                {hasOperationPermission() && (
                  <div className="action-buttons">
                    <Button 
                      type="primary" 
                      size="large" 
                      icon={<CheckCircleOutlined />} 
                      onClick={handleConfirm}
                      className="confirm-button"
                      disabled={transaction.status !== 'pending'}
                    >
                      确认交易
                    </Button>
                    <Button 
                      size="large" 
                      icon={<CloseCircleOutlined />} 
                      onClick={handleCancel}
                      className="cancel-button"
                      danger
                      disabled={transaction.status !== 'pending'}
                    >
                      取消交易
                    </Button>
                  </div>
                )}
                {userInfo?.user_type === 'admin' && (
                  <div className="admin-badge" style={{ marginTop: '10px', color: '#ff4d4f', fontWeight: 'bold' }}>
                    管理员模式：您可以查看和管理所有交易
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </>
        ) : (
          <div className="error-container">
            <h2>您没有权限查看此交易</h2>
            <p>请返回交易列表查看您参与的交易</p>
            <Button type="primary" href="/transactions">返回交易列表</Button>
          </div>
        )
      ) : (
        <div className="error-container">
          <h2>交易不存在或已被删除</h2>
          <Button type="primary" href="/transactions">返回交易列表</Button>
        </div>
      )}
    </TransactionDetailContainer>
  )
}

// 样式组件
const TransactionDetailContainer = styled.div`
  .breadcrumb {
    margin-bottom: 20px;
    font-size: 14px;
    color: #666;
  }
  
  .breadcrumb a {
    color: #1890ff;
    text-decoration: none;
  }
  
  .breadcrumb span {
    color: #333;
  }
  
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 600px;
  }
  
  .error-container {
    text-align: center;
    padding: 100px 0;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .page-header h1 {
    font-size: 24px;
    font-weight: bold;
    color: #333;
  }
  
  .transaction-status {
    font-size: 16px;
  }
  
  .transaction-info-card, .product-info-card, .timeline-card, .user-info-card, .action-buttons-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .product-content {
    display: flex;
    gap: 20px;
  }
  
  .product-image {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .product-details {
    flex: 1;
  }
  
  .timeline-title {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .timeline-time {
    font-size: 12px;
    color: #8c8c8c;
    margin-bottom: 4px;
  }
  
  .timeline-description {
    font-size: 14px;
    color: #333;
  }
  
  .user-content {
    display: flex;
    gap: 20px;
    align-items: center;
  }
  
  .username {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
  }
  
  .contact-info {
    font-size: 14px;
  }
  
  .contact-item {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;
  }
  
  .confirm-button {
    flex: 1;
  }
  
  .cancel-button {
    flex: 1;
  }
  
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    .product-content {
      flex-direction: column;
      align-items: center;
    }
    
    .product-image {
      width: 200px;
      height: 200px;
    }
    
    .user-content {
      flex-direction: column;
      text-align: center;
    }
    
    .action-buttons {
      flex-direction: column;
    }
  }
`

export default TransactionDetail
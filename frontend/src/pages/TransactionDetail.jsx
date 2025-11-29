import React, { useState, useEffect } from 'react'
import { Descriptions, Card, Button, message, Tag, Timeline, Row, Col, Avatar, Spin } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, UserOutlined, CalendarOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons'
import { useParams, Link } from 'react-router-dom'
import { getTransactionDetail, rejectTransaction, formatPrice, formatDate, getTransactionStatusText, getProductConditionText, acceptTransaction } from '../utils/api.js'
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
  const [loadingOperation, setLoadingOperation] = useState(false)
  
  useEffect(() => {
    // 获取用户信息
    const storedUser = localStorage.getItem('userInfo')
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser))
    }
  }, [])

  // 加载交易详情
  const loadTransactionDetail = async () => {
    setLoading(true)
    try {
      const response = await getTransactionDetail(id)
      setTransaction(response)
      setProduct(response.product)
      setBuyer(response.buyer)
      setSeller(response.seller)
      buildTimelineData(response)
    } catch (error) {
      console.error('加载交易详情失败:', error)
      message.error('加载交易详情失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 构建时间线数据
  const buildTimelineData = (transactionData) => {
    if (!transactionData) {
      setTimelineData([])
      return
    }

    const timeline = []
    const normalize = (value) => {
      if (!value) return null
      if (value instanceof Date) return value.toISOString()
      if (typeof value === 'string') return value.replace(' ', 'T')
      return value
    }

    if (transactionData.request_time) {
      timeline.push({
        time: normalize(transactionData.request_time),
        title: '交易创建',
        description: '买家发起了交易请求'
      })
    }

    if (transactionData.status === 'completed' && (transactionData.accept_time || transactionData.complete_time)) {
      timeline.push({
        time: normalize(transactionData.complete_time || transactionData.accept_time),
        title: '交易成功',
        description: '卖家接受了交易请求，交易完成'
      })
    }

    if (transactionData.status === 'cancelled') {
      timeline.push({
        time: normalize(transactionData.cancel_time || transactionData.request_time),
        title: '交易被拒绝',
        description: '卖家拒绝了此次交易'
      })
    }

    setTimelineData(timeline)
  }

  const formatDateValue = (value) => {
    if (!value) return ''
    if (value instanceof Date) {
      return formatDate(value)
    }
    if (typeof value === 'string') {
      return formatDate(value.replace(' ', 'T'))
    }
    if (value && value.toDate) {
      return formatDate(value.toDate())
    }
    return formatDate(value)
  }

  // 初始化加载
  useEffect(() => {
    loadTransactionDetail()
  }, [id])

  const handleAccept = async () => {
    if (!transaction) return
    setLoadingOperation(true)
    try {
      await acceptTransaction(transaction.id)
      message.success('交易已成功')
      await loadTransactionDetail()
    } catch (error) {
      console.error('接受交易失败:', error)
      message.error(error.message || '接受交易失败，请稍后重试')
    } finally {
      setLoadingOperation(false)
    }
  }

  // 处理拒绝交易
  const handleReject = async () => {
    if (!transaction) return
    setLoadingOperation(true)
    try {
      await rejectTransaction(transaction.id)
      message.success('交易已拒绝')
      await loadTransactionDetail()
    } catch (error) {
      console.error('拒绝交易失败:', error)
      message.error(error.message || '拒绝交易失败，请稍后重试')
    } finally {
      setLoadingOperation(false)
    }
  }
  
  // 检查当前用户是否有查看权限
  const hasViewPermission = () => {
    if (!userInfo || !transaction) return false
    
    // 管理员可以查看所有交易
    if (userInfo.user_type === 'admin') return true
    
    // 交易参与者可以查看交易
    if (transaction.buyer?.id === userInfo.id || transaction.seller?.id === userInfo.id) {
      return true
    }
    
    return false
  }
  
  // 检查当前用户是否有操作权限
  const isBuyer = transaction && userInfo && transaction.buyer?.id === userInfo.id
  const isSeller = transaction && userInfo && transaction.seller?.id === userInfo.id

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
      case 'cancelled':
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
                  <Descriptions.Item label="创建时间">{formatDateValue(transaction.request_time)}</Descriptions.Item>
                  <Descriptions.Item label="最近更新时间">{formatDateValue(transaction.complete_time || transaction.accept_time || transaction.request_time)}</Descriptions.Item>
                  <Descriptions.Item label="交易金额">{formatPrice(transaction.final_price || product.price)}</Descriptions.Item>
                  <Descriptions.Item label="交易地点">{product.location || '未指定'}</Descriptions.Item>
                  <Descriptions.Item label="备注">{transaction.notes || '无'}</Descriptions.Item>
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
                      <Descriptions.Item label="商品分类">{product.category || '未分类'}</Descriptions.Item>
                      <Descriptions.Item label="新旧程度">{getProductConditionText(product.condition)}</Descriptions.Item>
                      <Descriptions.Item label="商品价格">{formatPrice(product.price)}</Descriptions.Item>
                      <Descriptions.Item label="交易地点">{product.location || '未指定'}</Descriptions.Item>
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
                        <div className="timeline-time">{formatDateValue(item.time)}</div>
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
                  <Avatar size={64} src={buyer.avatar} icon={<UserOutlined />} />
                  <div className="user-details">
                    <div className="username">{buyer.username}</div>
                    <div className="contact-info">
                      <div className="contact-item">
                        <PhoneOutlined /> {buyer.phone || '未填写'}
                      </div>
                      <div className="contact-item">
                        <MailOutlined /> {buyer.email || '未填写'}
                      </div>
                      <div className="contact-item">
                        <CalendarOutlined /> 注册时间: {formatDateValue(buyer.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* 卖家信息 */}
              <Card className="user-info-card" title="卖家信息" style={{ marginTop: 24 }}>
                <div className="user-content">
                  <Avatar size={64} src={seller.avatar} icon={<UserOutlined />} />
                  <div className="user-details">
                    <div className="username">{seller.username}</div>
                    <div className="contact-info">
                      <div className="contact-item">
                        <PhoneOutlined /> {seller.phone || '未填写'}
                      </div>
                      <div className="contact-item">
                        <MailOutlined /> {seller.email || '未填写'}
                      </div>
                      <div className="contact-item">
                        <CalendarOutlined /> 注册时间: {formatDateValue(seller.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* 操作按钮 */}
              <Card className="action-buttons-card" style={{ marginTop: 24 }}>
                {isSeller && (
                  <div className="action-buttons">
                    {transaction.status === 'pending' && (
                      <Button 
                        type="primary" 
                        size="large" 
                        icon={<CheckCircleOutlined />} 
                        onClick={handleAccept}
                        loading={loadingOperation}
                        className="confirm-button"
                      >
                        接受并成交
                      </Button>
                    )}
                    {transaction.status === 'pending' && (
                      <Button 
                        size="large" 
                        icon={<CloseCircleOutlined />} 
                        onClick={handleReject}
                        loading={loadingOperation}
                        className="cancel-button"
                        danger
                      >
                        拒绝交易
                      </Button>
                    )}
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
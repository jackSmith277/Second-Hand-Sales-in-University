import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Tabs, Tag, Descriptions, Avatar, Spin, message, Modal, Popconfirm, Image, Alert, Input } from 'antd'
import { UserOutlined, PhoneOutlined, MailOutlined, HeartOutlined, HeartFilled, ShareAltOutlined, MessageOutlined, EnvironmentOutlined, CalendarOutlined, EyeOutlined, StarOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined, FlagOutlined, MoreOutlined } from '@ant-design/icons'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProductDetail, createTransaction, formatPrice, getProductConditionText, addFavorite, removeFavorite, checkFavorite, deleteProduct, contactSeller, getContactRequests, markContactRequestRead } from '../utils/api.js'
import styled from 'styled-components'
import { useUser } from '../hooks/useUser.js'

const { TabPane } = Tabs

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userInfo, isLoggedIn } = useUser()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [contactModalVisible, setContactModalVisible] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)
  const [contactInfo, setContactInfo] = useState(null)
  const [contactMessage, setContactMessage] = useState('')


  // 加载商品详情
  const loadProductDetail = async () => {
    setLoading(true)
    try {
      // 使用真实接口
      const data = await getProductDetail(id)
      setProduct(data)
      setActiveImageIndex(0)
    } catch (error) {
      message.error('加载商品详情失败')
      console.error('Failed to load product detail:', error)
    } finally {
      setLoading(false)
    }
  }

  // 立即购买
  const handleBuyNow = () => {
    if (!userInfo) {
      message.info('请先登录')
      return
    }
    
    // 检查是否是自己的商品
    if (userInfo.id === product.seller.id) {
      message.info('不能购买自己的商品')
      return
    }
    
    if (!product) {
      message.error('商品信息加载失败，请稍后再试')
      return
    }

    if (product.is_active === false || (product.status && product.status !== 'available')) {
      message.warning('该商品当前不可购买')
      return
    }

    setConfirmModalVisible(true)
  }

  // 确认购买
  const handleConfirmPurchase = async () => {
    if (purchaseLoading) return
    setPurchaseLoading(true)
    try {
      const response = await createTransaction({
        product_id: id
      })

      message.success(response.message || '交易申请已提交，请等待卖家确认')
      setConfirmModalVisible(false)
      // 重新加载商品详情以更新状态
      await loadProductDetail()
      if (response.transaction_id) {
        navigate(`/transactions/${response.transaction_id}`)
      } else {
        navigate('/transactions')
      }
    } catch (error) {
      console.error('Failed to create transaction:', error)
      message.error(error.message || '购买失败，请稍后重试')
    } finally {
      setPurchaseLoading(false)
    }
  }

  // 联系卖家
  const handleContact = async () => {
    if (!userInfo) {
      message.info('请先登录')
      return
    }
    
    if (!product) {
      message.error('商品信息加载中，请稍后再试')
      return
    }

    if (userInfo.id === product.seller.id) {
      message.info('这是您的商品，无需联系')
      return
    }

    // 先尝试获取已有的联系请求（包括回复）
    try {
      const response = await getContactRequests({ role: 'buyer', product_id: id })
      const requests = response.contact_requests || []
      const existingRequest = requests.find(req => req.product?.id === id)
      if (existingRequest) {
        // 如果已有联系请求，显示最新的信息（包括回复）
        setContactInfo({
          contact_request: existingRequest,
          seller: product.seller,
          product: {
            id: product.id,
            title: product.title,
            price: product.price
          }
        })
        setContactMessage(existingRequest.message || '')
        // 如果有回复且未读，自动标记为已读
        if (existingRequest.reply && !existingRequest.is_read) {
          try {
            await markContactRequestRead(existingRequest.id)
          } catch (error) {
            console.error('标记已读失败:', error)
          }
        }
      } else {
        setContactInfo(null)
        setContactMessage('')
      }
    } catch (error) {
      console.error('获取联系信息失败:', error)
      setContactInfo(null)
      setContactMessage('')
    }
    
    setContactModalVisible(true)
  }

  const handleSendContactMessage = async () => {
    if (!product) {
      message.error('商品信息加载失败，请稍后再试')
      return
    }

    if (contactLoading) {
      return
    }

    setContactLoading(true)
    try {
      const payload = {}
      const trimmedMessage = contactMessage.trim()
      if (trimmedMessage) {
        payload.message = trimmedMessage
      }
      const response = await contactSeller(id, payload)
      setContactInfo(response)
      if (response.message) {
        message.success(response.message)
      } else {
        message.success('已发送消息给卖家')
      }
      setContactMessage('')
    } catch (error) {
      console.error('联系卖家失败:', error)
      message.error(error.message || '联系卖家失败，请稍后重试')
    } finally {
      setContactLoading(false)
    }
  }

  // 收藏/取消收藏
  const handleToggleFavorite = async () => {
    if (!userInfo) {
      message.info('请先登录')
      return
    }
    
    try {
      if (isFavorite) {
        await removeFavorite(id)
        message.success('已取消收藏')
        // 同步更新本地收藏次数
        setProduct(prev => prev ? { ...prev, favorites_count: Math.max(0, (prev.favorites_count || 0) - 1) } : prev)
      } else {
        await addFavorite(id)
        message.success('收藏成功')
        // 同步更新本地收藏次数
        setProduct(prev => prev ? { ...prev, favorites_count: (prev.favorites_count || 0) + 1 } : prev)
      }
      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error('操作收藏失败:', error)
      message.error('操作失败，请稍后重试')
    }
  }

  // 分享商品
  const handleShare = () => {
    // 在实际应用中，这里应该实现分享功能
    message.info('分享功能待实现')
  }

  // 编辑商品（卖家）
  const handleEdit = () => {
    navigate(`/products/${id}/edit`)
  }

  // 删除商品（卖家或管理员）
  const handleDelete = async () => {
    try {
      await deleteProduct(id)
      message.success('商品已删除')
      // 返回商品列表页
      navigate('/products')
    } catch (error) {
      message.error('删除失败，请稍后重试')
      console.error('Failed to delete product:', error)
    }
  }

  // 禁用/启用商品（管理员）
  const handleToggleStatus = async () => {
    try {
      // 在实际应用中，这里应该调用API更新商品状态
      const newStatus = product.status === 'available' ? 'disabled' : 'available'
      setProduct({ ...product, status: newStatus })
      message.success(newStatus === 'disabled' ? '商品已禁用' : '商品已启用')
    } catch (error) {
      message.error('操作失败，请稍后重试')
      console.error('Failed to toggle product status:', error)
    }
  }

  // 举报商品（用户）
  const handleReport = () => {
    message.info('举报功能待实现')
  }

  useEffect(() => {
    loadProductDetail()
  }, [id])
  
  // 检查商品是否已收藏
  useEffect(() => {
    const checkProductFavorite = async () => {
      if (userInfo && id) {
        try {
          const result = await checkFavorite(id)
          setIsFavorite(result.is_favorite || false)
        } catch (error) {
          console.error('检查收藏状态失败:', error)
          setIsFavorite(false)
        }
      } else {
        setIsFavorite(false)
      }
    }
    
    checkProductFavorite()
  }, [userInfo, id])

  // 如果用户未登录，显示登录提示
  if (!isLoggedIn) {
    return (
      <ProductDetailContainer>
        <Card className="login-required-card">
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px'
          }}>
            <LockOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '24px' }} />
            <h2 style={{ marginBottom: '16px', color: '#333' }}>查看商品详情需要先登录</h2>
            <p style={{ marginBottom: '32px', color: '#666' }}>登录后即可查看完整的商品信息和进行购买操作</p>
            <Button 
              type="primary" 
              size="large" 
              onClick={() => navigate('/login')}
            >
              立即登录
            </Button>
          </div>
        </Card>
      </ProductDetailContainer>
    )
  }

  if (loading) {    return (
      <ProductDetailContainer>
        <Spin size="large" tip="加载中..." />
      </ProductDetailContainer>
    )
  }

  if (!product) {
    return (
      <ProductDetailContainer>
        <Message>商品不存在或已被删除</Message>
      </ProductDetailContainer>
    )
  }

  // 检查是否是商品所有者
  const isOwner = userInfo?.id === product.seller.id
  // 检查是否是管理员
  const isAdmin = userInfo?.user_type === 'admin'

  const recommendedProducts = product.recommended_products || []
  const getRecommendedImage = (images) => {
    if (!images) {
      return '/default-product-image.svg'
    }
    if (Array.isArray(images) && images.length > 0) {
      return images[0]
    }
    if (typeof images === 'string') {
      if (images.includes(',')) {
        const first = images.split(',').map(item => item.trim()).filter(Boolean)[0]
        return first || '/default-product-image.svg'
      }
      return images
    }
    return '/default-product-image.svg'
  }
  const mainImage = product.images && product.images.length > 0
    ? product.images[Math.min(activeImageIndex, product.images.length - 1)]
    : '/default-product-image.svg'

  return (
    <ProductDetailContainer>
      {!product.is_active && (
        <Alert
          type="warning"
          showIcon
          message="该商品已被管理员禁用"
          description={`禁用理由：${product.disable_reason || '管理员未提供具体理由'}`}
          style={{ marginBottom: 16 }}
        />
      )}
      <Row gutter={[24, 24]}>
        {/* 商品图片和基本信息 */}
        <Col xs={24} lg={16}>
          <Card className="product-images-card">
            <ProductImages>
              <Image
                src={mainImage}
                alt={product.title}
                className="main-image"
                fallback="/default-product-image.svg"
              />
              {product.images && product.images.length > 0 && (
                <div className="thumbnails">
                  {product.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${product.title} - ${index + 1}`}
                      className={index === activeImageIndex ? 'active' : ''}
                      onClick={() => setActiveImageIndex(index)}
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = '/default-product-image.svg'
                      }}
                    />
                  ))}
                </div>
              )}
            </ProductImages>
          </Card>

          <Card className="product-details-card">
            <h2>{product.title}</h2>
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={12}>
                <div className="product-price">
                  {formatPrice(product.price)}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="product-meta">
                  <Tag color="green">{getProductConditionText(product.condition)}</Tag>
                  <Tag>{product.category}</Tag>
                </div>
              </Col>
            </Row>
            <div className="highlighted-description">
              <h3>商品描述</h3>
              <div className="desc">
                {product.description}
              </div>
            </div>
            <Divider />
            <Descriptions column={1} bordered>
              <Descriptions.Item label="发布时间">
                {product.created_at}
              </Descriptions.Item>
              <Descriptions.Item label="浏览次数">
                <EyeOutlined /> {product.views}
              </Descriptions.Item>
              <Descriptions.Item label="收藏次数">
                <HeartOutlined /> {product.favorites_count || 0}
              </Descriptions.Item>
              <Descriptions.Item label="交易地点">
                <EnvironmentOutlined /> {product.location}
              </Descriptions.Item>
              {product.brand && (
                <Descriptions.Item label="品牌">{product.brand}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* 评价 */}
          <Card className="product-description-card">
            <Tabs defaultActiveKey="2">
              <TabPane tab="用户评价" key="2">
                <div className="product-reviews">
                  {/* 在实际应用中，这里应该显示商品的评价列表 */}
                  <Empty description="暂无评价" />
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* 右侧信息栏 */}
        <Col xs={24} lg={8}>
          {/* 卖家信息 */}
          <Card className="seller-info-card">
            <div className="seller-info">
              <Avatar size={64} src={product.seller.avatar} icon={<UserOutlined />} className="seller-avatar" />
              <h3>{product.seller.username}</h3>
              <div className="seller-stats">
                <span>已发布商品: 25</span>
                <span>好评率: 98%</span>
              </div>
              
              {/* 管理员可以查看卖家联系方式 */}
              {isAdmin && (
                <div className="seller-contact-info">
                  <p><PhoneOutlined /> {product.seller.phone}</p>
                  <p><MailOutlined /> {product.seller.email}</p>
                </div>
              )}
              
              {!isOwner && !isAdmin && (
                <Button type="primary" block onClick={handleContact} className="view-seller-button" loading={contactLoading}>
                  联系卖家
                </Button>
              )}
            </div>
          </Card>

          {/* 操作按钮 */}
          <Card className="product-actions-card">
            {/* 商品所有者操作 */}
            {isOwner && (
              <div className="owner-actions">
                <Button type="primary" block onClick={handleEdit} icon={<EditOutlined />}>
                  编辑商品
                </Button>
                <Popconfirm
                  title="确定要删除这个商品吗？"
                  onConfirm={handleDelete}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="default" danger block className="delete-button">
                    删除商品
                  </Button>
                </Popconfirm>
              </div>
            )}
            
            {/* 管理员操作 */}
            {isAdmin && (
              <div className="admin-actions">
                <Tag color="red">管理员操作</Tag>
                <Popconfirm
                  title={`确定要${product.status === 'available' ? '禁用' : '启用'}这个商品吗？`}
                  onConfirm={handleToggleStatus}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="default" block onClick={handleToggleStatus} icon={product.status === 'available' ? <LockOutlined /> : <UnlockOutlined />}>
                    {product.status === 'available' ? '禁用商品' : '启用商品'}
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title="确定要删除这个商品吗？"
                  onConfirm={handleDelete}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="default" danger block>
                    删除商品
                  </Button>
                </Popconfirm>
              </div>
            )}
            
            {/* 普通用户操作 */}
            {!isOwner && !isAdmin && product.status === 'available' && (
              <div className="user-actions">
                <Button type="primary" size="large" block onClick={handleBuyNow}>
                  立即购买
                </Button>
                <Button type="default" block onClick={handleContact} icon={<MessageOutlined />} loading={contactLoading}>
                  联系卖家
                </Button>
              </div>
            )}
            
            {/* 商品状态显示 */}
            {(!product.is_active || product.status !== 'available') && (
              <div className="product-status-notice">
                {!product.is_active ? (
                  <>
                    <Tag color="red">商品已禁用</Tag>
                    <p>该商品已被管理员禁用，仅发布者可见。</p>
                    {product.disable_reason && <p>禁用理由：{product.disable_reason}</p>}
                  </>
                ) : (
                  <>
                    <Tag color="red">商品已下架</Tag>
                    <p>该商品当前不可购买</p>
                  </>
                )}
              </div>
            )}
            
            {/* 通用操作按钮 */}
            <div className="common-actions">
              <Button
                type="text"
                icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                onClick={handleToggleFavorite}
                className="favorite-button"
              >
                {isFavorite ? '已收藏' : '收藏'}
              </Button>
              <Button
                type="text"
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                className="share-button"
              >
                分享
              </Button>
              {!isAdmin && !isOwner && (
                <Button
                  type="text"
                  icon={<FlagOutlined />}
                  onClick={handleReport}
                  className="report-button"
                >
                  举报
                </Button>
              )}
            </div>
          </Card>

          {/* 相关推荐 */}
          <Card className="recommended-products-card">
            <h3>相关推荐</h3>
            {recommendedProducts.length > 0 ? (
              <div className="recommended-products">
                {recommendedProducts.map((item) => (
                  <Link key={item.id} to={`/products/${item.id}`} className="recommended-product-item">
                    <img
                      src={getRecommendedImage(item.images)}
                      alt={item.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = '/default-product-image.svg'
                      }}
                    />
                    <div className="recommended-product-info">
                      <p className="recommended-product-title">{item.title}</p>
                      <p className="recommended-product-price">{formatPrice(item.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty description="暂无相关推荐" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 购买确认对话框 */}
      <Modal
        title="确认购买"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmModalVisible(false)}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmPurchase} loading={purchaseLoading} disabled={purchaseLoading}>
            确认购买
          </Button>
        ]}
      >
        <p>您确定要购买「{product.title}」吗？</p>
        <p>价格：{formatPrice(product.price)}</p>
      </Modal>

      {/* 联系卖家对话框 */}
      <Modal
        title="联系卖家"
        open={contactModalVisible}
        onCancel={() => {
          setContactModalVisible(false)
          setContactInfo(null)
          setContactMessage('')
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setContactModalVisible(false)
            setContactInfo(null)
            setContactMessage('')
          }}>
            关闭
          </Button>,
          <Button key="send" type="primary" loading={contactLoading} onClick={handleSendContactMessage}>
            {contactInfo ? '再次发送' : '发送消息'}
          </Button>
        ]}
      >
        <p style={{ marginBottom: 8 }}>给卖家留下一段简短的留言：</p>
        <Input.TextArea
          rows={4}
          maxLength={300}
          placeholder="例如：我对这件商品很感兴趣，方便约个时间见面吗？"
          value={contactMessage}
          onChange={(e) => setContactMessage(e.target.value)}
          className="contact-message-input"
        />
        {contactInfo ? (
          <div className="contact-result">
            <p><strong>卖家昵称：</strong>{contactInfo.seller?.username || '未提供'}</p>
            <p><strong>卖家电话：</strong>{contactInfo.seller?.phone || '卖家暂未填写联系电话'}</p>
            <p><strong>卖家邮箱：</strong>{contactInfo.seller?.email || '卖家暂未填写邮箱'}</p>
            {contactInfo.contact_request?.message && (
              <div style={{ 
                marginTop: 12, 
                marginBottom: 12, 
                padding: '16px 20px', 
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <p style={{ marginBottom: 8, fontWeight: 600, color: '#495057', fontSize: 14 }}>我的留言：</p>
                <p style={{ marginBottom: 0, color: '#212529', lineHeight: 1.6 }}>{contactInfo.contact_request.message}</p>
              </div>
            )}
            {contactInfo.contact_request?.reply && (
              <div style={{ 
                marginTop: 12, 
                marginBottom: 12, 
                padding: '16px 20px', 
                background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', 
                borderRadius: 12, 
                border: '2px solid #91d5ff',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)'
              }}>
                <p style={{ marginBottom: 8, fontWeight: 600, color: '#1890ff', fontSize: 14 }}>卖家回复：</p>
                <p style={{ marginBottom: 0, color: '#0050b3', lineHeight: 1.6 }}>{contactInfo.contact_request.reply}</p>
              </div>
            )}
            <p className="contact-result-tip">
              为保障安全，请在校园公共区域完成交易，线下转账时请核实对方身份。
            </p>
          </div>
        ) : (
          <p className="contact-tip">
            发送消息后会立即显示卖家的联系方式。
          </p>
        )}
      </Modal>
    </ProductDetailContainer>
  )
}

// 样式组件
const ProductDetailContainer = styled.div`
  padding: 32px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 64px);
  
  .login-required-card {
    max-width: 600px;
    margin: 0 auto;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-radius: 16px;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
    }
  }

  .product-images-card {
    margin-bottom: 24px;
    overflow: hidden;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
    }
  }

  .product-details-card {
    margin-bottom: 24px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    background: #ffffff;
    transition: all 0.3s ease;

    h2 {
      margin-bottom: 16px;
      color: #1a1a1a;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .product-price {
      font-size: 32px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 16px;
      display: inline-block;
    }

    .product-meta {
      margin-bottom: 16px;

      .ant-tag {
        margin-right: 8px;
        margin-bottom: 8px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 13px;
        border: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }

  /* 突出显示的商品描述 */
  .highlighted-description {
    margin: 12px 0 16px 0;
    padding: 20px;
    background: linear-gradient(135deg, #fff9e6 0%, #ffeaa7 100%);
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(212, 136, 6, 0.15);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 6px 16px rgba(212, 136, 6, 0.2);
      transform: translateY(-2px);
    }

    h3 {
      margin: 0 0 8px 0;
      color: #d48806;
      font-size: 18px;
      font-weight: 600;
    }

    .desc {
      color: #614700;
      line-height: 1.8;
      white-space: pre-wrap;
      font-size: 15px;
    }
  }

  .product-description-card {
    margin-bottom: 24px;

    .product-description p {
      margin-bottom: 16px;
      line-height: 1.8;
      color: #333;
    }

    .product-reviews {
      padding: 16px 0;
    }
  }

  .seller-info-card {
    margin-bottom: 24px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

    .seller-info {
      text-align: center;
      padding: 8px;
    }

    .seller-avatar {
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 3px solid #fff;
    }

    h3 {
      margin-bottom: 8px;
      color: #1a1a1a;
      font-size: 20px;
      font-weight: 600;
    }

    .seller-stats {
      margin-bottom: 16px;
      font-size: 14px;
      color: #666;
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;

      span {
        padding: 4px 12px;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        border-radius: 12px;
        font-weight: 500;
      }
    }

    .seller-contact-info {
      margin-bottom: 16px;
      text-align: left;
      padding: 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);

      p {
        margin-bottom: 8px;
        color: #495057;
        font-size: 14px;
      }
    }

    .view-seller-button {
      margin-top: 16px;
      border-radius: 8px;
      height: 40px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
        transform: translateY(-2px);
      }
    }
  }

  .product-actions-card {
    margin-bottom: 24px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    background: #ffffff;
    overflow: hidden;

    .owner-actions, .admin-actions, .user-actions {
      margin-bottom: 16px;

      .ant-btn {
        margin-bottom: 12px;
        border-radius: 8px;
        height: 44px;
        font-weight: 500;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      }
    }

    .product-status-notice {
      text-align: center;
      padding: 20px;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);
      border-radius: 12px;

      p {
        margin-top: 8px;
        color: #666;
      }
    }

    .common-actions {
      display: flex;
      justify-content: space-between;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
      gap: 8px;
    }

    .favorite-button, .share-button, .report-button {
      flex: 1;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        background: #f0f0f0;
        transform: translateY(-2px);
      }
    }

    .favorite-button {
      color: inherit;
    }
  }

  .recommended-products-card {
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    background: #ffffff;
    overflow: hidden;

    h3 {
      margin-bottom: 16px;
      color: #1a1a1a;
      font-size: 20px;
      font-weight: 600;
    }

    .recommended-products {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .recommended-product-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s ease;
      border: 1px solid #e9ecef;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

      &:hover {
        background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      img {
        width: 70px;
        height: 70px;
        object-fit: cover;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .recommended-product-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .recommended-product-title {
          margin: 0;
          font-size: 15px;
          color: #1a1a1a;
          line-height: 1.4;
          font-weight: 500;
        }

        .recommended-product-price {
          margin: 0;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 16px;
        }
      }
    }
  }

  .contact-message-input {
    margin-bottom: 16px;
    border-radius: 8px;
    
    textarea {
      border-radius: 8px;
      border: 2px solid #e9ecef;
      transition: all 0.3s ease;

      &:focus {
        border-color: #1890ff;
        box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
      }
    }
  }

  .contact-tip {
    margin-top: 8px;
    color: #888;
    font-size: 14px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .contact-result {
    margin-top: 16px;
    padding: 20px;
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);

    p {
      margin-bottom: 8px;
      color: #166534;
      font-size: 14px;
    }
  }

  .contact-result-tip {
    margin-top: 12px;
    color: #16a34a;
    font-size: 13px;
    font-weight: 500;
  }
`

const ProductImages = styled.div`
  .main-image {
    width: 100%;
    height: 500px;
    object-fit: contain;
    margin-bottom: 20px;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    background: #ffffff;
    padding: 20px;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.02);
    }
  }

  .thumbnails {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 8px 0;

    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 10px;

      &:hover {
        background: #555;
      }
    }

    img {
      width: 90px;
      height: 90px;
      object-fit: cover;
      border-radius: 12px;
      cursor: pointer;
      border: 3px solid transparent;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        border-color: #1890ff;
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
      }

      &.active {
        border-color: #1890ff;
        box-shadow: 0 4px 16px rgba(24, 144, 255, 0.4);
      }
    }
  }
`

const Message = styled.div`
  text-align: center;
  padding: 64px 0;
  color: #666;
`

const Divider = styled.hr`
  margin: 16px 0;
  border: none;
  border-top: 1px solid #f0f0f0;
`

const Empty = ({ description }) => (
  <div style={{ textAlign: 'center', padding: '64px 0', color: '#999' }}>
    <p>{description}</p>
  </div>
)

export default ProductDetail;
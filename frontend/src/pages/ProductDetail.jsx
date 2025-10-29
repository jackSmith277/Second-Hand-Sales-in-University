import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Tabs, Tag, Descriptions, Avatar, Spin, message, Modal, Popconfirm } from 'antd'
import { UserOutlined, PhoneOutlined, MailOutlined, HeartOutlined, ShareAltOutlined, MessageOutlined, EnvironmentOutlined, CalendarOutlined, EyeOutlined, StarOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined, FlagOutlined, MoreOutlined } from '@ant-design/icons'
import { useParams } from 'react-router-dom'
import { getProductDetail, createTransaction, formatPrice, getProductConditionText, addFavorite, removeFavorite, checkFavorite } from '../utils/api.js'
import styled from 'styled-components'
import { useUser } from '../hooks/useUser.js'

const { TabPane } = Tabs

const ProductDetail = () => {
  const { id } = useParams()
  const { userInfo } = useUser()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)

  // 模拟商品详情数据
  const mockProductDetail = {
    id: '1',
    title: '全新高等数学教材',
    description: '全新未使用的高等数学教材，适合大一学生使用。这本书是高等教育出版社出版的最新版，内容全面，讲解清晰，是学习高等数学的必备教材。书中包含大量例题和习题，有助于巩固所学知识。由于我已经修完这门课程，所以现在低价转让给有需要的同学。',
    price: 50,
    category: '教材书籍',
    images: [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=book1',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=book2',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=book3'
    ],
    status: 'available',
    created_at: '2023-10-15 10:30:00',
    updated_at: '2023-10-15 10:30:00',
    seller: {
      id: 's1',
      username: '李同学',
      email: 'li@school.edu',
      phone: '13800138001',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li'
    },
    views: 120,
    location: '一号教学楼',
    brand: '高等教育出版社',
    condition: 'new'
  }

  // 加载商品详情
  const loadProductDetail = async () => {
    setLoading(true)
    try {
      // 在实际应用中，这里应该调用API获取商品详情
      // const data = await getProductDetail(id)
      // setProduct(data)
      
      // 使用模拟数据
      setProduct(mockProductDetail)
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
    
    // 显示确认对话框
    setConfirmModalVisible(true)
  }

  // 确认购买
  const handleConfirmPurchase = async () => {
    try {
      // 在实际应用中，这里应该调用API创建交易
      // await createTransaction({
      //   productId: id,
      //   buyerId: userInfo.id
      // })
      
      message.success('购买成功！')
      setConfirmModalVisible(false)
      // 重新加载商品详情以更新状态
      loadProductDetail()
    } catch (error) {
      message.error('购买失败，请稍后重试')
      console.error('Failed to create transaction:', error)
    }
  }

  // 联系卖家
  const handleContact = () => {
    if (!userInfo) {
      message.info('请先登录')
      return
    }
    
    message.info(`正在联系卖家: ${product.seller.username}`)
    // 在实际应用中，这里应该跳转到消息页面或显示联系信息
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
      } else {
        await addFavorite(id)
        message.success('收藏成功')
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
    // 在实际应用中，这里应该跳转到编辑页面
    message.info('编辑功能待实现')
  }

  // 删除商品（卖家或管理员）
  const handleDelete = async () => {
    try {
      // 在实际应用中，这里应该调用API删除商品
      message.success('商品已删除')
      // 返回商品列表页
      window.history.back()
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

  if (loading) {
    return (
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

  return (
    <ProductDetailContainer>
      <Row gutter={[24, 24]}>
        {/* 商品图片和基本信息 */}
        <Col xs={24} lg={16}>
          <Card className="product-images-card">
            <ProductImages>
              <img src={product.images[0]} alt={product.title} className="main-image" />
              <div className="thumbnails">
                {product.images.map((img, index) => (
                  <img key={index} src={img} alt={`${product.title} - ${index + 1}`} />
                ))}
              </div>
            </ProductImages>
          </Card>

          <Card className="product-details-card">
            <h2>{product.title}</h2>
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={12}>
                <div className="product-price">
                  ¥{formatPrice(product.price)}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="product-meta">
                  <Tag color="green">{getProductConditionText(product.condition)}</Tag>
                  <Tag>{product.category}</Tag>
                </div>
              </Col>
            </Row>
            <Divider />
            <Descriptions column={1} bordered>
              <Descriptions.Item label="发布时间">
                {product.created_at}
              </Descriptions.Item>
              <Descriptions.Item label="浏览次数">
                <EyeOutlined /> {product.views}
              </Descriptions.Item>
              <Descriptions.Item label="交易地点">
                <EnvironmentOutlined /> {product.location}
              </Descriptions.Item>
              {product.brand && (
                <Descriptions.Item label="品牌">{product.brand}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* 描述和评价 */}
          <Card className="product-description-card">
            <Tabs defaultActiveKey="1">
              <TabPane tab="商品描述" key="1">
                <div className="product-description">
                  {product.description.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </TabPane>
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
                <Button type="primary" block onClick={handleContact} className="view-seller-button">
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
                <Button type="default" block onClick={handleContact} icon={<MessageOutlined />}>
                  联系卖家
                </Button>
              </div>
            )}
            
            {/* 商品状态显示 */}
            {product.status !== 'available' && (
              <div className="product-status-notice">
                <Tag color="red">商品已下架</Tag>
                <p>该商品当前不可购买</p>
              </div>
            )}
            
            {/* 通用操作按钮 */}
            <div className="common-actions">
              <Button
                type="text"
                icon={<HeartOutlined className={isFavorite ? 'favorited' : ''} />}
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
            <div className="recommended-products">
              {/* 在实际应用中，这里应该显示相关推荐的商品列表 */}
              {[1, 2, 3].map((item) => (
                <div key={item} className="recommended-product-item">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=rec${item}`} alt={`推荐商品${item}`} />
                  <p>推荐商品{item}</p>
                  <p className="recommended-product-price">¥{Math.floor(Math.random() * 100) + 10}</p>
                </div>
              ))}
            </div>
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
          <Button key="confirm" type="primary" onClick={handleConfirmPurchase}>
            确认购买
          </Button>
        ]}
      >
        <p>您确定要购买「{product.title}」吗？</p>
        <p>价格：¥{formatPrice(product.price)}</p>
      </Modal>
    </ProductDetailContainer>
  )
}

// 样式组件
const ProductDetailContainer = styled.div`
  padding: 24px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 64px);

  .product-images-card {
    margin-bottom: 24px;
    overflow: hidden;
  }

  .product-details-card {
    margin-bottom: 24px;

    h2 {
      margin-bottom: 16px;
      color: #333;
    }

    .product-price {
      font-size: 24px;
      font-weight: bold;
      color: #ff4d4f;
      margin-bottom: 16px;
    }

    .product-meta {
      margin-bottom: 16px;

      .ant-tag {
        margin-right: 8px;
        margin-bottom: 8px;
      }
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

    .seller-info {
      text-align: center;
    }

    .seller-avatar {
      margin-bottom: 16px;
    }

    h3 {
      margin-bottom: 8px;
      color: #333;
    }

    .seller-stats {
      margin-bottom: 16px;
      font-size: 14px;
      color: #666;

      span {
        margin: 0 8px;
      }
    }

    .seller-contact-info {
      margin-bottom: 16px;
      text-align: left;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 4px;

      p {
        margin-bottom: 8px;
      }
    }

    .view-seller-button {
      margin-top: 16px;
    }
  }

  .product-actions-card {
    margin-bottom: 24px;

    .owner-actions, .admin-actions, .user-actions {
      margin-bottom: 16px;

      .ant-btn {
        margin-bottom: 12px;
      }
    }

    .product-status-notice {
      text-align: center;
      padding: 16px;
      margin-bottom: 16px;

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
    }

    .favorite-button, .share-button, .report-button {
      flex: 1;
    }

    .favorite-button {
      color: #ff4d4f;
    }
  }

  .recommended-products-card {
    h3 {
      margin-bottom: 16px;
      color: #333;
    }

    .recommended-products {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .recommended-product-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background-color: #f9f9f9;
      border-radius: 4px;

      img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
      }

      p {
        flex: 1;
        margin: 0;
        font-size: 14px;
        color: #333;
      }

      .recommended-product-price {
        font-weight: bold;
        color: #ff4d4f;
      }
    }
  }
`

const ProductImages = styled.div`
  .main-image {
    width: 100%;
    height: 400px;
    object-fit: contain;
    margin-bottom: 16px;
  }

  .thumbnails {
    display: flex;
    gap: 12px;
    overflow-x: auto;

    img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
      border: 2px solid transparent;

      &:hover {
        border-color: #1890ff;
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
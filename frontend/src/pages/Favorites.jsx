import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Empty, Spin, Button, message } from 'antd'
import { HeartOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { getUserInfo, getFavorites, removeFavorite } from '../utils/api'

const Favorites = () => {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    loadUserInfo()
    loadFavorites()
  }, [])

  const loadUserInfo = async () => {
    try {
      const info = await getUserInfo()
      setUserInfo(info)
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const response = await getFavorites()
      // 假设API返回的数据结构是 { products: [...] }
      setFavorites(response.products || [])
    } catch (error) {
      console.error('获取收藏失败:', error)
      message.error('获取收藏失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (productId) => {
    try {
      await removeFavorite(productId)
      message.success('已取消收藏')
      // 从列表中移除该商品
      setFavorites(favorites.filter(item => item.id !== productId))
    } catch (error) {
      console.error('取消收藏失败:', error)
      message.error('取消收藏失败，请稍后重试')
    }
  }

  const renderFavoriteItem = (product) => (
    <Col xs={24} sm={12} md={8} lg={6} key={product.id} className="favorite-col">
      <Link to={`/products/${product.id}`}>
        <FavoriteCard 
          id={product.id}
          title={product.title}
          price={product.price}
          images={product.images || []}
          category={product.category}
          status={product.status}
          onRemove={handleRemoveFavorite}
        />
      </Link>
    </Col>
  )

  return (
    <FavoritesContainer>
      <div className="favorites-header">
        <h1>我的收藏</h1>
        {userInfo && (
          <p>你已收藏 {favorites.length} 件商品</p>
        )}
      </div>
      
      <div className="favorites-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : favorites.length > 0 ? (
          <Row gutter={[16, 16]}>
            {favorites.map(product => renderFavoriteItem(product))}
          </Row>
        ) : (
          <Empty 
            description="暂无收藏商品"
            className="empty-container"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary">
              <Link to="/products" style={{ color: '#fff' }}>
                去逛逛
              </Link>
            </Button>
          </Empty>
        )}
      </div>
    </FavoritesContainer>
  )
}

// 收藏卡片组件
const FavoriteCard = ({ id, title, price, images, category, status, onRemove }) => (
  <StyledCard
    actions={[
      <Button 
        type="text" 
        icon={<HeartOutlined />} 
        danger 
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onRemove(id)
        }}
      >
        取消收藏
      </Button>
    ]}
  >
    <div className="favorite-image">
      <img 
        src={images.length > 0 ? images[0] : '/default-product-image.svg'} 
        alt={title} 
        className="product-img"
      />
    </div>
    <div className="favorite-info">
      <h3 className="favorite-title">{title}</h3>
      <div className="favorite-price">¥{parseFloat(price).toFixed(2)}</div>
      <div className="favorite-meta">
        <span className="category">{category}</span>
        <span className={`status ${status}`}>
          {status === 'available' ? '可交易' : status === 'pending' ? '交易中' : '已售出'}
        </span>
      </div>
    </div>
  </StyledCard>
)

// 样式组件
const FavoritesContainer = styled.div`
  padding: 24px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 64px);

  .favorites-header {
    margin-bottom: 24px;
  }
  
  .favorites-header h1 {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  
  .favorites-content {
    min-height: 400px;
  }
  
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
  }
  
  .empty-container {
    padding: 60px 0;
  }
  
  .favorite-col {
    margin-bottom: 16px;
  }
`

const StyledCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  
  a {
    color: inherit;
    text-decoration: none;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .favorite-image {
    position: relative;
    height: 200px;
    overflow: hidden;
    border-radius: 4px 4px 0 0;
  }
  
  .product-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  &:hover .product-img {
    transform: scale(1.05);
  }
  
  .favorite-info {
    flex: 1;
    padding: 12px;
  }
  
  .favorite-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 8px;
    color: #333;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .favorite-price {
    font-size: 20px;
    font-weight: bold;
    color: #ff4d4f;
    margin-bottom: 8px;
  }
  
  .favorite-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #666;
  }
  
  .category {
    background-color: #e6f7ff;
    padding: 2px 8px;
    border-radius: 4px;
    color: #1890ff;
  }
  
  .status {
    padding: 2px 8px;
    border-radius: 4px;
  }
  
  .status.available {
    background-color: #f6ffed;
    color: #52c41a;
  }
  
  .status.pending {
    background-color: #fff7e6;
    color: #fa8c16;
  }
  
  .status.sold {
    background-color: #fff1f0;
    color: #ff4d4f;
  }
  
  .ant-card-actions {
    background-color: #fafafa;
    border-top: 1px solid #f0f0f0;
  }
  
  .ant-card-actions > li {
    margin: 0;
    border-right: none;
  }
`

export default Favorites
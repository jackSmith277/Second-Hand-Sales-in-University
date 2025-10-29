import React from 'react'
import { Card, Tag, Avatar, Badge, Space, Tooltip } from 'antd'
import { EyeOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { formatPrice, getProductConditionText } from '../utils/api.js'
import styled from 'styled-components'

const ProductCard = ({ 
  id, 
  title, 
  price, 
  images = [], 
  category, 
  status, 
  location, 
  seller, 
  createdAt, 
  views = 0 
}) => {
  // 获取状态标签
  const getStatusTag = (status) => {
    let color = ''
    let text = ''
    switch (status) {
      case 'available':
        color = 'green'
        text = '可交易'
        break
      case 'pending':
        color = 'orange'
        text = '交易中'
        break
      case 'sold':
        color = 'red'
        text = '已售出'
        break
      default:
        color = 'blue'
        text = '未知状态'
    }
    return (
      <Tag color={color}>{text}</Tag>
    )
  }

  // 处理商品图片显示
  const getImageUrl = (images) => {
    // 如果没有图片或不是有效的数组/字符串，使用默认图片
    if (!images || (Array.isArray(images) && images.length === 0)) {
      // 使用本地默认图片，避免使用外部API
      return '/default-product-image.svg'
    }

    // 如果是字符串，直接使用（可能是单个图片路径或逗号分隔的多个路径）
    if (typeof images === 'string') {
      // 检查是否包含逗号（后端存储格式）
      if (images.includes(',')) {
        // 取第一个图片路径
        const firstImage = images.split(',').map(img => img.trim())[0]
        return firstImage || '/default-product-image.svg'
      }
      return images
    }

    // 如果是数组，返回第一张图片
    if (Array.isArray(images)) {
      const firstImage = images[0]
      if (typeof firstImage === 'string') {
        return firstImage
      }
      if (typeof firstImage === 'object' && firstImage.url) {
        return firstImage.url
      }
      return '/default-product-image.svg'
    }

    // 处理对象格式（如果有）
    if (typeof images === 'object' && images.url) {
      // 假设对象有一个url属性
      return images.url || '/default-product-image.svg'
    }

    // 默认图片
    return '/default-product-image.svg'
  }

  return (
    <CustomProductCard hoverable className="product-card">
      <div className="card-header">
        <div className="status-badge">
          {getStatusTag(status)}
        </div>
      </div>
      
      <div className="card-image">
        <img 
          src={getImageUrl(images)} 
          alt={title || '商品图片'} 
          onError={(e) => {
            e.target.onerror = null
            e.target.src = '/default-product-image.svg'
          }}
        />
      </div>
      
      <div className="card-content">
        <div className="card-category">
          <Tag color="blue">{category}</Tag>
        </div>
        
        <div className="card-title">
          {title}
        </div>
        
        <div className="card-price">
          {formatPrice(price)}
        </div>
        
        <div className="card-meta">
          <div className="meta-item">
            <EyeOutlined className="meta-icon" />
            <span className="meta-text">{views}</span>
          </div>
          <div className="meta-item">
            <ClockCircleOutlined className="meta-icon" />
            <span className="meta-text">{createdAt}</span>
          </div>
        </div>
        
        <div className="card-footer">
          <div className="seller-info">
            <Avatar size="small" src={seller.avatar}>
              {seller.username?.[0] || 'U'}
            </Avatar>
            <span className="seller-name">{seller.username}</span>
          </div>
          
          <div className="location-info">
            <Tooltip title="交易地点">
              <EnvironmentOutlined className="location-icon" />
            </Tooltip>
            <span className="location-text">{location}</span>
          </div>
        </div>
      </div>
    </CustomProductCard>
  )
}

// 样式组件
const CustomProductCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  border-radius: 8px;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  
  .card-header {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 1;
  }
  
  .status-badge {
    background-color: rgba(255, 255, 255, 0.9);
    padding: 4px;
    border-radius: 4px;
  }
  
  .card-image {
    position: relative;
    height: 180px;
    overflow: hidden;
  }
  
  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  
  &:hover .card-image img {
    transform: scale(1.05);
  }
  
  .card-content {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }
  
  .card-category {
    margin-bottom: 8px;
  }
  
  .card-title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
  }
  
  .card-price {
    font-size: 20px;
    font-weight: bold;
    color: #f5222d;
    margin-bottom: 12px;
  }
  
  .card-meta {
    display: flex;
    gap: 16px;
    margin-bottom: auto;
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #8c8c8c;
  }
  
  .meta-icon {
    font-size: 12px;
  }
  
  .meta-text {
    white-space: nowrap;
  }
  
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
  }
  
  .seller-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .seller-name {
    font-size: 14px;
    color: #666;
    white-space: nowrap;
  }
  
  .location-info {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #8c8c8c;
  }
  
  .location-icon {
    font-size: 12px;
  }
  
  .location-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
  }
  
  @media (max-width: 768px) {
    .card-image {
      height: 160px;
    }
    
    .card-title {
      font-size: 15px;
    }
    
    .card-price {
      font-size: 18px;
    }
  }
  
  @media (max-width: 576px) {
    .card-image {
      height: 200px;
    }
    
    .card-content {
      padding: 12px;
    }
  }
`

export default ProductCard
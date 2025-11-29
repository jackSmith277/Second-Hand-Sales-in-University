import React from 'react'
import { Card, Tag } from 'antd'
import { EyeOutlined, HeartOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { formatPrice, formatDate } from '../utils/api.js'
import styled from 'styled-components'

const ProductCard = ({ 
  id, 
  title, 
  price, 
  images = [], 
  category,
  status,
  isActive = true,
  disableReason,
  views = 0,
  favorites_count = 0,
  createdAt
}) => {

  // 格式化发布时间
  const formatPublishTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 处理商品图片显示
  const getImageUrl = (images) => {
    // 如果没有图片或不是有效的数组/字符串，使用默认图片
    if (!images || (Array.isArray(images) && images.length === 0)) {
      return '/default-product-image.svg'
    }

    // 如果是字符串，直接使用（可能是单个图片路径或逗号分隔的多个路径）
    if (typeof images === 'string') {
      // 检查是否包含逗号（后端存储格式）
      if (images.includes(',')) {
        // 取第一个图片路径
        const firstImage = images.split(',').map(img => img.trim()).filter(img => img)[0]
        return firstImage || '/default-product-image.svg'
      }
      return images
    }

    // 如果是数组，返回第一张图片
    if (Array.isArray(images)) {
      // 过滤空字符串和null/undefined
      const validImages = images.filter(img => img && typeof img === 'string' && img.trim())
      if (validImages.length === 0) {
        return '/default-product-image.svg'
      }
      
      const firstImage = validImages[0]
      
      if (typeof firstImage === 'string') {
        return firstImage
      }
      if (typeof firstImage === 'object' && firstImage.url) {
        return firstImage.url
      }
      return '/default-product-image.svg'
    }

    // 处理对象格式（如果有）
    if (typeof images === 'object' && images !== null && images.url) {
      // 假设对象有一个url属性
      return images.url || '/default-product-image.svg'
    }

    // 默认图片
    return '/default-product-image.svg'
  }

  return (
    <CustomProductCard hoverable className="product-card">
      {/* 商品类型标签 - 左上角 */}
      <div className="card-category-badge">
        <Tag color="blue">{category}</Tag>
      </div>

      {!isActive && (
        <div className="card-status-badge">
          <Tag color="red">已禁用</Tag>
        </div>
      )}
      
      {/* 商品图片 */}
      <div className="card-image">
        <img 
          src={getImageUrl(images)} 
          alt={title || '商品图片'} 
          onError={(e) => {
            console.error('ProductCard - Image load error:', e.target.src)
            e.target.onerror = null
            e.target.src = '/default-product-image.svg'
          }}
        />
      </div>
      
      {/* 商品信息 */}
      <div className="card-content">
        <div className="card-title">
          {title}
        </div>
        {!isActive && disableReason && (
          <div className="card-disable-reason">
            禁用理由：{disableReason}
          </div>
        )}
        
        <div className="card-price">
          {formatPrice(price)}
        </div>
        
        {/* 商品统计信息 */}
        <div className="card-stats">
          <div className="stat-item">
            <EyeOutlined className="stat-icon" />
            <span className="stat-text">{views || 0}</span>
          </div>
          <div className="stat-item">
            <HeartOutlined className="stat-icon" />
            <span className="stat-text">{favorites_count || 0}</span>
          </div>
          <div className="stat-item">
            <ClockCircleOutlined className="stat-icon" />
            <span className="stat-text">
              {formatPublishTime(createdAt)}
            </span>
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
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  background: #ffffff;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  /* 商品类型标签 - 左上角 */
  .card-category-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
    background: linear-gradient(135deg, rgba(24, 144, 255, 0.95) 0%, rgba(47, 84, 235, 0.95) 100%);
    padding: 6px 12px;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
    backdrop-filter: blur(10px);
    
    .ant-tag {
      margin: 0;
      border: none;
      background: transparent;
      color: #ffffff;
      font-weight: 600;
      font-size: 12px;
      padding: 0;
    }
  }

  .card-status-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
    background: linear-gradient(135deg, rgba(245, 34, 45, 0.95) 0%, rgba(207, 19, 34, 0.95) 100%);
    padding: 6px 12px;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(245, 34, 45, 0.3);
    backdrop-filter: blur(10px);
    
    .ant-tag {
      margin: 0;
      border: none;
      background: transparent;
      color: #ffffff;
      font-weight: 600;
      font-size: 12px;
      padding: 0;
    }
  }
  
  /* 商品图片 */
  .card-image {
    position: relative;
    height: 220px;
    overflow: hidden;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
      z-index: 1;
      pointer-events: none;
    }
  }
  
  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  &:hover .card-image img {
    transform: scale(1.1);
  }
  
  /* 商品信息 */
  .card-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    flex: 1;
  }
  
  .card-disable-reason {
    font-size: 12px;
    color: #a8071a;
    background: linear-gradient(135deg, #fff1f0 0%, #ffe7e5 100%);
    border: 1px solid #ffccc7;
    border-radius: 8px;
    padding: 8px 12px;
    margin: 12px 0;
    line-height: 1.5;
    box-shadow: 0 2px 8px rgba(245, 34, 45, 0.1);
  }
  
  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
    min-height: 44px;
    transition: color 0.3s ease;
  }
  
  &:hover .card-title {
    color: #1890ff;
  }
  
  .card-price {
    font-size: 22px;
    font-weight: 700;
    background: linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 10px;
    letter-spacing: -0.5px;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 40px;
      height: 3px;
      background: linear-gradient(90deg, #f5222d 0%, #ff4d4f 100%);
      border-radius: 2px;
      opacity: 0.3;
    }
  }
  
  /* 商品统计信息 */
  .card-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid #f0f0f0;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #595959;
    transition: all 0.3s ease;
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.02);
    
    &:hover {
      background: rgba(24, 144, 255, 0.08);
      color: #1890ff;
      transform: translateY(-2px);
    }
  }
  
  .stat-icon {
    font-size: 14px;
    color: #8c8c8c;
    transition: color 0.3s ease;
  }
  
  .stat-item:hover .stat-icon {
    color: #1890ff;
  }
  
  .stat-text {
    white-space: nowrap;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    border-radius: 12px;
    
    .card-image {
      height: 240px;
    }
    
    .card-category-badge,
    .card-status-badge {
      top: 8px;
      padding: 4px 10px;
      font-size: 11px;
    }
    
    .card-content {
      padding: 16px;
    }
    
    .card-title {
      font-size: 16px;
      min-height: 48px;
      margin-bottom: 10px;
    }
    
    .card-price {
      font-size: 22px;
      margin-bottom: 10px;
    }
    
    .card-stats {
      gap: 12px;
      padding-top: 10px;
    }
    
    .stat-item {
      font-size: 12px;
      padding: 3px 6px;
    }
    
    .stat-icon {
      font-size: 13px;
    }
  }
  
  @media (max-width: 576px) {
    border-radius: 12px;
    
    &:hover {
      transform: translateY(-4px) scale(1.01);
    }
    
    .card-image {
      height: 220px;
    }
    
    .card-category-badge,
    .card-status-badge {
      top: 6px;
      left: 6px;
      right: 6px;
      padding: 3px 8px;
      font-size: 10px;
    }
    
    .card-content {
      padding: 14px;
    }
    
    .card-title {
      font-size: 15px;
      min-height: 45px;
      margin-bottom: 8px;
    }
    
    .card-price {
      font-size: 20px;
      margin-bottom: 8px;
    }
    
    .card-stats {
      flex-wrap: wrap;
      gap: 8px;
      padding-top: 8px;
    }
    
    .stat-item {
      font-size: 11px;
      padding: 2px 6px;
    }
    
    .stat-icon {
      font-size: 12px;
    }
  }
`

export default ProductCard
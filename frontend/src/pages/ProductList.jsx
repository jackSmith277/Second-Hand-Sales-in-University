import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Input, Select, Pagination, Empty, Spin, Button } from 'antd'
import { SearchOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons'
import { getProducts, formatPrice, getProductStatusText } from '../utils/api.js'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useUser } from '../hooks/useUser.js'
import ProductCardComponent from '../components/ProductCard.jsx'

const { Search } = Input
const { Option } = Select

const ProductList = () => {
  const { userInfo } = useUser()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('available')
  const [viewMode, setViewMode] = useState('all') // all, my

  // 使用真实API数据，移除模拟数据数组

  // 商品分类列表
  const categories = [
    { value: '', label: '全部分类' },
    { value: '教材书籍', label: '教材书籍' },
    { value: '电子产品', label: '电子产品' },
    { value: '生活用品', label: '生活用品' },
    { value: '运动器材', label: '运动器材' },
    { value: '交通工具', label: '交通工具' },
    { value: '服装鞋帽', label: '服装鞋帽' },
    { value: '美妆个护', label: '美妆个护' },
    { value: '乐器', label: '乐器' },
    { value: '其他', label: '其他' }
  ]

  // 商品状态列表
  const getStatusOptions = () => {
    const baseOptions = [
      { value: 'available', label: '可交易' },
      { value: 'pending', label: '交易中' },
      { value: 'sold', label: '已售出' }
    ]
    
    // 管理员可以看到所有状态，包括禁用的商品
    if (userInfo?.user_type === 'admin') {
      return [...baseOptions, { value: 'disabled', label: '已禁用' }]
    }
    
    return baseOptions
  }

  // 加载商品列表
  const loadProducts = async (page = 1, search = '', cat = '', stat = 'available', mode = 'all', size = pageSize) => {
    setLoading(true)
    try {
      // 根据视图模式确定参数
      const params = {
        page,
        per_page: size,
        search,
        category: cat || undefined
      }
      if (mode === 'my') {
        params.mine = true
        if (stat && stat !== 'all') {
          params.status = stat
        }
      } else {
        if (stat && stat !== 'all') {
          params.status = stat
        }
      }
      
      // 发送API请求获取商品数据
      const response = await getProducts(params)
      
      // 更新状态
      setProducts(response.products || [])
      setTotal(response.total || 0)
      setCurrentPage(response.current_page || page)
      
    } catch (error) {
      console.error('加载商品列表失败:', error)
      // 错误处理，保持界面稳定
      setProducts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载和参数变化时重新加载
  useEffect(() => {
    loadProducts(currentPage, searchQuery, category, status, viewMode, pageSize)
  }, [currentPage, searchQuery, category, status, pageSize, viewMode])
  
  // 处理视图模式切换
  const handleViewModeChange = (mode) => {
    // 管理员只能使用'all'模式
    if (userInfo?.user_type !== 'admin') {
      setViewMode(mode)
      // 切换到“我的商品”视图时默认展示全部状态
      if (mode === 'my') {
        setStatus('all')
      } else if (status === 'all') {
        setStatus('available')
      }
    }
    setCurrentPage(1)
  }

  // 处理搜索
  const handleSearch = (value) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  // 处理分类选择
  const handleCategoryChange = (value) => {
    setCategory(value)
    setCurrentPage(1)
  }

  // 处理状态选择
  const handleStatusChange = (value) => {
    setStatus(value ? value : (viewMode === 'my' ? 'all' : 'available'))
    setCurrentPage(1)
  }
  
  // 获取标题文本
  const getPageTitle = () => {
    if (userInfo?.user_type === 'admin') {
      return '商品管理'
    }
    return viewMode === 'my' ? '我的商品' : '商品列表'
  }

  // 处理分页变化
  const handlePageChange = (page) => {
    setCurrentPage(page)
    loadProducts(page, searchQuery, category, status, viewMode)
  }

  // 处理页码大小变化
  const handlePageSizeChange = (current, size) => {
    setPageSize(size)
    setCurrentPage(1)
    // 立即使用新的 pageSize 重新加载数据
    loadProducts(1, searchQuery, category, status, viewMode, size)
  }

  // 渲染商品卡片
  const renderProductCard = (product) => (
    <Col xs={24} sm={12} md={8} lg={6} key={product.id} className="product-col">
      <Link to={`/products/${product.id}`}>
        <ProductCardComponent 
          id={product.id}
          title={product.title}
          price={product.price}
          images={product.images || []}
          category={product.category}
          status={product.status}
          isActive={product.is_active}
          disableReason={product.disable_reason}
          location={product.trading_location}
          seller={{username: product.seller_username}}
          createdAt={product.created_at}
          views={product.views}
          favorites_count={product.favorites_count || 0}
        />
      </Link>
    </Col>
  )

  return (
    <ProductListContainer>
      <div className="product-list-header">
        <div className="header-top">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <h1>{getPageTitle()}</h1>
            
            <div className="header-actions">
              {/* 非管理员登录用户可以切换到我的商品视图 */}
              {userInfo && userInfo.user_type !== 'admin' && (
                <Button
                  type={viewMode === 'my' ? 'primary' : 'default'}
                  onClick={() => handleViewModeChange(viewMode === 'my' ? 'all' : 'my')}
                  icon={<FilterOutlined />}
                  style={{ marginRight: 8 }}
                >
                  {viewMode === 'my' ? '查看全部商品' : '查看我的商品'}
                </Button>
              )}
              
              {/* 登录用户可以发布新商品 */}
              {userInfo && userInfo.user_type !== 'admin' && (
                <Button type="primary" icon={<PlusOutlined />} href="/create-product">
                  发布商品
                </Button>
              )}
              
              {/* 管理员有特殊的功能按钮 */}
              {userInfo?.user_type === 'admin' && viewMode === 'all' && (
                <Button danger>
                  批量操作
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="filter-section">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12} lg={8}>
            <Search
              placeholder="搜索商品"
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              className="product-search"
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="选择分类"
              size="large"
              onChange={handleCategoryChange}
              value={category}
              className="product-filter"
            >
              {categories.map(cat => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="选择状态"
              size="large"
              onChange={handleStatusChange}
              value={status}
              className="product-filter"
            >
              <Option key="all" value="all">全部状态</Option>
              {getStatusOptions().map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Col>
          
          {/* 管理员额外的筛选选项 */}
          {userInfo?.user_type === 'admin' && (
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="选择操作类型"
                size="large"
                className="product-filter"
              >
                <Option value="verify">待审核</Option>
                <Option value="report">被举报</Option>
                <Option value="featured">推荐商品</Option>
              </Select>
            </Col>
          )}
        </Row>
        </div>
      </div>
      
      <div className="product-list-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : products.length > 0 ? (
          <Row gutter={[16, 16]}>
            {products.map(product => renderProductCard(product))}
          </Row>
        ) : (
          <Empty 
            description="暂无商品数据"
            className="empty-container"
          />
        )}
      </div>
      
      {total > 0 && (
        <div className="pagination-container">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            onShowSizeChange={handlePageSizeChange}
            showSizeChanger
            showTotal={(total) => `共 ${total} 件商品`}
            size="large"
            className="product-pagination"
          />
        </div>
      )}
    </ProductListContainer>
  )
}

// 样式组件
const ProductListContainer = styled.div`
  padding: 0 0 32px 0;
  min-height: calc(100vh - 64px);
  position: relative;
  
  /* 背景图片 */
  background-image: url('https://zs.whut.edu.cn/xyfg/202103/W020210610403863764386.jpg');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  
  /* 轻微遮罩层，确保内容清晰可见 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    z-index: 0;
    pointer-events: none;
  }
  
  /* 确保内容在背景之上 */
  > * {
    position: relative;
    z-index: 1;
  }
  
  .product-list-header {
    margin-bottom: 32px;
    padding: 0;
    position: relative;
    border-radius: 16px;
    box-shadow: none;
    border: none;
    overflow: hidden;
    background: transparent;
    
    .header-top {
      padding: 24px;
    }
    
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #1890ff;
      margin: 0;
      padding: 8px 20px;
      background: rgba(255, 255, 255, 0.85);
      border-radius: 30px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    }
    
    .header-actions {
      margin-top: 16px;
      
      .ant-btn {
        border-radius: 10px;
        height: 42px;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(11, 99, 206, 0.25);
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid rgba(24, 144, 255, 0.55);
        color: #0b63ce;
        backdrop-filter: none;
        min-width: 140px;
        letter-spacing: 0.5px;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(11, 99, 206, 0.35);
          background: #ffffff;
          border-color: rgba(24, 144, 255, 0.9);
          color: #0b63ce;
        }
        
        &.ant-btn-primary {
          background: linear-gradient(135deg, #4facfe 0%, #00c0ff 100%);
          border-color: transparent;
          color: #ffffff;
          
          &:hover {
            background: linear-gradient(135deg, #4facfe 10%, #00c0ff 90%);
            border-color: transparent;
            color: #ffffff;
          }
        }
      }
    }
  }
  
  .filter-section {
    padding: 24px;
    background: transparent;
    border: none;
    box-shadow: none;
    margin: 0 24px;
    
    .ant-input-affix-wrapper,
    .ant-select-selector {
      border-radius: 8px;
      border: 2px solid rgba(255, 255, 255, 0.5);
      background: transparent;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      
      &:hover {
        border-color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.1);
      }
      
      &:focus,
      &.ant-select-focused .ant-select-selector {
        border-color: #1890ff;
        box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
        background: rgba(255, 255, 255, 0.15);
      }
    }
    
    /* 下拉选择框的文字颜色 */
    .ant-select-selection-item,
    .ant-select-selection-placeholder {
      color: #ffffff !important;
    }
    
    .ant-select-arrow {
      color: rgba(255, 255, 255, 0.8) !important;
    }
  }
  
  /* 下拉菜单样式 */
  .ant-select-dropdown {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    
    .ant-select-item {
      color: #333;
      
      &:hover {
        background: rgba(24, 144, 255, 0.1);
      }
      
      &.ant-select-item-option-selected {
        background: rgba(24, 144, 255, 0.2);
        color: #1890ff;
      }
    }
  }
  
  /* 分页下拉菜单样式 */
  .ant-pagination-options .ant-select-dropdown {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    
    .ant-select-item {
      color: #333;
      
      &:hover {
        background: rgba(24, 144, 255, 0.1);
      }
      
      &.ant-select-item-option-selected {
        background: rgba(24, 144, 255, 0.2);
        color: #1890ff;
      }
    }
  }
  
  .product-search {
    width: 100%;
    
    .ant-input {
      border-radius: 8px;
      background: transparent;
      border: 2px solid rgba(255, 255, 255, 0.5);
      color: #ffffff;
      backdrop-filter: none;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.7);
      }
      
      &:hover {
        border-color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.05);
      }
      
      &:focus {
        border-color: #1890ff;
        box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
    }
    
    /* 搜索输入框前缀图标 */
    .ant-input-prefix,
    .ant-input-suffix {
      .anticon {
        color: rgba(255, 255, 255, 0.8);
      }
    }
    
    .ant-btn {
      background: transparent;
      border-color: rgba(255, 255, 255, 0.5);
      box-shadow: none;
      backdrop-filter: none;
      color: #1890ff;
      
      &:hover {
        background: rgba(24, 144, 255, 0.1);
        border-color: rgba(24, 144, 255, 0.8);
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
        color: #1890ff;
      }
    }
    
    /* 搜索按钮图标颜色 */
    .ant-input-search-button .anticon {
      color: #ffffff;
    }
  }
  
  .product-filter {
    width: 100%;
  }
  
  .product-list-content {
    min-height: 400px;
    padding: 0 24px;
    
    .product-col {
      margin-bottom: 24px;
    }
  }
  
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  
  .empty-container {
    padding: 80px 0;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  
  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 40px;
    padding: 24px;
    margin-left: 24px;
    margin-right: 24px;
    background: transparent;
    border-radius: 16px;
    box-shadow: none;
    
    .ant-pagination {
      .ant-pagination-total-text {
        color: #ffffff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .ant-pagination-item {
        border-radius: 8px;
        border: 2px solid rgba(255, 255, 255, 0.5);
        background: transparent;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        
        a {
          color: #ffffff;
        }
        
        &:hover {
          border-color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          
          a {
            color: #ffffff;
          }
        }
        
        &.ant-pagination-item-active {
          background: rgba(102, 126, 234, 0.5);
          border-color: rgba(102, 126, 234, 0.7);
          backdrop-filter: blur(10px);
          
          a {
            color: #ffffff;
          }
        }
      }
      
      .ant-pagination-prev,
      .ant-pagination-next {
        border-radius: 8px;
        border: 2px solid rgba(255, 255, 255, 0.5);
        background: transparent;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        
        .ant-pagination-item-link {
          background: transparent;
          border: none;
          color: #ffffff;
        }
        
        &:hover {
          border-color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          
          .ant-pagination-item-link {
            color: #ffffff;
          }
        }
      }
      
      /* 每页条数选择器 */
      .ant-pagination-options {
        .ant-pagination-options-size-changer {
          .ant-select {
            .ant-select-selector {
              background: transparent;
              border: 2px solid rgba(255, 255, 255, 0.5);
              backdrop-filter: blur(10px);
              color: #ffffff;
              
              .ant-select-selection-item {
                color: #ffffff;
              }
              
              .ant-select-selection-placeholder {
                color: rgba(255, 255, 255, 0.7);
              }
            }
            
            &:hover .ant-select-selector {
              border-color: rgba(255, 255, 255, 0.8);
              background: rgba(255, 255, 255, 0.1);
            }
            
            &.ant-select-focused .ant-select-selector {
              border-color: #1890ff;
              box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
              background: rgba(255, 255, 255, 0.15);
            }
          }
          
          .ant-select-arrow {
            color: rgba(255, 255, 255, 0.8);
          }
        }
      }
    }
  }
`

const StyledProductCard = styled(Card)`
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
  
  .product-image {
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
  
  .product-status {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #fff;
    background-color: rgba(0, 0, 0, 0.6);
  }
  
  .product-status.pending {
    background-color: #fa8c16;
  }
  
  .product-status.sold {
    background-color: #f5222d;
  }
  
  .product-info {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .product-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .product-price {
    font-size: 18px;
    font-weight: bold;
    color: #f5222d;
    margin-bottom: 8px;
  }
  
  .product-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    font-size: 12px;
    color: #8c8c8c;
    margin-top: auto;
    gap: 8px;
  }
  
  .product-id {
    color: #1890ff;
    font-family: monospace;
  }
  
  .header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
`

export default ProductList
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
  const loadProducts = async (page = 1, search = '', cat = '', stat = 'available', mode = 'all') => {
    setLoading(true)
    try {
      // 根据视图模式确定参数
      const params = {
        page,
        per_page: pageSize,
        search,
        category: cat || undefined,
        status: stat
      }
      
      // 发送API请求获取商品数据
      const response = await getProducts(params)
      
      // 处理数据
      let productList = response.products || []
      
      // 如果是查看我的商品视图，根据用户ID筛选
      if (mode === 'my' && userInfo) {
        const currentUserId = userInfo.user_id || userInfo.id
        productList = productList.filter(product => product.seller_id === currentUserId)
      }
      
      // 更新状态
      setProducts(productList)
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
    loadProducts(currentPage, searchQuery, category, status, viewMode)
  }, [currentPage, searchQuery, category, status, pageSize, viewMode])
  
  // 处理视图模式切换
  const handleViewModeChange = (mode) => {
    setViewMode(mode)
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
    setStatus(value)
    setCurrentPage(1)
  }
  
  // 获取标题文本
  const getPageTitle = () => {
    if (userInfo?.user_type === 'admin') {
      return viewMode === 'my' ? '我的商品' : '商品管理'
    }
    return viewMode === 'my' ? '我的商品' : '商品列表'
  }

  // 处理分页变化
  const handlePageChange = (page) => {
    setCurrentPage(page)
    loadProducts(page, searchQuery, category, status, viewMode)
  }

  // 处理页码大小变化
  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
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
          location={product.trading_location}
          seller={{username: product.seller_username}}
          createdAt={product.created_at}
          views={product.views}
        />
      </Link>
    </Col>
  )

  return (
    <ProductListContainer>
      <div className="product-list-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <h1>{getPageTitle()}</h1>
          
          <div className="header-actions">
            {/* 登录用户可以切换到我的商品视图 */}
            {userInfo && (
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
  .product-list-header {
    margin-bottom: 24px;
  }
  
  .product-list-header h1 {
    font-size: 24px;
    font-weight: bold;
  }
  
  .filter-section {
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .product-search {
    width: 100%;
  }
  
  .product-filter {
    width: 100%;
  }
  
  .product-list-content {
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
  
  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 32px;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
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
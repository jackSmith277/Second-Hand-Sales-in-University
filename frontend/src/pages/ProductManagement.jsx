import React, { useState, useEffect } from 'react'
import { Table, Input, Button, Space, Select, Tag, message, Spin, Image, Popconfirm, Modal } from 'antd'
import { SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { getProducts, deleteProduct, toggleProductStatus, getProductStatusText, formatPrice } from '../utils/api'
import { useNavigate } from 'react-router-dom'

const { Search, TextArea } = Input
const { Option } = Select

const ProductManagement = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [toggleModalVisible, setToggleModalVisible] = useState(false)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [toggleReason, setToggleReason] = useState('')
  const [toggleSubmitting, setToggleSubmitting] = useState(false)

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
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'available', label: '可交易' },
    { value: 'pending', label: '交易中' },
    { value: 'sold', label: '已售出' }
  ]

  // 加载商品列表
  const loadProducts = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = {
        page,
        per_page: pageSize,
        search: searchValue || undefined,
        category: category || undefined,
        status: status || undefined
      }
      
      const response = await getProducts(params)
      setProducts(response.products || [])
      setPagination({
        current: page,
        pageSize,
        total: response.total || 0
      })
    } catch (error) {
      message.error('加载商品列表失败')
      console.error('获取商品列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadProducts()
  }, [searchValue, category, status])

  // 处理搜索
  const handleSearch = (value) => {
    setSearchValue(value)
    setPagination({ ...pagination, current: 1 })
  }

  // 处理分类筛选
  const handleCategoryChange = (value) => {
    setCategory(value)
    setPagination({ ...pagination, current: 1 })
  }

  // 处理状态筛选
  const handleStatusChange = (value) => {
    setStatus(value)
    setPagination({ ...pagination, current: 1 })
  }

  // 处理翻页
  const handlePageChange = (page, pageSize) => {
    loadProducts(page, pageSize)
  }

  // 处理删除商品
  const handleDelete = async (productId) => {
    try {
      await deleteProduct(productId)
      message.success('商品删除成功')
      loadProducts(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error(error.message || '删除商品失败')
    }
  }

  // 处理禁用/启用商品
  const handleToggleStatus = (productId, currentStatus) => {
    const target = products.find(product => product.id === productId)
    if (!target) {
      return
    }

    if (currentStatus) {
      setToggleTarget(target)
      setToggleReason('')
      setToggleModalVisible(true)
    } else {
      performToggle(productId, {})
    }
  }

  const performToggle = async (productId, payload) => {
    setToggleSubmitting(true)
    try {
      const response = await toggleProductStatus(productId, payload)
      message.success(response.message || '商品状态已更新')
      setToggleModalVisible(false)
      setToggleTarget(null)
      setToggleReason('')
      await loadProducts(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error(error.message || '修改商品状态失败')
    } finally {
      setToggleSubmitting(false)
    }
  }

  const handleDisableConfirm = () => {
    if (!toggleTarget) return
    if (!toggleReason.trim()) {
      message.warning('请输入禁用理由')
      return
    }
    performToggle(toggleTarget.id, { reason: toggleReason.trim() })
  }

  // 处理编辑商品
  const handleEdit = (productId) => {
    navigate(`/products/${productId}/edit`)
  }

  // 处理查看商品详情
  const handleView = (productId) => {
    navigate(`/products/${productId}`)
  }

  // 获取状态标签
  const getStatusTag = (status) => {
    const colorMap = {
      available: 'success',
      pending: 'warning',
      sold: 'error'
    }
    
    return (
      <Tag color={colorMap[status] || 'default'}>
        {getProductStatusText(status)}
      </Tag>
    )
  }

  // 获取启用状态标签
  const getActiveStatusTag = (isActive, reason) => {
    if (isActive) {
      return <Tag color="success">已启用</Tag>
    }
    return (
      <div>
        <Tag color="error">已禁用</Tag>
        {reason && <div style={{ fontSize: '12px', color: '#999', maxWidth: '180px' }}>{reason}</div>}
      </div>
    )
  }

  // 获取商品图片URL
  const getImageUrl = (images) => {
    if (!images || (Array.isArray(images) && images.length === 0)) {
      return null
    }
    
    if (typeof images === 'string') {
      if (images.includes(',')) {
        const firstImage = images.split(',').map(img => img.trim()).filter(img => img)[0]
        return firstImage || null
      }
      return images
    }
    
    if (Array.isArray(images)) {
      const validImages = images.filter(img => img && typeof img === 'string' && img.trim())
      if (validImages.length === 0) {
        return null
      }
      return validImages[0]
    }
    
    return null
  }

  // 表格列定义
  const columns = [
    {
      title: '商品图片',
      dataIndex: 'images',
      key: 'images',
      width: 100,
      render: (images) => {
        const imageUrl = getImageUrl(images)
        if (!imageUrl) {
          return <div style={{ width: 80, height: 80, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999' }}>无图片</div>
        }
        return (
          <Image
            width={80}
            height={80}
            src={imageUrl}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          />
        )
      }
    },
    {
      title: '商品标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 200
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => formatPrice(price)
    },
    {
      title: '卖家',
      dataIndex: 'seller_username',
      key: 'seller_username',
      width: 120
    },
    {
      title: '交易状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag
    },
    {
      title: '启用状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive, record) => getActiveStatusTag(isActive, record.disable_reason)
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      key: 'views',
      width: 80
    },
    {
      title: '收藏数',
      dataIndex: 'favorites_count',
      key: 'favorites_count',
      width: 80
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger={record.is_active}
            icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleStatus(record.id, record.is_active)}
          >
            {record.is_active ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确定要删除这个商品吗？"
            description="删除后无法恢复，请谨慎操作"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="product-management-container">
      <div className="page-header">
        <h1>商品管理</h1>
      </div>
      
      <div className="filter-section">
        <div className="filter-row">
          <Search
            placeholder="搜索商品标题或描述"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 300, marginRight: 16 }}
          />
          
          <Select
            placeholder="选择分类"
            allowClear
            style={{ width: 150, marginRight: 16 }}
            value={category}
            onChange={handleCategoryChange}
          >
            {categories.map(cat => (
              <Option key={cat.value} value={cat.value}>{cat.label}</Option>
            ))}
          </Select>

          <Select
            placeholder="选择状态"
            allowClear
            style={{ width: 150, marginRight: 16 }}
            value={status}
            onChange={handleStatusChange}
          >
            {statusOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
          
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchValue('')
              setCategory('')
              setStatus('')
              loadProducts(1, pagination.pageSize)
            }}
          >
            重置
          </Button>
        </div>
      </div>
      
      <div className="table-container">
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          onChange={handlePageChange}
          loading={loading}
          scroll={{ x: 1500 }}
          locale={{
            emptyText: loading ? <Spin /> : '暂无商品数据'
          }}
        />
      </div>

      <style jsx>{`
        .product-management-container {
          padding: 24px;
          background: #fff;
          min-height: calc(100vh - 128px);
        }
        
        .page-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .page-header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        
        .filter-section {
          margin-bottom: 24px;
          padding: 16px;
          background: #fafafa;
          border-radius: 8px;
        }
        
        .filter-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .table-container {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
      `}</style>

      <Modal
        title={toggleTarget ? `禁用商品：${toggleTarget.title}` : '禁用商品'}
        open={toggleModalVisible}
        onOk={handleDisableConfirm}
        onCancel={() => {
          if (toggleSubmitting) return
          setToggleModalVisible(false)
          setToggleTarget(null)
          setToggleReason('')
        }}
        confirmLoading={toggleSubmitting}
        okText="确认禁用"
        cancelText="取消"
      >
        <p>请输入禁用理由，该理由将告知发布者：</p>
        <TextArea
          rows={4}
          maxLength={255}
          value={toggleReason}
          onChange={(e) => setToggleReason(e.target.value)}
          placeholder="请填写禁用理由（不超过255个字符）"
        />
      </Modal>
    </div>
  )
}

export default ProductManagement


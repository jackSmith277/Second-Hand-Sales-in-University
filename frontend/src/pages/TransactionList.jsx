import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Input, Select, DatePicker, Card, Empty, Row, Col, message } from 'antd'
import { SearchOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { getTransactions, getTransactionStatusText, formatPrice, formatDate, acceptTransaction, rejectTransaction } from '../utils/api.js'
import styled from 'styled-components'

const { Option } = Select
const { RangePicker } = DatePicker

const TransactionList = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: 'all',
    dateRange: null
  })
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [userInfo, setUserInfo] = useState(null)
  const [viewMode, setViewMode] = useState('own') // 'own' 或 'all'
  const [role, setRole] = useState('buyer') // buyer, seller, all
  
  useEffect(() => {
    // 获取用户信息
    const storedUser = localStorage.getItem('userInfo')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setUserInfo(user)
      
      // 检查URL参数，确定查看模式
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('view') === 'all' && user.user_type === 'admin') {
        setViewMode('all')
      }
    }
  }, [])

  // 加载交易列表
  const loadTransactions = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        per_page: pageSize
      }

      if (searchParams.status !== 'all') {
        params.status = searchParams.status
      }

      if (!(userInfo?.user_type === 'admin' && viewMode === 'all')) {
        if (role === 'buyer' || role === 'seller') {
          params.role = role
        }
      }

      if (userInfo?.user_type === 'admin' && viewMode === 'all') {
        params.view_all = true
        if (role === 'buyer' || role === 'seller') {
          params.role = role
        }
      }

      const response = await getTransactions(params)
      let data = response.transactions || []

      // 基于关键词的前端筛选
      if (searchParams.keyword) {
        const keyword = searchParams.keyword.trim()
        if (keyword) {
          data = data.filter(item =>
            (item.product_title && item.product_title.includes(keyword)) ||
            (item.buyer_username && item.buyer_username.includes(keyword)) ||
            (item.seller_username && item.seller_username.includes(keyword))
          )
        }
      }

      // 基于日期范围过滤（使用 request_time）
      if (searchParams.dateRange) {
        const [startDate, endDate] = searchParams.dateRange
        if (startDate && endDate) {
          const toDate = (value, isEnd = false) => {
            if (!value) return null
            if (value.startOf) {
              const normalized = isEnd ? value.endOf('day') : value.startOf('day')
              return normalized.toDate ? normalized.toDate() : new Date(normalized)
            }
            if (value instanceof Date) {
              return value
            }
            return new Date(value)
          }

          const parseRequestDate = (value) => {
            if (!value) return null
            if (value instanceof Date) return value
            if (typeof value === 'string') {
              return new Date(value.replace(' ', 'T'))
            }
            return new Date(value)
          }

          const start = toDate(startDate, false)
          const end = toDate(endDate, true)

          data = data.filter(item => {
            const requestDate = parseRequestDate(item.request_time)
            if (!requestDate || !start || !end) return false
            return requestDate >= start && requestDate <= end
          })
        }
      }

      setTransactions(data)
      const hasClientFilter = Boolean((searchParams.keyword && searchParams.keyword.trim()) || searchParams.dateRange)
      const totalCount = hasClientFilter ? data.length : (response.total || data.length)
      setTotal(totalCount)
    } catch (error) {
      console.error('加载交易列表失败:', error)
      message.error(error.message || '加载交易列表失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载和参数变化时重新加载
  useEffect(() => {
    if (!userInfo) return
    loadTransactions()
  }, [currentPage, pageSize, searchParams, viewMode, userInfo, role])

  useEffect(() => {
    if (!userInfo || userInfo.user_type !== 'admin') {
      return
    }
    if (viewMode === 'all' && role !== 'all') {
      setRole('all')
      setCurrentPage(1)
    }
    if (viewMode === 'own' && role === 'all') {
      setRole('buyer')
      setCurrentPage(1)
    }
  }, [viewMode, userInfo])
  
  // 处理页面切换时更新URL参数
  useEffect(() => {
    if (userInfo) {
      const urlParams = new URLSearchParams(window.location.search)
      if (userInfo.user_type === 'admin' && viewMode === 'all') {
        urlParams.set('view', 'all')
      } else {
        urlParams.delete('view')
      }
      // 更新URL而不刷新页面
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`
      window.history.replaceState({}, '', newUrl)
    }
  }, [viewMode, userInfo])

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1)
  }

  // 处理重置
  const handleReset = () => {
    setSearchParams({
      keyword: '',
      status: 'all',
      dateRange: null
    })
    setCurrentPage(1)
  }

  // 获取状态标签
  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'orange',
      completed: 'green',
      cancelled: 'red'
    }
    return colorMap[status] || 'default'
  }

  const normalizeDateString = (value) => {
    if (!value) return value
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (typeof value === 'string') {
      return value.replace(' ', 'T')
    }
    return value
  }

  // 表格列配置
  const columns = [
    {
      title: '交易编号',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true
    },
    {
      title: '商品名称',
      dataIndex: 'product_title',
      key: 'product_title',
      ellipsis: true,
      render: (text, record) => (
        <Link to={`/products/${record.product_id}`}>{text}</Link>
      )
    },
    {
      title: '交易金额',
      dataIndex: 'price',
      key: 'price',
      render: (_, record) => formatPrice(record.final_price || record.product_price || 0)
    },
    {
      title: '买家',
      dataIndex: 'buyer_username',
      key: 'buyer_username'
    },
    {
      title: '卖家',
      dataIndex: 'seller_username',
      key: 'seller_username'
    },
    {
      title: '交易状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getTransactionStatusText(status)}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDate(normalizeDateString(date))
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (_, record) => {
        const time = normalizeDateString(record.complete_time || record.cancel_time || record.accept_time || record.request_time)
        return formatDate(time)
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const userId = userInfo?.id
        const isBuyer = record.buyer_id === userId
        const isSeller = record.seller_id === userId
        const canAccept = isSeller && record.status === 'pending'
        const canReject = isSeller && record.status === 'pending'
        const canView = userInfo?.user_type === 'admin' || isBuyer || isSeller

        return (
          <div className="action-buttons-table">
            <div className="primary-actions">
              {canAccept && (
                <Button
                  type="link"
                  icon={<CheckCircleOutlined />}
                  size="small"
                  className="action-link accept"
                  onClick={() => handleAccept(record.id)}
                >
                  接受
                </Button>
              )}
              {canReject && (
                <Button
                  type="link"
                  icon={<CloseCircleOutlined />}
                  size="small"
                  className="action-link reject"
                  onClick={() => handleReject(record.id)}
                >
                  拒绝
                </Button>
              )}
            </div>
            <div className="secondary-actions">
              {canView && (
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  size="small"
                  className="action-link"
                >
                  <Link to={`/transactions/${record.id}`}>详情</Link>
                </Button>
              )}
            </div>
          </div>
        )
      }
    }
  ]

  // 处理接受交易
  const handleAccept = async (id) => {
    try {
      await acceptTransaction(id)
      message.success('交易已成功')
      loadTransactions()
    } catch (error) {
      console.error('接受交易失败:', error)
      message.error(error.message || '接受交易失败，请稍后重试')
    }
  }

  // 处理拒绝交易
  const handleReject = async (id) => {
    try {
      await rejectTransaction(id)
      message.success('交易已拒绝')
      loadTransactions()
    } catch (error) {
      console.error('拒绝交易失败:', error)
      message.error(error.message || '拒绝交易失败，请稍后重试')
    }
  }

  return (
    <TransactionListContainer>
      <div className="page-header">
        <h1>{viewMode === 'all' && userInfo?.user_type === 'admin' ? '全部交易管理' : '交易管理'}</h1>
        {/* 管理员视图切换按钮 */}
        {userInfo?.user_type === 'admin' && (
          <div className="view-mode-switch">
            <Button
              type={viewMode === 'own' ? 'primary' : 'default'}
              onClick={() => setViewMode('own')}
              style={{ marginRight: 8 }}
            >
              我的交易
            </Button>
            <Button
              type={viewMode === 'all' ? 'primary' : 'default'}
              onClick={() => setViewMode('all')}
            >
              全部交易
            </Button>
          </div>
        )}
        {viewMode === 'all' && userInfo?.user_type === 'admin' && (
          <Tag color="red" style={{ marginTop: 8 }}>管理员模式</Tag>
        )}
      </div>
      
      <Card className="filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={8}>
            <Input
              placeholder="搜索商品名称、买家或卖家"
              prefix={<SearchOutlined />}
              value={searchParams.keyword}
              onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Select
              placeholder="选择交易状态"
              value={searchParams.status}
              onChange={(value) => setSearchParams({ ...searchParams, status: value })}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待响应</Option>
              <Option value="completed">交易成功</Option>
              <Option value="cancelled">已拒绝</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              value={searchParams.dateRange}
              onChange={(dates) => setSearchParams({ ...searchParams, dateRange: dates })}
            />
          </Col>
        </Row>
        <div className="filter-actions">
          <div className="role-switch">
            {userInfo?.user_type === 'admin' && viewMode === 'all' ? (
              <>
                <Button type={role === 'all' ? 'primary' : 'default'} onClick={() => { setRole('all'); setCurrentPage(1) }}>
                  全部角色
                </Button>
                <Button type={role === 'buyer' ? 'primary' : 'default'} onClick={() => { setRole('buyer'); setCurrentPage(1) }}>
                  仅买家
                </Button>
                <Button type={role === 'seller' ? 'primary' : 'default'} onClick={() => { setRole('seller'); setCurrentPage(1) }}>
                  仅卖家
                </Button>
              </>
            ) : (
              <>
                <Button type={role === 'buyer' ? 'primary' : 'default'} onClick={() => { setRole('buyer'); setCurrentPage(1) }}>
                  作为买家
                </Button>
                <Button type={role === 'seller' ? 'primary' : 'default'} onClick={() => { setRole('seller'); setCurrentPage(1) }}>
                  作为卖家
                </Button>
              </>
            )}
          </div>
          <div className="filter-buttons">
            <Button type="primary" onClick={handleSearch}>搜索</Button>
            <Button onClick={handleReset}>重置</Button>
            <Button icon={<ReloadOutlined />} onClick={loadTransactions} loading={loading}>
              刷新
            </Button>
          </div>
        </div>
      </Card>
      
      <Card className="transactions-table-card">
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size)
            },
            showSizeChanger: true,
            showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          locale={{
            emptyText: <Empty description="暂无交易记录" />
          }}
        />
      </Card>
    </TransactionListContainer>
  )
}

// 样式组件
const TransactionListContainer = styled.div`
  padding: 32px 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 64px);
  
  .page-header {
    margin-bottom: 32px;
    padding: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
    
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 16px 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .view-mode-switch {
      margin-top: 16px;
      
      .ant-btn {
        border-radius: 8px;
        height: 40px;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }
  
  .filter-card {
    margin-bottom: 32px;
    padding: 24px;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: none;
    
    .ant-input,
    .ant-select-selector,
    .ant-picker {
      border-radius: 8px;
      border: 2px solid #e9ecef;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: #1890ff;
      }
      
      &:focus,
      &.ant-picker-focused {
        border-color: #1890ff;
        box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
      }
    }
  }
  
  .filter-actions {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    padding-top: 16px;
    border-top: 1px solid #e9ecef;
  }

  .role-switch, .filter-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    
    .ant-btn {
      border-radius: 8px;
      height: 36px;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  }
  
  .transactions-table-card {
    padding: 24px;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: none;
    overflow: hidden;
    
    .ant-table {
      .ant-table-thead > tr > th {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-bottom: 2px solid #dee2e6;
        font-weight: 600;
        color: #495057;
        padding: 16px;
      }
      
      .ant-table-tbody > tr {
        transition: all 0.3s ease;
        
        &:hover {
          background: #f8f9fa;
          transform: scale(1.01);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        > td {
          padding: 16px;
          border-bottom: 1px solid #e9ecef;
        }
      }
      
      .ant-table-tbody > tr:last-child > td {
        border-bottom: none;
      }
    }
    
    .ant-tag {
      border-radius: 12px;
      padding: 4px 12px;
      font-weight: 500;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .ant-btn-link {
      border-radius: 6px;
      padding: 4px 8px;
      transition: all 0.3s ease;
      
      &:hover {
        background: #f0f0f0;
        transform: translateY(-1px);
      }
    }
  
  .action-buttons-table {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .primary-actions,
    .secondary-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .action-link {
      padding: 0 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      a {
        color: #1890ff;
      }

      &:hover a {
        color: #40a9ff;
      }

      &.accept {
        color: #52c41a;
      }

      &.reject {
        color: #ff4d4f;
      }
    }
  }
    
    .ant-pagination {
      margin-top: 24px;
      
      .ant-pagination-item {
        border-radius: 8px;
        border: 2px solid #e9ecef;
        transition: all 0.3s ease;
        
        &:hover {
          border-color: #1890ff;
          transform: translateY(-2px);
        }
        
        &.ant-pagination-item-active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
          
          a {
            color: #ffffff;
          }
        }
      }
      
      .ant-pagination-prev,
      .ant-pagination-next {
        border-radius: 8px;
        border: 2px solid #e9ecef;
        transition: all 0.3s ease;
        
        &:hover {
          border-color: #1890ff;
          transform: translateY(-2px);
        }
      }
    }
  }
  
  @media (max-width: 768px) {
    padding: 16px;
    
    .page-header {
      padding: 20px;
      
      h1 {
        font-size: 24px;
      }
    }
    
    .filter-card {
      padding: 16px;
    }
    
    .filter-actions {
      flex-direction: column;
      align-items: stretch;
    }
    
    .role-switch, .filter-buttons {
      justify-content: center;
      width: 100%;
    }
    
    .transactions-table-card {
      padding: 16px;
      overflow-x: auto;
    }
  }
`

export default TransactionList
import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Input, Select, DatePicker, Card, Empty, Row, Col, message } from 'antd'
import { SearchOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { getTransactions, getTransactionStatusText, formatPrice, formatDate } from '../utils/api.js'
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

  // 模拟交易数据
  const mockTransactions = [
    {
      id: 't1',
      product_id: '1',
      product_title: '全新高等数学教材',
      buyer_id: 'b1',
      buyer_username: '王同学',
      seller_id: 's1',
      seller_username: '李同学',
      price: 50,
      status: 'pending',
      created_at: '2023-10-18 14:30:00',
      updated_at: '2023-10-18 14:30:00'
    },
    {
      id: 't2',
      product_id: '2',
      product_title: '线性代数教材',
      buyer_id: 'b2',
      buyer_username: '赵同学',
      seller_id: 's2',
      seller_username: '陈同学',
      price: 45,
      status: 'completed',
      created_at: '2023-10-15 09:15:00',
      updated_at: '2023-10-16 16:45:00'
    },
    {
      id: 't3',
      product_id: '3',
      product_title: '概率论与数理统计',
      buyer_id: 'b3',
      buyer_username: '刘同学',
      seller_id: 's3',
      seller_username: '黄同学',
      price: 55,
      status: 'canceled',
      created_at: '2023-10-10 11:20:00',
      updated_at: '2023-10-11 10:30:00'
    },
    {
      id: 't4',
      product_id: '4',
      product_title: '大学物理教材',
      buyer_id: 'b4',
      buyer_username: '周同学',
      seller_id: 's4',
      seller_username: '吴同学',
      price: 60,
      status: 'pending',
      created_at: '2023-10-08 16:00:00',
      updated_at: '2023-10-08 16:00:00'
    },
    {
      id: 't5',
      product_id: '5',
      product_title: '英语四级词汇',
      buyer_id: 'b5',
      buyer_username: '孙同学',
      seller_id: 's5',
      seller_username: '郑同学',
      price: 35,
      status: 'completed',
      created_at: '2023-10-05 13:45:00',
      updated_at: '2023-10-06 15:20:00'
    }
  ]

  // 加载交易列表
  const loadTransactions = async () => {
    setLoading(true)
    try {
      // 实际项目中应该从API获取数据
      const requestParams = {
        page: currentPage,
        pageSize: pageSize,
        ...searchParams
      }
      
      // 管理员查看全部交易时添加参数
      if (viewMode === 'all' && userInfo?.user_type === 'admin') {
        requestParams.view_all = true
      }
      
      // const response = await getTransactions(requestParams)
      // setTransactions(response.transactions)
      // setTotal(response.total)
      
      // 使用模拟数据
      let filteredData = [...mockTransactions]
      
      // 根据关键词筛选
      if (searchParams.keyword) {
        filteredData = filteredData.filter(item => 
          item.product_title.includes(searchParams.keyword) ||
          item.buyer_username.includes(searchParams.keyword) ||
          item.seller_username.includes(searchParams.keyword)
        )
      }
      
      // 根据状态筛选
      if (searchParams.status !== 'all') {
        filteredData = filteredData.filter(item => item.status === searchParams.status)
      }
      
      // 根据日期范围筛选
      if (searchParams.dateRange) {
        const [startDate, endDate] = searchParams.dateRange
        filteredData = filteredData.filter(item => {
          const transactionDate = new Date(item.created_at)
          return transactionDate >= startDate && transactionDate <= endDate
        })
      }
      
      // 根据用户类型和查看模式筛选
      if (userInfo && viewMode !== 'all') {
        filteredData = filteredData.filter(item => 
          item.buyer_id === userInfo.user_id || item.seller_id === userInfo.user_id
        )
      }
      
      // 模拟分页
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedData = filteredData.slice(startIndex, endIndex)
      
      setTransactions(paginatedData)
      setTotal(filteredData.length)
    } catch (error) {
      console.error('加载交易列表失败:', error)
      message.error('加载交易列表失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载和参数变化时重新加载
  useEffect(() => {
    loadTransactions()
  }, [currentPage, pageSize, searchParams, viewMode, userInfo])
  
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
    loadTransactions()
  }

  // 处理重置
  const handleReset = () => {
    setSearchParams({
      keyword: '',
      status: 'all',
      dateRange: null
    })
    setCurrentPage(1)
    loadTransactions()
  }

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
      case 'canceled':
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

  // 获取状态对应的颜色
  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'orange',
      completed: 'green',
      canceled: 'red'
    }
    return colorMap[status] || 'default'
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
      render: (price) => formatPrice(price)
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
      render: (date) => formatDate(date)
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date) => formatDate(date)
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const isAdmin = userInfo?.user_type === 'admin'
        const userId = userInfo?.user_id
        
        // 管理员可以进行所有操作
        // 普通用户只能对自己参与的交易进行相应操作
        const canManage = isAdmin || 
          (record.buyer_id === userId && record.status === 'pending') ||
          (record.seller_id === userId && record.status === 'pending')
        
        // 检查是否有权限查看此交易
            const canView = isAdmin || 
              (userInfo && (record.buyer_id === userInfo.user_id || record.seller_id === userInfo.user_id))
            
            return (
              <Space size="middle">
                {canView && (
                  <Button 
                    type="link" 
                    icon={<EyeOutlined />} 
                    size="small"
                  >
                    <Link to={`/transactions/${record.id}`}>查看详情</Link>
                  </Button>
                )}
                
                {canManage && record.status === 'pending' && (
                  <>
                    <Button 
                      type="link" 
                      icon={<CheckCircleOutlined />} 
                      size="small"
                      style={{ color: '#52c41a' }}
                      onClick={() => handleConfirm(record.id)}
                    >
                      确认
                    </Button>
                    <Button 
                      type="link" 
                      icon={<CloseCircleOutlined />} 
                      size="small"
                      style={{ color: '#ff4d4f' }}
                      onClick={() => handleCancel(record.id)}
                    >
                      取消
                    </Button>
                  </>
                )}
              </Space>
            )
      }
    }
  ]

  // 处理确认交易
  const handleConfirm = async (id) => {
    try {
      // 实际项目中应该调用确认交易的API
      // await confirmTransaction(id)
      message.success('交易已确认')
      loadTransactions()
    } catch (error) {
      message.error('确认交易失败，请稍后重试')
    }
  }

  // 处理取消交易
  const handleCancel = async (id) => {
    try {
      // 实际项目中应该调用取消交易的API
      // await cancelTransaction(id)
      message.success('交易已取消')
      loadTransactions()
    } catch (error) {
      message.error('取消交易失败，请稍后重试')
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
              <Option value="pending">待确认</Option>
              <Option value="completed">已完成</Option>
              <Option value="canceled">已取消</Option>
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
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
          <Button icon={<ReloadOutlined />} onClick={loadTransactions} loading={loading}>
            刷新
          </Button>
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
  .page-header {
    margin-bottom: 24px;
  }
  
  .page-header h1 {
    font-size: 24px;
    font-weight: bold;
    color: #333;
  }
  
  .filter-card {
    margin-bottom: 24px;
    padding: 16px;
  }
  
  .filter-actions {
    margin-top: 16px;
    display: flex;
    gap: 12px;
  }
  
  .transactions-table-card {
    padding: 16px;
  }
  
  @media (max-width: 768px) {
    .filter-actions {
      flex-wrap: wrap;
    }
    
    .filter-actions Button {
      flex: 1;
      min-width: 100px;
    }
  }
`

export default TransactionList
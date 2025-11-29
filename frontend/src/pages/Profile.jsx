import React, { useState, useEffect, useCallback } from 'react'
import { Card, Tabs, Form, Input, Button, Avatar, message, Row, Col, Statistic, List, Divider, Tag, Upload, Badge } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined, EditOutlined, CheckOutlined, ShoppingOutlined, TransactionOutlined, HeartOutlined, UsergroupAddOutlined, TrophyOutlined } from '@ant-design/icons'
import { getUserInfo, updateUserInfo, getFavorites, getProducts, getProductStatusText, formatPrice, getAdminStats, getContactRequests, replyContactRequest, markContactRequestRead, getUnreadCount, getTransactions, getTransactionStatusText } from '../utils/api.js'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

const { TabPane } = Tabs

const Profile = () => {
  const [form] = Form.useForm()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [stats, setStats] = useState({
    products: 0,
    transactions: 0,
    favorites: 0,
    users: 0,
    totalProducts: 0,
    totalTransactions: 0
  })
  const [myProducts, setMyProducts] = useState([])
  const [myProductsLoading, setMyProductsLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [contactRequests, setContactRequests] = useState([])
  const [contactRequestsLoading, setContactRequestsLoading] = useState(false)
  const [replyingId, setReplyingId] = useState(null)
  const [replyTexts, setReplyTexts] = useState({})
  const [replying, setReplying] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [transactionRecords, setTransactionRecords] = useState([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)

  // 初始空数据，将从API获取真实数据
  const defaultStats = {
    products: 0,
    transactions: 0,
    favorites: 0,
    users: 0,
    totalProducts: 0,
    totalTransactions: 0
  }

  // 加载用户信息和统计数据
  const loadMyProducts = useCallback(async () => {
    setMyProductsLoading(true)
    try {
      const response = await getProducts({ mine: true, per_page: 5 })
      const productList = response.products || []
      setMyProducts(productList)
      setStats(prev => ({
        ...prev,
        products: response.total ?? productList.length ?? 0
      }))
    } catch (error) {
      console.error('获取我的商品失败:', error)
      message.error(error.message || '获取我的商品失败')
    } finally {
      setMyProductsLoading(false)
    }
  }, [])

  const loadRecentTransactions = useCallback(async () => {
    if (!userInfo) return
    setTransactionsLoading(true)
    try {
      const params = {
        page: 1,
        per_page: 6,
        role: 'all'
      }
      const response = await getTransactions(params)
      setTransactionRecords(response.transactions || [])
    } catch (error) {
      console.error('获取交易记录失败:', error)
    } finally {
      setTransactionsLoading(false)
    }
  }, [userInfo])

  // 存储消息，分别存储作为买家和卖家的消息
  const [buyerRequests, setBuyerRequests] = useState([])
  const [sellerRequests, setSellerRequests] = useState([])

  const loadContactRequests = useCallback(async () => {
    setContactRequestsLoading(true)
    try {
      // 同时加载作为买家和卖家的消息
      const [sellerResponse, buyerResponse] = await Promise.all([
        getContactRequests({ role: 'seller', per_page: 20 }).catch(() => ({ contact_requests: [], unread_count: 0 })),
        getContactRequests({ role: 'buyer', per_page: 20 }).catch(() => ({ contact_requests: [], unread_count: 0 }))
      ])
      
      const sellerReqs = sellerResponse.contact_requests || []
      const buyerReqs = buyerResponse.contact_requests || []
      
      setSellerRequests(sellerReqs)
      setBuyerRequests(buyerReqs)
      
      // 合并所有消息，卖家消息在前
      const allRequests = [...sellerReqs.map(req => ({ ...req, _role: 'seller' })), ...buyerReqs.map(req => ({ ...req, _role: 'buyer' }))]
      setContactRequests(allRequests)
      
      // 更新未读数量（合并两个角色的未读数量）
      const sellerUnread = sellerResponse.unread_count || 0
      const buyerUnread = buyerResponse.unread_count || 0
      setUnreadCount(sellerUnread + buyerUnread)
    } catch (error) {
      console.error('获取联系消息失败:', error)
      message.error(error.message || '获取联系消息失败')
    } finally {
      setContactRequestsLoading(false)
    }
  }, [])

  // 加载未读消息数量（同时获取卖家和买家的未读数量）
  const loadUnreadCount = useCallback(async () => {
    try {
      const [sellerResponse, buyerResponse] = await Promise.all([
        getUnreadCount('seller').catch(() => ({ unread_count: 0 })),
        getUnreadCount('buyer').catch(() => ({ unread_count: 0 }))
      ])
      const totalUnread = (sellerResponse.unread_count || 0) + (buyerResponse.unread_count || 0)
      setUnreadCount(totalUnread)
    } catch (error) {
      console.error('获取未读消息数量失败:', error)
    }
  }, [])

  const fetchUserData = useCallback(async () => {
    try {
      const info = await getUserInfo()
      setUserInfo(info)
      form.setFieldsValue({
        username: info.username,
        email: info.email,
        phone: info.phone || '',
        avatar: info.avatar || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      })

      try {
        const favoritesData = await getFavorites()
        setStats(prev => ({
          ...prev,
          favorites: favoritesData.total ?? favoritesData.favorites?.length ?? 0
        }))
      } catch (error) {
        console.error('获取收藏统计失败:', error)
        setStats(prev => ({ ...prev, favorites: 0 }))
      }

      if (info.user_type === 'admin') {
        try {
          const adminStats = await getAdminStats()
          setStats(prev => ({
            ...prev,
            users: adminStats.total_users ?? 0,
            totalProducts: adminStats.total_products ?? 0,
            totalTransactions: adminStats.total_transactions ?? 0
          }))
        } catch (error) {
          console.error('获取管理员统计失败:', error)
        }
      }

      await loadMyProducts()
      await loadRecentTransactions()
    } catch (error) {
      console.error('获取用户信息失败:', error)
      message.error('获取用户信息失败，请重新登录')
    }
  }, [form, loadMyProducts, loadRecentTransactions])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  useEffect(() => {
    if (userInfo && userInfo.user_type !== 'admin') {
      loadContactRequests()
      loadUnreadCount()
    }
  }, [userInfo, loadContactRequests, loadUnreadCount])

  // 处理编辑
  const handleEdit = () => {
    setEditing(true)
  }

  // 处理取消编辑
  const handleCancel = () => {
    setEditing(false)
    if (userInfo) {
      form.setFieldsValue({
        username: userInfo.username,
        email: userInfo.email,
        phone: userInfo.phone,
        avatar: userInfo.avatar,
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    }
  }

  // 处理保存
  const handleSave = async (values) => {
    setLoading(true)
    try {
      const payload = {
        username: values.username?.trim(),
        email: values.email?.trim(),
        phone: values.phone?.trim(),
        avatar: values.avatar?.trim()
      }

      if (values.new_password) {
        if (!values.current_password) {
          message.error('请先输入当前密码')
          setLoading(false)
          return
        }
        payload.current_password = values.current_password
        payload.new_password = values.new_password
      }

      // 移除空字段，避免后端覆盖为 undefined
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === null) {
          delete payload[key]
        }
      })

      await updateUserInfo(payload)
      message.success('个人信息更新成功')
      await fetchUserData()
      setEditing(false)
    } catch (error) {
      message.error(error.response?.data?.message || '更新失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 渲染个人信息表单
  const renderProfileForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
      className="profile-form"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8} className="profile-avatar-col">
          <div className="profile-avatar-section">
            <Avatar
              size={120}
              src={form.getFieldValue('avatar') || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
            />
            <Upload
              name="file"
              showUploadList={false}
              action="/api/upload/avatar"
              disabled={!editing}
              headers={{
                'user-id': userInfo?.id || '',
                'user-type': userInfo?.user_type || ''
              }}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/')
                if (!isImage) {
                  message.error('仅支持上传图片文件')
                }
                const isLt2M = file.size / 1024 / 1024 < 2
                if (!isLt2M) {
                  message.error('头像大小需小于2MB')
                }
                return isImage && isLt2M
              }}
              onChange={({ file }) => {
                if (file.status === 'uploading') {
                  setAvatarUploading(true)
                }
                if (file.status === 'done') {
                  const url = file.response?.url
                  if (url) {
                    form.setFieldsValue({ avatar: url })
                    const updatedUserInfo = { ...userInfo, avatar: url }
                    setUserInfo(updatedUserInfo)
                    // 更新 localStorage 中的 userInfo
                    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
                    message.success('头像上传成功')
                    // 刷新页面以更新所有组件
                    setTimeout(() => {
                      window.location.reload()
                    }, 500)
                  }
                  setAvatarUploading(false)
                } else if (file.status === 'error') {
                  setAvatarUploading(false)
                  message.error(file.response?.error || '头像上传失败')
                }
              }}
            >
              <Button type="link" disabled={!editing || avatarUploading}>
                {avatarUploading ? '上传中...' : '上传头像'}
              </Button>
            </Upload>
          </div>
        </Col>
        <Col xs={24} md={16}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input disabled={!editing} placeholder="用户名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input disabled={!editing} placeholder="邮箱" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="手机号码"
            rules={[{ required: true, message: '请输入手机号码' }]}
          >
            <Input disabled={!editing} placeholder="手机号码" />
          </Form.Item>

          <Form.Item
            name="current_password"
            label="当前密码"
            tooltip="修改密码时需要先输入当前密码"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!editing || !getFieldValue('new_password')) {
                    return Promise.resolve()
                  }
                  if (!value) {
                    return Promise.reject(new Error('请输入当前密码'))
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <Input.Password disabled={!editing} placeholder="当前密码" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="新密码"
            rules={
              editing
                ? [{ min: 6, message: '密码至少6位' }]
                : []
            }
          >
            <Input.Password disabled={!editing} placeholder="不修改请留空" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="确认新密码"
            dependencies={['new_password']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!editing || !getFieldValue('new_password')) {
                    return Promise.resolve()
                  }
                  if (!value) {
                    return Promise.reject(new Error('请确认新密码'))
                  }
                  if (value !== getFieldValue('new_password')) {
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <Input.Password disabled={!editing} placeholder="请再次输入新密码" />
          </Form.Item>
          
          <div className="profile-actions">
            {editing ? (
              <>
                <Button type="primary" htmlType="submit" loading={loading}>
                  <CheckOutlined /> 保存
                </Button>
                <Button onClick={handleCancel} style={{ marginLeft: 8 }}>
                  取消
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                htmlType="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  handleEdit()
                }}
              >
                <EditOutlined /> 编辑资料
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </Form>
  )

  // 渲染统计信息
  const renderStatistics = () => {
    // 管理员统计信息
    if (userInfo?.user_type === 'admin') {
      return (
        <Row gutter={[16, 16]} className="profile-stats">
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="系统用户数量"
                value={stats.users}
                prefix={<UsergroupAddOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="商品总数"
                value={stats.totalProducts}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="总交易量"
                value={stats.totalTransactions}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#fa541c' }}
              />
            </Card>
          </Col>
        </Row>
      )
    }
    
    // 普通用户统计信息
    return (
      <Row gutter={[16, 16]} className="profile-stats">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="发布的商品"
              value={stats.products}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="交易记录"
              value={stats.transactions}
              prefix={<TransactionOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="收藏商品"
              value={stats.favorites}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>
    )
  }

  // 渲染我的商品
  const renderMyProducts = () => (
    <Card title="我的商品" extra={<Link to="/products?my=1">查看全部</Link>}>
      <List
        loading={myProductsLoading}
        dataSource={myProducts}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <Link key="edit" to={`/products/${item.id}/edit`}>编辑</Link>,
              <Link key="view" to={`/products/${item.id}`}>查看</Link>
            ]}
          >
            <List.Item.Meta
              title={<Link to={`/products/${item.id}`}>{item.title}</Link>}
              description={`发布时间: ${item.created_at} | 状态: ${getProductStatusText(item.status)}${item.is_active === false ? `（已禁用${item.disable_reason ? `：${item.disable_reason}` : ''}）` : ''}`}
            />
            <div className="product-price">{formatPrice(item.price)}</div>
          </List.Item>
        )}
        locale={{ emptyText: <div className="empty-message">暂无发布的商品，<a href="/create-product">立即发布</a></div> }}
      />
    </Card>
  )

  // 渲染交易记录
  const renderTransactions = () => (
    <Card title="交易记录" extra={<a href="/transactions">查看全部</a>}>
      <List
        dataSource={transactionRecords}
        loading={transactionsLoading}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <Link key="view" to={`/transactions/${item.id}`}>查看详情</Link>
            ]}
          >
            <List.Item.Meta
              title={<Link to={`/products/${item.product?.id || item.product_id}`}>{item.product_title}</Link>}
              description={`状态: ${getTransactionStatusText(item.status)} ｜ 创建时间: ${formatDate(item.request_time)}`}
            />
            <div className="product-price">{formatPrice(item.final_price || item.product?.price)}</div>
          </List.Item>
        )}
        locale={{ emptyText: <div className="empty-message">暂无交易记录</div> }}
      />
    </Card>
  )

  const handleReply = async (contactId) => {
    const replyText = replyTexts[contactId]?.trim()
    if (!replyText) {
      message.warning('请输入回复内容')
      return
    }

    setReplying(true)
    try {
      await replyContactRequest(contactId, replyText)
      message.success('回复成功')
      // 重新加载消息列表和未读数量
      await loadContactRequests()
      await loadUnreadCount()
      // 清除回复输入框
      setReplyTexts(prev => {
        const newTexts = { ...prev }
        delete newTexts[contactId]
        return newTexts
      })
      setReplyingId(null)
    } catch (error) {
      message.error(error.message || '回复失败，请稍后重试')
    } finally {
      setReplying(false)
    }
  }

  const renderContactInbox = () => (
    <Card
      title="联系消息"
      extra={
        <Button type="link" onClick={loadContactRequests} disabled={contactRequestsLoading}>
          刷新
        </Button>
      }
    >
      <List
        loading={contactRequestsLoading}
        dataSource={contactRequests}
        renderItem={(item) => {
          const buyerName = item.buyer?.username || '匿名用户'
          const productTitle = item.product?.title || '商品'
          const actions = []
          if (item.product?.id) {
            actions.push(<Link key="product" to={`/products/${item.product.id}`}>查看商品</Link>)
          }
          const contactDetails = []
          if (item.buyer?.email) {
            contactDetails.push(`邮箱：${item.buyer.email}`)
          }
          if (item.buyer?.phone) {
            contactDetails.push(`电话：${item.buyer.phone}`)
          }
          const hasReply = item.reply && item.reply.trim()
          const isReplying = replyingId === item.id
          const isUnread = !item.is_read
          
          // 当消息展开时，自动标记为已读
          const handleItemClick = async () => {
            if (isUnread) {
              try {
                await markContactRequestRead(item.id)
                // 更新本地状态
                setContactRequests(prev => prev.map(req => 
                  req.id === item.id ? { ...req, is_read: true } : req
                ))
                // 更新未读数量
                setUnreadCount(prev => Math.max(0, prev - 1))
              } catch (error) {
                console.error('标记已读失败:', error)
              }
            }
          }
          
          return (
            <List.Item 
              key={item.id} 
              actions={actions}
              onClick={handleItemClick}
              style={{ 
                cursor: 'pointer',
                backgroundColor: isUnread ? '#f0f9ff' : 'transparent',
                borderLeft: isUnread ? '3px solid #1890ff' : '3px solid transparent',
                paddingLeft: isUnread ? '13px' : '16px'
              }}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>
                      {item._role === 'seller' 
                        ? `${buyerName} 想了解「${productTitle}」`
                        : `我对「${productTitle}」的咨询`
                      }
                    </span>
                    {isUnread && <Badge status="processing" />}
                  </div>
                }
                description={
                  <div>
                    {item._role === 'seller' ? (
                      // 卖家视角：显示买家留言
                      <>
                        <div style={{ 
                          marginBottom: 8, 
                          padding: '16px 20px', 
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                          borderRadius: 12,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                        }}>
                          <p style={{ marginBottom: 8, fontWeight: 600, color: '#495057', fontSize: 14 }}>买家留言：</p>
                          <p style={{ marginBottom: 0, color: '#212529', lineHeight: 1.6 }}>{item.message || '对方未留下留言'}</p>
                        </div>
                        {hasReply ? (
                          <div style={{ 
                            marginTop: 8, 
                            padding: '16px 20px', 
                            background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', 
                            borderRadius: 12, 
                            border: '2px solid #91d5ff',
                            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)'
                          }}>
                            <p style={{ marginBottom: 8, fontWeight: 600, color: '#1890ff', fontSize: 14 }}>我的回复：</p>
                            <p style={{ marginBottom: 0, color: '#0050b3', lineHeight: 1.6 }}>{item.reply}</p>
                          </div>
                        ) : (
                          <div style={{ marginTop: 8 }}>
                            {isReplying ? (
                              <div>
                                <Input.TextArea
                                  rows={3}
                                  maxLength={300}
                                  placeholder="请输入回复内容..."
                                  value={replyTexts[item.id] || ''}
                                  onChange={(e) => setReplyTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  style={{ marginBottom: 8 }}
                                />
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <Button
                                    type="primary"
                                    size="small"
                                    loading={replying}
                                    onClick={() => handleReply(item.id)}
                                  >
                                    发送回复
                                  </Button>
                                  <Button
                                    size="small"
                                    onClick={() => {
                                      setReplyingId(null)
                                      setReplyTexts(prev => {
                                        const newTexts = { ...prev }
                                        delete newTexts[item.id]
                                        return newTexts
                                      })
                                    }}
                                  >
                                    取消
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                type="link"
                                size="small"
                                onClick={() => setReplyingId(item.id)}
                              >
                                回复消息
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      // 买家视角：显示我的留言和卖家回复
                      <>
                        <div style={{ 
                          marginBottom: 8, 
                          padding: '16px 20px', 
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                          borderRadius: 12,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                        }}>
                          <p style={{ marginBottom: 8, fontWeight: 600, color: '#495057', fontSize: 14 }}>我的留言：</p>
                          <p style={{ marginBottom: 0, color: '#212529', lineHeight: 1.6 }}>{item.message || '未留下留言'}</p>
                        </div>
                        {hasReply ? (
                          <div style={{ 
                            marginTop: 8, 
                            padding: '16px 20px', 
                            background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', 
                            borderRadius: 12, 
                            border: '2px solid #91d5ff',
                            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)'
                          }}>
                            <p style={{ marginBottom: 8, fontWeight: 600, color: '#1890ff', fontSize: 14 }}>卖家回复：</p>
                            <p style={{ marginBottom: 0, color: '#0050b3', lineHeight: 1.6 }}>{item.reply}</p>
                          </div>
                        ) : (
                          <div style={{ 
                            marginTop: 8, 
                            padding: '16px 20px', 
                            background: 'linear-gradient(135deg, #fffbe6 0%, #ffeaa7 100%)', 
                            borderRadius: 12, 
                            border: '2px solid #ffe58f',
                            boxShadow: '0 2px 8px rgba(212, 136, 6, 0.15)'
                          }}>
                            <p style={{ marginBottom: 0, color: '#d48806', fontWeight: 500 }}>等待卖家回复...</p>
                          </div>
                        )}
                      </>
                    )}
                    {contactDetails.length > 0 && (
                      <p style={{ marginTop: 8, marginBottom: 0, color: '#888', fontSize: 12 }}>
                        {contactDetails.join(' ｜ ')}
                      </p>
                    )}
                  </div>
                }
              />
              <div className="contact-request-meta">
                <div>收到时间：{item.created_at}</div>
                {item.updated_at && item.updated_at !== item.created_at && (
                  <div>最近更新：{item.updated_at}</div>
                )}
              </div>
            </List.Item>
          )
        }}
        locale={{ emptyText: <div className="empty-message">暂无联系消息</div> }}
      />
    </Card>
  )

  // 获取交易状态文本
  const getStatusText = (status) => {
    const statusMap = {
      'pending': '待处理',
      'completed': '交易成功',
      'cancelled': '交易失败'
    }
    return statusMap[status] || status
  }

  return (
    <ProfileContainer>
      <div className="profile-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1>{userInfo?.user_type === 'admin' ? '管理员中心' : '个人中心'}</h1>
          {userInfo && (
            <Tag color={userInfo.user_type === 'admin' ? 'red' : 'blue'}>
              {userInfo.user_type === 'admin' ? '管理员' : '学生'}
            </Tag>
          )}
        </div>
      </div>
      
      {renderStatistics()}
      
      <Divider />
      
      <Tabs defaultActiveKey="1" className="profile-tabs">
        <TabPane tab="基本信息" key="1">
          <Card className="profile-info-card">
            {renderProfileForm()}
          </Card>
        </TabPane>
        {userInfo?.user_type !== 'admin' && (
          <>
            <TabPane tab="我的商品" key="2">
              {renderMyProducts()}
            </TabPane>
            <TabPane tab="交易记录" key="3">
              {renderTransactions()}
            </TabPane>
            <TabPane 
              tab={
                <span>
                  联系消息
                  {unreadCount > 0 && (
                    <span style={{ 
                      marginLeft: 8, 
                      padding: '2px 6px', 
                      background: '#ff4d4f', 
                      color: '#fff', 
                      borderRadius: 10, 
                      fontSize: 12 
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </span>
              } 
              key="4"
            >
              {renderContactInbox()}
            </TabPane>
          </>
        )}
        {userInfo?.user_type === 'admin' && (
          <TabPane tab="系统概览" key="admin">
            <Card>
              <h3>管理员信息</h3>
              <p>欢迎使用管理员账号访问系统。作为管理员，您可以：</p>
              <ul>
                <li>管理所有用户账号</li>
                <li>查看全部交易记录</li>
                <li>监控系统运行状态</li>
              </ul>
              <Button type="primary" href="/user-management" style={{ marginTop: 16 }}>
                前往用户管理
              </Button>
              <Button href="/transactions?view=all" style={{ marginLeft: 8, marginTop: 16 }}>
                查看全部交易
              </Button>
            </Card>
          </TabPane>
        )}
      </Tabs>
    </ProfileContainer>
  )
}

// 样式组件
const ProfileContainer = styled.div`
  padding: 32px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 64px);

  .profile-header {
    margin-bottom: 32px;
    padding: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
    
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
  
  .profile-stats {
    margin-bottom: 32px;
    
    .ant-card {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      border: none;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
      }
    }
  }
  
  .profile-info-card {
    margin-bottom: 24px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: none;
    overflow: hidden;
  }

  .profile-tabs {
    .ant-tabs-nav {
      background: #ffffff;
      padding: 0 24px;
      border-radius: 12px 12px 0 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      margin-bottom: 0;
    }

    .ant-tabs-content-holder {
      background: #ffffff;
      border-radius: 0 0 12px 12px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .ant-tabs-tab {
      font-weight: 500;
      transition: all 0.3s ease;
      
      &:hover {
        color: #1890ff;
      }
    }

    .ant-tabs-tab-active {
      .ant-tabs-tab-btn {
        color: #1890ff;
        font-weight: 600;
      }
    }
  }
  
  .profile-avatar-col {
    display: flex;
    justify-content: center;
  }
  
  .profile-avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .avatar-input {
    margin-top: 16px;
    width: 200px;
  }
  
  .profile-actions {
    margin-top: 16px;
  }
  
  .profile-tabs {
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .product-price {
    font-size: 16px;
    font-weight: bold;
    color: #f5222d;
  }
  
  .empty-message {
    text-align: center;
    padding: 40px 0;
    color: #666;
  }

  .contact-request-meta {
    min-width: 180px;
    text-align: right;
    font-size: 12px;
    color: #888;

    div + div {
      margin-top: 4px;
    }
  }
  
  @media (max-width: 768px) {
    .profile-avatar-col {
      margin-bottom: 20px;
    }
  }
`

export default Profile
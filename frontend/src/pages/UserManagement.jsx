import React, { useState, useEffect } from 'react'
import { Table, Input, Button, Space, Select, Tag, message, Spin } from 'antd'
import { SearchOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons'
import { getUsers, toggleUserStatus } from '../utils/api'

const { Search } = Input
const { Option } = Select

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [userType, setUserType] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 加载用户列表
  const loadUsers = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const response = await getUsers({
        page,
        per_page: pageSize,
        search: searchValue,
        user_type: userType
      })
      setUsers(response.users)
      setPagination({
        current: page,
        pageSize,
        total: response.total
      })
    } catch (error) {
      message.error('加载用户列表失败')
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadUsers()
  }, [searchValue, userType])

  // 处理搜索
  const handleSearch = (value) => {
    setSearchValue(value)
    setPagination({ ...pagination, current: 1 })
  }

  // 处理用户类型筛选
  const handleUserTypeChange = (value) => {
    setUserType(value)
    setPagination({ ...pagination, current: 1 })
  }

  // 处理翻页
  const handlePageChange = (page, pageSize) => {
    loadUsers(page, pageSize)
  }

  // 处理状态切换
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await toggleUserStatus(userId)
      message.success(response.message)
      // 更新本地数据
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: response.is_active } : user
      ))
    } catch (error) {
      message.error(error.response?.data?.message || '修改用户状态失败')
    }
  }

  // 获取用户类型标签
  const getUserTypeTag = (type) => {
    const colorMap = {
      student: 'blue',
      teacher: 'green',
      admin: 'red'
    }
    
    const labelMap = {
      student: '学生',
      teacher: '教师',
      admin: '管理员'
    }
    
    return <Tag color={colorMap[type] || 'default'}>{labelMap[type] || type}</Tag>
  }

  // 获取用户状态标签
  const getStatusTag = (isActive) => {
    return isActive ? 
      <Tag color="success">正常</Tag> : 
      <Tag color="error">禁用</Tag>
  }

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      ellipsis: true
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      ellipsis: true,
      render: (phone) => phone || '-'
    },
    {
      title: '用户类型',
      dataIndex: 'user_type',
      key: 'user_type',
      render: getUserTypeTag
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: getStatusTag
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        // 管理员账号和自己的账号不能禁用
        const canToggle = record.user_type !== 'admin'
        
        return (
          <Space size="middle">
            {canToggle && (
              <Button 
                danger={record.is_active}
                onClick={() => handleToggleStatus(record.id, record.is_active)}
              >
                {record.is_active ? '禁用' : '启用'}
              </Button>
            )}
          </Space>
        )
      }
    }
  ]

  return (
    <div className="user-management-container">
      <div className="page-header">
        <h1>用户管理</h1>
      </div>
      
      <div className="filter-section">
        <div className="filter-row">
          <Search
            placeholder="搜索用户名或邮箱"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 300, marginRight: 16 }}
          />
          
          <Select
            placeholder="用户类型"
            allowClear
            style={{ width: 120, marginRight: 16 }}
            onChange={handleUserTypeChange}
          >
            <Option value="student">学生</Option>
            <Option value="teacher">教师</Option>
            <Option value="admin">管理员</Option>
          </Select>
          
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchValue('')
              setUserType('')
              loadUsers(1, pagination.pageSize)
            }}
          >
            重置
          </Button>
        </div>
      </div>
      
      <div className="table-container">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          onChange={handlePageChange}
          loading={loading}
          locale={{
            emptyText: loading ? <Spin /> : '暂无用户数据'
          }}
        />
      </div>

      <style jsx>{`
        .user-management-container {
          padding: 24px;
          background: #fff;
          min-height: calc(100vh - 128px);
        }
        
        .page-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
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
        }
        
        .table-container {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </div>
  )
}

export default UserManagement
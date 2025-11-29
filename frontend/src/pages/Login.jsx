import React, { useState, useEffect } from 'react'
import { Form, Input, Button, message, Card, Typography, Checkbox, Radio, Space, Divider, Tag } from 'antd'
import { LockOutlined, UserOutlined, UserSwitchOutlined, UserAddOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { loginUser } from '../utils/api.js'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const { Title, Paragraph } = Typography

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [userType, setUserType] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

 
  // 处理用户类型切换
  const handleUserTypeChange = (e) => {
    const type = e.target.value
    setUserType(type)
  }

    // 组件挂载时清空表单
  useEffect(() => {
    form.resetFields()
  }, [form])

  // 处理表单提交
  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      // 调用后端api，同时传递用户类型
      const response = await loginUser({ ...values, user_type: userType })

      localStorage.setItem('isLoggedIn', 'true')
      message.success(`登录成功，欢迎回来，${response.username}！`)

      if (response.user_type === 'admin') {
        navigate('/user-management')
      } else {
        navigate('/')
      }
      // 刷新页面以确保App组件中的用户状态立即更新
      window.location.reload()  
    } catch (error) {
        // Axios 错误 (后端返回 400/401)
        if (error.response) {
          message.error(error.response.data?.message || '登录失败，请检查用户名和密码')
        } else {
         // 其他网络错误或代码逻辑错误
          message.error('网络错误或服务器异常，请稍后重试')
        }
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginContainer>
      <LoginCard>
        <div className="login-header">
          <Title level={2}>欢迎登录校园二手商品交易系统</Title>
          <Paragraph className="login-subtitle">
            便捷、安全的校园二手商品交易平台
          </Paragraph>
        </div>
        
        {/* 用户类型选择 */}
        <div className="user-type-section">
          <Radio.Group 
            value={userType} 
            onChange={handleUserTypeChange}
            buttonStyle="solid"
            size="large"
          >
            <Radio.Button value="student">
              <UserOutlined /> 一般用户 (学生/老师)
            </Radio.Button>
            <Radio.Button value="admin">
              <UserSwitchOutlined /> 管理员账号
            </Radio.Button>
          </Radio.Group>
        </div>
        
        <Divider />
        
        <Form
          form={form}
          onFinish={handleSubmit}
          className="login-form"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
            className="login-form-item"
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="用户名"
              autoComplete='new-username'
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
            className="login-form-item"
          >
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              type={showPassword ? 'text' : 'password'}
              placeholder="密码"
              autoComplete='new-password'
              suffix={
                <div style={{ cursor: 'pointer' }} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </div>
              }
            />
          </Form.Item>
          
          <Form.Item name="remember" valuePropName="checked" className="login-form-item">
            <Checkbox>记住我</Checkbox>
            <a className="login-form-forgot" href="#">
              忘记密码？
            </a>
          </Form.Item>
          
          <Form.Item className="login-form-item">
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
              loading={loading}
              block
              size="large"
            >
              登录
            </Button>
          </Form.Item>
          
          <Form.Item className="login-form-footer">
              <span>还没有账号？</span>
              <Link to="/register" className="register-link">
                <UserAddOutlined /> 立即注册
              </Link>
            </Form.Item>
        </Form>
      </LoginCard>
    </LoginContainer>
  )
}

// 样式组件
const LoginContainer = styled.div`
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  overflow: hidden;
  background-color: #fff;
  
  .login-header {
    text-align: center;
    margin-bottom: 30px;
    padding: 0 20px;
  }
  
  .quick-login-section {
    margin-top: 20px;
  }
  
  .quick-login-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 4px 0;
  }
  
  .user-type-section {
    margin: 20px 0;
    text-align: center;
  }
  
  .test-accounts-info {
    margin-top: 20px;
    padding: 16px;
    background-color: #f5f5f5;
    border-radius: 8px;
  }
  
  .account-item {
    margin-bottom: 12px;
    padding: 12px;
    background-color: #fff;
    border-radius: 6px;
    border-left: 4px solid #1890ff;
  }
  
  .account-item:last-child {
    border-left-color: #ff4d4f;
    margin-bottom: 0;
  }
  
  .account-item p {
    margin: 4px 0;
    font-size: 14px;
  }
  
  .login-subtitle {
    color: #666;
    margin-top: 10px;
  }
  
  .login-form {
    padding: 0 40px 20px;
  }
  
  .login-form-item {
    margin-bottom: 20px;
  }
  
  .login-form-button {
    height: 44px;
    font-size: 16px;
  }
  
  .login-form-forgot {
    float: right;
  }
  
  .login-form-footer {
    text-align: center;
    margin-top: 20px;
    color: #666;
  }
  
  .register-link {
    color: #1890ff;
    margin-left: 5px;
  }
  
  @media (max-width: 768px) {
    max-width: 100%;
    margin: 0 20px;
    
    .login-form {
      padding: 0 20px 20px;
    }
  }
`

export default Login
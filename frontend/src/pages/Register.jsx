import React, { useState } from 'react'
import { Form, Input, Button, message, Card, Typography, Select } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { registerUser } from '../utils/api.js'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const { Title, Paragraph } = Typography
const { Option } = Select

const Register = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  // 使用mock数据填充表单，防止输入框为空
  const [initialValues] = useState({
    
  })

  // 处理表单提交
  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      // 确保普通注册用户类型只能是student或teacher，并且移除confirmPassword字段
      const { confirmPassword, ...userData } = values;
      userData.user_type = values.user_type === 'admin' ? 'student' : values.user_type;
      const response = await registerUser(userData)
      message.success('注册成功，请登录')
      // 注册成功后跳转到登录页面
      navigate('/login')
    } catch (error) {
      message.error(error.message || '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 确认密码验证规则
  const validateConfirmPassword = (rule, value, callback) => {
    if (!value) {
      return callback(new Error('请确认密码'));
    }
    const password = form.getFieldValue('password');
    if (password && password !== value) {
      return callback(new Error('两次输入的密码不一致'));
    }
    return callback();
  }

  return (
    <RegisterContainer>
      <RegisterCard>
        <div className="register-header">
          <Title level={2}>创建账号</Title>
          <Paragraph className="register-subtitle">
            加入校园二手商品交易系统，享受便捷的交易体验
          </Paragraph>
        </div>
        
        <Form
          form={form}
          initialValues={initialValues}
          onFinish={handleSubmit}
          className="register-form"
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 4, max: 20, message: '用户名长度应在4-20个字符之间' }
            ]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, max: 20, message: '密码长度应在6-20个字符之间' }
            ]}
          >
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码"
              autoComplete="new-password"
              suffix={
                <div style={{ cursor: 'pointer' }} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </div>
              }
            />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[

              { validator: validateConfirmPassword }
            ]}
          >
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              type={showPassword ? 'text' : 'password'}
              placeholder="请再次输入密码"
              autoComplete="new-password"
              suffix={
                <div style={{ cursor: 'pointer' }} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </div>
              }
            />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder="请输入邮箱"
              autoComplete="email"
            />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="手机号码"
            rules={[
              { required: true, message: '请输入手机号码' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined className="site-form-item-icon" />}
              placeholder="请输入手机号码"
              autoComplete="tel"
            />
          </Form.Item>
          
          <Form.Item
            name="user_type"
            label="用户类型"
            rules={[{ required: true, message: '请选择用户类型' }]}
          >
            <Select placeholder="请选择用户类型">
              <Option value="student">学生</Option>
              <Option value="teacher">教师</Option>
              {/* 管理员账号需要通过特殊方式创建，不允许自行注册 */}
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="register-form-button"
              loading={loading}
              block
              size="large"
            >
              注册
            </Button>
          </Form.Item>
          
          <div className="register-form-footer">
            <span>已有账号？</span>
            <Link to="/login" className="login-link">
              立即登录
            </Link>
          </div>
        </Form>
      </RegisterCard>
    </RegisterContainer>
  )
}

// 样式组件
const RegisterContainer = styled.div`
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
`

const RegisterCard = styled(Card)`
  width: 100%;
  max-width: 500px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  overflow: hidden;
  background-color: #fff;
  
  .register-header {
    text-align: center;
    margin-bottom: 30px;
    padding: 0 20px;
  }
  
  .register-subtitle {
    color: #666;
    margin-top: 10px;
  }
  
  .register-form {
    padding: 0 40px 20px;
  }
  
  .register-form-button {
    height: 44px;
    font-size: 16px;
  }
  
  .register-form-footer {
    text-align: center;
    margin-top: 20px;
    color: #666;
  }
  
  .login-link {
    color: #1890ff;
    margin-left: 5px;
  }
  
  @media (max-width: 768px) {
    max-width: 100%;
    margin: 0 20px;
    
    .register-form {
      padding: 0 20px 20px;
    }
  }
`

export default Register
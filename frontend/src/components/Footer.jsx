import React from 'react'
import { Layout, Row, Col, Typography, Divider, Link, Space, Icon } from 'antd'
import { GithubOutlined, AlipayOutlined, WechatOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons'
import styled from 'styled-components'

const { Footer } = Layout
const { Title, Text, Paragraph } = Typography

const CustomFooter = () => {
  return (
    <CustomFooterContainer>
      <div className="footer-content">
        <Row gutter={[48, 24]}>
          <Col xs={24} sm={24} md={8}>
            <div className="footer-section about">
              <Title level={4} className="section-title">校园二手商品交易系统</Title>
              <Paragraph className="section-description">
                致力于为全校师生提供安全、便捷的二手商品交易平台，促进资源的有效利用和环保理念的传播。
              </Paragraph>
              <div className="social-icons">
                <Space>
                  <a href="#" className="social-icon"><GithubOutlined /></a>
                  <a href="#" className="social-icon"><WechatOutlined /></a>
                  <a href="#" className="social-icon"><MailOutlined /></a>
                </Space>
              </div>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={4}>
            <div className="footer-section quick-links">
              <Title level={4} className="section-title">快速链接</Title>
              <ul className="link-list">
                <li><Link href="/">首页</Link></li>
                <li><Link href="/products">商品列表</Link></li>
                <li><Link href="/create-product">发布商品</Link></li>
                <li><Link href="/transactions">交易管理</Link></li>
              </ul>
            </div>
          </Col>
          
          <Col xs={24} sm={12} md={4}>
            <div className="footer-section resources">
              <Title level={4} className="section-title">资源中心</Title>
              <ul className="link-list">
                <li><Link href="#">交易指南</Link></li>
                <li><Link href="#">常见问题</Link></li>
                <li><Link href="#">用户协议</Link></li>
                <li><Link href="#">隐私政策</Link></li>
              </ul>
            </div>
          </Col>
          
          <Col xs={24} sm={24} md={8}>
            <div className="footer-section contact">
              <Title level={4} className="section-title">联系我们</Title>
              <div className="contact-info">
                <div className="contact-item">
                  <EnvironmentOutlined className="contact-icon" />
                  <Text>学校创业园A栋101室</Text>
                </div>
                <div className="contact-item">
                  <PhoneOutlined className="contact-icon" />
                  <Text>020-12345678</Text>
                </div>
                <div className="contact-item">
                  <MailOutlined className="contact-icon" />
                  <Text>support@campus-market.com</Text>
                </div>
                <div className="contact-item">
                  <ClockCircleOutlined className="contact-icon" />
                  <Text>周一至周日 9:00-21:00</Text>
                </div>
              </div>
              <div className="payment-methods">
                <Text>支持支付方式：</Text>
                <Space>
                  <AlipayOutlined className="payment-icon" />
                  <WechatOutlined className="payment-icon" />
                </Space>
              </div>
            </div>
          </Col>
        </Row>
        
        <Divider className="footer-divider" />
        
        <div className="footer-bottom">
          <Text className="copyright">© 2023 校园二手商品交易系统 版权所有</Text>
          <div className="bottom-links">
            <Link href="#">用户协议</Link>
            <Link href="#">隐私政策</Link>
            <Link href="#">网站地图</Link>
          </div>
        </div>
      </div>
    </CustomFooterContainer>
  )
}

// 样式组件
const CustomFooterContainer = styled(Footer)`
  background-color: #262626;
  color: #fff;
  padding: 40px 24px;
  margin-top: auto;
  
  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .footer-section {
    padding: 16px 0;
  }
  
  .section-title {
    color: #fff;
    margin-bottom: 16px;
    font-weight: 500;
  }
  
  .section-description {
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.6;
  }
  
  .social-icons {
    margin-top: 16px;
  }
  
  .social-icon {
    color: rgba(255, 255, 255, 0.65);
    font-size: 20px;
    transition: color 0.3s;
  }
  
  .social-icon:hover {
    color: #fff;
  }
  
  .link-list {
    list-style: none;
    padding: 0;
  }
  
  .link-list li {
    margin-bottom: 12px;
  }
  
  .link-list a {
    color: rgba(255, 255, 255, 0.65);
    text-decoration: none;
    transition: color 0.3s;
  }
  
  .link-list a:hover {
    color: #fff;
  }
  
  .contact-info {
    margin-bottom: 16px;
  }
  
  .contact-item {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .contact-icon {
    margin-right: 12px;
    color: rgba(255, 255, 255, 0.65);
  }
  
  .contact-item Text {
    color: rgba(255, 255, 255, 0.65);
  }
  
  .payment-methods {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .payment-icon {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.65);
  }
  
  .footer-divider {
    background-color: rgba(255, 255, 255, 0.1);
    margin: 24px 0;
  }
  
  .footer-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 24px;
  }
  
  .copyright {
    color: rgba(255, 255, 255, 0.65);
  }
  
  .bottom-links {
    display: flex;
    gap: 24px;
  }
  
  .bottom-links Link {
    color: rgba(255, 255, 255, 0.65);
    text-decoration: none;
    transition: color 0.3s;
  }
  
  .bottom-links Link:hover {
    color: #fff;
  }
  
  @media (max-width: 768px) {
    padding: 30px 16px;
    
    .footer-content {
      text-align: center;
    }
    
    .social-icons {
      justify-content: center;
    }
    
    .link-list {
      text-align: center;
    }
    
    .contact-item {
      justify-content: center;
    }
    
    .payment-methods {
      justify-content: center;
      flex-direction: column;
      gap: 8px;
    }
    
    .footer-bottom {
      flex-direction: column;
      gap: 16px;
    }
    
    .bottom-links {
      justify-content: center;
      gap: 16px;
    }
  }
  
  @media (max-width: 576px) {
    .footer-bottom {
      flex-direction: column;
      gap: 12px;
    }
    
    .bottom-links {
      flex-direction: column;
      gap: 8px;
    }
  }
`

export default CustomFooter
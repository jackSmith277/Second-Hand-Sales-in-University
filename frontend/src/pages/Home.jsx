import React from 'react'
import { Card, Row, Col, Button, Input, Carousel, Statistic, Tag } from 'antd'
import { SearchOutlined, ShoppingOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

const { Search } = Input

const Home = () => {
  // 轮播图数据
  const carouselItems = [
    {
      title: '新学期，新装备',
      description: '二手教材、电子产品，应有尽有',
      image: 'https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png'
    },
    {
      title: '毕业季，清闲置',
      description: '把闲置物品留给有需要的同学',
      image: 'https://gw.alipayobjects.com/zos/rmsportal/nxkuOJlFJuAUhzlMTCEe.png'
    },
    {
      title: '环保校园，从我做起',
      description: '减少浪费，循环利用',
      image: 'https://gw.alipayobjects.com/zos/rmsportal/BZtTvZaVHxLWdydVxJTa.png'
    }
  ]

  // 统计数据
  const statistics = [
    {
      title: '注册用户',
      value: 10000,
      icon: <UserOutlined style={{ color: '#1890ff' }} />
    },
    {
      title: '商品数量',
      value: 5000,
      icon: <ShoppingOutlined style={{ color: '#52c41a' }} />
    },
    {
      title: '成功交易',
      value: 3000,
      icon: <Tag color="green" />
    }
  ]

  // 热门分类
  const categories = [
    { name: '教材书籍', count: 1200 },
    { name: '电子产品', count: 800 },
    { name: '生活用品', count: 1500 },
    { name: '运动器材', count: 600 },
    { name: '美妆护肤', count: 400 },
    { name: '其他', count: 500 }
  ]

  // 搜索处理
  const handleSearch = (value) => {
    if (value) {
      window.location.href = `/products?search=${encodeURIComponent(value)}`
    }
  }

  return (
    <div className="home">
      {/* 轮播图 */}
      <CarouselWrapper>
        <Carousel autoplay>
          {carouselItems.map((item, index) => (
            <CarouselItem key={index}>
              <div className="carousel-content">
                <h1>{item.title}</h1>
                <p>{item.description}</p>
                <Button type="primary" size="large" href="/products">
                  立即查看 <ArrowRightOutlined />
                </Button>
              </div>
              <div className="carousel-image">
                <img src={item.image} alt={item.title} />
              </div>
            </CarouselItem>
          ))}
        </Carousel>
      </CarouselWrapper>

      {/* 搜索栏 */}
      <SearchSection>
        <div className="search-container">
          <Search
            placeholder="搜索二手商品"
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            className="home-search"
          />
        </div>
      </SearchSection>

      {/* 统计信息 */}
      <StatisticsSection>
        <Row gutter={[16, 16]}>
          {statistics.map((stat, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.icon}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </StatisticsSection>

      {/* 热门分类 */}
      <CategoriesSection>
        <h2 className="section-title">热门分类</h2>
        <Row gutter={[16, 16]}>
          {categories.map((category, index) => (
            <Col xs={12} sm={8} md={4} key={index}>
              <CategoryCard>
                <Link to={`/products?category=${encodeURIComponent(category.name)}`}>
                  <h3>{category.name}</h3>
                  <p>{category.count} 件商品</p>
                </Link>
              </CategoryCard>
            </Col>
          ))}
        </Row>
      </CategoriesSection>

      {/* 推荐内容 */}
      <FeaturesSection>
        <h2 className="section-title">为什么选择我们</h2>
        <Row gutter={[16, 16]}>
          <FeatureCard title="安全可靠" description="实名认证，交易保障" />
          <FeatureCard title="方便快捷" description="线上沟通，线下交易" />
          <FeatureCard title="价格实惠" description="高性价比，物有所值" />
        </Row>
      </FeaturesSection>

      {/* 行动号召 */}
      <CTASection>
        <h2>开始您的二手交易之旅</h2>
        <p>注册账号，发布闲置，找到心仪的商品</p>
        <div className="cta-buttons">
          <Button type="primary" size="large" href="/register">
            立即注册
          </Button>
          <Button size="large" href="/login">
            已有账号，去登录
          </Button>
        </div>
      </CTASection>
    </div>
  )
}

// 样式组件
const CarouselWrapper = styled.div`
  margin-bottom: 24px;
  .ant-carousel .slick-slide {
    height: 400px;
    position: relative;
  }
`

const CarouselItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  background-color: #f0f9ff;
  padding: 0 40px;
  
  .carousel-content {
    max-width: 500px;
  }
  
  .carousel-content h1 {
    font-size: 36px;
    margin-bottom: 16px;
    color: #1890ff;
  }
  
  .carousel-content p {
    font-size: 18px;
    margin-bottom: 24px;
    color: #666;
  }
  
  .carousel-image {
    flex-shrink: 0;
  }
  
  .carousel-image img {
    max-height: 300px;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 40px 20px;
    
    .carousel-content h1 {
      font-size: 24px;
    }
    
    .carousel-content p {
      font-size: 14px;
    }
    
    .carousel-image img {
      max-height: 150px;
      margin-top: 20px;
    }
  }
`

const SearchSection = styled.div`
  margin-bottom: 24px;
  
  .search-container {
    display: flex;
    justify-content: center;
  }
  
  .home-search {
    width: 60%;
    max-width: 600px;
  }
`

const StatisticsSection = styled.div`
  margin-bottom: 32px;
`

const CategoriesSection = styled.div`
  margin-bottom: 32px;
  
  .section-title {
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
  }
`

const CategoryCard = styled(Card)`
  text-align: center;
  height: 100%;
  transition: all 0.3s;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  
  a {
    color: #333;
    display: block;
    height: 100%;
    padding: 20px 0;
  }
  
  h3 {
    margin-bottom: 8px;
    font-size: 18px;
  }
  
  p {
    color: #666;
    font-size: 14px;
  }
`

const FeaturesSection = styled.div`
  margin-bottom: 32px;
  
  .section-title {
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
  }
`

const FeatureCard = ({ title, description }) => (
  <Col xs={24} sm={12} md={8}>
    <Card className="feature-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </Card>
  </Col>
)

const CTASection = styled.div`
  background-color: #e6f7ff;
  padding: 40px 20px;
  text-align: center;
  margin-top: 40px;
  
  h2 {
    font-size: 28px;
    margin-bottom: 16px;
    color: #1890ff;
  }
  
  p {
    font-size: 16px;
    margin-bottom: 24px;
    color: #666;
  }
  
  .cta-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
  }
  
  @media (max-width: 768px) {
    .cta-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .cta-buttons Button {
      width: 100%;
      max-width: 200px;
    }
  }
`

export default Home
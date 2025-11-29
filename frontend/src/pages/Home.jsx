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
      image: 'https://zs.whut.edu.cn/xyfg/202103/W020210610412601797703.jpg'
    },
    {
      title: '毕业季，清闲置',
      description: '把闲置物品留给有需要的同学',
      image: 'https://zs.whut.edu.cn/xyfg/202005/W020200525458775820764.jpg'
    },
    {
      title: '环保校园，从我做起',
      description: '减少浪费，循环利用',
      image: 'https://zs.whut.edu.cn/qt/lbtbtp/202406/W020240619361224536923.jpg'
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
    <HomeContainer>
      {/* 轮播图 */}
      <CarouselWrapper>
        <Carousel autoplay effect="fade" autoplaySpeed={3000}>
          {carouselItems.map((item, index) => (
            <CarouselItem 
              key={`carousel-${index}-${item.image}`} 
              bgImage={item.image}
            >
              <div className="carousel-content">
                <h1>{item.title}</h1>
                <p>{item.description}</p>
                <Button type="primary" size="large" href="/products" className="carousel-button">
                  立即查看 <ArrowRightOutlined />
                </Button>
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
    </HomeContainer>
  )
}

// 样式组件
const HomeContainer = styled.div`
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 32px 24px;
`

const CarouselWrapper = styled.div`
  margin-bottom: 40px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  
  .ant-carousel .slick-slide {
    height: 500px;
    min-height: 500px;
    position: relative;
    
    > div {
      height: 100%;
      min-height: 100%;
    }
  }
  
  .ant-carousel .slick-list {
    height: 500px;
    min-height: 500px;
  }
  
  .ant-carousel .slick-track {
    height: 500px;
    min-height: 500px;
  }
  
  .ant-carousel .slick-dots {
    bottom: 20px;
    
    li button {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
    }
    
    li.slick-active button {
      background: #1890ff;
      width: 24px;
      border-radius: 6px;
    }
  }
`

const CarouselItem = styled.div.attrs(props => ({
  style: {
    '--bg-image-url': `url(${props.bgImage || ''})`
  }
}))`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 100%;
  height: 100%;
  padding: 0 60px;
  position: relative;
  overflow: hidden;
  
  /* 背景图片 - 清晰显示 */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    min-height: 100%;
    background-image: var(--bg-image-url, url(${props => props.bgImage || ''}));
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    opacity: 1;
    z-index: 0;
    pointer-events: none;
  }
  
  /* 轻微遮罩层，确保文字清晰可见 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    min-height: 100%;
    background: rgba(0, 0, 0, 0.15);
    z-index: 1;
    pointer-events: none;
  }
  
  .carousel-content {
    max-width: 500px;
    z-index: 2;
    position: relative;
    width: 100%;
  }
  
  .carousel-content h1 {
    font-size: 48px;
    margin-bottom: 20px;
    color: #ffffff;
    font-weight: 700;
    text-shadow: 0 4px 16px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.6);
    line-height: 1.2;
  }
  
  .carousel-content p {
    font-size: 20px;
    margin-bottom: 32px;
    color: #ffffff;
    line-height: 1.6;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8), 0 1px 4px rgba(0, 0, 0, 0.6);
    font-weight: 500;
  }
  
  .carousel-button {
    height: 50px;
    padding: 0 32px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 25px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    z-index: 2;
    position: relative;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    }
  }
  
  .carousel-image {
    flex-shrink: 0;
    z-index: 2;
    position: relative;
    animation: float 3s ease-in-out infinite;
    display: none; /* 隐藏原来的图片，因为现在使用背景图 */
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  .carousel-image img {
    max-height: 350px;
    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.3));
    border-radius: 16px;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 40px 20px;
    
    .carousel-content h1 {
      font-size: 32px;
    }
    
    .carousel-content p {
      font-size: 16px;
    }
    
    .carousel-image img {
      max-height: 200px;
      margin-top: 20px;
    }
  }
`

const SearchSection = styled.div`
  margin-bottom: 40px;
  
  .search-container {
    display: flex;
    justify-content: center;
  }
  
  .home-search {
    width: 70%;
    max-width: 700px;
    border-radius: 50px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
      transform: translateY(-2px);
    }
    
    .ant-input {
      border-radius: 50px 0 0 50px;
      height: 56px;
      font-size: 16px;
      padding-left: 24px;
    }
    
    .ant-btn {
      border-radius: 0 50px 50px 0;
      height: 56px;
      padding: 0 32px;
    }
  }
`

const StatisticsSection = styled.div`
  margin-bottom: 48px;
  
  .ant-card {
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: none;
    transition: all 0.3s ease;
    height: 100%;
    
    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    }
  }
  
  .ant-statistic-title {
    font-size: 16px;
    color: #666;
    font-weight: 500;
  }
  
  .ant-statistic-content {
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`

const CategoriesSection = styled.div`
  margin-bottom: 48px;
  padding: 40px 0;
  
  .section-title {
    font-size: 36px;
    margin-bottom: 32px;
    text-align: center;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`

const CategoryCard = styled(Card)`
  text-align: center;
  height: 100%;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: none;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  overflow: hidden;
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  }
  
  a {
    color: #333;
    display: block;
    height: 100%;
    padding: 32px 20px;
    text-decoration: none;
    transition: all 0.3s ease;
  }
  
  h3 {
    margin-bottom: 12px;
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  p {
    color: #666;
    font-size: 14px;
    margin: 0;
  }
`

const FeaturesSection = styled.div`
  margin-bottom: 48px;
  padding: 40px 0;
  
  .section-title {
    font-size: 36px;
    margin-bottom: 32px;
    text-align: center;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .feature-card {
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: none;
    transition: all 0.3s ease;
    height: 100%;
    padding: 32px;
    text-align: center;
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    
    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    }
    
    h3 {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #1a1a1a;
    }
    
    p {
      color: #666;
      font-size: 15px;
      line-height: 1.6;
      margin: 0;
    }
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
  background-image: url('https://zs.whut.edu.cn/qt/lbtbtp/202406/W020240619473006005348.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 60px 40px;
  text-align: center;
  margin-top: 60px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.35);
    border-radius: 20px;
    z-index: 0;
  }
  
  h2 {
    font-size: 36px;
    margin-bottom: 16px;
    color: #ffffff;
    font-weight: 700;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 1;
  }
  
  p {
    font-size: 18px;
    margin-bottom: 32px;
    color: rgba(255, 255, 255, 0.95);
    position: relative;
    z-index: 1;
  }
  
  .cta-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
    position: relative;
    z-index: 1;
    
    .ant-btn {
      height: 50px;
      padding: 0 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 25px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
      }
    }
  }
  
  @media (max-width: 768px) {
    padding: 40px 20px;
    
    h2 {
      font-size: 28px;
    }
    
    p {
      font-size: 16px;
    }
    
    .cta-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .cta-buttons .ant-btn {
      width: 100%;
      max-width: 200px;
    }
  }
`

export default Home
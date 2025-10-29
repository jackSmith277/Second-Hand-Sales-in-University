import React, { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Select, Upload, Button, message, Card, Row, Col } from 'antd'
import { PlusOutlined, InboxOutlined } from '@ant-design/icons'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { getProductDetail, updateProduct } from '../utils/api.js'

const { Option } = Select
const { TextArea } = Input
const { Dragger } = Upload

const EditProduct = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageList, setImageList] = useState([])
  const [product, setProduct] = useState(null)
  const navigate = useNavigate()
  const { id } = useParams()

  // 分类选项
  const categoryOptions = [
    { label: '教材书籍', value: '教材书籍' },
    { label: '电子产品', value: '电子产品' },
    { label: '生活用品', value: '生活用品' },
    { label: '服装鞋帽', value: '服装鞋帽' },
    { label: '体育器材', value: '体育器材' },
    { label: '美妆个护', value: '美妆个护' },
    { label: '其他', value: '其他' }
  ]

  // 商品状态选项
  const statusOptions = [
    { label: '可交易', value: 'available' },
    { label: '已预订', value: 'pending' }
  ]

  // 新旧程度选项
  const conditionOptions = [
    { label: '全新', value: 'new' },
    { label: '九成新', value: 'like_new' },
    { label: '八成新', value: 'good' },
    { label: '七成新', value: 'fair' },
    { label: '六成新及以下', value: 'poor' }
  ]

  // 交易地点选项
  const locationOptions = [
    { label: '一号教学楼', value: '一号教学楼' },
    { label: '二号教学楼', value: '二号教学楼' },
    { label: '图书馆', value: '图书馆' },
    { label: '食堂', value: '食堂' },
    { label: '学生宿舍区', value: '学生宿舍区' },
    { label: '校园广场', value: '校园广场' }
  ]

  // 加载商品详情
  useEffect(() => {
    const fetchProductDetail = async () => {
      setLoading(true)
      try {
        // 从API获取数据
        const response = await getProductDetail(id)
        setProduct(response)
        
        // 填充表单数据
        form.setFieldsValue({
          title: response.title,
          description: response.description,
          price: response.price,
          category: response.category,
          status: response.status,
          location: response.location,
          condition: response.condition
        })
        
        // 设置图片列表
        setImageList(Array.isArray(response.images) && response.images.length > 0 ? 
          response.images.map((image, index) => ({
            uid: `image-${id}-${index}`,
            name: `product-image-${index + 1}.jpg`,
            status: 'done',
            url: image
          })) : [])
      } catch (error) {
        console.error('加载商品详情失败:', error)
        message.error('加载商品详情失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchProductDetail()
  }, [id, form])

  // 图片上传配置
  const uploadProps = {
    name: 'file',
    multiple: true,
    action: '/api/upload', // 实际项目中需要配置正确的上传接口
    listType: 'picture-card',
    accept: 'image/*',
    beforeUpload: (file) => {
      // 限制文件大小为2MB
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error('图片必须小于2MB!')
        return Upload.LIST_IGNORE
      }
      // 限制文件类型
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件!')
        return Upload.LIST_IGNORE
      }
      return true
    },
    onPreview: async (file) => {
      let src = file.url
      if (!src) {
        src = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.readAsDataURL(file.originFileObj)
          reader.onload = () => resolve(reader.result)
        })
      }
      const image = new Image()
      image.src = src
      const imgWindow = window.open(src)
      imgWindow?.document.write(image.outerHTML)
    },
    onChange: ({ fileList }) => {
      setImageList(fileList)
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files)
    },
    fileList: imageList
  }

  // 处理表单提交
  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      // 处理图片数据
      const imageUrls = imageList
        .filter(file => file.status === 'done')
        .map(file => file.url)
      
      // 准备提交的数据
      const productData = {
        ...values,
        images: imageUrls
      }
      
      // 实际项目中调用API更新商品
      // const response = await updateProduct(id, productData)
      
      // 模拟API调用成功
      setTimeout(() => {
        message.success('商品更新成功')
        navigate(`/products/${id}`) // 更新成功后跳转到商品详情页
      }, 1000)
    } catch (error) {
      console.error('更新商品失败:', error)
      message.error(error.response?.data?.message || '商品更新失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理重置表单
  const handleReset = () => {
    if (product) {
      form.setFieldsValue({
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        status: product.status,
        location: product.location,
        condition: product.condition
      })
    }
  }

  return (
    <EditProductContainer>
      <div className="breadcrumb">
        <Link to="/">首页</Link> &gt; 
        <Link to="/products">商品列表</Link> &gt; 
        <span>编辑商品</span>
      </div>
      
      <div className="page-header">
        <h1>编辑商品</h1>
        <div className="page-description">请修改商品信息，完成后点击保存按钮</div>
      </div>
      
      {loading ? (
        <Card className="loading-card">
          <div className="loading-content">加载中...</div>
        </Card>
      ) : (
        <Card className="form-card">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="商品标题"
                  name="title"
                  rules={[
                    { required: true, message: '请输入商品标题' },
                    { max: 100, message: '商品标题不能超过100个字符' }
                  ]}
                >
                  <Input placeholder="请输入商品标题（1-100字）" />
                </Form.Item>
                
                <Form.Item
                  label="商品描述"
                  name="description"
                  rules={[
                    { required: true, message: '请输入商品描述' },
                    { min: 10, message: '商品描述不能少于10个字符' },
                    { max: 2000, message: '商品描述不能超过2000个字符' }
                  ]}
                >
                  <TextArea rows={6} placeholder="请详细描述商品的特点、使用情况等信息（10-2000字）" />
                </Form.Item>
                
                <Form.Item
                  label="商品价格"
                  name="price"
                  rules={[
                    { required: true, message: '请输入商品价格' },
                    { type: 'number', min: 0.01, message: '价格不能小于0.01元' }
                  ]}
                >
                  <InputNumber 
                    min={0.01} 
                    step={0.01} 
                    style={{ width: '100%' }} 
                    placeholder="请输入商品价格"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  label="商品分类"
                  name="category"
                  rules={[
                    { required: true, message: '请选择商品分类' }
                  ]}
                >
                  <Select placeholder="请选择商品分类" options={categoryOptions} />
                </Form.Item>
                
                <Form.Item
                  label="商品状态"
                  name="status"
                  rules={[
                    { required: true, message: '请选择商品状态' }
                  ]}
                >
                  <Select placeholder="请选择商品状态" options={statusOptions} />
                </Form.Item>
                
                <Form.Item
                  label="新旧程度"
                  name="condition"
                  rules={[
                    { required: true, message: '请选择商品新旧程度' }
                  ]}
                >
                  <Select placeholder="请选择商品新旧程度" options={conditionOptions} />
                </Form.Item>
                
                <Form.Item
                  label="交易地点"
                  name="location"
                  rules={[
                    { required: true, message: '请选择交易地点' }
                  ]}
                >
                  <Select placeholder="请选择交易地点" options={locationOptions} />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              label="商品图片"
              name="images"
              valuePropName="fileList"
              getValueFromEvent={({ fileList }) => fileList}
              rules={[
                { required: true, message: '请至少上传一张商品图片' }
              ]}
            >
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p className="ant-upload-hint">
                  支持单个或批量上传，最多上传9张图片，每张图片不超过2MB
                </p>
              </Dragger>
            </Form.Item>
            
            <div className="form-actions">
              <Button type="primary" htmlType="submit" loading={loading} className="submit-button">
                保存修改
              </Button>
              <Button onClick={handleReset} className="reset-button">
                重置
              </Button>
              <Button className="cancel-button">
                <Link to={`/products/${id}`}>取消</Link>
              </Button>
            </div>
          </Form>
        </Card>
      )}
    </EditProductContainer>
  )
}

// 样式组件
const EditProductContainer = styled.div`
  .breadcrumb {
    margin-bottom: 20px;
    font-size: 14px;
    color: #666;
  }
  
  .breadcrumb a {
    color: #1890ff;
    text-decoration: none;
  }
  
  .page-header {
    margin-bottom: 24px;
  }
  
  .page-header h1 {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
  }
  
  .page-description {
    font-size: 14px;
    color: #666;
  }
  
  .loading-card {
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 40px 24px;
    text-align: center;
  }
  
  .loading-content {
    font-size: 16px;
    color: #666;
  }
  
  .form-card {
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 24px;
  }
  
  .form-actions {
    margin-top: 24px;
    display: flex;
    gap: 12px;
  }
  
  .submit-button {
    min-width: 120px;
  }
  
  @media (max-width: 768px) {
    .form-card {
      padding: 16px;
    }
    
    .form-actions {
      flex-wrap: wrap;
    }
    
    .form-actions Button {
      flex: 1;
      min-width: 100px;
    }
  }
  
  @media (max-width: 576px) {
    .page-header h1 {
      font-size: 20px;
    }
  }
`

export default EditProduct
import React, { useState } from 'react'
import { Form, Input, InputNumber, Select, Upload, Button, message, Card, Row, Col } from 'antd'
import { PlusOutlined, InboxOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { createProduct } from '../utils/api.js'

const { Option } = Select
const { TextArea } = Input
const { Dragger } = Upload

const CreateProduct = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  // 初始图片列表（为空，等待用户上传）
  const [imageList, setImageList] = useState([])
  const navigate = useNavigate()

  // 分类选项
  const categoryOptions = [
    { value: '教材书籍', label: '教材书籍' },
    { value: '电子产品', label: '电子产品' },
    { value: '生活用品', label: '生活用品' },
    { value: '运动器材', label: '运动器材' },
    { value: '交通工具', label: '交通工具' },
    { value: '服装鞋帽', label: '服装鞋帽' },
    { value: '美妆个护', label: '美妆个护' },
    { value: '乐器', label: '乐器' },
    { value: '其他', label: '其他' }
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
    { label: '博学主楼', value: '博学主楼' },
    { label: '博学东楼', value: '博学东楼' },
    { label: '博学西楼', value: '博学西楼' },
    { label: '博学北楼', value: '博学北楼' },
    { label: '图书馆', value: '图书馆' },
    { label: '校园广场', value: '校园广场' },
    { label: '智园', value: '智园' },
    { label: '慧园', value: '慧园' },
    { label: '卓园', value: '卓园' },
    { label: '越园', value: '越园' }
  ]

  // 自定义上传处理 - 不立即上传，只创建预览
  const customRequest = ({ file, onSuccess, onError }) => {
    // 使用 FileReader 创建预览URL，不实际上传
    const reader = new FileReader()
    reader.onload = (e) => {
      // 创建预览URL（base64）
      const previewUrl = e.target.result
      // 模拟上传成功，但实际文件还在本地
      onSuccess({
        url: previewUrl,
        name: file.name,
        status: 'done',
        uid: file.uid || Date.now() + Math.random()
      }, file)
    }
    reader.onerror = () => {
      onError(new Error('读取文件失败'))
    }
    reader.readAsDataURL(file)
  }

  // 图片上传配置
  const uploadProps = {
    name: 'file',
    multiple: true,
    customRequest: customRequest,
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
      // 更新图片列表，保存文件对象用于后续上传
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
      // 先上传所有图片（只有发布时才上传）
      const uploadedUrls = []
      
      for (const file of imageList) {
        // 检查是否是本地文件（有 originFileObj 或者是 File 对象）
        const fileObj = file.originFileObj || file
        
        if (fileObj instanceof File) {
          // 如果是本地文件，需要上传
          const formData = new FormData()
          formData.append('file', fileObj)
          
          try {
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            })
            
            if (uploadResponse.ok) {
              const result = await uploadResponse.json()
              uploadedUrls.push(result.url)
            } else {
              const errorData = await uploadResponse.json().catch(() => ({}))
              throw new Error(errorData.error || '图片上传失败')
            }
          } catch (error) {
            console.error('上传图片失败:', error)
            message.error(`图片 ${file.name || '未知'} 上传失败: ${error.message}`)
            setLoading(false)
            return
          }
        } else if (file.url && file.url.startsWith('/imgs/product/')) {
          // 如果已经是服务器上的图片（编辑时），直接使用
          uploadedUrls.push(file.url)
        } else if (file.url && file.url.startsWith('data:')) {
          // 如果是base64预览图，需要转换为File对象并上传
          try {
            // 将base64转换为blob
            const response = await fetch(file.url)
            const blob = await response.blob()
            const fileObj = new File([blob], file.name || 'image.png', { type: blob.type })
            
            const formData = new FormData()
            formData.append('file', fileObj)
            
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            })
            
            if (uploadResponse.ok) {
              const result = await uploadResponse.json()
              uploadedUrls.push(result.url)
            } else {
              throw new Error('图片上传失败')
            }
          } catch (error) {
            console.error('上传base64图片失败:', error)
            message.error(`图片上传失败: ${error.message}`)
            setLoading(false)
            return
          }
        }
      }
      
      if (uploadedUrls.length === 0) {
        message.error('请至少上传一张商品图片')
        setLoading(false)
        return
      }
      
      // 准备提交的数据
      const productData = {
        ...values,
        images: uploadedUrls
      }
      
      // 调用API创建商品
      const response = await createProduct(productData)
      
      message.success('商品发布成功')
      navigate('/products') // 发布成功后跳转到商品列表页
    } catch (error) {
      console.error('创建商品失败:', error)
      message.error(error.message || '商品发布失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理重置表单
  const handleReset = () => {
    form.resetFields()
    setImageList([])
  }

  return (
    <CreateProductContainer>
      <div className="breadcrumb">
        <Link to="/">首页</Link> &gt; 
        <span>发布商品</span>
      </div>
      
      <div className="page-header">
        <h1>发布商品</h1>
        <div className="page-description">请填写商品信息，完成后点击发布按钮</div>
      </div>
      
      <Card className="form-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'available',
            condition: 'good'
          }}
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
              发布商品
            </Button>
            <Button onClick={handleReset} className="reset-button">
              重置
            </Button>
            <Button className="cancel-button">
              <Link to="/products">取消</Link>
            </Button>
          </div>
        </Form>
      </Card>
      
      <div className="tips-section">
        <h3>发布商品小贴士：</h3>
        <ul className="tips-list">
          <li>填写详细的商品描述和多角度的商品图片可以提高商品的关注度</li>
          <li>合理的价格设置有助于商品更快售出</li>
          <li>请选择准确的商品分类，以便其他用户更容易找到您的商品</li>
          <li>交易地点请选择双方都方便的位置</li>
          <li>发布前请确保您对商品拥有所有权或处分权</li>
        </ul>
      </div>
    </CreateProductContainer>
  )
}

// 样式组件
const CreateProductContainer = styled.div`
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
  
  .tips-section {
    margin-top: 24px;
    background-color: #f5f5f5;
    padding: 16px 24px;
    border-radius: 4px;
  }
  
  .tips-section h3 {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
    color: #333;
  }
  
  .tips-list {
    list-style: none;
    padding: 0;
  }
  
  .tips-list li {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
    padding-left: 20px;
    position: relative;
  }
  
  .tips-list li:before {
    content: "•";
    position: absolute;
    left: 8px;
    color: #1890ff;
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
    
    .tips-section {
      padding: 12px 16px;
    }
    
    .tips-section h3 {
      font-size: 14px;
    }
    
    .tips-list li {
      font-size: 13px;
    }
  }
`

export default CreateProduct
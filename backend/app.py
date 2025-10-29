import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
import pymysql
from flask_migrate import Migrate
from werkzeug.utils import secure_filename
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:123456@localhost/sales'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 配置上传文件夹
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 确保上传文件夹存在
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

CORS(app)
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# 数据库模型
class User(db.Model):
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.now)
    avatar = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)
    user_type = db.Column(db.String(20), default='student')  # student, teacher, admin
    posts = db.relationship('Product', backref='seller', lazy=True)
    transactions = db.relationship('Transaction', backref='buyer', lazy=True)
    order_records = db.relationship('OrderRecord', backref='user', lazy=True, foreign_keys='OrderRecord.user_id')
    other_party_records = db.relationship('OrderRecord', backref='other_party', lazy=True, foreign_keys='OrderRecord.other_party_id')

class Product(db.Model):
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    images = db.Column(db.Text)  # 可以存储多个图片路径，用逗号分隔
    status = db.Column(db.String(20), default='available')  # available, sold, pending
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    seller_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    views = db.Column(db.Integer, default=0)
    location = db.Column(db.String(100))
    brand = db.Column(db.String(50))
    condition = db.Column(db.String(20))  # new, like_new, good, fair, poor
    transactions = db.relationship('Transaction', backref='product', lazy=True)

class Transaction(db.Model):
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = db.Column(db.String(50), db.ForeignKey('product.id'), nullable=False)
    buyer_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, completed, cancelled
    request_time = db.Column(db.DateTime, default=datetime.now)
    accept_time = db.Column(db.DateTime)
    complete_time = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    final_price = db.Column(db.Float)
    order_records = db.relationship('OrderRecord', backref='transaction', lazy=True, cascade='all, delete-orphan')

class OrderRecord(db.Model):
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = db.Column(db.String(50), db.ForeignKey('transaction.id'), nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    order_type = db.Column(db.String(20), nullable=False)  # buy, sell
    product_title = db.Column(db.String(100), nullable=False)
    product_price = db.Column(db.Float, nullable=False)
    order_time = db.Column(db.DateTime, default=datetime.now)
    order_status = db.Column(db.String(20), nullable=False)  # 记录交易时的状态
    other_party_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)  # 交易对方ID

# 辅助函数
def get_current_user():
    # 这里应该从请求头或会话中获取当前用户
    # 简化版，实际项目中应该使用JWT或其他认证方式
    user_id = request.headers.get('user-id')
    if user_id:
        return User.query.get(user_id)
    return None

def is_admin(user):
    # 检查用户是否为管理员
    return user and user.user_type == 'admin'

# 用户管理子系统API
@app.route('/api/users/register', methods=['POST'])
def register_user():
    data = request.json
    if not data.get('username') or not data.get('password') or not data.get('email'):
        return jsonify({'message': '用户名、密码和邮箱不能为空'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': '用户名已存在'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': '邮箱已被注册'}), 400
    
    # 检查是否要注册管理员账号
    user_type = data.get('user_type', 'student')
    if user_type == 'admin':
        # 只有管理员可以创建新的管理员账号
        current_user = get_current_user()
        if not is_admin(current_user):
            return jsonify({'message': '只有管理员才能创建管理员账号'}), 403
    
    new_user = User(
        username=data['username'],
        password=data['password'],  # 实际项目中应该加密存储密码
        email=data['email'],
        phone=data.get('phone'),
        avatar=data.get('avatar'),
        user_type=user_type
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': '注册成功', 'user_id': new_user.id}), 201

@app.route('/api/users/login', methods=['POST'])
def login_user():
    data = request.json
    
    # 获取用户输入的用户名、密码和用户类型
    username = data.get('username')
    password = data.get('password')
    requested_user_type = data.get('user_type', 'student')  # 默认为学生类型
    
    # 查询用户
    user = User.query.filter_by(username=username, password=password).first()
    
    # 检查用户是否存在且处于活跃状态
    if not user :
        return jsonify({'message': '用户名或密码错误'}),401

    if not user.is_active:
        return jsonify({'message': '用户状态异常，请联系管理员'}), 401
    # 验证用户类型是否匹配
    if user.user_type != requested_user_type:
        return jsonify({'message': '用户类型不匹配，请选择正确的账号类型'}), 401
    
    # 实际项目中应该返回JWT token
    return jsonify({
        'message': '登录成功',
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'user_type': user.user_type
    }), 200

@app.route('/api/users/profile', methods=['GET'])
def get_user_profile():
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'phone': user.phone,
        'avatar': user.avatar,
        'user_type': user.user_type,
        'created_at': user.created_at.strftime('%Y-%m-%d %H:%M:%S')
    }), 200

@app.route('/api/users', methods=['GET'])
def get_users():
    user = get_current_user()
    if not user or not is_admin(user):
        return jsonify({'message': '只有管理员可以查看用户列表'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    user_type = request.args.get('user_type', '')
    
    query = User.query
    
    # 搜索功能
    if search:
        query = query.filter(
            (User.username.contains(search)) | 
            (User.email.contains(search))
        )
    
    # 用户类型过滤
    if user_type:
        query = query.filter_by(user_type=user_type)
    
    pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page)
    users = pagination.items
    
    result = []
    for u in users:
        result.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'phone': u.phone,
            'user_type': u.user_type,
            'is_active': u.is_active,
            'created_at': u.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return jsonify({
        'users': result,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200

@app.route('/api/users/<user_id>/toggle', methods=['PUT'])
def toggle_user_status(user_id):
    user = get_current_user()
    if not user or not is_admin(user):
        return jsonify({'message': '只有管理员可以修改用户状态'}), 403
    
    # 不允许禁用自己的账号
    if user.id == user_id:
        return jsonify({'message': '不能禁用自己的账号'}), 400
    
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({'message': '用户不存在'}), 404
    
    # 不允许禁用其他管理员账号
    if target_user.user_type == 'admin' and target_user.id != user.id:
        return jsonify({'message': '不能禁用其他管理员账号'}), 403
    
    target_user.is_active = not target_user.is_active
    db.session.commit()
    
    return jsonify({
        'message': '用户状态已更新',
        'is_active': target_user.is_active
    }), 200

# 用户订单记录相关API
@app.route('/api/order-records', methods=['GET'])
def get_user_order_records():
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    # 获取查询参数
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    order_type = request.args.get('order_type')  # buy, sell
    status = request.args.get('status')  # pending, accepted, completed, cancelled
    
    # 构建查询
    query = OrderRecord.query.filter_by(user_id=user.id)
    
    # 应用过滤条件
    if order_type:
        query = query.filter_by(order_type=order_type)
    if status:
        query = query.filter_by(order_status=status)
    
    # 分页并按时间倒序排序
    pagination = query.order_by(OrderRecord.order_time.desc()).paginate(page=page, per_page=per_page)
    order_records = pagination.items
    
    # 格式化结果
    result = []
    for record in order_records:
        result.append({
            'id': record.id,
            'transaction_id': record.transaction_id,
            'order_type': record.order_type,
            'product_title': record.product_title,
            'product_price': record.product_price,
            'order_time': record.order_time.strftime('%Y-%m-%d %H:%M:%S'),
            'order_status': record.order_status,
            'other_party_username': record.other_party.username,
            'other_party_id': record.other_party_id
        })
    
    return jsonify({
        'order_records': result,
        'total': pagination.total,
        'page': page,
        'per_page': per_page
    }), 200

@app.route('/api/users/profile', methods=['PUT'])
def update_user_profile():
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    data = request.json
    if 'username' in data and data['username'] != user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': '用户名已存在'}), 400
        user.username = data['username']
    
    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': '邮箱已被注册'}), 400
        user.email = data['email']
    
    if 'phone' in data:
        user.phone = data['phone']
    
    if 'avatar' in data:
        user.avatar = data['avatar']
    
    if 'password' in data and data['password']:
        user.password = data['password']  # 实际项目中应该加密存储密码
    
    db.session.commit()
    
    return jsonify({'message': '个人信息更新成功'}), 200

# 商品管理子系统API
@app.route('/api/products', methods=['POST'])
def create_product():
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    data = request.json
    if not data.get('title') or not data.get('description') or not data.get('price') or not data.get('category'):
        return jsonify({'message': '标题、描述、价格和分类不能为空'}), 400
    
    # 处理图片路径，确保存储为逗号分隔的字符串
    images_data = data.get('images', '')
    if isinstance(images_data, list):
        images_str = ','.join(images_data)
    else:
        images_str = images_data
    
    new_product = Product(
        title=data['title'],
        description=data['description'],
        price=data['price'],
        category=data['category'],
        images=images_str,
        seller_id=user.id,
        location=data.get('location'),
        brand=data.get('brand'),
        condition=data.get('condition', 'good')
    )
    
    db.session.add(new_product)
    db.session.commit()
    
    return jsonify({'message': '商品创建成功', 'product_id': new_product.id}), 201

@app.route('/api/products', methods=['GET'])
def get_products():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    category = request.args.get('category')
    search = request.args.get('search')
    status = request.args.get('status', 'available')
    
    query = Product.query.filter_by(status=status)
    
    if category:
        query = query.filter_by(category=category)
    
    if search:
        search = f'%{search}%'
        query = query.filter(Product.title.like(search) | Product.description.like(search))
    
    pagination = query.order_by(Product.created_at.desc()).paginate(page=page, per_page=per_page)
    products = pagination.items
    
    result = []
    for product in products:
        # 处理图片数据，将逗号分隔的字符串转换为数组并去除空白字符
        images = []
        if product.images:
            if isinstance(product.images, str):
                # 如果是字符串，按逗号分割并过滤空字符串
                images = [img.strip() for img in product.images.split(',') if img.strip()]
            elif isinstance(product.images, list):
                images = product.images
            else:
                images = []
        
        result.append({
            'id': product.id,
            'title': product.title,
            'description': product.description,
            'price': product.price,
            'category': product.category,
            'images': images,
            'status': product.status,
            'created_at': product.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': product.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
            'seller_id': product.seller_id,
            'seller_username': product.seller.username,
            'views': product.views,
            'location': product.location,
            'brand': product.brand,
            'condition': product.condition
        })
    
    return jsonify({
        'products': result,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page
    }), 200

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product_detail(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': '商品不存在'}), 404
    
    # 增加浏览量
    product.views += 1
    db.session.commit()
    
    return jsonify({
        'id': product.id,
        'title': product.title,
        'description': product.description,
        'price': product.price,
        'category': product.category,
        'images': product.images.split(',') if product.images else [],
        'status': product.status,
        'created_at': product.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'updated_at': product.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
        'seller': {
            'id': product.seller.id,
            'username': product.seller.username,
            'email': product.seller.email,
            'phone': product.seller.phone,
            'avatar': product.seller.avatar
        },
        'views': product.views,
        'location': product.location,
        'brand': product.brand,
        'condition': product.condition
    }), 200

@app.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': '商品不存在'}), 404
    
    if product.seller_id != user.id:
        return jsonify({'message': '没有权限修改此商品'}), 403
    
    data = request.json
    if 'title' in data:
        product.title = data['title']
    
    if 'description' in data:
        product.description = data['description']
    
    if 'price' in data:
        product.price = data['price']
    
    if 'category' in data:
        product.category = data['category']
    
    if 'images' in data:
        product.images = data['images']
    
    if 'status' in data:
        product.status = data['status']
    
    if 'location' in data:
        product.location = data['location']
    
    if 'brand' in data:
        product.brand = data['brand']
    
    if 'condition' in data:
        product.condition = data['condition']
    
    db.session.commit()
    
    return jsonify({'message': '商品更新成功'}), 200

@app.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': '商品不存在'}), 404
    
    if product.seller_id != user.id:
        return jsonify({'message': '没有权限删除此商品'}), 403
    
    # 检查是否有相关的交易记录
    transactions = Transaction.query.filter_by(product_id=product_id).all()
    active_transactions = [t for t in transactions if t.status not in ['completed', 'cancelled']]
    if active_transactions:
        return jsonify({'message': '此商品有未完成的交易，无法删除'}), 400
    
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({'message': '商品删除成功'}), 200

# 交易管理子系统API
@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    data = request.json
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({'message': '商品ID不能为空'}), 400
    
    # 查找商品
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': '商品不存在'}), 404
    
    if product.status != 'available':
        return jsonify({'message': '商品已售出或已被预订'}), 400
    
    if product.seller_id == user.id:
        return jsonify({'message': '不能购买自己的商品'}), 400
    
    # 检查是否已经申请过此商品的交易
    existing_transaction = Transaction.query.filter_by(
        product_id=product_id,
        buyer_id=user.id,
        status='pending'
    ).first()
    
    if existing_transaction:
        return jsonify({'message': '已经申请过此商品的交易'}), 400
    
    # 创建交易
    new_transaction = Transaction(
        product_id=product_id,
        buyer_id=user.id,
        notes=data.get('notes'),
        final_price=data.get('final_price', product.price)
    )
    
    db.session.add(new_transaction)
    db.session.flush()  # 获取交易ID但不提交事务
    
    # 创建买家订单记录
    buyer_order_record = OrderRecord(
        transaction_id=new_transaction.id,
        user_id=user.id,
        order_type='buy',
        product_title=product.title,
        product_price=product.price,
        order_status='pending',
        other_party_id=product.seller_id
    )
    
    # 创建卖家订单记录
    seller_order_record = OrderRecord(
        transaction_id=new_transaction.id,
        user_id=product.seller_id,
        order_type='sell',
        product_title=product.title,
        product_price=product.price,
        order_status='pending',
        other_party_id=user.id
    )
    
    db.session.add(buyer_order_record)
    db.session.add(seller_order_record)
    db.session.commit()
    
    return jsonify({'message': '交易申请成功', 'transaction_id': new_transaction.id}), 201

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    role = request.args.get('role', 'buyer')  # buyer or seller
    
    # 管理员可以查看所有交易
    if is_admin(user):
        query = Transaction.query
    elif role == 'buyer':
        query = Transaction.query.filter_by(buyer_id=user.id)
    else:
        # 作为卖家查询交易
        query = Transaction.query.join(Product).filter(Product.seller_id == user.id)
    
    if status:
        query = query.filter_by(status=status)
    
    pagination = query.order_by(Transaction.request_time.desc()).paginate(page=page, per_page=per_page)
    transactions = pagination.items
    
    result = []
    for transaction in transactions:
        result.append({
            'id': transaction.id,
            'product_id': transaction.product_id,
            'product_title': transaction.product.title,
            'product_price': transaction.product.price,
            'buyer_id': transaction.buyer_id,
            'buyer_username': transaction.buyer.username,
            'status': transaction.status,
            'request_time': transaction.request_time.strftime('%Y-%m-%d %H:%M:%S'),
            'accept_time': transaction.accept_time.strftime('%Y-%m-%d %H:%M:%S') if transaction.accept_time else None,
            'complete_time': transaction.complete_time.strftime('%Y-%m-%d %H:%M:%S') if transaction.complete_time else None,
            'notes': transaction.notes,
            'final_price': transaction.final_price
        })
    
    return jsonify({
        'transactions': result,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page
    }), 200

# 图片上传接口
@app.route('/api/upload', methods=['POST'])
def upload_file():
    # 检查是否有文件被上传
    if 'file' not in request.files:
        return jsonify({'error': '没有文件上传'}), 400
    
    files = request.files.getlist('file')  # 获取所有上传的文件
    
    # 检查是否有文件
    if not files or files[0].filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    # 处理单个文件的情况（兼容前端上传组件）
    file = files[0]
    
    # 检查文件类型是否被允许
    if file and allowed_file(file.filename):
        # 生成安全的文件名
        filename = secure_filename(file.filename)
        # 生成唯一文件名，避免覆盖
        unique_filename = str(uuid.uuid4()) + os.path.splitext(filename)[1]
        
        # 保存文件到上传文件夹
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # 返回文件URL
        file_url = f'/uploads/{unique_filename}'
        return jsonify({
            'url': file_url,
            'name': filename,
            'status': 'done',
            'uid': unique_filename
        }), 200
    
    return jsonify({'error': '文件类型不允许'}), 400

# 检查文件扩展名是否被允许
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 提供静态文件访问
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# 交易详情
@app.route('/api/transactions/<transaction_id>', methods=['GET'])
def get_transaction_detail(transaction_id):
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return jsonify({'message': '交易不存在'}), 404
    
    # 管理员可以查看所有交易，其他人只能查看自己的交易
    if not is_admin(user) and transaction.buyer_id != user.id and transaction.product.seller_id != user.id:
        return jsonify({'message': '没有权限查看此交易'}), 403
    
    return jsonify({
        'id': transaction.id,
        'product': {
            'id': transaction.product.id,
            'title': transaction.product.title,
            'description': transaction.product.description,
            'price': transaction.product.price,
            'images': transaction.product.images.split(',') if transaction.product.images else [],
            'category': transaction.product.category
        },
        'buyer': {
            'id': transaction.buyer.id,
            'username': transaction.buyer.username,
            'email': transaction.buyer.email,
            'phone': transaction.buyer.phone
        },
        'seller': {
            'id': transaction.product.seller.id,
            'username': transaction.product.seller.username,
            'email': transaction.product.seller.email,
            'phone': transaction.product.seller.phone
        },
        'status': transaction.status,
        'request_time': transaction.request_time.strftime('%Y-%m-%d %H:%M:%S'),
        'accept_time': transaction.accept_time.strftime('%Y-%m-%d %H:%M:%S') if transaction.accept_time else None,
        'complete_time': transaction.complete_time.strftime('%Y-%m-%d %H:%M:%S') if transaction.complete_time else None,
        'notes': transaction.notes,
        'final_price': transaction.final_price
    }), 200

@app.route('/api/transactions/<transaction_id>/accept', methods=['PUT'])
def accept_transaction(transaction_id):
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return jsonify({'message': '交易不存在'}), 404
    
    # 管理员或卖家可以接受交易
    if not is_admin(user) and transaction.product.seller_id != user.id:
        return jsonify({'message': '只有管理员或卖家可以接受交易'}), 403
    
    if transaction.status != 'pending':
        return jsonify({'message': '交易状态不允许接受'}), 400
    
    transaction.status = 'accepted'
    transaction.accept_time = datetime.now()
    transaction.product.status = 'pending'  # 将商品状态改为待处理
    
    # 更新相关的订单记录状态
    for record in transaction.order_records:
        record.order_status = 'accepted'
    
    db.session.commit()
    
    return jsonify({'message': '交易已接受'}), 200

@app.route('/api/transactions/<transaction_id>/complete', methods=['PUT'])
def complete_transaction(transaction_id):
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return jsonify({'message': '交易不存在'}), 404
    
    # 管理员或交易相关方可以完成交易
    if not is_admin(user) and transaction.buyer_id != user.id and transaction.product.seller_id != user.id:
        return jsonify({'message': '没有权限完成此交易'}), 403
    
    if transaction.status != 'accepted':
        return jsonify({'message': '交易状态不允许完成'}), 400
    
    transaction.status = 'completed'
    transaction.complete_time = datetime.now()
    transaction.product.status = 'sold'  # 将商品状态改为已售出
    
    # 更新相关的订单记录状态
    for record in transaction.order_records:
        record.order_status = 'completed'
    
    db.session.commit()
    
    return jsonify({'message': '交易已完成'}), 200

@app.route('/api/transactions/<transaction_id>/cancel', methods=['PUT'])
def cancel_transaction(transaction_id):
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return jsonify({'message': '交易不存在'}), 404
    
    # 管理员可以取消任何交易，普通用户只能取消自己的待处理/已接受交易
    if not is_admin(user):
        if transaction.buyer_id != user.id or transaction.status not in ['pending', 'accepted']:
            return jsonify({'message': '没有权限取消此交易'}), 403
    
    transaction.status = 'cancelled'
    
    # 如果商品状态是待处理，则恢复为可购买
    if transaction.product.status == 'pending':
        transaction.product.status = 'available'
    
    # 更新相关的订单记录状态
    for record in transaction.order_records:
        record.order_status = 'cancelled'
    
    db.session.commit()
    
    return jsonify({'message': '交易已取消'}), 200


# 初始化数据库
@app.cli.command('init-db')
def init_db():
    db.create_all()
    print('Database initialized.')

# 首页路由，用于测试
@app.route('/')
def index():
    return jsonify({'message': 'Campus Second-hand Trading System Backend'})

if __name__ == '__main__':
    # 创建数据库表
    with app.app_context():
        db.create_all()
    app.run(debug=True)
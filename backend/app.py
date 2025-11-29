import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
from urllib.parse import urlparse
import pymysql
from flask_migrate import Migrate
from werkzeug.utils import secure_filename
from sqlalchemy.sql import func
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:123456@localhost/sales'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 配置上传文件夹 - 商品图片保存到 imgs/product，头像保存到 imgs/avator
PRODUCT_IMAGES_FOLDER = os.path.join('imgs', 'product')
AVATAR_IMAGES_FOLDER = os.path.join('imgs', 'avator')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['PRODUCT_IMAGES_FOLDER'] = PRODUCT_IMAGES_FOLDER
app.config['AVATAR_IMAGES_FOLDER'] = AVATAR_IMAGES_FOLDER

# 确保上传文件夹存在
if not os.path.exists(PRODUCT_IMAGES_FOLDER):
    os.makedirs(PRODUCT_IMAGES_FOLDER)
if not os.path.exists(AVATAR_IMAGES_FOLDER):
    os.makedirs(AVATAR_IMAGES_FOLDER)

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
    favorites = db.relationship('Favorite', backref='user', lazy=True, cascade='all, delete-orphan')
    contact_requests = db.relationship('ContactRequest', backref='buyer', lazy=True, cascade='all, delete-orphan', foreign_keys='ContactRequest.buyer_id')
    received_contact_requests = db.relationship('ContactRequest', backref='seller', lazy=True, foreign_keys='ContactRequest.seller_id')

class Product(db.Model):
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    images = db.Column(db.Text)  # 可以存储多个图片路径，用逗号分隔
    status = db.Column(db.String(20), default='available')  # available, sold, pending
    is_active = db.Column(db.Boolean, default=True)  # 是否启用，False表示被管理员禁用
    disable_reason = db.Column(db.String(255))  # 禁用理由
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    seller_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    views = db.Column(db.Integer, default=0)
    location = db.Column(db.String(100))
    brand = db.Column(db.String(50))
    condition = db.Column(db.String(20))  # new, like_new, good, fair, poor
    transactions = db.relationship('Transaction', backref='product', lazy=True)
    favorites = db.relationship('Favorite', backref='product', lazy=True, cascade='all, delete-orphan')
    contact_requests = db.relationship('ContactRequest', backref='product', lazy=True, cascade='all, delete-orphan')

class Transaction(db.Model):
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = db.Column(db.String(50), db.ForeignKey('product.id'), nullable=False)
    buyer_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, completed (成功), cancelled (拒绝)
    request_time = db.Column(db.DateTime, default=datetime.now)
    accept_time = db.Column(db.DateTime)
    complete_time = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    final_price = db.Column(db.Float)
    cancel_reason = db.Column(db.String(255))
    cancel_time = db.Column(db.DateTime)
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

class ContactRequest(db.Model):
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = db.Column(db.String(50), db.ForeignKey('product.id'), nullable=False)
    buyer_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    seller_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text)
    reply = db.Column(db.Text)  # 卖家回复
    status = db.Column(db.String(20), default='active')  # active, archived
    buyer_read = db.Column(db.Boolean, default=False)  # 买家是否已读
    seller_read = db.Column(db.Boolean, default=False)  # 卖家是否已读
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    __table_args__ = (
        db.UniqueConstraint('product_id', 'buyer_id', name='unique_contact_request'),
    )

class Favorite(db.Model):
    id = db.Column(db.String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.String(50), db.ForeignKey('product.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # 添加唯一约束，防止用户重复收藏同一个商品
    __table_args__ = (db.UniqueConstraint('user_id', 'product_id', name='unique_user_product_favorite'),)

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

def delete_avatar_file(avatar_path):
    """删除旧头像文件，避免磁盘累积"""
    if not avatar_path or not isinstance(avatar_path, str):
        return
    normalized = avatar_path.split('?')[0]
    if '://' in normalized:
        normalized = urlparse(normalized).path
    normalized = normalized.replace('\\', '/')
    normalized = normalized.lstrip('/')
    if not normalized.startswith('imgs/avator/'):
        return
    filename = normalized.split('/')[-1]
    if not filename:
        return
    base_dir = os.path.dirname(os.path.abspath(__file__))
    avatar_dir = os.path.abspath(os.path.join(base_dir, app.config['AVATAR_IMAGES_FOLDER']))
    file_path = os.path.join(avatar_dir, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass

# 用户管理子系统API
@app.route('/api/users/register', methods=['POST'])
def register_user():
    data = request.get_json(silent=True) or {}
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
    data = request.get_json(silent=True) or {}
    
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
    if requested_user_type =='admin' :
        if requested_user_type!=user.user_type:
            return jsonify({'message': '用户类型不匹配，请选择正确的账号类型'}), 401
    else:
        if user.user_type not in ['student','teacher']:
            return jsonify({'message': '用户类型不匹配，请选择正确的账号类型'}), 401
    
    # 实际项目中应该返回JWT token
    return jsonify({
        'message': '登录成功',
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'avatar': user.avatar,
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
    
    data = request.get_json(silent=True) or {}
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
        new_avatar = data['avatar']
        if new_avatar != user.avatar:
            delete_avatar_file(user.avatar)
            user.avatar = new_avatar
    
    # 修改密码需要提供当前密码，避免误操作
    new_password = data.get('new_password')
    if new_password:
        current_password = data.get('current_password')
        if not current_password or current_password != user.password:
            return jsonify({'message': '当前密码错误，请重新输入'}), 400
        user.password = new_password  # 实际项目中应该加密存储密码
    
    db.session.commit()
    
    return jsonify({
        'message': '个人信息更新成功',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'avatar': user.avatar
        }
    }), 200

@app.route('/api/admin/stats', methods=['GET'])
def get_admin_stats():
    user = get_current_user()
    if not user or not is_admin(user):
        return jsonify({'message': '只有管理员可以查看系统统计'}), 403

    total_users = User.query.count()
    total_products = Product.query.count()
    total_transactions = Transaction.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    active_products = Product.query.filter_by(is_active=True).count()

    return jsonify({
        'total_users': total_users,
        'active_users': active_users,
        'total_products': total_products,
        'active_products': active_products,
        'total_transactions': total_transactions
    }), 200

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
    user = get_current_user()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    category = request.args.get('category')
    search = request.args.get('search')
    status = request.args.get('status')
    seller_id = request.args.get('seller_id')
    mine_param = request.args.get('mine')

    if mine_param and mine_param.lower() in ['1', 'true', 'yes']:
        if not user:
            return jsonify({'message': '未登录'}), 401
        seller_id = user.id
    
    # 管理员可以查看所有状态的商品（包括被禁用的），普通用户默认只查看可交易且未被禁用的商品
    query = Product.query
    if seller_id:
        query = query.filter_by(seller_id=seller_id)

    if is_admin(user):
        if status:
            query = query.filter_by(status=status)
    else:
        current_user_id = user.id if user else None
        if seller_id and current_user_id and seller_id == current_user_id:
            # 当前用户查看自己的商品，默认不限制状态和启用状态
            if status:
                query = query.filter_by(status=status)
        else:
            # 其他情况下仅展示可交易且已启用的商品
            query = query.filter_by(is_active=True)
            if status:
                query = query.filter_by(status=status)
            else:
                query = query.filter_by(status='available')
    
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
            'is_active': product.is_active,
            'disable_reason': product.disable_reason,
            'created_at': product.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': product.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
            'seller_id': product.seller_id,
            'seller_username': product.seller.username,
            'views': product.views,
            'location': product.location,
            'brand': product.brand,
            'condition': product.condition,
            'favorites_count': len(product.favorites)
        })
    
    return jsonify({
        'products': result,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page
    }), 200

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product_detail(product_id):
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': '商品不存在'}), 404
    
    # 处理图片数据，将逗号分隔的字符串转换为数组并去除空白字符
    images = []
    if product.images:
        if isinstance(product.images, str):
            images = [img.strip() for img in product.images.split(',') if img.strip()]
        elif isinstance(product.images, list):
            images = product.images
        else:
            images = []
    
    # 普通用户只能查看自己的被禁用商品详情
    if not is_admin(user) and not product.is_active and product.seller_id != user.id:
        return jsonify({'message': '商品不存在或已被禁用'}), 404
    
    # 获取相关推荐商品
    recommended_query = Product.query.filter(
        Product.category == product.category,
        Product.id != product.id,
        Product.is_active.is_(True)
    )
    if not is_admin(user):
        recommended_query = recommended_query.filter_by(status='available')
    recommended_products = recommended_query.order_by(func.rand()).limit(3).all()
    
    recommended_result = []
    for rec in recommended_products:
        rec_images = []
        if rec.images:
            if isinstance(rec.images, str):
                rec_images = [img.strip() for img in rec.images.split(',') if img.strip()]
            elif isinstance(rec.images, list):
                rec_images = rec.images
        recommended_result.append({
            'id': rec.id,
            'title': rec.title,
            'price': rec.price,
            'category': rec.category,
            'images': rec_images,
            'status': rec.status,
            'is_active': rec.is_active
        })
    
    # 增加浏览量（允许卖家查看被禁用的商品，但不重复计算卖家查看导致的单次多次？保持原逻辑）
    product.views += 1
    db.session.commit()
    
    return jsonify({
        'id': product.id,
        'title': product.title,
        'description': product.description,
        'price': product.price,
        'category': product.category,
        'images': images,
        'status': product.status,
        'is_active': product.is_active,
        'disable_reason': product.disable_reason,
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
        'condition': product.condition,
        'favorites_count': len(product.favorites),
        'recommended_products': recommended_result
    }), 200

@app.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': '商品不存在'}), 404
    
    # 管理员可以编辑任何商品，普通用户只能编辑自己的商品
    if not is_admin(user) and product.seller_id != user.id:
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
        # 处理图片数据，确保存储为逗号分隔的字符串
        images_data = data['images']
        if isinstance(images_data, list):
            images_str = ','.join(images_data)
        else:
            images_str = images_data
        product.images = images_str
    
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
    
    # 管理员可以删除任何商品，普通用户只能删除自己的商品
    if not is_admin(user) and product.seller_id != user.id:
        return jsonify({'message': '没有权限删除此商品'}), 403
    
    # 检查是否有相关的交易记录
    transactions = Transaction.query.filter_by(product_id=product_id).all()
    active_transactions = [t for t in transactions if t.status not in ['completed', 'cancelled']]
    if active_transactions:
        return jsonify({'message': '此商品有未完成的交易，无法删除'}), 400

    # 先删除本地图片文件（使用绝对路径并清理URL参数）
    try:
        images = []
        if product.images:
            if isinstance(product.images, str):
                images = [img.strip() for img in product.images.split(',') if img.strip()]
            elif isinstance(product.images, list):
                images = product.images
        # 计算图片目录的绝对路径
        base_dir = os.path.dirname(os.path.abspath(__file__))
        product_img_dir = os.path.abspath(os.path.join(base_dir, app.config['PRODUCT_IMAGES_FOLDER']))
        for img in images:
            # 去掉查询参数，取最后的文件名
            clean = img.split('?')[0]
            filename = clean.split('/')[-1]
            if not filename:
                continue
            file_path = os.path.join(product_img_dir, filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass
    except Exception:
        # 图片删除失败不应阻止业务继续
        pass

    # 删除收藏记录
    try:
        Favorite.query.filter_by(product_id=product_id).delete()
    except Exception:
        pass

    # 删除已完成/已取消的交易（其 order_records 通过关系会一并删除）
    for t in transactions:
        if t.status in ['completed', 'cancelled']:
            db.session.delete(t)

    # 最后删除商品
    db.session.delete(product)
    db.session.commit()

    return jsonify({'message': '商品删除成功'}), 200

@app.route('/api/products/<product_id>/toggle', methods=['PUT'])
def toggle_product_status(product_id):
    user = get_current_user()
    if not user or not is_admin(user):
        return jsonify({'message': '只有管理员可以禁用/启用商品'}), 403
    
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': '商品不存在'}), 404
    
    data = request.get_json(silent=True) or {}
    if product.is_active:
        reason = data.get('reason', '')
        if not isinstance(reason, str) or not reason.strip():
            return jsonify({'message': '禁用商品时必须提供理由'}), 400
        product.is_active = False
        product.disable_reason = reason.strip()[:255]
    else:
        product.is_active = True
        product.disable_reason = None
    db.session.commit()
    
    return jsonify({
        'message': '商品状态已更新',
        'is_active': product.is_active,
        'disable_reason': product.disable_reason
    }), 200

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
    
    if not product.is_active:
        return jsonify({'message': '商品已被禁用，无法进行交易'}), 400
    
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

    # 更新商品状态为交易中
    product.status = 'pending'
    
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
        seller = transaction.product.seller
        result.append({
            'id': transaction.id,
            'product_id': transaction.product_id,
            'product_title': transaction.product.title,
            'product_price': transaction.product.price,
            'buyer_id': transaction.buyer_id,
            'buyer_username': transaction.buyer.username,
            'seller_id': seller.id if seller else None,
            'seller_username': seller.username if seller else None,
            'status': transaction.status,
            'request_time': transaction.request_time.strftime('%Y-%m-%d %H:%M:%S'),
            'accept_time': transaction.accept_time.strftime('%Y-%m-%d %H:%M:%S') if transaction.accept_time else None,
            'complete_time': transaction.complete_time.strftime('%Y-%m-%d %H:%M:%S') if transaction.complete_time else None,
            'cancel_time': transaction.cancel_time.strftime('%Y-%m-%d %H:%M:%S') if transaction.cancel_time else None,
            'notes': transaction.notes,
            'final_price': transaction.final_price
        })
    
    return jsonify({
        'transactions': result,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page
    }), 200

# 收藏相关API
@app.route('/api/favorites', methods=['POST'])
def create_favorite():
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401

    data = request.json
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({'message': '商品ID不能为空'}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': '商品不存在'}), 404

    existing = Favorite.query.filter_by(user_id=user.id, product_id=product_id).first()
    if existing:
        return jsonify({'message': '已收藏过该商品'}), 400

    fav = Favorite(user_id=user.id, product_id=product_id)
    db.session.add(fav)
    db.session.commit()

    return jsonify({'message': '收藏成功'}), 201

@app.route('/api/favorites/<product_id>', methods=['DELETE'])
def delete_favorite(product_id):
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401

    fav = Favorite.query.filter_by(user_id=user.id, product_id=product_id).first()
    if not fav:
        return jsonify({'message': '未收藏该商品'}), 404

    db.session.delete(fav)
    db.session.commit()

    return jsonify({'message': '已取消收藏'}), 200

@app.route('/api/favorites', methods=['GET'])
def list_favorites():
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401

    favorites = Favorite.query.filter_by(user_id=user.id).all()
    result = []
    for fav in favorites:
        p = fav.product
        images = []
        if p.images:
            if isinstance(p.images, str):
                images = [img.strip() for img in p.images.split(',') if img.strip()]
            elif isinstance(p.images, list):
                images = p.images
        result.append({
            'id': p.id,
            'title': p.title,
            'price': p.price,
            'category': p.category,
            'images': images,
            'status': p.status,
            'created_at': p.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'views': p.views,
            'favorites_count': len(p.favorites)
        })

    return jsonify({'favorites': result, 'total': len(result)}), 200

@app.route('/api/favorites/check/<product_id>', methods=['GET'])
def check_favorite(product_id):
    user = get_current_user()
    if not user:
        return jsonify({'is_favorite': False}), 200

    fav = Favorite.query.filter_by(user_id=user.id, product_id=product_id).first()
    return jsonify({'is_favorite': fav is not None}), 200

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
        
        # 保存文件到 imgs/product 文件夹
        file_path = os.path.join(app.config['PRODUCT_IMAGES_FOLDER'], unique_filename)
        file.save(file_path)
        
        # 返回文件URL - 使用 /imgs/product/ 路径
        file_url = f'/imgs/product/{unique_filename}'
        return jsonify({
            'url': file_url,
            'name': filename,
            'status': 'done',
            'uid': unique_filename
        }), 200
    
    return jsonify({'error': '文件类型不允许'}), 400

# 头像上传接口
@app.route('/api/upload/avatar', methods=['POST'])
def upload_avatar():
    user = get_current_user()
    if not user:
        return jsonify({'error': '未登录'}), 401

    if 'file' not in request.files:
        return jsonify({'error': '没有文件上传'}), 400

    files = request.files.getlist('file')
    if not files or files[0].filename == '':
        return jsonify({'error': '没有选择文件'}), 400

    file = files[0]
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = str(uuid.uuid4()) + os.path.splitext(filename)[1]
        file_path = os.path.join(app.config['AVATAR_IMAGES_FOLDER'], unique_filename)
        file.save(file_path)
        file_url = f'/imgs/avator/{unique_filename}'
        if user.avatar and user.avatar != file_url:
            delete_avatar_file(user.avatar)
        user.avatar = file_url
        db.session.commit()
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

# 提供静态文件访问 - 商品图片
@app.route('/imgs/product/<filename>')
def product_image_file(filename):
    return send_from_directory(app.config['PRODUCT_IMAGES_FOLDER'], filename)

@app.route('/imgs/avator/<filename>')
def avatar_image_file(filename):
    return send_from_directory(app.config['AVATAR_IMAGES_FOLDER'], filename)

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
    
    # 处理商品图片数据
    product_images = []
    if transaction.product.images:
        if isinstance(transaction.product.images, str):
            product_images = [img.strip() for img in transaction.product.images.split(',') if img.strip()]
        elif isinstance(transaction.product.images, list):
            product_images = transaction.product.images
        else:
            product_images = []
    
    return jsonify({
        'id': transaction.id,
        'product': {
            'id': transaction.product.id,
            'title': transaction.product.title,
            'description': transaction.product.description,
            'price': transaction.product.price,
            'images': product_images,
            'category': transaction.product.category,
            'condition': transaction.product.condition,
            'location': transaction.product.location,
            'status': transaction.product.status,
            'brand': transaction.product.brand
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
        'cancel_time': transaction.cancel_time.strftime('%Y-%m-%d %H:%M:%S') if transaction.cancel_time else None,
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
    
    # 只有卖家可以接受交易
    if transaction.product.seller_id != user.id:
        return jsonify({'message': '只有卖家可以确认交易'}), 403
    
    if transaction.status != 'pending':
        return jsonify({'message': '交易状态不允许接受'}), 400
    
    now = datetime.now()
    transaction.status = 'completed'
    transaction.accept_time = now
    transaction.complete_time = now
    transaction.product.status = 'sold'
    
    # 更新相关的订单记录状态
    for record in transaction.order_records:
        record.order_status = 'completed'
    
    db.session.commit()
    
    return jsonify({'message': '交易已成功'}), 200

@app.route('/api/transactions/<transaction_id>/reject', methods=['PUT'])
def reject_transaction(transaction_id):
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401
    
    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return jsonify({'message': '交易不存在'}), 404
    
    # 只有卖家可以拒绝交易
    if transaction.product.seller_id != user.id:
        return jsonify({'message': '只有卖家可以拒绝交易'}), 403
    
    if transaction.status != 'pending':
        return jsonify({'message': '当前状态无法拒绝'}), 400
    
    transaction.status = 'cancelled'
    transaction.cancel_time = datetime.now()
    data = request.get_json(silent=True) or {}
    reason = data.get('reason')
    if reason:
        transaction.cancel_reason = str(reason)[:255]
    
    transaction.product.status = 'available'
    
    for record in transaction.order_records:
        record.order_status = 'cancelled'
    
    db.session.commit()
    
    return jsonify({'message': '交易已拒绝'}), 200

# 联系卖家
@app.route('/api/contact-requests', methods=['POST'])
def create_contact_request():
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401

    data = request.json or {}
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({'message': '商品ID不能为空'}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': '商品不存在'}), 404

    if product.seller_id == user.id:
        return jsonify({'message': '不能联系自己的商品'}), 400

    if not product.is_active:
        return jsonify({'message': '商品已被禁用，无法联系卖家'}), 400

    seller = product.seller
    if not seller:
        return jsonify({'message': '卖家信息异常，请稍后重试'}), 500

    if not seller.is_active:
        return jsonify({'message': '卖家账号已被禁用，无法联系'}), 400

    buyer_message = data.get('message')
    if isinstance(buyer_message, str):
        buyer_message = buyer_message.strip()
    else:
        buyer_message = None

    contact = ContactRequest.query.filter_by(product_id=product_id, buyer_id=user.id).first()
    created_new = False
    if contact:
        contact.status = 'active'
        if buyer_message:
            contact.message = buyer_message
        contact.seller_read = False  # 新消息，卖家未读
        contact.updated_at = datetime.now()
    else:
        contact = ContactRequest(
            product_id=product_id,
            buyer_id=user.id,
            seller_id=product.seller_id,
            message=buyer_message,
            seller_read=False  # 新消息，卖家未读
        )
        db.session.add(contact)
        created_new = True

    db.session.commit()

    return jsonify({
        'message': '联系卖家成功' if not created_new else '已发送联系请求',
        'created_new': created_new,
        'contact_request': {
            'id': contact.id,
            'status': contact.status,
            'message': contact.message,
            'reply': contact.reply,
            'created_at': contact.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': contact.updated_at.strftime('%Y-%m-%d %H:%M:%S') if contact.updated_at else None
        },
        'seller': {
            'id': seller.id,
            'username': seller.username,
            'phone': seller.phone,
            'email': seller.email
        },
        'product': {
            'id': product.id,
            'title': product.title,
            'price': product.price,
            'status': product.status,
            'is_active': product.is_active
        }
    }), 200

@app.route('/api/contact-requests', methods=['GET'])
def list_contact_requests():
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    product_id = request.args.get('product_id')
    admin_user = is_admin(user)
    role = request.args.get('role')
    if not role:
        role = 'seller' if not admin_user else 'all'

    query = ContactRequest.query

    # 管理员可以按需查看所有消息，其余用户根据角色过滤
    if not admin_user:
        if role == 'buyer':
            query = query.filter_by(buyer_id=user.id)
        else:
            query = query.filter_by(seller_id=user.id)
    else:
        seller_id = request.args.get('seller_id')
        buyer_id = request.args.get('buyer_id')
        if buyer_id:
            query = query.filter_by(buyer_id=buyer_id)
        elif seller_id:
            query = query.filter_by(seller_id=seller_id)
        elif role == 'buyer':
            query = query.filter_by(buyer_id=user.id)
        elif role == 'seller':
            query = query.filter_by(seller_id=user.id)

    # 按商品ID过滤
    if product_id:
        query = query.filter_by(product_id=product_id)

    if status:
        query = query.filter_by(status=status)

    pagination = query.order_by(ContactRequest.updated_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    contact_requests = pagination.items

    result = []
    unread_count = 0
    for contact in contact_requests:
        product = contact.product
        buyer = contact.buyer
        seller = contact.seller
        
        # 根据当前用户ID确定是否已读
        is_read = False
        if contact.buyer_id == user.id:
            is_read = contact.buyer_read
        elif contact.seller_id == user.id:
            is_read = contact.seller_read
        else:
            # 管理员查看时，根据role参数判断
            if role == 'buyer':
                is_read = contact.buyer_read
            else:
                is_read = contact.seller_read
        
        if not is_read:
            unread_count += 1
        
        result.append({
            'id': contact.id,
            'message': contact.message,
            'reply': contact.reply,
            'status': contact.status,
            'is_read': is_read,
            'created_at': contact.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': contact.updated_at.strftime('%Y-%m-%d %H:%M:%S') if contact.updated_at else None,
            'product': {
                'id': product.id,
                'title': product.title,
                'price': product.price,
                'status': product.status,
                'is_active': product.is_active
            } if product else None,
            'buyer': {
                'id': buyer.id,
                'username': buyer.username,
                'email': buyer.email,
                'phone': buyer.phone
            } if buyer else None,
            'seller': {
                'id': seller.id,
                'username': seller.username,
                'email': seller.email,
                'phone': seller.phone
            } if seller else None
        })

    return jsonify({
        'contact_requests': result,
        'total': pagination.total,
        'unread_count': unread_count,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    }), 200

# 卖家回复消息
@app.route('/api/contact-requests/<contact_id>/reply', methods=['PUT'])
def reply_contact_request(contact_id):
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401

    contact = ContactRequest.query.get(contact_id)
    if not contact:
        return jsonify({'message': '联系请求不存在'}), 404

    # 只有卖家可以回复
    if not is_admin(user) and contact.seller_id != user.id:
        return jsonify({'message': '只有卖家可以回复此消息'}), 403

    # 检查是否已经回复过
    if contact.reply:
        return jsonify({'message': '已经回复过此消息，每个消息只能回复一次'}), 400

    data = request.get_json(silent=True) or {}
    reply_message = data.get('reply')
    if not reply_message or not isinstance(reply_message, str) or not reply_message.strip():
        return jsonify({'message': '回复内容不能为空'}), 400

    contact.reply = reply_message.strip()
    contact.buyer_read = False  # 新回复，买家未读
    contact.updated_at = datetime.now()
    db.session.commit()

    return jsonify({
        'message': '回复成功',
        'contact_request': {
            'id': contact.id,
            'message': contact.message,
            'reply': contact.reply,
            'updated_at': contact.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        }
    }), 200

# 标记消息为已读
@app.route('/api/contact-requests/<contact_id>/read', methods=['PUT'])
def mark_contact_request_read(contact_id):
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401

    contact = ContactRequest.query.get(contact_id)
    if not contact:
        return jsonify({'message': '联系请求不存在'}), 404

    # 检查用户是否有权限查看此消息
    if not is_admin(user) and contact.buyer_id != user.id and contact.seller_id != user.id:
        return jsonify({'message': '没有权限操作此消息'}), 403

    # 根据用户角色标记为已读
    if contact.buyer_id == user.id:
        contact.buyer_read = True
    elif contact.seller_id == user.id:
        contact.seller_read = True
    
    db.session.commit()

    return jsonify({'message': '已标记为已读'}), 200

# 获取未读消息数量
@app.route('/api/contact-requests/unread-count', methods=['GET'])
def get_unread_count():
    user = get_current_user()
    if not user:
        return jsonify({'message': '未登录'}), 401

    role = request.args.get('role', 'seller')
    
    if role == 'buyer':
        unread_count = ContactRequest.query.filter_by(
            buyer_id=user.id,
            buyer_read=False
        ).count()
    else:
        unread_count = ContactRequest.query.filter_by(
            seller_id=user.id,
            seller_read=False
        ).count()

    return jsonify({'unread_count': unread_count}), 200


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
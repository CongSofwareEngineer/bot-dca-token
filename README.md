# Bot DCA Token API

API Express.js với TypeScript và MongoDB để quản lý token và DCA (Dollar Cost Averaging).

## 🚀 Tính năng

- **Authentication**: Đăng ký, đăng nhập, JWT token
- **Token Management**: CRUD operations cho token
- **DCA Support**: Quản lý Dollar Cost Averaging
- **MongoDB Integration**: Lưu trữ dữ liệu với Mongoose
- **TypeScript**: Type safety và developer experience tốt hơn
- **Security**: Helmet, CORS, input validation

## 📋 Yêu cầu

- Node.js >= 16.x
- MongoDB >= 4.x (local hoặc MongoDB Atlas)
- npm hoặc yarn

## 🛠️ Cài đặt

1. **Clone repository:**
```bash
git clone <repository-url>
cd bot-dca-tken
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Cấu hình environment variables:**
Sao chép file `.env` và cập nhật các giá trị:
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bot-dca-token
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
```

4. **Khởi động MongoDB:**
- Local: `mongod`
- Hoặc sử dụng MongoDB Atlas

5. **Chạy ứng dụng:**

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## 📚 API Endpoints

### Authentication

#### POST `/api/auth/register`
Đăng ký user mới
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST `/api/auth/login`
Đăng nhập
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/profile`
Lấy thông tin profile (cần token)
```
Authorization: Bearer <jwt-token>
```

### Token Management

#### POST `/api/tokens`
Tạo token mới (cần authentication)
```json
{
  "tokenAddress": "0x1234567890123456789012345678901234567890",
  "tokenName": "Bitcoin",
  "tokenSymbol": "BTC",
  "price": 50000,
  "amount": 0.1,
  "dcaAmount": 100,
  "dcaFrequency": "weekly"
}
```

#### GET `/api/tokens`
Lấy danh sách token (cần authentication)
Query parameters:
- `page`: Số trang (default: 1)
- `limit`: Số lượng per page (default: 10)
- `isActive`: true/false để filter theo status

#### GET `/api/tokens/:id`
Lấy thông tin token theo ID (cần authentication)

#### PUT `/api/tokens/:id`
Cập nhật token (cần authentication)
```json
{
  "price": 55000,
  "amount": 0.2,
  "dcaAmount": 150
}
```

#### DELETE `/api/tokens/:id`
Xóa token (cần authentication)

#### PATCH `/api/tokens/:id/toggle`
Bật/tắt trạng thái token (cần authentication)

### Health Check

#### GET `/health`
Kiểm tra trạng thái API
```json
{
  "success": true,
  "message": "Bot DCA Token API is running",
  "timestamp": "2025-09-27T10:30:00.000Z",
  "environment": "development"
}
```

## 🗂️ Cấu trúc thư mục

```
src/
├── config/
│   └── database.ts          # Cấu hình MongoDB
├── controllers/
│   ├── authController.ts    # Authentication logic
│   └── tokenController.ts   # Token management logic
├── middleware/
│   └── auth.ts             # JWT middleware & error handling
├── models/
│   ├── User.ts             # User schema
│   └── Token.ts            # Token schema
├── routes/
│   ├── auth.ts             # Authentication routes
│   └── tokens.ts           # Token routes
├── types/
│   └── index.ts            # TypeScript interfaces
└── index.ts                # Main application file
```

## 🔒 Security

- **JWT Authentication**: Bảo vệ các endpoint cần authentication
- **Password Hashing**: Sử dụng bcryptjs
- **Input Validation**: Mongoose schema validation
- **CORS**: Cấu hình CORS cho frontend
- **Helmet**: Security headers
- **Environment Variables**: Sensitive data trong .env

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
Có thể tạo Dockerfile để containerize ứng dụng.

## 📝 Scripts

- `npm run dev`: Chạy development mode với nodemon
- `npm run build`: Build TypeScript thành JavaScript
- `npm start`: Chạy production build
- `npm run clean`: Xóa thư mục dist

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

ISC License

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Kiểm tra MongoDB đã chạy chưa
- Kiểm tra MONGODB_URI trong .env
- Đảm bảo MongoDB Atlas whitelist IP (nếu dùng Atlas)

### JWT Issues
- Đảm bảo JWT_SECRET được set trong .env
- Token có thể hết hạn (7 ngày)

### Port Issues
- Thay đổi PORT trong .env nếu 3000 đã được sử dụng
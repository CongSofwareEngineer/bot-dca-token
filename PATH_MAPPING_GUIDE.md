# Path Mapping Configuration Guide

## 🎯 Đã cấu hình

✅ **TypeScript Path Mapping** với "@" làm root  
✅ **Development Mode** - Hoạt động với ts-node + tsconfig-paths  
✅ **Production Build** - Hoạt động với tsc + tsc-alias  
✅ **Runtime Support** - Hoạt động với module-alias  

## 📂 Path Mapping Available

```typescript
// Thay vì relative imports
import User from '../models/User';
import { JWTPayload } from '../types';
import authRoutes from './routes/auth';

// Bây giờ có thể dùng absolute imports
import User from '@/models/User';
import { JWTPayload } from '@/types';
import authRoutes from '@/routes/auth';
```

### Các paths được cấu hình:

- `@/*` → `src/*` (root)
- `@/config/*` → `src/config/*`
- `@/controllers/*` → `src/controllers/*`
- `@/middleware/*` → `src/middleware/*`
- `@/models/*` → `src/models/*`
- `@/routes/*` → `src/routes/*`
- `@/types/*` → `src/types/*`

## ⚙️ Cấu hình Files

### 1. `tsconfig.json`
```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/config/*": ["./config/*"],
      // ... other paths
    }
  },
  "ts-node": {
    "require": ["tsconfig-paths/register"]
  }
}
```

### 2. `package.json`
```json
{
  "scripts": {
    "start": "node -r module-alias/register dist/index.js",
    "dev": "nodemon --exec ts-node -r tsconfig-paths/register src/index.ts",
    "build": "tsc && tsc-alias"
  },
  "_moduleAliases": {
    "@": "dist"
  }
}
```

### 3. `nodemon.json`
```json
{
  "exec": "ts-node -r tsconfig-paths/register ./src/index.ts"
}
```

## 🚀 Packages Installed

- **tsconfig-paths**: Resolve TypeScript path mapping trong development
- **tsc-alias**: Convert path aliases trong build output
- **module-alias**: Runtime path resolution cho production
- **@types/module-alias**: TypeScript types

## 🔧 Development Workflow

### Development Mode
```bash
npm run dev
```
- Sử dụng `ts-node` với `tsconfig-paths/register`
- Path mapping hoạt động trực tiếp
- Hot reload với nodemon

### Production Build
```bash
npm run build
npm start
```
- `tsc` compile TypeScript
- `tsc-alias` convert @ paths thành relative paths
- `module-alias` handle runtime resolution

## ✅ Tested & Working

### ✅ Development Mode
- ✅ Server khởi động thành công
- ✅ Path imports hoạt động
- ✅ Hot reload working

### ✅ Build Mode  
- ✅ TypeScript compilation thành công
- ✅ Path aliases được resolve
- ✅ Không có lỗi build

### ✅ ESLint
- ✅ Path mapping được nhận diện
- ✅ Không có lỗi import resolution
- ✅ Linting hoạt động bình thường

## 💡 Lợi ích

### ✅ Cleaner Imports
```typescript
// Trước
import User from '../../../models/User';
import { validateToken } from '../../middleware/auth';

// Sau  
import User from '@/models/User';
import { validateToken } from '@/middleware/auth';
```

### ✅ Refactoring Safe
- Không lo lắng về việc move files
- Imports không bị break khi restructure

### ✅ Better IntelliSense
- VS Code autocomplete hoạt động tốt hơn
- Jump to definition working

### ✅ Consistent
- Tất cả imports đều consistent
- Dễ đọc và maintain code

## 🎯 Examples

### Models
```typescript
import User from '@/models/User';
import Token from '@/models/Token';
```

### Controllers
```typescript
import { authController } from '@/controllers/authController';
import { tokenController } from '@/controllers/tokenController';
```

### Types & Interfaces
```typescript
import { ApiResponse, JWTPayload } from '@/types';
```

### Middleware
```typescript
import { authenticateToken, errorHandler } from '@/middleware/auth';
```

### Config
```typescript
import connectDB from '@/config/database';
```

## 🚀 Next Steps

1. **Gradually migrate** existing relative imports to @ paths
2. **Use consistently** trong new code
3. **Enjoy cleaner** và maintainable codebase!

Path mapping đã được setup hoàn chỉnh và tested. Bạn có thể bắt đầu sử dụng ngay! 🎉
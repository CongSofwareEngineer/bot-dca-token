# ESLint Configuration Guide

## 📋 Đã cài đặt

✅ **ESLint** - JavaScript/TypeScript linter  
✅ **@typescript-eslint/parser** - Parser cho TypeScript  
✅ **@typescript-eslint/eslint-plugin** - Rules cho TypeScript  
✅ **Prettier** - Code formatter  
✅ **eslint-config-prettier** - Tắt ESLint rules xung đột với Prettier  

## 🚀 Scripts có sẵn

```bash
# Kiểm tra lỗi linting
npm run lint

# Tự động sửa các lỗi có thể sửa được
npm run lint:fix

# Kiểm tra strict (không cho phép warnings)
npm run lint:check

# Format code với Prettier
npm run format

# Kiểm tra format
npm run format:check
```

## ⚙️ Cấu hình

### ESLint (.eslintrc.js)
- **Parser**: @typescript-eslint/parser
- **Plugins**: @typescript-eslint
- **Extends**: eslint:recommended, plugin:@typescript-eslint/recommended
- **Environment**: Node.js, ES6

### Prettier (.prettierrc)
- Single quotes
- No trailing commas
- 2 spaces indentation
- Semicolons
- 100 character line width

### Rules được áp dụng

#### TypeScript Rules
- `@typescript-eslint/no-unused-vars`: Error (với pattern '^_' được ignore)
- `@typescript-eslint/no-explicit-any`: Warning
- `@typescript-eslint/explicit-function-return-type`: Off
- `@typescript-eslint/explicit-module-boundary-types`: Off

#### General Rules
- `no-console`: Off (cho phép console.log trong server)
- `no-debugger`: Warning
- `prefer-const`: Error
- `no-var`: Error
- `quotes`: Single quotes
- `semi`: Required
- `indent`: 2 spaces
- `max-len`: 100 characters (warning)

## 🔧 VS Code Integration

File `.vscode/settings.json` đã được tạo với:
- ESLint validation cho TypeScript
- Sử dụng project eslint config
- Tắt format on save để tránh xung đột

## 📝 Workflow khuyến nghị

1. **Viết code** như bình thường
2. **Chạy lint** để kiểm tra lỗi:
   ```bash
   npm run lint
   ```
3. **Auto-fix** những lỗi có thể sửa được:
   ```bash
   npm run lint:fix
   ```
4. **Format code** với Prettier:
   ```bash
   npm run format
   ```
5. **Kiểm tra cuối** trước commit:
   ```bash
   npm run lint:check
   ```

## 🚫 Tắt rules cho trường hợp đặc biệt

### Tắt cho một dòng
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = await someFunction();
```

### Tắt cho một file
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
// Toàn bộ file sẽ không check rule này
```

### Tắt cho một block
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
const data: any = something;
const other: any = somethingElse;
/* eslint-enable @typescript-eslint/no-explicit-any */
```

## 🔍 Hiện tại

Code hiện tại có **16 warnings** về `any` type - đây là warnings hợp lý và có thể giữ như vậy hoặc cải thiện dần.

## 🛠️ Tùy chỉnh thêm

Để thêm rules hoặc thay đổi cấu hình, edit file `.eslintrc.js`:

```javascript
rules: {
  // Thêm rule mới
  'rule-name': 'error',
  
  // Thay đổi level
  '@typescript-eslint/no-explicit-any': 'error', // thay vì 'warn'
  
  // Tắt rule
  'rule-name': 'off'
}
```

## 🎯 Lợi ích

- ✅ **Code consistency** - Tất cả dev viết code theo cùng style
- ✅ **Bug prevention** - Phát hiện lỗi tiềm ẩn sớm
- ✅ **Better TypeScript** - Tận dụng tối đa type safety
- ✅ **Auto formatting** - Không cần lo về format code
- ✅ **Team workflow** - Dễ review code và maintain
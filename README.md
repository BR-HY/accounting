# 一句话记账

这是一个适合部署到 GitHub Pages 的静态记账网页，当前版本已经升级为：

- GitHub Pages 托管前端
- Supabase Auth 负责登录
- Supabase Postgres 负责账本存储
- Row Level Security 保证每个账号只能看到自己的数据
- 前端内置自然语言解析和基础月度报表

## 功能

- 输入一句自然语言，例如：`昨天和同事吃火锅花了128元`
- 自动提取时间、金额、用途和分类
- 邮箱魔法链接登录
- 同一账号多设备同步
- 不同账号只显示自己的账本
- 支持 CSV 导出
- 提供完整周报页面
- 提供完整月报页面
- 支持近六个月趋势对比

## 当前目录

- `index.html`：页面结构
- `styles.css`：视觉样式
- `app.js`：自然语言解析、Supabase 登录和云端 CRUD
- `config.js`：填写 Supabase 项目配置
- `config.example.js`：配置示例
- `supabase/schema.sql`：数据库表和 RLS 策略
- `.github/workflows/pages.yml`：GitHub Pages 自动部署

## 第一步：创建 Supabase 免费项目

1. 打开 Supabase，新建一个免费项目。
2. 进入 SQL Editor，执行 `supabase/schema.sql`。
3. 进入 `Authentication -> URL Configuration`。
4. 配置：
   - `Site URL`：你的 GitHub Pages 网址
   - `Redirect URLs`：同样加入你的 GitHub Pages 网址

例如：

```text
https://你的用户名.github.io/仓库名/
```

## 第二步：填写前端配置

编辑 `config.js`：

```js
window.APP_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY"
};
```

注意：

- `anon key` 可以放前端，它本来就是公开客户端密钥
- 不要把 `service_role` key 放进仓库

## 第三步：部署到 GitHub Pages

1. 新建一个 GitHub 仓库，把当前目录文件上传上去。
2. 默认分支建议使用 `main`。
3. 仓库已带好 `GitHub Pages` 工作流：`.github/workflows/pages.yml`
4. 在 GitHub 仓库设置中打开 `Pages`
5. Source 设为 `GitHub Actions`
6. push 到 `main` 后会自动部署

## 运行逻辑

1. 用户打开 GitHub Pages 网址
2. 浏览器加载 `index.html`、`styles.css`、`config.js`、`app.js`
3. `app.js` 连接 Supabase
4. 用户用邮箱登录
5. Supabase Auth 返回当前用户会话
6. 前端用该会话读取和写入 `ledger_entries`
7. 由于表启用了 RLS，不同用户只能访问自己的记录

## 数据存储位置

- 页面代码：GitHub 仓库和 GitHub Pages
- 账本数据：Supabase Postgres
- 登录状态：浏览器本地 session，由 Supabase 客户端维护

## 旧本地数据迁移

如果你之前用过纯本地版，这一版会在用户第一次登录且云端无数据时，尝试把旧的 `localStorage` 记录迁移到当前账号下。

## 后续可继续扩展

- 预算提醒
- 多账本
- 自定义分类
- 导入 CSV

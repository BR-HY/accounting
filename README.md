# 云朵账本

一个可以直接部署到 GitHub Pages 的记账网站前端，登录与账本同步使用 Supabase。

## 这版包含什么

- GitHub Pages 托管前端
- Supabase Auth 邮箱密码登录/注册
- Supabase Postgres 存储账本
- Row Level Security 确保每个账号只能访问自己的数据
- 首页、记账页、周报页、月报页四个独立页面
- 一句话快速识别基础记账信息
- CSV 导出、JSON 备份导入导出

## 目录

- `index.html`：首页与登录入口
- `ledger.html`：记账页
- `weekly.html`：周报页
- `monthly.html`：月报页
- `styles.css`：样式
- `app.js`：前端逻辑
- `config.js`：你的 Supabase 配置（需要自己填写）
- `config.example.js`：配置示例
- `supabase/schema.sql`：账本表和 RLS 策略（当前会创建 `public.natural_ledger_records`）

## 第一步：创建 Supabase 项目

1. 在 Supabase 创建项目。
2. 打开 SQL Editor，执行 `supabase/schema.sql`。脚本会创建新的账本表 `public.natural_ledger_records`。
3. 进入 `Authentication -> URL Configuration`。
4. 配置：
   - `Site URL`：你的 GitHub Pages 正式地址
   - `Redirect URLs`：同样加入你的 GitHub Pages 地址

例如：

```text
https://你的用户名.github.io/仓库名/
```

## 第二步：填写前端配置

编辑 `config.js`：

```js
window.APP_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_PUBLISHABLE_KEY"
};
```

注意：

- 这里应该填写 **publishable key / anon key**，不要填写 `service_role` key
- `service_role` 绝不能放进前端仓库

## 第三步：部署到 GitHub Pages

1. 新建 GitHub 仓库并上传整个目录。
2. 进入 `Settings -> Pages`。
3. 选择从分支部署，分支选 `main`，目录选根目录。
4. 等待 GitHub Pages 发布。

## 使用说明

- 首页负责登录/注册和总览
- 记账页负责新增、编辑、导入导出和管理账目
- 周报页只看周视角
- 月报页只看月视角

## 说明


- 如果你之前已经建过旧表 `public.ledger_entries`，这版前端将不再读取它；新数据会写入 `public.natural_ledger_records`。
- 没填 `config.js` 时，页面会提示你先完成配置
- 登录后，账本数据保存在 Supabase，不再存 localStorage
- 同一账号在不同设备登录，会看到同一份账本

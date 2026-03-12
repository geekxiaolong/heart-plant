# heart-plant

植物记三端分离后的用户前端仓库。

## 当前状态
- 当前判断：**可进入真实账号联调**
- 本地构建：`npm run build` 已通过
- 当前主链路已稳定：
  - 登录 / 注册
  - 受保护接口统一鉴权头
  - moments / following / public profile 关注态同步
  - 个人资料编辑与头像上传回退
  - 植物详情时间线请求恢复

## 启动方式
```bash
npm install
npm run dev
```
默认端口：`3000`

## 其他常用命令
```bash
npm run build
npm run preview
```

## 仓库职责
- 用户登录与会话恢复
- 首页 / 植物库 / 认领链路
- Moments / Following / Public Profile 社交链路
- 个人资料编辑
- 植物详情、日记、心情等用户侧页面

## 目录摘要
- `src/app/pages/`：页面
- `src/app/components/`：组件
- `src/app/context/`：认证/主题上下文
- `src/app/utils/`：API 与工具函数
- `src/styles/`：样式

## 联调前提
前端真实联调仍依赖：
1. 有效 Supabase 登录态 / 普通测试账号
2. 可用后端 API 环境
3. 若涉及上传与资料写入，后端侧需已配置 `SUPABASE_SERVICE_ROLE_KEY`

## 最小人工验收
见根目录：`FINAL_ACCEPTANCE_RUNBOOK.md`
- 用户侧重点：`U1 ~ U4`

## 相关文档
- `USAGE.md`
- `REPOSITORY_GUIDE.md`
- `FRONTEND_RELEASE_CHECKLIST.md`
- 根目录 `FINAL_ACCEPTANCE_RUNBOOK.md`

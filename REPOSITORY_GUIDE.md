# heart-plant 仓库说明文档

## 仓库定位
用户前端仓库，对应植物记 C 端用户使用界面。

## 当前职责
- 用户登录
- 首页/发现页
- 植物认领
- 动态/通知
- 个人中心
- 日记/心情/成就

## 技术栈
- React 18
- TypeScript
- Vite
- Tailwind CSS

## 目录说明
- `src/app/pages/`：用户页面
- `src/app/components/`：用户组件与通用组件
- `src/app/context/`：认证/主题上下文
- `src/app/utils/`：API 与工具函数
- `src/styles/`：样式文件

## 开发原则
1. 保持与原单体项目功能一致
2. 保持原有 UI 不变
3. 保持数据结构与接口字段不变
4. 用户端不直接承载 admin 逻辑

## 当前状态
- 已从原单体项目中拆出独立仓库
- 正在清理与管理后台无关耦合
- 后续将抽离共用 API / 类型定义

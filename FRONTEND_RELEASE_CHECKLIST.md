# Frontend release-readiness checklist

## Stable flows after current fixes
- 登录 / 注册：注册成功后自动登录；已注册邮箱会切回登录并直接尝试密码登录。
- 受保护接口鉴权：统一通过 `buildApiHeaders()` / `apiRequest()` 注入 `apikey` + 用户 JWT，减少页面间 header 漂移。
- 动态路由恢复：修复多处错误字符串插值，`/stats/:userId`、`/follow/:userId`、`/moments/:id/comments`、`/plant-timeline/:id` 等请求不再发到字面量路径。
- 公开主页链路：新增 `/u/:userId` 别名，关注列表、广场、个人主页之间的跳转更一致。
- 关注态同步：`Moments` / `Following` / `UserProfile` / `Profile` 共享关注缓存与事件广播，关注/取关后的 UI 同步更稳定。
- 个人资料页：支持加载资料、编辑资料、头像上传、失败时回退到 Supabase Auth metadata。
- 用户主页：支持从 moments 派生资料，缺少专用接口时回退到全量 moments 过滤，空态更合理。
- 资源地址解析：统一通过 `getStoragePublicUrl()` 解析 `storage:` 路径，避免页面内硬编码 bucket URL。
- Build health：`npm run build` 通过。

## Residual low-priority risks
- 主包体积仍较大（`dist/assets/index-*.js` ~1.27 MB），不是发布阻塞，但会影响首屏加载。
- `UserProfile` 在 `/moments/user/:id` 不可用时会回退到全量 `/moments` 过滤，数据量变大后可能拖慢加载。
- 关注状态仍按用户逐个请求 `/is-following/:userId`，广场用户很多时会带来额外请求数。
- 资料更新对后端 `/profile` 路由和 Supabase Auth metadata 做了双路径兼容，后续最好收敛到单一真源。
- `FRONTEND_AUTH_AUDIT.md` 是人工审计文档，不影响运行，但发布时要确认是否保留在仓库。

## Manual verification before release
1. 登录页
   - 现有账号登录成功并跳转首页。
   - 新账号注册成功后自动登录。
   - 已注册邮箱在注册模式下会提示并自动切到登录。
2. 广场 / 关注
   - 在 `Moments` 里关注、取消关注某用户后，按钮状态立即刷新。
   - 进入 `Following` 页面，列表与刚才操作保持一致。
   - 从 `Following` 点击头像能进入 `/u/:userId`。
3. 公开主页
   - 打开自己的 `/u/:userId` 与他人的 `/u/:userId`。
   - 他人主页关注/取关可用；自己的主页不显示关注按钮。
   - 无 moments 的用户主页空态文案正常。
4. 个人资料
   - `Profile` 能正确加载 name / bio / location / avatar。
   - 修改资料后立即回显，不强制整页刷新。
   - 上传头像成功后展示新图；失败时预览能回退。
5. 植物详情
   - 时间线接口能正常返回，不再因错误鉴权头或路径失败。
6. 回归检查
   - 刷新页面后 session 仍有效，受保护页面不会错误跳回登录。
   - 打开浏览器 Network，确认受保护请求携带用户 JWT，而不是 anon key 冒充 bearer token。

## Recommendation
- 这批改动已经达到“可以继续提测/灰度”的状态。
- 若要正式对外发布，建议至少完成一次真实账号的端到端手工验证，重点看登录、资料编辑、关注链路三条主流程。

# 大佬云官网

无构建依赖的静态展示站，可直接部署至 Cloudflare Pages、Netlify 或任意静态服务器。

## 文件结构

```text
.
├── index.html    # 八个核心模块、SEO 与 JSON-LD
├── features.html # 专线优势独立页
├── pricing.html  # 优惠价格独立页
├── speedtest.html# 4K / 8K 速度实测页
├── ai-tools.html # AI 出海导航页
├── tutorials.html# 全平台客户端教程页
├── faq.html      # 新手排错与 FAQ 结构化数据
├── wiki.html     # 协议与线路科普长文页
├── styles.css    # 暗黑响应式视觉系统
├── script.js     # 导航、价格切换、教程与 FAQ 交互
├── site-shell.js # 独立页面共享 Header / Footer
├── assets/       # 品牌 Logo、favicon、测速与社交分享视觉素材
├── go.html       # 外链安全白名单跳转页
├── _redirects    # 静态托管路由配置
└── README.md
```

## 上线前配置

1. 将 `index.html` 中的 `example.com` canonical、Open Graph 地址替换为正式域名。
2. 将 `go.html` 内 `targets` 白名单中的注册、套餐和工单地址替换为真实地址。
3. 只通过 `targets` 白名单新增外链，不接受任意 URL 参数，避免开放重定向漏洞。

## IndexNow 与站点地图

- 验证密钥文件位于站点根目录：`7c34c1da8656e9d3e732f2f4deb80707.txt`。
- `npm run build` 会根据静态页面生成根目录 `sitemap.xml`；生产构建必须设置 `SITE_URL=https://你的正式域名`。
- `npm run indexnow` 会读取 `sitemap.xml` 的全部 URL、自动读取根目录密钥文件，并提交到 IndexNow。
- GitHub Pages 工作流位于 `.github/workflows/deploy.yml`。使用前在仓库 Variables 中设置 `SITE_URL`，不要填写路径或末尾页面名。
- 本地验证示例：`$env:SITE_URL='https://你的正式域名'; npm run build; npm run indexnow`。

## 链接健康检查

- `npm run links:check`：检查站内链接、资源、锚点、15 家推广地址与 8 个客户端官方源，并生成 `LINK_HEALTH_REPORT.md`。
- `npm run links:fix`：在检查基础上修复可确定的路径错误，同步 `_redirects`、`nginx-redirects.conf` 与 `go-targets.js`。
- 外部请求采用并发检测、8 秒超时、HEAD 失败后 GET；明确 404/5xx 才启用预设降级，DNS/TLS/超时保留原地址并进入人工复核。

本地预览可直接打开 `index.html`，或运行任意静态文件服务器。

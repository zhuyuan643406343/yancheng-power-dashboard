# 盐城供电公司 · 新闻宣传专业统计看板

> 移动端优先的内部 Web 看板，展示各县公司及本部每周宣传工作表现。

## 🔗 在线地址

https://5ff4e15931ff4a18900ac8747e0ac395.app.codebuddy.work

访问密码：`Ycj5186!`

## 📂 项目结构

| 文件夹/文件 | 说明 |
|-------------|------|
| `dashboard/` | 看板主程序（SPA + PWA） |
| `dashboard/index.html` | 单文件应用，含密码保护、6Tab周报、月度/季度/单位数据 |
| `dashboard/manifest.json` | PWA 配置，支持添加到手机主屏幕 |
| `dashboard/sw.js` | Service Worker，离线缓存 |
| `*.json` | 从金山文档拉取的源数据 |

## 🚀 部署方式

部署到 CloudStudio，执行：

```
workbuddy_cloudstudio_deploy --directory ./dashboard --entry index.html
```

## 📊 数据来源

金山文档多维表格：新闻宣传专业统计表(2026)
- 自动拉取：每周一自动化任务从金山文档读取最新得分
- 手动拉取：使用 `kdocs-cli` 工具

## ✨ 功能模块

- 🔐 密码保护（session 内免登）
- 📅 每周周报（第1-22周，6Tab专业报告）
- 📆 月度总结（1-5月排名+明细）
- 📊 季度总结（Q1/Q2 对比分析）
- 🏢 单位数据（单单位全周期走势）
- 📱 PWA + 离线缓存

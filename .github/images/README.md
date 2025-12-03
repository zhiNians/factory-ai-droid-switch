# Images Directory

这个目录用于存放项目文档中使用的图片资源。

## 目录结构

```
.github/images/
├── screenshots/         # 应用截图
│   ├── main-interface.png       # 主界面截图
│   ├── add-key-dialog.png       # 添加密钥对话框（待添加）
│   ├── batch-import.png         # 批量导入界面（待添加）
│   ├── model-selector.png       # 模型选择器（待添加）
│   └── system-tray.png          # 系统托盘菜单（待添加）
├── logos/               # Logo 和图标
│   └── banner.png               # 项目横幅（待添加）
└── diagrams/            # 架构图和流程图
    └── architecture.png         # 架构图（待添加）
```

## 命名规范

### 截图 (screenshots/)
- 使用小写字母和连字符
- 格式: `功能名称.png`
- 例如: `main-interface.png`, `add-key-dialog.png`

### Logo (logos/)
- 使用描述性名称
- 例如: `banner.png`, `icon.png`, `favicon.png`

### 图表 (diagrams/)
- 使用描述性名称
- 例如: `architecture.png`, `workflow.png`, `data-flow.png`

## 图片规范

### 尺寸
- 截图: 建议宽度 1200-2400px (在 README 中会缩放到 800px 显示)
- Logo: 根据使用场景调整
- 图表: 建议宽度 1000-1600px

### 格式
- 优先使用 PNG (支持透明背景)
- 图表可以使用 SVG (矢量图)
- 照片类可以使用 JPG (文件更小)

### 优化
- 使用工具压缩图片以减小文件大小
- 建议单个图片不超过 1MB
- 可以使用 TinyPNG、ImageOptim 等工具

## 在 README 中使用

### 居中显示带说明
```markdown
<p align="center">
  <img src=".github/images/screenshots/main-interface.png" alt="主界面" width="800">
  <br>
  <em>主界面 - API 密钥管理</em>
</p>
```

### 多图并排显示
```markdown
<p align="center">
  <img src=".github/images/screenshots/image1.png" alt="Image 1" width="400">
  <img src=".github/images/screenshots/image2.png" alt="Image 2" width="400">
</p>
```

### 普通显示
```markdown
![主界面](.github/images/screenshots/main-interface.png)
```

## 注意事项

1. 不要提交包含敏感信息的截图（API Key、个人信息等）
2. 确保图片文件名不包含空格或特殊字符
3. 定期检查并清理不再使用的图片
4. 大文件考虑使用 Git LFS (Large File Storage)

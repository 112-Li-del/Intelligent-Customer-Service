# 电商智能客服

商城基于 Medusa 和 Next.js。目前可以浏览官方示例商品和体验购物流程，商品说明书和 RAG 问答后续接入。

## 需要下载和安装的软件

以下以 Windows 64 位和 PowerShell 为例。每位开发者使用自己的本地数据库，避免测试操作互相影响。已有符合版本要求的软件可以直接使用。

| 软件 | 版本和用途 | 下载或安装方式 |
| --- | --- | --- |
| Git | 用于克隆 GitHub 仓库、拉取更新和提交代码 | [Git for Windows](https://git-scm.com/install/windows) |
| Node.js | 项目要求 22.23.4 或更高版本，推荐 Node.js 24 LTS。安装包自带 npm | [Node.js 官方下载](https://nodejs.org/en/download)，选择 24 LTS 的 Windows x64 安装包 |
| pnpm | 项目锁定 10.11.1，用于安装依赖和运行项目 | 安装 Node.js 后执行 `npm.cmd install --global pnpm@10.11.1`。[pnpm 安装文档](https://pnpm.io/10.x/installation) |
| PostgreSQL | 团队统一用 16.x，提供本地数据库 | [PostgreSQL 官方 Windows 下载页](https://www.postgresql.org/download/windows/)，从 EDB 下载 16.x 的 Windows x86-64 安装包 |

安装 PostgreSQL 时勾选 **PostgreSQL Server、pgAdmin 4 和 Command Line Tools**。记住为 `postgres` 设置的密码和端口（默认 `5432`）。pgAdmin 随安装包提供，用于创建数据库。Stack Builder 可以跳过。

安装完成后，重新打开 PowerShell，检查开发工具和数据库端口：

```powershell
git --version
node --version
npm.cmd --version
pnpm.cmd --version
Test-NetConnection 127.0.0.1 -Port 5432
```

数据库用了其他端口时，替换检查命令和下文连接地址中的 `5432`。端口连通后，再用 pgAdmin 登录确认账号和密码。

Medusa、Next.js、React 等项目依赖由 `pnpm install --frozen-lockfile` 统一安装。当前演示无需安装 Docker、Redis、Python、向量数据库或模型网关。Medusa 的前台公开 API Key 在本地初始化数据库时生成。

## 本地部署步骤

### 1. 创建数据库并安装依赖

在 pgAdmin 中连接本机 PostgreSQL，创建空数据库 `medusa_preview`。然后从仓库根目录执行：

```powershell
cd dtc-starter-main
pnpm.cmd install --frozen-lockfile
if (-not (Test-Path apps/backend/.env)) {
    Copy-Item apps/backend/.env.template apps/backend/.env
}
if (-not (Test-Path apps/storefront/.env.local)) {
    Copy-Item apps/storefront/.env.template apps/storefront/.env.local
}
```

首次配置时复制模板。已有本地环境文件时，打开原文件修改所需字段即可。

在 `apps/backend/.env` 中设置 `DATABASE_URL`，把 `YOUR_PASSWORD` 换成实际密码。密码含 `@`、`#` 等 URL 特殊字符时，先对密码做 URL 百分号编码。端口和用户名也按本机配置填写。

```dotenv
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/medusa_preview
```

本地演示可以移除模板里的 `REDIS_URL` 一行，Medusa 会使用本地默认实现。

### 2. 初始化数据库并启动后端

以下命令从 `dtc-starter-main` 目录运行。迁移会导入 12 款共享演示商品，包含原有的 4 款服装和新增的 8 款跨品类商品。创建管理员时，将 `YOUR_LOCAL_ADMIN_PASSWORD` 换成你自己的密码。

```powershell
pnpm.cmd --dir apps/backend exec medusa db:migrate
pnpm.cmd --dir apps/backend exec medusa user -e admin@demo.local -p 'YOUR_LOCAL_ADMIN_PASSWORD'
pnpm.cmd --dir apps/backend run dev
```

打开[本地管理后台](http://localhost:9000/app)，登录后从 **Settings → Publishable API Keys** 复制默认的公开 API Key。将它填入 `apps/storefront/.env.local` 的 `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`。

### 3. 启动商城前台

保留后端终端，再开一个终端，从 `dtc-starter-main` 运行：

```powershell
pnpm.cmd --dir apps/storefront run dev
```

打开[商城首页](http://localhost:8000/)或[商品列表](http://localhost:8000/cn/store)，确认能看到中文示例商品和人民币价格。初始化会创建中国大陆配送区域，结算使用模拟支付。

已有本地环境时，运行一次数据库迁移，并将 `apps/storefront/.env.local` 中的 `NEXT_PUBLIC_DEFAULT_REGION` 改为 `cn`，然后重启前后端。

### 同步共享演示商品

团队成员拉取最新代码后，从 `dtc-starter-main` 运行以下命令，将共享商品导入各自的本地数据库，再启动或重启前后端。

```powershell
pnpm.cmd --dir apps/backend exec medusa db:migrate
```

共享清单包含商品分类、人民币价格、规格和样例评价。商品图库随前台代码分发，迁移会为这 12 款演示商品追加角度、细节和场景图，并初始化新增商品的演示库存。已经导入过的本地环境会复用已有商品、库存和图片记录。

如需单独重新同步演示资料和搜索索引，可以运行：

```powershell
pnpm.cmd --dir apps/backend exec medusa exec ./src/scripts/seed-catalog-preview.ts
```

刷新商品列表后可打开任意商品详情。在详情页打开知选 AI 助手，可以查询该商品的参数和使用说明。当前演示按关键词匹配商品资料。评价是为演示编写的样例。

提交到 GitHub 时，环境变量字段通过 `.env.template` 同步，本机密码和连接配置填在 Git 忽略的 `.env` 或 `.env.local` 中。

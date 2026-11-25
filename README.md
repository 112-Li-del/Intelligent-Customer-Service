# 电商智能客服

商城基于 Medusa 2.0 和 Next.js 构建，包含完整的直营电商购物链路以及**“来财 AI 智能客服”**（结合 RAG 知识库检索、实时库存/价格校验、成衣尺码指南与智能商品搭配推荐）。

---

## ⚡ 极速一键启动（已有环境速查）

如果你已安装好 Node.js、pnpm 和 PostgreSQL，进入 `dtc-starter-main` 目录后只需以下 4 步即可全套跑通：

```powershell
# 1. 安装依赖并准备环境变量
cd dtc-starter-main
pnpm.cmd install --frozen-lockfile
if (-not (Test-Path apps/backend/.env)) { Copy-Item apps/backend/.env.template apps/backend/.env }
if (-not (Test-Path apps/storefront/.env.local)) { Copy-Item apps/storefront/.env.template apps/storefront/.env.local }
# 提示：请确保 apps/backend/.env 中的 DATABASE_URL 密码已填写为你的本机 PostgreSQL 密码

# 2. 数据库迁移与初始化演示商品
pnpm.cmd --dir apps/backend exec medusa db:migrate

# 3. 导入智能客服知识库与向量数据（支持大模型 RAG 问答）
pnpm.cmd --dir apps/storefront exec node --env-file=../backend/.env --env-file=.env.local ./scripts/import-knowledge.mjs

# 4. 启动前后端服务（分别在两个终端运行）
# 终端 1 (后端 9000 端口):
pnpm.cmd --dir apps/backend run dev

# 终端 2 (前端 8000 端口):
pnpm.cmd --dir apps/storefront run dev
```

* 🛍️ **商城前台**：[http://localhost:8000](http://localhost:8000)（右下角点击 ✨ **来财 AI 客服**）
* ⚙️ **管理后台**：[http://localhost:9000/app](http://localhost:9000/app)

---

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

### 4. 配置与启用 AI 智能客服（RAG 知识库问答）

智能客服包含**大模型对话**、**Medusa 实时库存/价格校验**与**PostgreSQL 知识库检索（RAG）**。

#### (1) 配置前端环境变量
在 `apps/storefront/.env.local` 中配置兼容 OpenAI 格式的大语言模型和向量模型参数（推荐使用阿里云 DashScope、DeepSeek 或 OpenAI）：

```dotenv
# 大模型聊天服务（必须配置，否则降级为本地演示 Mock 模式）
AI_CHAT_BASE_URL=https://api.openai.com/v1
AI_CHAT_API_KEY=sk-xxxxxx
AI_CHAT_MODEL=gpt-4o-mini

# 向量嵌入模型（用于切片检索；若暂无 Embedding Key 可使用下方纯文本模式）
AI_EMBEDDING_BASE_URL=https://api.openai.com/v1
AI_EMBEDDING_API_KEY=sk-xxxxxx
AI_EMBEDDING_MODEL=text-embedding-3-small

# 知识库数据库连接（本地开发自动继承 backend 的 DATABASE_URL，无需修改）
AI_KNOWLEDGE_USE_LOCAL_MEDUSA=true
```

#### (2) 导入商品知识库与搭配图谱
首次启动或更新知识库后，从 `dtc-starter-main/apps/storefront` 运行导入脚本，将 12 款商品的官方核实规格、成衣尺码对照、配送退货政策及搭配关系切片入库：

```powershell
# 完整向量切片导入（需要配置 AI_EMBEDDING_*）
cd dtc-starter-main/apps/storefront
node --env-file=../backend/.env --env-file=.env.local ./scripts/import-knowledge.mjs

# 或：纯文本模式导入（若未配置 Embedding，仅建立关键词全文索引）
node --env-file=../backend/.env --env-file=.env.local ./scripts/import-knowledge.mjs --text-only
```

#### (3) 验证问答服务
启动前台后，点击右下角 **✨ 来财 AI 客服**，尝试发送以下测试问题检验不同维度的问答链路：
* **实时规格与多接口区分**：“充电宝的 USB-C 和 USB-A 分别支持多少瓦快充？”（核对准确输出功率）
* **尺码表精确核对**：“卫衣 L 码的胸围是多少？XL 呢？”（测试多轮指代理解与尺码提取）
* **场景与商品搭配推荐**：“买了电脑支架，出差还可以搭配什么？”（验证动态推荐卡片展示）
* **实时价格与库存查询**：“连帽卫衣现在多少钱，有现货吗？”（测试 Medusa 实时库存价格联动）

---

## 常见问题与自动降级说明

1. **未配置 AI Key 会怎样？**
   * 系统会自动进入**本地演示模式**，对常见问题（如退换货、尺码选择）返回预置的基础回复，前台会标注 `[演示回复]`。
2. **未运行知识库导入脚本会怎样？**
   * 大模型仍能通用对话，但在涉及具体商品规格、确切尺寸、退换货政策细节时，无法调取经过审核的事实依据。建议拉取代码后务必执行一次 `import-knowledge.mjs`。
3. **提交代码注意事项**：
   * 环境变量字段请通过 `.env.template` 维护，真实的密钥和数据库密码存放在本地 `.env` 与 `.env.local` 中，已被 `.gitignore` 保护，切勿提交到公共仓库。


# 来财商城客服知识库

每件商品以 Medusa `handle` 命名，如 `products/usb-c-power-bank.md`。售后和配送等全店规则单独放在 `policies/`，按适用地区维护。长文可作为原始资料归档，导入时按商品和章节提取。同一个商品的标题、分类、上架状态来自 Medusa。文档只记录核实过的规格和来源，价格和库存由客服实时查询 Medusa。

## 模型配置

在商城前端目录的 `.env.local` 中填写聊天的 `AI_CHAT_BASE_URL`、`AI_CHAT_API_KEY`、`AI_CHAT_MODEL`。填写服务商公布的 API 基础地址，保留 `/v1` 等路径前缀。当前聊天接口会在其后拼接 `/chat/completions`，要求供应商支持 OpenAI 兼容的对话格式。填写后重启商城前端开发服务。聊天模型未配置时，客服会标注回复来自演示模式。

`AI_EMBEDDING_BASE_URL`、`AI_EMBEDDING_API_KEY`、`AI_EMBEDDING_MODEL` 用于后续知识切片向量化。可以使用不同的服务商。实际导入时先验证其 `/embeddings` 接口和返回维度。聊天配置和 Embedding 配置均只用于服务端。

`AI_RERANK_URL`、`AI_RERANK_API_KEY`、`AI_RERANK_MODEL` 用于对混合检索召回的候选切片精排。`AI_RERANK_URL` 填服务商给出的完整重排接口地址，例如 `https://api.example.com/v1/rerank`。这组配置仅用于服务端，可先留空，待接入知识库检索后启用。

## 商品文档

按[商品资料模板](./product-template.md)录入原始来源和适用规格。保留数值、单位、条件、警告和表头。未知项目留空或删去对应章节，资料里的样例评价不作为商品规格证据。

- [本批商品和政策原稿](./sources/laicai_products_kb.md)共 12 款商品、1 份通用政策和 30 个三级章节。
- `drafts/products/` 按实际 Medusa handle 存放 12 份商品草稿，`drafts/policies/` 存放通用政策草稿。[差异核对表](./catalog-review.md)记录了与现有资料不一致的关键字段。
- `products/` 中的 12 份正式商品文档以本地 Medusa 公开商品数据为来源，`policies/` 下的[中国大陆配送与退货](./policies/shipping-and-returns-cn.md)来自商城现行地区配置。四款服饰的成衣参考尺码是商城确认采用的演示数据。
- 入库时只读取 `products/` 和 `policies/` 中元数据标为 `status: "approved"` 的文档。原稿、草稿和核对表用于编辑审核。
- [正式汇总](./laicai_products_kb.md)用于查阅。详情页和客服接口共用 [尺码数据](../apps/storefront/src/lib/data/apparel-size-guides.json)。改表后从本目录运行 `node sync-size-guides.mjs` 更新独立文档和汇总，用 `node sync-size-guides.mjs --check` 检查有无差异。

## 导入与扩容约定

从商城前端目录运行以下命令。数据库连接取自 Medusa 的本地配置，Embedding 取自商城的服务端配置。

```powershell
node --env-file=../backend/.env --env-file=.env.local ./scripts/import-knowledge.mjs
```

使用 `--text-only` 只导入正文和关键词索引。导入结果写入独立的 `laicai_knowledge.chunks` 表，同一切片按稳定 ID 更新。再次导入只为缺少向量、正文变更或模型切换的切片请求 Embedding。本地 PostgreSQL 暂无 pgvector 时，浮点向量保存在 `real[]` 中，可用于小数据量的精确相似度查询。

- 导入时按 `product_handle` 解析当前环境的 Medusa 商品 ID。文档和切片至少关联商品 ID、变体 ID（适用时）、章节类型、语言、来源和资料更新时间。类目可关联多个分类 ID。客服引用应能定位到原文件和章节。
- 每个切片附上商品名和章节标题。尺码表每条切片应保留表头、单位和适用规格。按章节切分，限制单片长度，维持条件与参数的对应关系。
- 使用内容哈希、Embedding 模型和切片规则版本判断是否需要更新。单件商品变更时重新处理受影响的切片，并清理该商品的过期记录。商品下架后排除其切片，展示事实前仍校验 Medusa 的可见性和地区。
- 当前可先逐商品导入。扩展到上万件时，Markdown 仍可用作资料来源，在线检索查 PostgreSQL 中的索引和切片。按商品或类目缩小候选，做关键词与向量召回，再对少量结果重排。向量列的维度以选定模型的实际输出为准。同一个向量索引使用同一模型和维度。
- 数据规模大到需要近似向量索引时，评估 HNSW 的召回率、过滤行为和延迟。端到端时间也包含 Embedding、重排和生成，应以真实数据和并发实测。

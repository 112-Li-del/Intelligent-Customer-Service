"use client"

import { getApparelSizeGuide } from "@lib/util/apparel-size-guide"
import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "商品信息",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "配送与退货",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const guide = getApparelSizeGuide(product.handle)
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">材质</span>
            <p>{product.material ? product.material : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">产地</span>
            <p>{product.origin_country ? product.origin_country : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">类型</span>
            <p>{product.type ? product.type.value : "-"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">重量</span>
            <p>{product.weight ? `${product.weight} g` : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">尺寸</span>
            <p>
              {product.length && product.width && product.height
                ? `${product.length}L x ${product.width}W x ${product.height}H`
                : "-"}
            </p>
          </div>
        </div>
      </div>
      {guide && <ProductSizeGuide guide={guide} />}
    </div>
  )
}

function ProductSizeGuide({ guide }: { guide: NonNullable<ReturnType<typeof getApparelSizeGuide>> }) {
  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div
        role="region"
        aria-label="尺码对照表"
        tabIndex={0}
        className="overflow-x-auto rounded-md border border-gray-200 focus-visible:ring-2 focus-visible:ring-brand-navy"
      >
        <table className="w-full border-collapse text-center text-xs tabular-nums text-gray-700">
          <caption className="bg-white px-3 py-2.5 text-left text-sm font-semibold text-brand-ink">
            {guide.caption}
          </caption>
          <thead className="bg-gray-50 text-brand-ink">
            <tr>
              {guide.columns.map((column) => (
                <th key={column} scope="col" className="px-1.5 py-2 font-semibold">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guide.rows.map(([size, ...measurements]) => (
              <tr key={size} className="border-t border-gray-100 even:bg-gray-50">
                <th scope="row" className="px-1.5 py-2 font-semibold text-brand-ink">{size}</th>
                {measurements.map((measurement, index) => (
                  <td key={guide.columns[index + 1]} className="whitespace-nowrap px-1.5 py-2">{measurement}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs leading-5 text-gray-600">{guide.fitNote}</p>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">配送时效</span>
            <p className="max-w-sm">
              配送方式和预计送达时间以结算页为准。
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">换货</span>
            <p className="max-w-sm">
              尺码不合适时，可联系客户服务咨询换货。
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">退货</span>
            <p className="max-w-sm">
              退货条件、期限和费用请查看退货政策。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs

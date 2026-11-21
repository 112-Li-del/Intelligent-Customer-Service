$ErrorActionPreference = "Stop"

$p = Join-Path $PSScriptRoot "src\scripts\catalog-preview-products.json"
$a = @(Get-Content $p -Raw -Encoding UTF8 | ConvertFrom-Json)

if (@($a | Where-Object { $_.handle -eq "huawei-pura-90-pro-max" }).Count -gt 0) {
    throw "华为商品已经存在，停止写入。"
}

$n = @{
    handle = "huawei-pura-90-pro-max"
    category = "digital-accessories"
    title = "HUAWEI Pura 90 Pro Max"
    price = 6499
    material = "铝合金边框、玻璃后盖"
    description = "HUAWEI Pura 90 Pro Max，麒麟9030S处理器，HarmonyOS 6.1，6.9英寸OLED LTPO屏幕，6000mAh电池，100W有线快充，80W无线快充，5000万像素主摄和2亿像素长焦。"
    specs = @{
        型号 = "SCA-AL00"
        操作系统 = "HarmonyOS 6.1"
        处理器 = "麒麟9030S"
        屏幕 = "6.9英寸OLED，1-120Hz LTPO，2880×1308"
        电池 = "典型6000mAh，额定5850mAh"
        有线充电 = "100W，18W有线反向充电"
        无线充电 = "80W无线充电，无线反向充电"
        前置摄像头 = "1300万像素超广角，支持自动对焦"
        后置摄像头 = "5000万像素可变光圈主摄、4000万像素超广角、2亿像素长焦、第二代红枫原色摄像头"
        变焦 = "4倍光学变焦，最高100倍数字变焦"
        防护等级 = "IP68/IP69"
        机身尺寸 = "164×77.1×8.1mm"
        机身重量 = "约230.5g"
        存储版本 = "12GB+256GB、12GB+512GB、16GB+512GB、16GB+1TB"
    }
    reviews = @()
}

$b = @($a) + @($n)
$t = "$p.tmp"
ConvertTo-Json -InputObject $b -Depth 20 | Set-Content -LiteralPath $t -Encoding UTF8
$null = Get-Content -LiteralPath $t -Raw -Encoding UTF8 | ConvertFrom-Json
Move-Item -LiteralPath $t -Destination $p -Force

Write-Output "追加成功，商品总数：$($b.Count)"
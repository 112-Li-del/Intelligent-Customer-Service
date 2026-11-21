
import json
import os
import tempfile

json_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "src",
    "scripts",
    "catalog-preview-products.json"
)

with open(json_path, "r", encoding="utf-8-sig") as f:
    products = json.load(f)

if not isinstance(products, list):
    raise TypeError("商品文件最外层不是数组，停止修改。")

if len(products) != 12:
    raise ValueError(f"原商品数量为 {len(products)}，不是预期的12个，停止修改。")

handle = "huawei-pura-90-pro-max"

if any(p.get("handle") == handle for p in products):
    raise ValueError("华为商品已经存在，停止重复添加。")

new_product = {
    "handle": handle,
    "category": "digital-accessories",
    "title": "HUAWEI Pura 90 Pro Max",
    "price": 6499,
    "material": "铝合金边框、玻璃后盖",
    "description": (
        "HUAWEI Pura 90 Pro Max（SCA-AL00），搭载麒麟9030S处理器和HarmonyOS 6.1。"
        "配备6.9英寸OLED LTPO屏幕、6000mAh典型容量电池，支持100W有线快充和80W无线快充。"
        "后置5000万像素可变光圈主摄、4000万像素超广角和2亿像素长焦镜头，"
        "支持双向北斗卫星消息。提供四种内存与存储组合。"
    ),
    "specs": {
        "型号": "SCA-AL00",
        "上市时间": "2026年4月",
        "操作系统": "HarmonyOS 6.1",
        "处理器": "麒麟9030S",
        "屏幕": "6.9英寸OLED，标准矩形6.87英寸，1–120Hz LTPO",
        "屏幕分辨率": "2880×1308，460PPI",
        "屏幕显示": "10.7亿色，P3广色域，300Hz触控采样率",
        "屏幕保护": "抗反光耐刮昆仑玻璃",
        "电池容量": "典型6000mAh，额定5850mAh",
        "有线充电": "100W有线快充，18W有线反向充电",
        "无线充电": "80W无线充电，支持无线反向充电",
        "后置摄像头": "5000万像素可变光圈主摄（F1.4–F4.0，OIS）＋4000万像素超广角（F2.2）＋2亿像素长焦（F2.6，OIS，支持长焦微距）＋第二代红枫原色摄像头",
        "前置摄像头": "1300万像素超广角，F2.0，支持自动对焦",
        "变焦": "4倍光学变焦，最高100倍数字变焦",
        "视频": "前后置最高支持4K；后置1080p@960fps慢动作，前置1080p@240fps慢动作",
        "影像功能": "XMAGE智拍、AI辅助构图、超级夜景、星空人像、电影效果、RAW等",
        "机身尺寸": "164×77.1×8.1mm",
        "机身重量": "约230.5g",
        "防护等级": "IP68/IP69，防护能力并非永久有效，进水损坏不在保修范围内",
        "SIM卡": "双卡双待双通，支持eSIM",
        "无线连接": "Wi-Fi 802.11 a/b/g/n/ac/ax/be，2.4GHz/5GHz，2×2 MIMO",
        "蓝牙": "Bluetooth 6.0，支持LDAC/L2HC",
        "其他连接": "星闪E2.0、红外、NFC、OTG、天际通",
        "定位系统": "GPS双频、北斗四频、GLONASS、GALILEO三频、QZSS双频、NavIC",
        "卫星通信": "支持双向北斗卫星消息",
        "接口": "USB-C",
        "传感器": "环境光、红外、侧边指纹、霍尔、陀螺仪、指南针、气压计、接近光、重力、姿态、激光对焦、色温",
        "使用温度": "0–35℃",
        "存储温度": "-20–45℃",
        "存储版本": "12GB+256GB、12GB+512GB、16GB+512GB、16GB+1TB",
        "特色功能": "AI姿势推荐、远距人声增强、3D动态照片、AI人像精修、AI降噪通话、户外探索模式、极限续航模式、AI隔空传送、AI智控键、AI通话摘要、AI通话翻译、口罩人脸识别、超级终端、多屏协同、中转站、智感支付、隐私空间、畅连通话、华为分享、应用分身、密码保险箱等，部分功能需HOTA升级"
    },
    "reviews": []
}

updated = products + [new_product]

fd, temp_path = tempfile.mkstemp(
    prefix="catalog-preview-",
    suffix=".json",
    dir=os.path.dirname(json_path)
)
os.close(fd)

try:
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(updated, f, ensure_ascii=False, indent=2)
        f.write("\n")

    with open(temp_path, "r", encoding="utf-8") as f:
        verified = json.load(f)

    if len(verified) != 13 or verified[-1].get("handle") != handle:
        raise ValueError("写入前验证失败，原文件未替换。")

    os.replace(temp_path, json_path)

finally:
    if os.path.exists(temp_path):
        os.remove(temp_path)

print("追加成功")
print("商品总数：", len(updated))
print("新增商品：", handle)
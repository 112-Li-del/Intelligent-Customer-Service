
@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "SYNC_CATALOG_IMAGES_APPLY=1"

echo ========================================
echo       商品图片正式同步
echo ========================================
echo.

pnpm exec medusa exec ./src/scripts/sync-catalog-preview-images.ts

echo.
echo ========================================
echo 同步脚本执行结束，请检查上方统计结果
echo ========================================
pause

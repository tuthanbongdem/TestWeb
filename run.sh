#!/bin/bash
echo ""
echo " ╔═══════════════════════════════════════╗"
echo " ║        Vocabulary  |  Blazor WASM     ║"
echo " ╚═══════════════════════════════════════╝"
echo ""

if ! command -v dotnet &>/dev/null; then
    echo " [!] Không tìm thấy .NET SDK."
    echo "     Tải về tại: https://dot.net/download"
    exit 1
fi

echo " [*] Khởi động tại http://localhost:5000"
echo " [*] Nhấn Ctrl+C để dừng."
echo ""

(sleep 5 && \
  (xdg-open "http://localhost:5000" 2>/dev/null || \
   open "http://localhost:5000" 2>/dev/null || \
   true)) &

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/Vocabulary"
dotnet run --urls "http://localhost:5000"

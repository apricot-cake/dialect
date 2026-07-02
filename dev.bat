@echo off
rem 開発サーバーを起動してブラウザで開く(終了はこのウィンドウで q か Ctrl+C)
cd /d "%~dp0"
npm run dev -- --open
pause

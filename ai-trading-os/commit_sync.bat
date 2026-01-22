@echo off
echo Starting Commit & Push Process...
cd /d "c:\Users\Ohm\Desktop\EA_test\ai-trading-os"

echo.
echo 1. Adding files...
git add .

echo.
echo 2. Committing changes...
git commit -m "feat: implement Control-First Indicator Workflow and Trade Distribution filters"

echo.
echo 3. Pushing to remote...
git push

echo.
echo Done!
pause

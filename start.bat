@echo off
start "React Frontend" cmd /k "npm run dev"
start "Flask Backend" cmd /k "cd flask_backend && python modified_video_app.py"

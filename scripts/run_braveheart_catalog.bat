@echo off
REM Wrapper for Windows Task Scheduler — paths with spaces don't play nicely
REM with schtasks /tr argument. Calling via this batch sidesteps that.

cd /d "C:\Apps in Dev Visual Code Folder\Claude Working Folder\PROJECTS\jb3ai-command-centre\scripts"
python braveheart_catalog.py

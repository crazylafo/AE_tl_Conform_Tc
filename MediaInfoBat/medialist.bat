@echo off

echo ********** Create txt MediaInfo Files **********
set "mediainfo_path=.\MediaInfo"
set "output_file=\mediaList.txt" 


echo.
echo Looking for Media Assets on target directory . . .
  dir %1 *.mxf *.mov  /b /s >> %1\filelist.tmp
  set "templist = %1\filelist.tmp"
REM  ********  ********
(for /f "delims=" %%i in ("%1\!filelist.tmp!") do (
    setlocal enabledelayedexpansion
    "!mediainfo_path!"  -f --Output "%%i" >> "%1!output_file!"
    echo()
    endlocal
)

del "%1\filelist.tmp"
echo.
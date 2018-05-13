@echo off

echo ********** Create txt MediaInfo Files **********
set "mediainfo_path=C:\Program Files\MediaInfo_CLI\MediaInfo.exe"
set "output_file=\mediaList.txt" 


echo.
echo Looking for Media Assets on target directory . . .
dir %1\*.mov /s/b/o:n > "%1\filelist.txt"
(for /F  "usebackq delims=" %%i in ("%1\filelist.txt") do (
	echo %%i 
    setlocal enabledelayedexpansion
    "!mediainfo_path!"  -f --Output "%%i" > "%1!output_file!"
    echo()
    endlocal
)

del "%1\filelist.txt"
echo.
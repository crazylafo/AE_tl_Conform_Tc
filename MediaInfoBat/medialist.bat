@echo off
set "target=G:\documents\Bureau\aeptest"
set "output_file=\mediaList.txt"
set "mediainfo_path=C:\Program Files\MediaInfo_CLI\MediaInfo.exe"


echo ......LISTING FILES.......
dir "%target%\"*.mov /s/b/o:n> "%target%\filelist.txt"

echo .......READING FILES.......
(for /F "usebackq delims=" %%i in ("%target%\filelist.txt") do (
	echo %%i
    "%mediainfo_path%"  -f --Output "%%i">>"%target%\%output_file%"
    echo()
)
del "%target%\filelist.txt"
echo.
Visual-IDE
======================================

Visual IDE built on JavaScript


** Set up dependencies

Simply run ```npm install```
See Node about installation for trouble shoting


** Set up database

Install mongodb. Add it to path for later use. Create a folder by the name of data for holding data.


** Note about installation

For this project, we acutally started from windows and then we saw errors during the
installation process of mongoose--and the root reason for that is the failing of vcbuild
on windows x64(win7) platform.

After running npm install directly, navigate to the modules for which the build failed and build it/them manually.

To resolve this issue, try to build(node-gyp) and specify the build target platform as win32. Also, it may help
if you specify --msvs=2012 if you have vs2012 installed instead.

Ref:

http://stackoverflow.com/questions/22448885/how-do-i-build-32-bit-binaries-on-a-64-bit-system-using-npm

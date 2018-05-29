#!/bin/bash
echo "*-*-*-- MINERSTAT OS RECOVERY --*-*-*"
sudo killall node
sudo screen -S minerstat-console -X quit
sudo screen -S listener -X quit
sudo rm -rf /home/minerstat/minerstat-os
cd /home/minerstat
ls
git clone http://github.com/minerstat/minerstat-os
cd /home/minerstat/minerstat-os
npm install
chmod -R 777 *
echo "Copy config from MSOS (NTFS) Partition"
cp /media/storage/config.js /home/minerstat/minerstat-os
echo ""
cat config.js
echo ""
echo ""
echo "Recovery is done!" 
sleep 3
sudo reboot -f
echo ""
echo "*-*-*-- MINERSTAT.COM--*-*-*"

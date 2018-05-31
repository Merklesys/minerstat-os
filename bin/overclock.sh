#!/bin/bash
echo "*-*-* Overclocking in progress *-*-*"

AMDDEVICE=$(sudo lshw -short | grep AMD | wc -l)
if [ "$AMDDEVICE" -gt "0" ]; then
AMDDIVIDE=$((AMDDEVICE / 2))
else
AMDDIVIDE="0"
fi

NVIDIADEVICE=$(sudo lshw -short | grep NVIDIA | wc -l)
if [ "$NVIDIADEVICE" -gt "0" ]; then
NVIDIADIVIDE=$((NVIDIADEVICE / 2))
else
NVIDIADIVIDE="0"
fi

NVIDIA="$(nvidia-smi -L)"

if [ ! -z "$NVIDIA" ]; then

if echo "$NVIDIA" | grep -iq "^GPU 0:" ;then

DONVIDIA="YES"

fi
fi

if [ "$AMDDIVIDE" -gt "0" ]; then

DOAMD="YES"

fi


echo ""
echo "--------------------------"

TOKEN="$(cat /home/minerstat/minerstat-os/config.js | grep 'global.accesskey' | sed 's/global.accesskey =//g' | sed 's/;//g')"
WORKER="$(cat /home/minerstat/minerstat-os/config.js | grep 'global.worker' | sed 's/global.worker =//g' | sed 's/;//g')"

echo "TOKEN: $TOKEN"
echo "WORKER: $WORKER"

echo "--------------------------"

sudo rm doclock.sh
sleep 1

if [ ! -z "$DONVIDIA" ]; then

wget -qO doclock.sh "https://api.minerstat.com/v2/getclock.php?type=nvidia&token=$TOKEN&worker=$WORKER&nums=$NVIDIADIVIDE"
sleep 3
sudo sh doclock.sh

fi

if [ ! -z "$DOAMD" ]; then

wget -qO doclock.sh "https://api.minerstat.com/v2/getclock.php?type=amd&token=$TOKEN&worker=$WORKER&nums=$AMDDIVIDE"
sleep 3
sudo sh doclock.sh

fi
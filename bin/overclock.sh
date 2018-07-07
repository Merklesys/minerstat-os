#!/bin/bash
echo "*-*-* Overclocking in progress *-*-*"

AMDDEVICE=$(sudo lshw -C display | grep AMD | wc -l)
NVIDIADEVICE=$(sudo lshw -C display | grep NVIDIA | wc -l)

NVIDIA="$(nvidia-smi -L)"

if [ ! -z "$NVIDIA" ]; then
	if echo "$NVIDIA" | grep -iq "^GPU 0:" ;then
		DONVIDIA="YES"
	fi
fi

if [ "$AMDDEVICE" -gt "0" ]; then
	DOAMD="YES"
fi

echo "FOUND AMD: $AMDDEVICE || FOUND NVIDIA: $NVIDIADEVICE"
echo ""
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
	sudo nvidia-smi -pm 1
	wget -qO doclock.sh "https://api.minerstat.com/v2/getclock.php?type=nvidia&token=$TOKEN&worker=$WORKER&nums=$NVIDIADEVICE"
	sleep 3
	sudo sh doclock.sh
	sleep 2
	sudo chvt 1
fi

if [ ! -z "$DOAMD" ]; then
	wget -qO doclock.sh "https://api.minerstat.com/v2/getclock.php?type=amd&token=$TOKEN&worker=$WORKER&nums=$AMDDEVICE"
	sleep 3
	sudo sh doclock.sh
	sudo chvt 1
fi

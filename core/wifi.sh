#!/bin/bash

INTERFACE="$(ls /sys/class/net)"
DEVICE=""
SSID=$(cat /media/storage/network.txt | grep 'WIFISSID="' | sed 's/WIFISSID="//g' | sed 's/"//g')
PASSWD=$(cat /media/storage/network.txt | grep 'WIFIPASS="' | sed 's/WIFIPASS="//g' | sed 's/"//g')

echo ""
echo "*** Connecting Wireless Network ***"
echo ""

for dev in $INTERFACE; do
	if [ -d "/sys/class/net/$dev/wireless" ]; then DEVICE=$dev; fi;
done

if echo "$DEVICE" | grep "w" ;then

	echo "Configuring Wifi Connection to: "$DEVICE
	echo ""
	echo ""
	echo "SSID: $SSID"

	nmcli d wifi rescan
	nmcli d wifi list
	nmcli device wifi connect $SSID password $PASSWD

	echo ""
	TEST="$(ping google.com -w 1 | grep '1 packets transmitted')"

		if echo "$TEST" | grep "0%" ;then
   		echo ""
   		echo "Success! You have active internet connection."
		else
   		echo ""
   		echo "Oh! Something went wrong, you are not connected to the internet."
		fi

else
	echo "No supported wifi adapter found";
fi
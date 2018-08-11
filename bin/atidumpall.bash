#!/bin/bash
#exec 2>/dev/null

AMDN=$(sudo lshw -C display | grep AMD | wc -l)

sudo rm -rf /home/minerstat/minerstat-os/bin/bios
sudo mkdir /home/minerstat/minerstat-os/bin/bios
sudo chmod -R 777 /home/minerstat/minerstat-os/bin/bios

if [ "$AMDDEVICE" != 0 ]
then
	echo ""
	else
	echo "No AMD GPU's detected"
	exit 1
fi

for (( i=0; i < $AMDN; i++ )); do
	echo "--- Exporting GPU$i VBIOS ---"
	./atiflash -s $i "bios/"$i"_bios.rom"
done

sudo chmod -R 777 /home/minerstat/minerstat-os/bin/bios
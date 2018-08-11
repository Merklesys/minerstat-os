#!/bin/bash
#exec 2>/dev/null

AMDN=$(sudo lshw -C display | grep AMD | wc -l)
BIOS=$1
ARG2=$2
ARG3=$3
ARG4=$4

if [ "$AMDDEVICE" != 0 ]
then
	echo ""
	else
	echo "No AMD GPU's detected"
	exit 1
fi

if [ "$BIOS" != "" ]
then
	echo ""
else
	echo "Flash VBIOS to all AMD GPUs on the system"
	echo "Usage: mflashall bios.rom";
	exit 1
fi


for (( i=0; i < $AMDN; i++ )); do
	echo "--- Flashing GPU$i ---"
	./home/minerstat/minerstat-os/bin/atiflash -p $i $BIOS $ARGS2 $ARGS3 $ARGS4
done
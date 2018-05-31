#!/bin/bash
exec 2>/dev/null

if [ ! $1 ]; then
echo ""
echo "--- EXAMPLE ---"
echo "./overclock_nvidia a b c d"
echo "a = POWER LIMIT in Watts (Example: 120 = 120W) [ROOT REQUIRED]"
echo "b = GLOBAL FAN SPEED (100 = 100%)"
echo "c = Memory Offset"
echo "d = Core Offset"
echo ""
echo "-- Full Example --"
echo "./overclock_nvidia 120 80 1300 100"
echo ""
fi

if [ $1 ]; then
POWERLIMITINWATT=$1
FANSPEED=$2
MEMORYOFFSET=$3
COREOFFSET=$4

sudo nvidia-smi -pm 1
sudo nvidia-settings -c :0 -a GPUPowerMizerMode=1 | grep "Attribute"


# TESING PERFORMANCE LEVEL

QUERY="$(sudo nvidia-settings -c :0 -a [gpu:0]/GPUMemoryTransferRateOffset[3]=100)"

if echo "$QUERY" | grep "Attri" ;then
PLEVEL=3
else
PLEVEL=2
fi

sleep 1


if [ "$POWERLIMITINWATT" -ne 0 ]
then
if [ "$POWERLIMITINWATT" != "skip" ]
then
sudo nvidia-smi -pl $POWERLIMITINWATT | grep 'Power'
fi
fi

if [ "$FANSPEED" != "skip" ]
then
sudo nvidia-settings -c :0 -a 'GPUFanControlState=1' -a 'GPUTargetFanSpeed='"$FANSPEED"'' | grep 'Attribute'
fi

if [ "$MEMORYOFFSET" != "skip" ]
then
sudo nvidia-settings -c :0 -a 'GPUMemoryTransferRateOffset['"$PLEVEL"']='"$MEMORYOFFSET"'' | grep 'Attribute'
fi

if [ "$COREOFFSET" != "skip" ]
then
sudo nvidia-settings -c :0 -a 'GPUGraphicsClockOffset['"$PLEVEL"']='"$COREOFFSET"'' | grep 'Attribute'
fi


sleep 2
sudo chvt 1

fi

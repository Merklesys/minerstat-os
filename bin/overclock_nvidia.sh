#!/bin/bash
exec 2>/dev/null

if [ ! $1 ]; then
echo ""
echo "--- EXAMPLE ---"
echo "./overclock_nvidia a b c d e"
echo "a = GPUID"
echo "b = POWER LIMIT in Watts (Example: 120 = 120W) [ROOT REQUIRED]"
echo "c = GLOBAL FAN SPEED (100 = 100%)"
echo "d = Memory Offset"
echo "e = Core Offset"
echo ""
echo "-- Full Example --"
echo "./overclock_nvidia 0 120 80 1300 100"
echo ""
fi

if [ $1 ]; then
GPUID=$1
POWERLIMITINWATT=$2
FANSPEED=$3
MEMORYOFFSET=$4
COREOFFSET=$5

# TESING PERFORMANCE LEVEL

QUERY="$(sudo nvidia-settings -c :0 -a [gpu:"$GPUID"]/GPUMemoryTransferRateOffset[3]=100)"

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
sudo nvidia-smi -i $GPUID -pl $POWERLIMITINWATT
fi
fi

if [ "$FANSPEED" != "skip" ]
then
sudo nvidia-settings -c :0 -a '[gpu:'"$GPUID"']/GPUFanControlState=1' -a '[fan:"$GPUID"]/GPUTargetFanSpeed='"$FANSPEED"'';
fi

if [ "$MEMORYOFFSET" != "skip" ]
then
sudo nvidia-settings -c :0 -a '[gpu:'"$GPUID"']/GPUMemoryTransferRateOffset['"$PLEVEL"']='"$MEMORYOFFSET"''
fi

if [ "$COREOFFSET" != "skip" ]
then
sudo nvidia-settings -c :0 -a '[gpu:'"$GPUID"']/GPUGraphicsClockOffset['"$PLEVEL"']='"$COREOFFSET"''
fi

sleep 2
sudo chvt 1

fi

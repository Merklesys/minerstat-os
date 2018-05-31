#!/bin/bash
exec 2>/dev/null

if [ ! $1 ]; then
echo ""
echo "--- EXAMPLE ---"
echo "./overclock_amd a b c d e"
echo "a = GPUID"
echo "b = Memory Clock"
echo "c = Core Clock"
echo "d = Fan Speed"
echo ""
echo "-- Full Example --"
echo "./overclock_amd 0 1750 1100 80 1.11"
echo ""
fi

if [ $1 ]; then
GPUID=$1
MEMCLOCK=$2
CORECLOCK=$3
FANSPEED=$4
VDDC=$5

if [ "$CORECLOCK" != "skip" ]
then
sudo ./amdcovc coreclk:$GPUID=$CORECLOCK | grep "Setting core clock"
sleep 0.5
sudo ./amdcovc ccoreclk:$GPUID=$CORECLOCK | grep "Setting current core"
fi

if [ "$MEMCLOCK" != "skip" ]
then
sudo ./amdcovc memclk:$GPUID=$MEMCLOCK | grep "Setting memory clock"
sleep 0.5
sudo ./amdcovc cmemclk:$GPUID=$MEMCLOCK | grep "Setting current memory"
fi

if [ "$FANSPEED" != "skip" ]
then
sudo ./ohgodatool -i $GPUID --set-fanspeed $FANSPEED
sudo ./amdcovc fanspeed:$GPUID=$FANSPEED | grep "Setting"
fi

sleep 2
sudo chvt 1

fi
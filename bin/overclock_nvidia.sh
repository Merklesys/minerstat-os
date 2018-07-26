#!/bin/bash
exec 2>/dev/null

if [ ! $1 ]; then
	echo ""
	echo "--- EXAMPLE ---"
	echo "./overclock_nvidia 1 2 3 4 5"
	echo "1 = GPUID"
	echo "2 = POWER LIMIT in Watts (Example: 120 = 120W) [ROOT REQUIRED]"
	echo "3 = GLOBAL FAN SPEED (100 = 100%)"
	echo "4 = Memory Offset"
	echo "5 = Core Offset"
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

## BULIDING QUERIES
STR1=""
STR2=""
STR3=""
STR4="-c :0"

# TESING PERFORMANCE LEVEL

QUERY="$(sudo nvidia-settings -c :0 -a [gpu:"$GPUID"]/GPUMemoryTransferRateOffset[3]=100)"
#sudo nvidia-settings -c :0 -a GPUPowerMizerMode=1 | grep "Attribute"

if echo "$QUERY" | grep "Attri" ;then
	PLEVEL=3
else
	PLEVEL=2
fi

echo "--- DETECTED PERFORMANCE LEVEL: $PLEVEL ---";

#################################£
# POWER LIMIT

if [ "$POWERLIMITINWATT" -ne 0 ]
then
	if [ "$POWERLIMITINWATT" != "skip" ]
	then
		sudo nvidia-smi -i $GPUID -pl $POWERLIMITINWATT
	fi
fi

#################################£
# FAN SPEED

if [ "$FANSPEED" != "0" ]
then
	echo "--- MANUAL GPU FAN MOD. ---"
else
	echo "--- AUTO GPU FAN SPEED (by Drivers) ---"
	STR1="-a [gpu:$GPUID]/GPUFanControlState=0"
fi

if [ "$FANSPEED" != "skip" ]
then
	STR1="-a [gpu:$GPUID]/GPUFanControlState=1 -a [fan:"$GPUID"]/GPUTargetFanSpeed="$FANSPEED""
fi

#################################£
# CLOCKS

if [ "$MEMORYOFFSET" != "skip" ]
then
  if [ "$MEMORYOFFSET" != "0" ]
  then
  	STR2="-a [gpu:"$GPUID"]/GPUMemoryTransferRateOffset["$PLEVEL"]="$MEMORYOFFSET""
  fi
fi

if [ "$COREOFFSET" != "skip" ]
then
  if [ "$COREOFFSET" != "0" ]
  then
	STR3="-a [gpu:"$GPUID"]/GPUGraphicsClockOffset["$PLEVEL"]="$COREOFFSET""
  fi
fi


#################################£
# APPLY THIS GPU SETTINGS AT ONCE
FINISH="$(sudo nvidia-settings $STR1 $STR2 $STR3 $STR4)"
echo $FINISH


fi
#!/bin/bash
exec 2>/dev/null

if [ ! $1 ]; then
echo ""
echo "--- BIOS OVERWRITE EXAMPLE ---"
echo "./overclock_amd a b c d e"
echo "a = GPUID"
echo "b = Memory Clock"
echo "c = Core Clock"
echo "d = Fan Speed"
echo "e = VDDC"
echo ""
echo "-- Full Example --"
echo "./bios_amd 0 2100 1180 90 800"
echo ""
fi

if [ $1 ]; then
GPUID=$1
MEMCLOCK=$2
CORECLOCK=$3
FANSPEED=$4
VDDC=$5
CHECKV=$(sudo ./ohgodatool -i $GPUID --show-mem)

if [ "$VDDC" != "skip" ]
then	
	for voltstate in {1..15}; do
		sudo ./ohgodatool -i $GPUID --volt-state $voltstate --vddc-table-set $VDDC
	done
	SUM=$(expr "$VDDC" + 25)
	for memstate in {1..2}; do
		if echo "$CHECKV" | grep "Memory state 3" ;then
			sudo ./ohgodatool -i $GPUID --mem-state 3 --vddci $SUM
		else
			sudo ./ohgodatool -i $GPUID --mem-state $memstate --vddci $SUM
		fi
	done
fi

sleep 2

if [ "$MEMCLOCK" != "skip" ]
then
	if [ "$CORECLOCK" != "skip" ]
	then
		echo "Setting up CoreStates and MemClocks GPU$gpuid"
		for corestate in {4..7}; do
		if echo "$CHECKV" | grep "Memory state 3" ;then
			sudo ./ohgodatool -i $GPUID --core-state $corestate --core-clock $CORECLOCK --mem-state 3 --mem-clock $MEMCLOCK
		else
			if echo "$CHECKV" | grep "Memory state 2" ;then
				sudo ./ohgodatool -i $GPUID --core-state $corestate --core-clock $CORECLOCK --mem-state 2 --mem-clock $MEMCLOCK
			else
				sudo ./ohgodatool -i $GPUID --core-state $corestate --core-clock $CORECLOCK --mem-state 1 --mem-clock $MEMCLOCK
			fi
		fi
		done
		echo manual > /sys/class/drm/card$GPUID/device/power_dpm_force_performance_level
		echo 4 > /sys/class/drm/card$GPUID/device/pp_dpm_sclk
		sleep 2
		sudo ./amdcovc coreclk:$GPUID=$CORECLOCK | grep "Setting core clock"
		sleep 0.5
		sudo ./amdcovc ccoreclk:$GPUID=$CORECLOCK | grep "Setting current core"
		sudo ./amdcovc memclk:$GPUID=$MEMCLOCK | grep "Setting memory clock"
		sleep 0.5
		sudo ./amdcovc cmemclk:$GPUID=$MEMCLOCK | grep "Setting current memory"
	fi
fi

if [ "$FANSPEED" != "skip" ]
then
	sudo ./ohgodatool -i $GPUID --set-fanspeed $FANSPEED
	sudo ./amdcovc fanspeed:$GPUID=$FANSPEED | grep "Setting"
fi

# SHOW NEW CLOCKS
echo "NEW CLOCKS"
echo "These changes requires computer reboot! (mreboot)"
echo ""

sudo ./ohgodatool -i $GPUID  --show-mem

sleep 2
sudo chvt 1

fi

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
	echo "e = VDDC"
	echo ""
	echo "-- Full Example --"
	echo "./overclock_amd 0 1750 1100 80 1.11"
	echo ""
fi

if [ $1 ]; then

	# VARIBLES
	GPUID=$1
	MEMCLOCK=$2
	CORECLOCK=$3
	FANSPEED=$4
	VDDC=$5
	
	MEMSTATES="2"
	
	CHECKMEM=$(sudo ./ohgodatool -i $GPUID --show-mem)
  	if echo "$CHECKMEM" | grep "Memory state 1:" ;then
	MEMSTATES="1"
	fi
	
	CHECKMEMA=$(sudo ./ohgodatool -i $GPUID --show-mem)
  	if echo "$CHECKMEMA" | grep "Memory state 2:" ;then
	MEMSTATES="2"
	fi
	
	echo "FOUND MEMORY STATE: $MEMSTATES"
		
	if [ "$VDDC" != "skip" ]  
	then
		if [ "$VDDC" != "0" ]  
		then
			# set all voltage states from 1 upwards to xxx mV:
			for gpuid in $GPUID; do 
			echo "Setting up VDDC Voltage GPU$gpuid"

		if [ "$MEMSTATES" != "2" ]  
		then
			echo "MEMSTATE NOT Equals to 2";
			for voltstate in 0 8 9 10; do  
			sudo ./ohgodatool -i $gpuid --volt-state $voltstate --vddc-table-set $VDDC 
			done
		else
			echo "MEMSTATE Equals to 2";
			for voltstate in 1 2 3 4 5 6 7 8 9 10 11 12 13 14; do  
			sudo ./ohgodatool -i $gpuid --volt-state $voltstate --vddc-table-set $VDDC 
			done
		fi
			done
  
			# VDDCI Voltages 
			# VDDC Voltage + 50
			VDDCI=$(expr "$VDDC" + 50)  
			for gpuid in $GPUID; do 
			echo "Setting up VDDC Voltage GPU$gpuid" 
			for memstate in 1 2; do 
			sudo ./ohgodatool -i $gpuid --mem-state $memstate --vddci $VDDCI  
			done
			done 
			fi
	fi


# Tables Edited: OK!
# Now set the clocks as default

	if [ "$CORECLOCK" != "skip" ]
	then
		if [ "$MEMCLOCK" != "skip" ]
		then
			if [ "$CORECLOCK" != "0" ]
			then
				if [ "$MEMCLOCK" != "0" ]
				then
		# Set new clocks for bios 
		for gpuid in $GPUID; do 
		echo "Setting up CoreStates and MemClocks GPU$gpuid"
	if [ "$MEMSTATES" != "2" ]  
	then
		echo "MEMSTATE NOT Equals to 2";
		for corestate in 7; do
			sudo ./ohgodatool -i $gpuid --core-state $corestate --core-clock $CORECLOCK --mem-state $MEMSTATES --mem-clock $MEMCLOCK --set-fanspeed 70		
		done
	else
		echo "MEMSTATE Equals to 2";
		for corestate in 4 5 6 7; do
		sudo ./ohgodatool -i $gpuid --core-state $corestate --core-clock $CORECLOCK --mem-state $MEMSTATES --mem-clock $MEMCLOCK --set-fanspeed 70		
		done
	fi
		echo manual > /sys/class/drm/card$gpuid/device/power_dpm_force_performance_level 
		echo 4 > /sys/class/drm/card$gpuid/device/pp_dpm_sclk  
		done
		# Core Clock
		sudo ./amdcovc coreclk:$GPUID=$CORECLOCK | grep "Setting core clock"
		sleep 0.3
		sudo ./amdcovc ccoreclk:$GPUID=$CORECLOCK | grep "Setting current core"
		# Memory Clock
		sudo ./amdcovc memclk:$GPUID=$MEMCLOCK | grep "Setting memory clock"
		sleep 0.3
		sudo ./amdcovc cmemclk:$GPUID=$MEMCLOCK | grep "Setting current memory"
		sleep 0.2
		# Fan speed protection if not set
		sudo ./ohgodatool -i $GPUID --set-fanspeed 70
		fi
	fi
	fi
	fi
	
	if [ "$FANSPEED" != "skip" ]
	then
		sudo ./ohgodatool -i $GPUID --set-fanspeed $FANSPEED
		sudo ./amdcovc fanspeed:$GPUID=$FANSPEED | grep "Setting"
	fi
	
fi

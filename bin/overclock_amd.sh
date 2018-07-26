#!/bin/bash
exec 2>/dev/null

if [ ! $1 ]; then
	echo ""
	echo "--- EXAMPLE ---"
	echo "./overclock_amd 1 2 3 4 5 6"
	echo "1 = GPUID"
	echo "2 = Memory Clock"
	echo "3 = Core Clock"
	echo "4 = Fan Speed"
	echo "5 = VDDC"
	echo "6 = VDDCI"
	echo ""
	echo "-- Full Example --"
	echo "./overclock_amd 0 2100 1140 80 850 900"
	echo ""
fi

if [ $1 ]; then

	#################################£
	# Declare
	GPUID=$1
	MEMCLOCK=$2
	CORECLOCK=$3
	FANSPEED=$4
	VDDC=$5
	VDDCI=$6
	# MDDC is not implemented due not effect much Polaris gpu's and..
	# really stable around 1000mV 
	MDDC=$7
	
	#################################£
	# Overwrite PowerPlay to manual
	echo manual > /sys/class/drm/card$GPUID/device/power_dpm_force_performance_level 
	
	## BULIDING QUERIES
	STR1="";
	STR2="";
	
	if [ "$FANSPEED" != "skip" ]
	then
		STR1="--set-fanspeed $FANSPEED";
		STR2="fanspeed:$GPUID=$FANSPEED";
	fi
	
	## Detect memory state's
	MEMSTATES="2"
	
	CHECKMEM=$(sudo ./ohgodatool -i $GPUID --show-mem)
  	if echo "$CHECKMEM" | grep "Memory state 1:" ;then
		MEMSTATES="1"
	fi
	
	CHECKMEMA=$(sudo ./ohgodatool -i $GPUID --show-mem)
  	if echo "$CHECKMEMA" | grep "Memory state 2:" ;then
		MEMSTATES="2"
	fi
	
	echo $MEMSTATES > /sys/class/drm/card$GPUID/device/pp_dpm_mclk
	
	echo "--- FOUND MEMORY STATE: $MEMSTATES ---"
		
	if [ "$VDDC" != "skip" ]  
	then
		if [ "$VDDC" != "0" ]  
		then
			# set all voltage states from 1 upwards to xxx mV:
			for gpuid in $GPUID; do 
			echo "--- Setting up VDDC Voltage GPU$gpuid ---"

		if [ "$MEMSTATES" != "2" ]  
		then
			echo "MEMSTATE NOT Equals to 2";
			for voltstate in 0 8 9 10; do  
			sudo ./ohgodatool -i $gpuid --volt-state $voltstate --vddc-table-set $VDDC 
			done
		else
			echo "MEMSTATE Equals to 2";
			for voltstate in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do  
			sudo ./ohgodatool -i $gpuid --volt-state $voltstate --vddc-table-set $VDDC 
			done
		fi
			done
 		 
		 if [ "$VDDCI" != "" ]  
		 then
		 if [ "$VDDCI" != "0" ]  
		 then
		 if [ "$VDDCI" != "skip" ]  
		 then
			# VDDCI Voltages 
			# VDDC Voltage + 50
			for gpuid in $GPUID; do 
			echo "--- Setting up VDDCI Voltage GPU$gpuid ---" 
			for memstate in 1 2; do 
				sudo ./ohgodatool -i $gpuid --mem-state $memstate --vddci $VDDCI  
			done
			done
			fi
		      fi
		      else
		      if [ "$VDDCI" != "skip" ]  
		      then
		      VDDCI=$(expr "$VDDC" + 50)
		      for memstate in 1 2; do 
		      	 	sudo ./ohgodatool -i $GPUID --mem-state $memstate --vddci $VDDCI  
		      done
		      fi
		   fi
		fi
	fi


#################################£
# SET MEMORY @ CORE CLOCKS

	if [ "$CORECLOCK" != "skip" ]
	then
		if [ "$MEMCLOCK" != "skip" ]
		then
			if [ "$CORECLOCK" != "0" ]
			then
				if [ "$MEMCLOCK" != "0" ]
				then
		# Set new clocks in tables
		for gpuid in $GPUID; do 
		echo "--- Setting up CoreStates and MemClocks GPU$gpuid ---"
	if [ "$MEMSTATES" != "2" ]  
	then
		echo "-- MEMSTATE NOT Equals to 2 --";
		echo 7 > /sys/class/drm/card$gpuid/device/pp_dpm_sclk
		echo "- CORESTATE has been set to: 7 -"
		for corestate in 7; do
			sudo ./ohgodatool -i $gpuid --core-state $corestate --core-clock $CORECLOCK --mem-state $MEMSTATES --mem-clock $MEMCLOCK $STR1
		done
	else
		echo "-- MEMSTATE Equals to 2 --";
		echo 5 > /sys/class/drm/card$gpuid/device/pp_dpm_sclk
	    echo "- CORESTATE has been set to: 5 -"
		for corestate in 4 5 6 7; do
		sudo ./ohgodatool -i $gpuid --core-state $corestate --core-clock $CORECLOCK --mem-state $MEMSTATES --mem-clock $MEMCLOCK $STR1
		done
	fi
		done

		#################################£
		# Apply Changes
		sudo ./amdcovc memclk:$GPUID=$MEMCLOCK cmemclk:$GPUID=$MEMCLOCK coreclk:$GPUID=$CORECLOCK ccoreclk:$GPUID=$CORECLOCK $STR2 | grep "Setting"
		fi
	fi
	fi
	fi
	
	
fi

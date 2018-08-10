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
		
	## BULIDING QUERIES
	STR1="";
	STR2="";
	STR3="";
	STR4="";
	STR5="";
	STR6="";
	
	if [ "$FANSPEED" != "skip" ]
	then
		STR1="--set-fanspeed $FANSPEED";
		STR2="fanspeed:$GPUID=$FANSPEED";
	fi
	
	## Detect state's
	MEMSTATES=$(sudo ./ohgodatool -i $GPUID --show-mem  | grep -E "Memory state ([0-9]+):" | tail -n 1 | sed -r 's/.*([0-9]+).*/\1/')
	CORESTATE=$(sudo ./ohgodatool -i $GPUID --show-core | grep -E "DPM state ([0-9]+):"    | tail -n 1 | sed -r 's/.*([0-9]+).*/\1/')
	
	
	echo "--- FOUND MEMORY STATE: $MEMSTATES ---"
		
	if [ "$VDDC" != "skip" ]  
	then
		if [ "$VDDC" != "0" ]  
		then
			# set all voltage states from 1 upwards to xxx mV:
			echo "--- Setting up VDDC Voltage GPU$gpuid ---"
			
			if [ "$MEMSTATES" != "2" ]  
			then
				for voltstate in 0 8 9 10; do  
				sudo ./ohgodatool -i $GPUID --volt-state $voltstate --vddc-table-set $VDDC 
				done
			else
				for voltstate in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do  
				sudo ./ohgodatool -i $GPUID --volt-state $voltstate --vddc-table-set $VDDC 
				done
			fi
			
		fi
	
	
	 if [ "$VDDCI" != "" ]  
	 then
	 if [ "$VDDCI" != "0" ]  
	 then
	 if [ "$VDDCI" != "skip" ]  
	 then
		# VDDCI Voltages 
		# VDDC Voltage + 50
			echo "--- Setting up VDDCI Voltage GPU$gpuid ---" 
			sudo ./ohgodatool -i $GPUID --mem-state $MEMSTATES --vddci $VDDCI  
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
	
		# APPLY AT THE END
		STR4="cmemclk:$GPUID=$MEMCLOCK"
		STR5="coreclk:$GPUID=$CORECLOCK"
		
		# Set new clocks in tables
		echo "--- Setting up CoreStates and MemClocks GPU$gpuid ---"
		echo "-- MEMSTATE Equals to $MEMSTATES --";
	  	echo "- CORESTATE has been set to: $CORESTATE -"
	  		if [ "$MEMSTATES" != "2" ]  
			then
					for corestate in 5 7; do
						sudo ./ohgodatool -i $GPUID --core-state $corestate --core-clock $CORECLOCK --mem-state $MEMSTATES --mem-clock $MEMCLOCK $STR1
					done
			else
				for corestate in 3 4 5 6 7; do
				if [ "$corestate" != "$CORESTATE" ] 
				then
					sudo ./ohgodatool -i $GPUID --core-state $corestate --core-clock $CORECLOCK --mem-state $MEMSTATES --mem-clock $MEMCLOCK
				else
					sudo ./ohgodatool -i $GPUID --core-state $corestate --core-clock $CORECLOCK --mem-state $MEMSTATES --mem-clock $MEMCLOCK $STR1
				fi
				done
			fi
	   
	#################################£
	# Overwrite PowerPlay to manual
	sudo echo "manual" > /sys/class/drm/card$GPUID/device/power_dpm_force_performance_level 
	sudo echo $CORESTATE > /sys/class/drm/card$GPUID/device/pp_dpm_sclk
	sudo echo $MEMSTATES > /sys/class/drm/card$GPUID/device/pp_dpm_mclk 
	
	 fi
	 fi
	 fi
	 fi
	
		#################################£
		# Apply Changes
		#sudo ./amdcovc memclk:$GPUID=$MEMCLOCK cmemclk:$GPUID=$MEMCLOCK coreclk:$GPUID=$CORECLOCK ccoreclk:$GPUID=$CORECLOCK $STR2 | grep "Setting"
		sudo ./amdcovc $STR4 $STR5 $STR2 | grep "Setting"
		
		##################################
		# CURRENT_Clock Protection
		sudo ./amdcovc ccoreclk:$GPUID=$CORECLOCK memclk:$GPUID=$MEMCLOCK | grep "Setting"
fi

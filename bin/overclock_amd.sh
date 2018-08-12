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
	OHGOD1="";
	OHGOD2="";
	OHGOD3="";
	OHGOD4="";
	
	if [ "$FANSPEED" != "skip" ]
	then
		STR1="--set-fanspeed $FANSPEED";
		STR2="fanspeed:$GPUID=$FANSPEED";
	fi
	
	## Detect state's
	maxMemState=$(sudo ./ohgodatool -i $GPUID --show-mem  | grep -E "Memory state ([0-9]+):" | tail -n 1 | sed -r 's/.*([0-9]+).*/\1/' | sed 's/[^0-9]*//g')
	maxCoreState=$(sudo ./ohgodatool -i $GPUID --show-core | grep -E "DPM state ([0-9]+):"    | tail -n 1 | sed -r 's/.*([0-9]+).*/\1/' | sed 's/[^0-9]*//g')
	currentCoreState=$(sudo su -c "cat /sys/class/drm/card$GPUID/device/pp_dpm_sclk | grep '*' | cut -f1 -d':' | sed -r 's/.*([0-9]+).*/\1/' | sed 's/[^0-9]*//g'")
	#currentCoreState=5

	
	## If $currentCoreState equals zero (undefined)
	## Use maxCoreState BUT IF ZERO means idle use the same
	 
	if [ -z $currentCoreState ]; then
		echo "ERROR: No Current Core State found for GPU$GPUID"
		currentCoreState=5
	fi
	
	if [ "$currentCoreState" != 0 ]
	then
		echo ""
	else
   		echo "WARN: GPU$GPUID was idle, using default states (5) (Idle)"
		currentCoreState=5
   	fi
   	
	## Memstate just for protection
	if [ -z $maxMemState ]; then
		echo "ERROR: No Current Mem State found for GPU$GPUID"
		$maxMemState = 1; # 1 is exist on RX400 & RX500 too.
	fi

	
	# CURRENT Volt State for Undervolt
	voltStateLine=$(($currentCoreState + 1))
	currentVoltState=$(sudo ./ohgodatool -i $GPUID --show-core | grep -E "VDDC:" | sed -n $voltStateLine"p" | sed 's/^.*entry/entry/' | sed 's/[^0-9]*//g')
		
	#echo "DEBUG: C $currentCoreState / VL $voltStateLine / CVS $currentVoltState"
	echo ""
		
	if [ "$VDDC" != "skip" ]  
	then
		if [ "$VDDC" != "0" ]  
		then
			echo "--- Setting up VDDC Voltage GPU$GPUID (VS: $currentVoltState) ---"
			# set all voltage states from 1 upwards to xxx mV:
			for voltstate in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do  
				sudo ./ohgodatool -i $GPUID --volt-state $voltstate --vddc-table-set $VDDC 
			done
			# currentVoltState for protection
			sudo ./ohgodatool -i $GPUID --volt-state $currentVoltState --vddc-table-set $VDDC | grep "-" | cut -f1 -d"Usage"			
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
				echo ""
				echo "--- Setting up VDDCI Voltage GPU$GPUID ---" 
				sudo ./ohgodatool -i $GPUID --mem-state $maxMemState --vddci $VDDCI | grep "-" | cut -f1 -d"Usage"
	 fi
	 fi
	 fi
	
	#################################£
	# SET MEMORY @ CORE CLOCKS

	if [ "$CORECLOCK" != "skip" ] 
	then	
	if [ "$CORECLOCK" != "0" ] 
	then
		# APPLY AT THE END
		STR5="coreclk:$GPUID=$CORECLOCK"
	  	OHGOD1=" --core-state $currentCoreState --core-clock $CORECLOCK"
	 fi
	 fi

	
	 if [ "$MEMCLOCK" != "skip" ] 
	 then
	 if [ "$MEMCLOCK" != "0" ] 
	 then
	 	# APPLY AT THE END
		STR4="cmemclk:$GPUID=$MEMCLOCK"
		OHGOD2=" --mem-state $maxMemState --mem-clock $MEMCLOCK"
	 fi
	 fi
	 
	 #################################£
	 # PROTECT FANS, JUST IN CASE
	 if [ "$FANSPEED" != 0 ]
	 then
		OHGOD3=" --set-fanspeed $FANSPEED"
	 else
	 	OHGOD3=" --set-fanspeed 70"
	 fi

	
	#################################£
	# Apply Changes
	#sudo ./amdcovc memclk:$GPUID=$MEMCLOCK cmemclk:$GPUID=$MEMCLOCK coreclk:$GPUID=$CORECLOCK ccoreclk:$GPUID=$CORECLOCK $STR2 | grep "Setting"
	#################################£
	# Overwrite PowerPlay to manual
	echo ""
	echo "--- APPLY CURRENT_CLOCKS ---"
	echo "- SET | GPU$GPUID Performance level: manual -"
	echo "- SET | GPU$GPUID DPM state: $currentCoreState -"
	echo "- SET | GPU$GPUID MEM state: $maxMemState -"
	sudo ./ohgodatool -i $GPUID $OHGOD1 $OHGOD2 $OHGOD3 | grep "-" | cut -f1 -d"Usage"
	
	sudo su -c "echo 'manual' > /sys/class/drm/card$GPUID/device/power_dpm_force_performance_level"
	sudo su -c "echo $currentCoreState > /sys/class/drm/card$GPUID/device/pp_dpm_sclk"
	sudo su -c "echo $maxMemState > /sys/class/drm/card$GPUID/device/pp_dpm_mclk"
	echo ""
	echo "NOTICE: If below is empty try to use a 'Supported clock or flash your gpu bios' "
	echo ""	
	sleep 0.2
	sudo ./amdcovc $STR4 $STR5 $STR2 | grep "Setting"
		
	##################################
	# CURRENT_Clock Protection
	sudo ./amdcovc memclk:$GPUID=$MEMCLOCK | grep "Setting"
	sudo ./amdcovc ccoreclk:$GPUID=$CORECLOCK | grep "Setting"

fi

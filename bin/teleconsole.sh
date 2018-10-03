#!/bin/sh
#exec 2>/dev/null

RESTARTEVERY=3600
CURRENTSYNC=0

echo "*-*-* Teleconsole *-*-*"

forcekill() {
PID=$(pidof teleproxy)
sudo kill -9 $PID
}

check()
{
	echo "-- Checking health on Teleconsole --"
	CURRENTSYNC=$(($CURRENTSYNC + 35))
	if [ "$CURRENTSYNC" -gt "$RESTARTEVERY" ]; then
		echo "Timeout, Restarting Teleconsole";
    	CURRENTSYNC=0
    	forcekill
    	sudo killall teleproxy
    	sudo rm /home/minerstat/minerstat-os/bin/teleproxy.0
    	start
	fi
	# Basic health check
	SEARCH=$(cat teleproxy.0 | grep "SSH tunnel cannot be established" | wc -L)
	if [ "$SEARCH" -gt 0 ]; then
		echo "Seems teleconsole crashed"
		forcekill
		sudo killall teleproxy
    	sudo rm /home/minerstat/minerstat-os/bin/teleproxy.0
    	start
	fi
}

start()
{
	echo "-- Starting Teleconsole --"
	cd /home/minerstat/minerstat-os/bin/
	sudo rm /home/minerstat/minerstat-os/bin/teleproxy.0
	screen -L -Logfile teleproxy.0 -A -m -d -S teleproxy ./teleproxy -f gravitational.com:80
	sleep 15
	TELEID=$(cat teleproxy.0 | grep WebUI | rev | cut -d ' ' -f 1 | rev | xargs)
	echo $TELEID
}

# Start loop
while true
do 
	if screen -list | grep -q "teleproxy";
	then
		check
	else
   		start
	fi
	sleep 35
done
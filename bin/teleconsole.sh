#!/bin/sh
#exec 2>/dev/null

sudo echo -n "" > /home/minerstat/minerstat-os/bin/teleproxy.0

RESTARTEVERY=3600
CURRENTSYNC=0

echo "*-*-* Teleconsole *-*-*"

run() {
screen -L -Logfile teleproxy.0 -A -m -d -S teleproxy ./teleproxy -f gravitational.com:80
}


start()
{
	echo "-- Starting Teleconsole --"
	cd /home/minerstat/minerstat-os/bin/
	sudo echo -n "" > /home/minerstat/minerstat-os/bin/teleproxy.0
	run
}

forcekill() {
	sudo echo -n "" > /home/minerstat/minerstat-os/bin/teleproxy.0
	sudo killall teleproxy
	sleep 0.5
	sudo killall teleproxy
	sleep 0.8
	sudo killall teleproxy
	sleep 5
	start
}

check()
{
	echo "-- Checking health on Teleconsole --"
	CURRENTSYNC=$(($CURRENTSYNC + 30))
	if [ "$CURRENTSYNC" -gt "$RESTARTEVERY" ]; then
		echo "Timeout, Restarting Teleconsole";
    	CURRENTSYNC=0
    	forcekill
    	sudo echo -n "" > /home/minerstat/minerstat-os/bin/teleproxy.0
    	#start
	fi
	# Basic health check
	SEARCH=$(cat teleproxy.0 | grep "SSH tunnel cannot be established" | wc -L)
	if [ "$SEARCH" -gt 0 ]; then
		echo "Seems teleconsole crashed"
		forcekill
    	sudo echo -n "" > /home/minerstat/minerstat-os/bin/teleproxy.0
    	#start
	fi
	# Over
	CRASH=$(cat teleproxy.0 | grep "You have ended your session" | wc -L)
	if [ "$CRASH" -gt 0 ]; then
		echo "Seems teleconsole crashed"
		forcekill
    	sudo echo -n "" > /home/minerstat/minerstat-os/bin/teleproxy.0
    	#start
	fi
	# File size empty
	CHARS=$(cat teleproxy.0 | wc -L)
	if [ "$CHARS" -lt 70 ]; then
	forcekill	
	fi
	
}

# Start with APP
forcekill


# Start loop
while true
do 
	sleep 30
	TELEID=$(cat /home/minerstat/minerstat-os/bin/teleproxy.0 | grep WebUI | rev | cut -d ' ' -f 1 | rev | xargs)
	echo "TeleID: "$TELEID
	check
done
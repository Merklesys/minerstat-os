if ! screen -list | grep -q "dummy"; then

screen -A -m -d -S dummy sleep 22176000
screen -A -m -d -S listener sudo sh /home/minerstat/minerstat-os/core/init.sh

sudo find /var/log -type f -delete

cd /home/minerstat/shellinabox
./shellinaboxd --port 4200 -b

NETBOT="$(cat /media/storage/network.txt | grep 'EVERYBOOT=' | tail -n 1 | sed 's/EVERYBOOT=//g')"
SSID=$(cat /media/storage/network.txt | grep 'WIFISSID="' | sed 's/WIFISSID="//g' | sed 's/"//g')

NVIDIA="$(nvidia-smi -L)"

if [ ! -z "$NVIDIA" ]; then

if echo "$NVIDIA" | grep -iq "^GPU 0:" ;then

sudo chmod 777 /home/minerstat/minerstat-os/bin/OhGodAnETHlargementPill-r2
screen -A -m -d -S ethboost sudo /home/minerstat/minerstat-os/bin/OhGodAnETHlargementPill-r2

fi
fi

echo ""
echo "-------- INITIALIZING FAKE DUMMY PLUG -------------"
echo "Please wait.."
sleep 1
sudo service dgm stop
sleep 3
screen -A -m -d -S display sudo X
echo ""

echo " "
echo "-------- CONFIGURE NETWORK ADAPTERS --------------"

if [ "$SSID" != "" ]
then

	cd /home/minerstat/minerstat-os/core
	sudo sh wifi.sh

else

	if [ "$NETBOT" != "NO" ]
	then
		cd /home/minerstat/minerstat-os/bin
		sudo sh dhcp.sh
	else
		echo "If you don't have connection set EVERYBOOT=YES parameter on the USB."
	fi

fi

sleep 1

echo " "
echo "-------- WAITING FOR CONNECTION -----------------"
echo ""

while ! sudo ping minerstat.com -w 1 | grep "0%"; do
sleep 1
done

echo ""
echo "-------- AUTO UPDATE MINERSTAT ------------------"
echo ""
cd /home/minerstat/minerstat-os
sudo sh git.sh
echo ""
sudo chmod -R 777 /home/minerstat/minerstat-os/*

echo " "
echo "-------- OVERCLOCKING ---------------------------"
cd /home/minerstat/minerstat-os/bin
sudo sh overclock.sh

echo " "
echo "-------- RUNNING JOBS ---------------------------"
cd /home/minerstat/minerstat-os/bin
sudo sh jobs.sh
echo ""

sleep 1
sudo chvt 1

cd /media/storage/distro
sudo sh expand.sh

echo " "
echo "-------- INITALIZING MINERSTAT CLIENT -----------"
cd /home/minerstat/minerstat-os
screen -A -m -d -S minerstat-console sh /home/minerstat/minerstat-os/start.sh;
echo ""
echo "Minerstat has been started in the background.."
echo "Waiting for console output.."
sleep 5
sudo chvt 1
sleep 9
screen -x minerstat-console
sleep 1
exec bash
source ~/.bashrc
fi
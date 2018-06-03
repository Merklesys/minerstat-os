if ! screen -list | grep -q "dummy"; then

screen -A -m -d -S dummy sleep 86400

sudo echo "boot" > /home/minerstat/minerstat-os/bin/random.txt
sudo find /var/log -type f -delete

NETBOT="$(cat /media/storage/network.txt | grep 'DHCP=' | tail -n 1 | sed 's/DHCP=//g')"

echo ""
echo "-------- INSTALLING FAKE DUMMY PLUG ------------"
echo "Please wait.."
sleep 1
sudo update-grub
sudo nvidia-xconfig -a --allow-empty-initial-configuration --cool-bits=28 --use-display-device="DFP-0" --connected-monitor="DFP-0" --enable-all-gpus
sudo service gdm stop
#screen -A -m -d -S display sudo X
sleep 10
sudo chvt 1
echo ""

#echo "-------- OVERCLOCKING ---------------------------"
#cd /home/minerstat/minerstat-os/bin
#sudo sh overclock.sh

echo " "
echo "-------- AUTO CONFIGURE NETWORK ADAPTERS --------"
if [ "$NETBOT" != "NO" ]
then
cd /home/minerstat/minerstat-os/bin
sudo sh dhcp.sh
else
echo "If you don't have connection set DHCP=YES parameter on the USB."
fi

sleep 2

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

echo "-------- RUNNING JOBS ---------------------------"
cd /home/minerstat/minerstat-os/bin
sudo sh jobs.sh
echo ""

cd /media/storage/distro
sudo sh expand.sh

echo "-------- REBOOT IN 3 SEC -----------"
sleep 2
sudo reboot -f
fi

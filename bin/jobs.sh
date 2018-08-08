#!/bin/bash
exec 2>/dev/null
echo "Running Clean jobs.."
find '/home/minerstat/minerstat-os' -name "*log.txt" -type f -delete
echo "Log files deleted"
sudo dmesg -n 1
sudo apt clean
# Fix Slow start bug
sudo systemctl disable NetworkManager-wait-online.service
# Nvidia PCI_BUS_ID
sudo rm /etc/environment
sudo cp /home/minerstat/minerstat-os/core/environment /etc/environment
export CUDA_DEVICE_ORDER=PCI_BUS_ID
# libc-ares2
sudo apt-get install libc-ares2

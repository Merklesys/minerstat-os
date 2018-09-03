#!/bin/bash

echo ""
echo "=== UPDATING MSOS FOR VEGA 56/64 ==="
echo ""
echo "--- Ctrl + C to abort it. ---"

sleep 3

# STOP MINING AND STUFF
sudo killall screen
killall screen
killall node
sleep 5
sudo chvt 1

# DEPENDENCIES
cd /tmp
sudo apt-get install git flex bison libssl-dev cmake libelf-dev libpci-dev pkg-config libjansson4 -y

# NEW KERNEL
git --git-dir=/dev/null clone --depth=1 https://github.com/coinscrow/linux-kernel-amdgpu-binaries
cd linux-kernel-amdgpu-binaries
sudo dpkg -i linux-headers*ubuntu*.deb linux-image*ubuntu*.deb firmware-radeon-ucode_*_all.deb

#  ROCT-Thunk-Interface
cd /tmp
git clone --depth 1 https://github.com/coinscrow/ROCT-Thunk-Interface -b fxkamd/drm-next-wip
cd ROCT-Thunk-Interface
mkdir -p build
cd build
cmake ..
make
sudo cp -a /opt/rocm/libhsakmt/lib/ /opt/rocm/libhsakmt/lib.bak
sudo cp libhsakmt.so* /opt/rocm/libhsakmt/lib

# UPDATE BOOTLOADER (GRUB)
cd /home/minerstat/minerstat-os/update
sudo chmod 777 /etc/grub.d/10_linux
sudo rm /etc/grub.d/10_linux
sudo cp vega_grub 10_linux
sudo cp 10_linux /etc/grub.d
sudo chmod 777 /etc/grub.d/10_linux
sync
#sudo update-initramfs -u
sudo update-grub2



sleep 3

echo ""

echo "You need to reboot to apply changes."
echo""

echo "=== REBOOTING ==="
echo "--- Ctrl + C to abort it. ---"

sleep 5

sudo shutdown -r now
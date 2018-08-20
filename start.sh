#! /usr/bin/bash

sync; echo 1 > /proc/sys/vm/drop_caches
screen -A -m -d -S fakescreen sh /home/minerstat/minerstat-os/bin/fakescreen.sh

sh launcher.sh

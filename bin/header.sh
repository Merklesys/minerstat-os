#! /usr/bin/bash

while true; do
	output=$(neofetch)
	sleep 0.5;
	if ps ax | grep -v grep | grep node > /dev/null; then
	clear
	echo
	echo
	echo
	echo
	echo
	echo
	echo "$output"
    sleep 0.5
    else
    exit
    fi
done
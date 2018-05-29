#! /usr/bin/bash

exec 2> /home/minerstat/debug.txt
git config --global user.email "dump@minerstat.com"
git config --global user.name "minerstat"
RESPONSE = "$(git pull --no-edit)"

echo "$RESPONSE"

sleep 1

if grep -q "merge" /home/minerstat/debug.txt;
then

sleep 2

sudo git commit - a - m "Init"
sudo git merge --no - edit
sudo git add * -f
sudo git commit - a - m "Fix done"

fi

sudo rm /home/minerstat/debug.txt
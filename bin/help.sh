#!/bin/bash
BLUE='\e[38;5;69m'
NC='\e[0;37m'
END='\e[0m'
echo "${BLUE}=============== msOS commands ==============="
echo ""
echo "${BLUE}miner${NC}\t\tShow mining client screen"
echo "${BLUE}mstart${NC}\t\t(Re)start mining"
echo "${BLUE}mstop${NC}\t\tStop mining"
echo "${BLUE}mrecovery${NC}\tRestore system to default"
echo "${BLUE}mupdate${NC}\t\tUpdate system (clients, fixes, ...)"
echo "${BLUE}mreconf${NC}\t\tSimulate first boot: configure DHCP, creating fake dummy"
echo "${BLUE}mclock${NC}\t\tFetch OC from the dashboard"
echo "${BLUE}mreboot${NC}\t\tReboot the rig"
echo "${BLUE}mshutdown${NC}\tShut down the rig"
echo "${BLUE}mfind${NC}\t\tFind GPU (e.g. mfind 0 - will set fans to 0% except GPU0 for 5 seconds)"
echo "${BLUE}mlang${NC}\t\tSet keyboard layout (e.g. mlang de)"
echo "${END}"

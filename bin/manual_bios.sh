core_clock=1145
mem_clocks=(2160 2160 2160 2160 2160 2160)
# set core/mem states from DPM state 4 upwards to $core_clock and values from mem_clocks()
for gpuid in ${!mem_clocks[*]}; do
echo "Setting up CoreStates and MemClocks GPU$gpuid"
for corestate in 4 5 6 7; do
sudo ./ohgodatool -i $gpuid --core-state $corestate --core-clock $core_clock --mem-state 2 --mem-clock ${mem_clocks[$gpuid]}
done
echo manual > /sys/class/drm/card$gpuid/device/power_dpm_force_performance_level
echo 4 > /sys/class/drm/card$gpuid/device/pp_dpm_sclk
done


vddc_voltages=(900 900 900 900 900 900)
# set all voltage states from 1 upwards to xxx mV:
for gpuid in ${!vddc_voltages[*]}; do
echo "Setting up VDDC Voltage GPU$gpuid"
for voltstate in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
sudo ./ohgodatool -i $gpuid --volt-state $voltstate --vddc-table-set ${vddc_voltages[$gpuid]}
done
done



vddci_voltages=(950 950 950 950 950 950)
for gpuid in ${!vddci_voltages[*]}; do
echo "Setting up VDDC Voltage GPU$gpuid"
for memstate in 1 2; do
sudo ./ohgodatool -i $gpuid --mem-state $memstate --vddci ${vddci_voltages[$gpuid]}
done
done

pid_websersocket=$(pgrep -f "websersocket_296b976f-8e94-46e4-8f64-11963ba02ea9.js")
watch -n 1 ps -p $pid_websersocket -o pid,etime,%cpu,%mem,cmd
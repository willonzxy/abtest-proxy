const os = require('os');
module.exports = {
    getLocalIP(){
        let ip = '';
        return ip ? ip : (function(){
            try {
                const osType = os.type(); //系统类型
                const netInfo = os.networkInterfaces(); //网络信息
                if (osType === 'Windows_NT') {
                    for (let dev in netInfo) {
                        if (dev.includes('本地连接')){
                            for (let j = 0; j < netInfo[dev].length; j++) {
                                if (netInfo[dev][j].family === 'IPv4') {
                                    ip = netInfo[dev][j].address;
                                    break;
                                }
                            }
                        }
                    }
    
                } else if (osType === 'Linux') {
                    ip = netInfo.eth0[0].address;
                }
            } catch (error) {
                
            }
            return ip;
        })()
    }
}

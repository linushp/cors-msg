const TinyBus = require('tinybus');

const SCRIPT_FROM_REQ = "cors-msg-req";
const SCRIPT_FROM_RES = "cors-msg-res";

class CorsMsg {
    constructor() {
        this.uniqueIndex = 1;
        this.bus = new TinyBus();
        window.addEventListener("message", this.handleMessage)
    }

    /**
     * 私有函数，生成uniqueId
     * @returns {string}
     */
    uniqueId = (prefix) => {
        return prefix + "" + location.host + "_" + Date.now() + "_" + (this.uniqueIndex++);
    };

    /**
     * 私有函数
     * @param evt
     */
    handleMessage = (evt) => {
        const evtData = evt.data || {};
        const {scriptName, scriptId, scriptFrom} = evtData;

        if (scriptName && scriptId && scriptFrom) {

            if (scriptFrom === SCRIPT_FROM_REQ) { //请求
                this.bus.emit(scriptName, evtData, evt);
            }

            if (scriptFrom === SCRIPT_FROM_RES) { //响应
                const resScriptId = 'res_' + scriptId;
                this.bus.emit(resScriptId, evtData, evt);
            }
        }
    };


    /**
     * 指定要接受那种类型的脚本消息
     * @param scriptName 必填，脚本名称
     * @param executor 可选参数。自定义的脚本执行器，可以根据业务自己实现
     * @param targetOrigin 可选参数
     */
    acceptCorsScript = (scriptName, executor = null, targetOrigin = "*") => {
        this.bus.off(scriptName);
        this.bus.on(scriptName, async ({scriptName, scriptId, scriptString}, evt) => {
            let error = null;
            let result = null;

            try {
                if (executor) {
                    result = await executor({scriptName, scriptId, scriptString, evt});
                } else {
                    let function1 = new Function(scriptString);
                    function1();
                }
            } catch (e) {
                console.log('onScript', e);
                error = {name: e.name, stack: e.stack, str: e.toString(),}
            }

            window.postMessage({
                scriptName: scriptName,
                scriptId: scriptId,
                scriptString: scriptString,
                scriptFrom: SCRIPT_FROM_RES,
                scriptResult: result,
                scriptError: error,
            }, targetOrigin);
        });
    };


    /**
     * 取消跨站脚本的执行
     * @param scriptName
     */
    rejectCorsScript = (scriptName) => {
        this.bus.off(scriptName);
    };


    /**
     * 发送可以跨域执行的脚本
     * @param scriptName 必填。脚本名称
     * @param scriptString 可以为空。 一段JS脚本用于在其他页面中执行
     * @param targetOrigin 可以为空。
     * @param timeout 可以为空，默认10秒
     * @returns {Promise}
     */
    sendCorsScript = async ({scriptName, scriptString, targetOrigin = "*", timeout = 10000}) => {
        return new Promise((resolve, reject) => {

            const scriptId = this.uniqueId(scriptName);
            const resScriptId = 'res_' + scriptId;

            //响应超时
            const timeHandler = setTimeout(() => {
                this.bus.off(resScriptId);
                reject({name: 'timeout'});
            }, timeout);

            this.bus.on(resScriptId, ({scriptResult, scriptError}, evt) => {
                this.bus.off(resScriptId);
                clearTimeout(timeHandler);

                if (scriptError) {
                    reject(scriptError);
                } else {
                    resolve(scriptResult);
                }

            });


            window.postMessage({
                scriptName,
                scriptId,
                scriptString,
                scriptFrom: SCRIPT_FROM_REQ
            }, targetOrigin);

        });
    }
}


/**
 * 强单例，无论重复引入多少次，只有一个对象实例
 * @returns {CorsMsg}
 */
function makeUniqueInstance() {
    if (!window.corsMsg) {
        window.corsMsg = new CorsMsg();
    }
    return window.corsMsg;
}

const corsMsg = makeUniqueInstance();

module.exports = corsMsg;

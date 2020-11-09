# 跨域 iframe父子页面之间通信

实现了父子页面之间类似 request / response 的通信方式。


### 例子一 
 
 iframe 子页面请求从父业面中获取用户信息

```javascript


/**
 * iframe 子页面。请求从父业面中获取用户信息
 * @returns {Promise<void>}
 */
async function demo_sender() {
    let userInfo = await corsMsg.sendCorsScript({
        scriptName:'GET_USER_INFO'
    });

    console.log(userInfo)
}


/**
 * iframe 父页面. 响应子页面的请求返回数据
 * @returns {Promise<void>}
 */

corsMsg.acceptCorsScript('GET_USER_INFO', async function () {
        //如果是异步结果，返回Promise对象。
        return {username:'zhangsan',age:3223}
})



```



### 例子二 


iframe 子页面直接在父业面中执行脚本


```javascript

/**
 * iframe 子页面。直接在父业面中执行脚本
 * @returns {Promise<void>}
 */
async function demo2_sender() {
    await corsMsg.sendCorsScript({
        scriptName:'SET_USER_INFO',
        scriptString:`window.currentUserInfo=${JSON.stringify({username:'李四',age:18})}` //这段代码实际上在父业面执行
    });
}


/**
 * iframe 父页面. 允许子页面执行SET_USER_INFO脚本
 * @returns {Promise<void>}
 */
corsMsg.acceptCorsScript('SET_USER_INFO');

```


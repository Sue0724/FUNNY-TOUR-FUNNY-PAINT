// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto'); // 引入 crypto 模块

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
}));
app.use(bodyParser.json());

const APP_ID = 'wx26ed5d6638671f30';
const APP_SECRET = '0ed454be9048f8a777be7ec79e2b3e14';

// 用户登录接口
app.post('/api/login', async (req, res) => {

  const { code } = req.body;
  if (!code) {
    return res.status(400).send('Code is missing');
  }
  console.log("接收到前端的登录请求！");
  try {
    const response = await axios.get(`https://api.weixin.qq.com/sns/jscode2session`, {
      params: {
        appid: APP_ID,
        secret: APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid, session_key } = response.data;
    res.json({ openid, session_key });
  } catch (error) {
    console.error(error);
    res.status(500).send('服务器错误');
  }
});

// 解密用户信息接口
app.post('/api/decrypt', (req, res) => {
  const { encryptedData, iv, sessionKey } = req.body;
  if (!encryptedData || !iv || !sessionKey) {
    return res.status(400).send('缺少参数');
  }
  console.log("接收到前端的解密请求！");
  // 解密逻辑
  const appId = APP_ID;
  const pc = new WXBizDataCrypt(appId, sessionKey);
  const data = pc.decryptData(encryptedData, iv);

  if (data.errCode) {
    return res.status(400).send(data.errMsg);
  }

  res.json(data);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，监听端口 ${PORT}`);
});

// WXBizDataCrypt 类用于解密数据
class WXBizDataCrypt {
  constructor(appId, sessionKey) {
    this.appId = appId;
    this.sessionKey = sessionKey;
  }

  decryptData(encryptedData, iv) {
    // Base64 decode
    const sessionKeyBuffer = Buffer.from(this.sessionKey, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');

    let decoded;
    try {
      // AES解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer);
      decoded = Buffer.concat([decipher.update(encryptedDataBuffer), decipher.final()]);
    } catch (err) {
      throw new Error('Illegal buffer');
    }

    // Convert buffer to utf8 string
    decoded = decoded.toString();

    try {
      decoded = JSON.parse(decoded);
    } catch (err) {
      throw new Error('JSON parse error');
    }

    if (decoded.watermark.appid !== this.appId) {
      throw new Error('Illegal appid');
    }
    
    return decoded;
  }
}

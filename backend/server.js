// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// 替换为你的微信小程序的 appid 和 secret
const APP_ID = 'your_app_id';
const APP_SECRET = 'your_app_secret';

// 用户登录接口
app.post('/api/login', async (req, res) => {
  const { code } = req.body; // 从请求中获取 code
  if (!code) {
    return res.status(400).send('Code is missing');
  }
  
  // 将 code 发给微信服务器，获取 openId, sessionKey 等信息
  try {
    // 请求微信 API 获取 openid 和 session_key
    const response = await axios.get(`https://api.weixin.qq.com/sns/jscode2session`, {
      params: {
        appid: APP_ID,
        secret: APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid, session_key } = response.data;

    // 这里可以添加数据库操作，将用户信息与 openid 关联
    // const userInfo = await findOrCreateUser(openid);

    res.json({ openid, session_key }); // 返回用户信息
  } catch (error) {
    console.error(error);
    res.status(500).send('服务器错误');
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，监听端口 ${PORT}`);
});

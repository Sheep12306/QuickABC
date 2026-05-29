# 阿里云服务器部署指南

## 前置信息

| 项目 | 值 |
|------|-----|
| 微信小程序 AppID | `wx437eadbea15cf0b2` |
| 项目目录 | `/opt/vocab-server` |
| 后端端口 | `3000` |

---

## 第 1 步：SSH 登录阿里云 ECS

```bash
ssh root@你的服务器公网IP
```

---

## 第 2 步：安装 MySQL 8.0

```bash
# CentOS/RHEL
yum install -y mysql-server
systemctl start mysqld
systemctl enable mysqld

# Ubuntu/Debian
apt update && apt install -y mysql-server
systemctl start mysql
systemctl enable mysql
```

**获取临时密码并修改:**
```bash
# CentOS 首次启动有临时密码
grep 'temporary password' /var/log/mysqld.log

# 登录
mysql -u root -p

# 修改 root 密码（在 MySQL 内执行）
ALTER USER 'root'@'localhost' IDENTIFIED BY '你的强密码';
FLUSH PRIVILEGES;
```

---

## 第 3 步：创建数据库

把项目里的 `init.sql` 上传到服务器，然后执行：

```bash
# 在服务器上
mysql -u root -p < init.sql
```

---

## 第 4 步：安装 Node.js 18+

```bash
# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 验证
node -v   # 应输出 v18.x.x
npm -v    # 应输出 9.x.x
```

---

## 第 5 步：安装 PM2

```bash
npm install -g pm2
```

---

## 第 6 步：上传项目到服务器

**在你的本地电脑上执行**（把 `<服务器IP>` 替换为你的阿里云公网 IP）：

```bash
# 打包项目（排除 node_modules）
cd C:\Users\alex\WeChatProjects\miniprogram-1
zip -r vocab-server.zip vocab-server -x "vocab-server/node_modules/*"

# 上传到服务器
scp vocab-server.zip root@<服务器IP>:/opt/
```

**在服务器上解压并安装依赖：**

```bash
cd /opt
unzip vocab-server.zip
cd vocab-server
npm install --production
```

---

## 第 7 步：配置环境变量

```bash
cd /opt/vocab-server
nano .env
```

修改以下值：

```
DB_PASSWORD=你的MySQL密码          # 第 2 步设置的密码
JWT_SECRET=随机生成一个64位字符串    # 用 openssl rand -hex 32 生成

# 这两个去微信公众平台获取（见下方说明）
WECHAT_APP_ID=wx437eadbea15cf0b2
WECHAT_APP_SECRET=你的小程序AppSecret
```

**获取 AppSecret 的路径：**
登录 [mp.weixin.qq.com](https://mp.weixin.qq.com) → 开发 → 开发管理 → 开发设置 → AppSecret（需要管理员扫码）

---

## 第 8 步：创建日志目录并启动

```bash
mkdir -p /var/log/vocab-server

# 首次启动（自动建表）
cd /opt/vocab-server
DB_SYNC_ALTER=true pm2 start ecosystem.config.js

# 查看日志确认启动成功
pm2 logs vocab-server --lines 30
```

看到以下输出说明成功：
```
Database connected.
Models synced.
Server running on port 3000 [production]
```

确认成功后，后续重启用 `pm2 restart vocab-server`（不需要再设 `DB_SYNC_ALTER=true`）。

保存 PM2 进程列表（服务器重启后自动恢复）：
```bash
pm2 save
pm2 startup   # 按屏幕提示执行命令
```

---

## 第 9 步：配置 Nginx + SSL

```bash
# 安装 Nginx
yum install -y nginx   # 或 apt install -y nginx

# 安装 certbot（Let's Encrypt 免费 SSL）
yum install -y certbot python3-certbot-nginx   # CentOS
# 或: apt install -y certbot python3-certbot-nginx  # Ubuntu

# 申请 SSL 证书（把 your-domain.com 替换为你的真实域名）
certbot --nginx -d your-domain.com
```

把项目里的 `nginx.conf` 内容复制到：
```bash
nano /etc/nginx/conf.d/vocab-server.conf
```

**必须修改 nginx.conf 中的两处 `your-domain.com` 为你的真实域名。**

```bash
# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
systemctl enable nginx
```

---

## 第 10 步：配置微信小程序后台

1. 登录 [mp.weixin.qq.com](https://mp.weixin.qq.com)
2. 开发 → 开发管理 → 开发设置 → 服务器域名
3. 在 **request 合法域名** 中添加你的 API 域名：`https://你的域名.com`
4. 保存

**注意：** 微信要求域名必须已备案且使用 HTTPS。新域名备案通常需要 1-3 周，这段时间可以用微信开发者工具的「不校验合法域名」选项进行开发测试。

---

## 第 11 步：修改前端 API 地址

编辑 `miniprogram/utils/api.js`，把第一行的 `API_BASE` 改为你的真实地址：

```javascript
const API_BASE = 'https://你的域名.com/api';
```

---

## 第 12 步：验证

1. 打开微信开发者工具
2. 勾选「不校验合法域名」（如果域名备案还未完成）
3. 测试完整流程：登录 → 选择单词书 → 学习 → 保存进度 → 复习 → 错词本

---

## 常用运维命令

```bash
pm2 status              # 查看进程状态
pm2 logs vocab-server   # 查看日志
pm2 restart vocab-server  # 重启
pm2 stop vocab-server   # 停止

mysql -u root -p        # 登录数据库
USE vocab_app;
SHOW TABLES;
SELECT COUNT(*) FROM users;

nginx -t                # 测试 Nginx 配置
systemctl reload nginx  # 重载 Nginx
systemctl status nginx  # Nginx 状态
```

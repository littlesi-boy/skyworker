# 天工一号 - 打工人微信小程序

原生微信小程序 + 微信云开发实现，按 PRD 从零搭建。

## 功能范围

- 上工 tab：40 秒双数值平衡闯关、暂停/后台自动暂停、突发事件、10s/25s 自愿加班、三类免费道具、通关/失败/复活弹窗、晋升和皮肤奖励。
- 空间 tab：头像昵称宣言编辑、当前段位展示、每日打卡和自动打卡开关、我的皮肤、成长档案、历史对局、清空个人战绩。
- 云开发：`user_profiles` 保存本人档案，`events` 记录埋点。

## 使用方式

1. 用微信开发者工具打开本目录。
2. 在 `project.config.json` 中替换真实 `appid`。
3. 在 `app.js` 的 `globalData.envId` 填写云开发环境 ID。
4. 在开发者工具中创建云环境，部署 `cloudfunctions/login`、`cloudfunctions/syncUserData`、`cloudfunctions/trackEvent`。
5. 数据库集合建议创建：`user_profiles`、`events`，权限使用“仅创建者可读写”或云函数读写。

## 说明

- PRD 要求首次进入不立即授权，本实现仅在空间页填写头像昵称宣言时使用 `chooseAvatar` 与 `type="nickname"` 能力。
- 游客身份不能开始游戏，保存完整资料后解锁。
- 失败不扣积分不掉段，复活入口为用户主动点击；广告能力预留为埋点入口，接入真实激励广告时可在 `reviveByAd` 中补充 `RewardedVideoAd`。

const { RANKS, GAME, EVENTS, OVERTIME, INTERFERENCE, ITEMS, SKINS, FAILURE_TEXTS, CHECKIN_TEXTS } = require('./utils/config');
const { isProfileReady, loadProfile, saveProfile, trackEvent, randomFrom, randomItems, randomSkin, rankByScore, todayKey } = require('./utils/store');
const { CLOUD_ENV } = require('./utils/env');

if (wx.cloud) {
  wx.cloud.init({
    env: CLOUD_ENV,
    traceUser: true
  });
}

const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');
const system = wx.getSystemInfoSync();
const dpr = system.pixelRatio || 1;

canvas.width = system.windowWidth * dpr;
canvas.height = system.windowHeight * dpr;
ctx.scale(dpr, dpr);

const W = system.windowWidth;
const H = system.windowHeight;
const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
const safeTop = Math.max(92, menuButton ? menuButton.bottom + 18 : (system.safeArea ? system.safeArea.top + 58 : 92));

const state = {
  profile: loadProfile(),
  tab: 'work',
  status: 'idle',
  paused: false,
  timeLeft: GAME.duration,
  duration: GAME.duration,
  progress: GAME.initialProgress,
  mood: GAME.initialMood,
  moodCap: 100,
  currentRoundRanked: false,
  elapsed: 0,
  perfect: true,
  acceptedOvertimes: [],
  eventSchedule: [],
  bugBalls: [],
  needles: [],
  nextBugAt: INTERFERENCE.firstAt,
  nextNeedleAt: 12,
  triggeredOvertime: {},
  alertOverlay: null,
  modal: null,
  failOverlay: null,
  panel: null,
  rankTab: 'friends',
  rankings: {
    friends: [],
    all: []
  },
  touchStartX: 0,
  touchStartY: 0,
  touchStartPanel: null,
  profileAuthTried: false,
  userInfoButton: null,
  userInfoButtonKey: '',
  toolsExpanded: false,
  pressingTool: null,
  activePressButton: null,
  imageCache: {},
  toast: null,
  buttons: [],
  lastTick: Date.now()
};

function init() {
  state.profile = loadProfile();
  if (isProfileReady(state.profile) && state.profile.leaderboardEnabled && state.profile.autoCheckIn && state.profile.lastCheckInDate !== todayKey()) {
    performCheckIn(true);
  }
  wx.onTouchStart(handleTouch);
  wx.onTouchEnd(handleTouchEnd);
  wx.onTouchCancel(handleTouchEnd);
  wx.onHide(() => {
    if (state.status === 'running') state.paused = true;
  });
  setInterval(loop, 1000 / 30);
  trackEvent('game_open', {});
}

function loop() {
  const now = Date.now();
  if (state.status === 'running' && !state.paused && !state.modal && now - state.lastTick >= 1000) {
    stepGame();
    state.lastTick = now;
  }
  draw();
}

function tapFeedback() {
  if (state.profile.sfxEnabled === false) return;
  if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
  if (!wx.createInnerAudioContext) return;
  if (!state.tapAudio) {
    state.tapAudio = wx.createInnerAudioContext();
    state.tapAudio.src = 'assets/audio/click.wav';
    state.tapAudio.volume = 0.45;
  }
  state.tapAudio.stop();
  state.tapAudio.play();
}

function saveAuthorizedProfile(userInfo) {
  const profile = loadProfile();
  if (userInfo && userInfo.nickName) profile.nickname = userInfo.nickName;
  if (userInfo && userInfo.avatarUrl) profile.avatarUrl = userInfo.avatarUrl;
  if (!profile.motto) profile.motto = '稳住心态写代码';
  profile.completedProfile = isProfileReady(Object.assign({}, profile, { completedProfile: true }));
  state.profile = saveProfile(maybeGrantProfileReward(profile));
  return state.profile;
}

function maybeGrantProfileReward(profile) {
  const ready = isProfileReady(Object.assign({}, profile, { completedProfile: true }));
  if (!ready || profile.profileRewardClaimed) return profile;
  const rewards = randomItems(3);
  rewards.forEach((item) => {
    profile.items[item.id] = (profile.items[item.id] || 0) + 1;
  });
  profile.profileRewardClaimed = true;
  setTimeout(() => {
    state.modal = {
      type: 'profile_reward',
      title: '个人信息完善成功',
      copy: '欢迎转正入档，系统随机赠送 3 个随身道具。',
      rewards: rewards.map((item) => `${item.name} +1`)
    };
  }, 80);
  return profile;
}

function startGame() {
  state.profile = loadProfile();
  if (!state.profile.privacyAccepted) {
    requestPrivacyThenStart();
    return;
  }
  if (state.profile.privacyAccepted && !state.profile.friendAuth) {
    requestFriendAuthThenStart();
    return;
  }
  beginRound();
}

function beginRound() {
  state.profile = loadProfile();
  const rank = RANKS[state.profile.rankIndex];
  Object.assign(state, {
    status: 'running',
    paused: false,
    timeLeft: GAME.duration,
    duration: GAME.duration,
    progress: GAME.initialProgress,
    mood: GAME.initialMood,
    moodCap: 100,
    currentRoundRanked: !!state.profile.leaderboardEnabled,
    elapsed: 0,
    perfect: true,
    acceptedOvertimes: [],
    eventSchedule: createEventSchedule(rank.events, GAME.duration),
    bugBalls: [],
    needles: [],
    nextBugAt: INTERFERENCE.firstAt,
    nextNeedleAt: 12 + Math.floor(Math.random() * 6),
    triggeredOvertime: {},
    alertOverlay: null,
    modal: null,
    failOverlay: null,
    toast: null,
    lastTick: Date.now()
  });
  trackEvent('round_start', { rankIndex: state.profile.rankIndex, ranked: state.currentRoundRanked, guest: !isProfileReady(state.profile) });
}

function stepGame() {
  state.elapsed += 1;
  const rank = RANKS[state.profile.rankIndex];
  const overtimeDrain = state.acceptedOvertimes.reduce((sum, key) => {
    const item = OVERTIME[key];
    return {
      progress: sum.progress + item.progressDrain,
      mood: sum.mood + item.moodDrain
    };
  }, { progress: 0, mood: 0 });
  state.progress = clamp(state.progress - GAME.progressDrain - rank.drainBonus - overtimeDrain.progress);
  state.mood = clamp(state.mood - GAME.moodDrain - rank.drainBonus - overtimeDrain.mood, 0, state.moodCap);
  state.timeLeft = Math.max(state.duration - state.elapsed, 0);
  if (state.progress < GAME.perfectLine || state.mood < GAME.perfectLine) state.perfect = false;
  tryTriggerEvent();
  tryTriggerOvertime();
  stepInterference();
  if (state.progress <= 0 || state.mood <= 0) {
    finishRound(state.progress <= 0 ? 'progress' : 'mood');
    return;
  }
  if (state.timeLeft <= 0) finishRound();
}

function stepInterference() {
  const rankIndex = state.profile.rankIndex || 0;
  if (state.elapsed >= state.nextBugAt) {
    spawnBugBall(rankIndex);
    state.nextBugAt += Math.max(INTERFERENCE.minInterval, INTERFERENCE.baseInterval - Math.floor(rankIndex / 2));
  }
  if (state.elapsed >= state.nextNeedleAt && Math.random() < INTERFERENCE.needleDropChance) {
    spawnNeedle();
    state.nextNeedleAt = state.elapsed + 9 + Math.floor(Math.random() * 8);
  }
  const fallSpeed = INTERFERENCE.baseFallSpeed + rankIndex * INTERFERENCE.speedStep;
  state.bugBalls.forEach((bug) => {
    bug.y += fallSpeed;
    bug.age += 1;
    if (!bug.big && bug.age >= INTERFERENCE.growAfter) {
      bug.big = true;
      bug.radius = 16;
      state.mood = clamp(state.mood - INTERFERENCE.growMoodDamage, 0, state.moodCap);
      showAlert('BUG 变大了！', `心态指数 -${INTERFERENCE.growMoodDamage}，落入终端将造成更高损耗`);
    }
  });
  state.needles.forEach((needle) => {
    needle.y += 0.11;
  });
  state.bugBalls = state.bugBalls.filter((bug) => {
    if (bug.y < 1) return true;
    const progressDamage = bug.big ? INTERFERENCE.bigDamage : INTERFERENCE.smallDamage;
    const moodDamage = bug.big ? INTERFERENCE.bigMoodDamage : INTERFERENCE.smallMoodDamage;
    state.progress = clamp(state.progress - progressDamage);
    state.mood = clamp(state.mood - moodDamage, 0, state.moodCap);
    showAlert('BUG 击中开发终端！', `开发进度 -${progressDamage}，心态指数 -${moodDamage}`);
    return false;
  });
  state.needles = state.needles.filter((needle) => {
    if (needle.y < 1) return true;
    const profile = loadProfile();
    profile.items.needle = (profile.items.needle || 0) + 1;
    state.profile = saveProfile(profile);
    showAlert('获得破Bug针！', '可刺破正在下落的bug球');
    return false;
  });
}

function spawnBugBall(rankIndex) {
  state.mood = clamp(state.mood - INTERFERENCE.spawnMoodDamage, 0, state.moodCap);
  state.bugBalls.push({
    id: Date.now() + Math.random(),
    x: 0.22 + Math.random() * 0.56,
    y: -0.08,
    radius: 11 + Math.min(rankIndex, 5),
    big: false,
    age: 0
  });
  showAlert('BUG 球入侵！', `心态指数 -${INTERFERENCE.spawnMoodDamage}，使用破Bug针可刺破`);
}

function spawnNeedle() {
  state.needles.push({
    id: Date.now() + Math.random(),
    x: 0.18 + Math.random() * 0.64,
    y: -0.06
  });
  showAlert('破Bug针掉落！', '接住后使用次数 +1，可带入下一局');
}

function showAlert(title, copy) {
  state.alertOverlay = { title, copy, until: Date.now() + 1500 };
}

function tryTriggerEvent() {
  if (!state.eventSchedule.includes(state.elapsed)) return;
  const event = randomFrom(EVENTS);
  state.progress = clamp(state.progress + event.progress);
  state.mood = clamp(state.mood + event.mood, 0, state.moodCap);
  state.toast = `${event.title}：${event.desc}`;
  setTimeout(() => {
    state.toast = null;
  }, 1600);
}

function tryTriggerOvertime() {
  if (!GAME.overtimeAt.includes(state.timeLeft) || state.triggeredOvertime[state.timeLeft]) return;
  state.triggeredOvertime[state.timeLeft] = true;
  const type = state.profile.rankIndex >= 4 && state.timeLeft === 15 ? 'night' : 'normal';
  state.modal = Object.assign({ type, modalType: 'overtime' }, OVERTIME[type]);
  trackEvent('overtime_popup', { type });
}

function acceptOvertime() {
  if (!state.modal || state.modal.modalType !== 'overtime') return;
  const modal = state.modal;
  state.acceptedOvertimes.push(modal.type);
  const extras = createEventSchedule(modal.extraEvents, Math.max(state.timeLeft, 8));
  state.eventSchedule = state.eventSchedule.concat(extras.map((item) => state.elapsed + item));
  if (modal.moodCapDrop) {
    state.moodCap = Math.max(70, state.moodCap - modal.moodCapDrop);
    state.mood = Math.min(state.mood, state.moodCap);
  }
  state.modal = null;
  trackEvent('overtime_accept', { type: modal.type });
}

function rejectOvertime() {
  if (state.modal && state.modal.modalType === 'overtime') {
    trackEvent('overtime_reject', { type: state.modal.type });
    state.modal = null;
  }
}

function useItem(id) {
  if (state.status !== 'running') return;
  const profile = loadProfile();
  if (!profile.items[id]) {
    state.toast = '道具不足';
    return;
  }
  profile.items[id] -= 1;
  const hasOvertime = state.acceptedOvertimes.length > 0;
  if (id === 'time') {
    const add = hasOvertime ? 15 : 10;
    state.duration += add;
    state.timeLeft += add;
  }
  if (id === 'mood') state.mood = clamp(state.mood + (hasOvertime ? 65 : 50), 0, state.moodCap);
  if (id === 'progress') state.progress = clamp(state.progress + (hasOvertime ? 60 : 50));
  if (id === 'bean') {
    state.progress = clamp(state.progress + 8);
    state.mood = clamp(state.mood + 4, 0, state.moodCap);
    showAlert('效率豆生效！', '开发进度 +8，心态指数 +4');
  }
  if (id === 'mindstone') {
    state.mood = clamp(state.mood + 8, 0, state.moodCap);
    state.progress = clamp(state.progress + 4);
    showAlert('心态石生效！', '心态指数 +8，开发进度 +4');
  }
  if (id === 'needle') {
    const target = state.bugBalls.find((bug) => bug.y > -0.05 && bug.y < 1);
    if (!target) {
      profile.items[id] += 1;
      state.profile = saveProfile(profile);
      state.toast = '当前没有可刺破的bug球';
      return;
    }
    state.bugBalls = state.bugBalls.filter((bug) => bug.id !== target.id);
    showAlert('BUG 球已刺破！', '本次不会扣除开发进度');
  }
  state.profile = saveProfile(profile);
  trackEvent('item_use', { itemId: id });
}

function isChargeItem(id) {
  return id === 'bean' || id === 'mindstone';
}

function chargeItemLabel(id) {
  return id === 'mindstone' ? '心态石' : '效率豆';
}

function useChargedItem(id, charged) {
  if (state.status !== 'running') return;
  const profile = loadProfile();
  if (!profile.items[id]) {
    state.toast = `${chargeItemLabel(id)}不足`;
    return;
  }
  profile.items[id] -= 1;
  const primaryAdd = charged ? 15 : 8;
  const sideAdd = charged ? 8 : 4;
  if (id === 'bean') {
    state.progress = clamp(state.progress + primaryAdd);
    state.mood = clamp(state.mood + sideAdd, 0, state.moodCap);
  } else {
    state.mood = clamp(state.mood + primaryAdd, 0, state.moodCap);
    state.progress = clamp(state.progress + sideAdd);
  }
  state.profile = saveProfile(profile);
  showAlert(
    charged ? `${chargeItemLabel(id)}蓄力爆发！` : `${chargeItemLabel(id)}生效！`,
    id === 'bean'
      ? `开发进度 +${primaryAdd}，心态指数 +${sideAdd}`
      : `心态指数 +${primaryAdd}，开发进度 +${sideAdd}`
  );
  trackEvent('item_use', { itemId: id, charged });
}

function startToolCharge(id) {
  if (state.status !== 'running') {
    state.toast = `开局后才能使用${chargeItemLabel(id)}`;
    return;
  }
  if (!state.profile.items[id]) {
    state.toast = `${chargeItemLabel(id)}不足`;
    return;
  }
  state.pressingTool = {
    id,
    startedAt: Date.now()
  };
}

function releaseToolCharge(id) {
  if (!state.pressingTool || state.pressingTool.id !== id) return;
  const charged = Date.now() - state.pressingTool.startedAt >= 2000;
  state.pressingTool = null;
  useChargedItem(id, charged);
}

function finishRound(reason) {
  if (state.status !== 'running') return;
  const passed = state.progress > GAME.passLine && state.mood > GAME.passLine && state.timeLeft <= 0;
  if (passed) handleSuccess();
  else {
    state.status = 'ending';
    state.failOverlay = {
      reason: reason || 'timeout',
      title: reason === 'mood' ? '崩溃啦，心态指数归零！！' : reason === 'progress' ? '宕机啦，开发进度归零！！' : '本次职场闯关失利啦'
    };
    setTimeout(handleFailure, 900);
  }
}

function handleSuccess() {
  const profile = loadProfile();
  if (!state.currentRoundRanked) {
    state.modal = {
      type: 'success',
      title: '游客体验通关',
      copy: '本局未授权朋友关系，不计入排行榜和个人累计积分。',
      rewards: ['游客体验不结算正式奖励']
    };
    state.status = 'finished';
    trackEvent('round_success_guest', { rankIndex: profile.rankIndex });
    return;
  }
  const oldRankIndex = profile.rankIndex;
  const rank = RANKS[oldRankIndex];
  const perfect = state.perfect && state.progress >= GAME.perfectLine && state.mood >= GAME.perfectLine;
  const multiplier = state.acceptedOvertimes.reduce((value, type) => {
    const config = OVERTIME[type];
    return Math.max(value, perfect ? config.perfectMultiplier : config.normalMultiplier);
  }, 1);
  const gainedScore = Math.ceil((perfect ? rank.perfectScore : rank.normalScore) * multiplier);
  const rewardCount = Math.max(1, state.acceptedOvertimes.reduce((count, type) => count + OVERTIME[type].items, 0));
  const rewards = [`晋升积分 +${gainedScore}`];

  randomItems(rewardCount).forEach((item) => {
    profile.items[item.id] = (profile.items[item.id] || 0) + 1;
    rewards.push(`${item.name} +1`);
  });
  state.acceptedOvertimes.forEach((type) => {
    const skinId = OVERTIME[type].skinId;
    if (skinId && !profile.skins.includes(skinId)) {
      profile.skins.push(skinId);
      rewards.push('熬夜加班工位皮肤');
    }
  });
  profile.totalScore += gainedScore;
  profile.passCount += 1;
  profile.totalRounds += 1;
  profile.overtimeRounds += state.acceptedOvertimes.length ? 1 : 0;
  profile.overtimeCount += state.acceptedOvertimes.length;
  profile.overtimeSeconds += state.acceptedOvertimes.includes('night') ? 8 * 3600 : state.acceptedOvertimes.length * 2 * 3600;
  profile.perfectCount += perfect ? 1 : 0;
  profile.rankIndex = rankByScore(profile.totalScore);
  profile.highestRankIndex = Math.max(profile.highestRankIndex, profile.rankIndex);
  if (profile.rankIndex > oldRankIndex && profile.rankIndex >= 1) {
    const skin = randomSkin(profile.rankIndex);
    if (skin && !profile.skins.includes(skin.id)) {
      profile.skins.push(skin.id);
      rewards.push(`${skin.rarity}皮肤：${skin.name}`);
    }
  }
  profile.records.unshift({
    id: `${Date.now()}`,
    time: state.duration - state.timeLeft,
    overtime: state.acceptedOvertimes.join(',') || '无',
    result: '通关',
    perfect,
    rewards: rewards.join('、'),
    createdAt: Date.now()
  });
  state.profile = saveProfile(profile);
  state.modal = {
    type: 'success',
    title: profile.rankIndex > oldRankIndex ? '晋升成功' : '本局顺利通关',
    copy: profile.rankIndex > oldRankIndex ? `当前${RANKS[oldRankIndex].title}晋升到${RANKS[profile.rankIndex].title}` : `双线守住，晋升积分 +${gainedScore}`,
    rewards
  };
  state.status = 'finished';
  trackEvent('round_success', { rankIndex: profile.rankIndex, gainedScore, perfect });
}

function handleFailure() {
  const profile = loadProfile();
  if (!state.currentRoundRanked) {
    state.modal = {
      type: 'fail',
      title: '游客体验结束',
      copy: randomFrom(FAILURE_TEXTS),
      rewards: []
    };
    state.failOverlay = null;
    state.status = 'finished';
    trackEvent('round_fail_guest', { rankIndex: profile.rankIndex });
    return;
  }
  profile.failCount += 1;
  profile.totalRounds += 1;
  profile.records.unshift({
    id: `${Date.now()}`,
    time: state.duration - state.timeLeft,
    overtime: state.acceptedOvertimes.join(',') || '无',
    result: '失败',
    perfect: false,
    rewards: '无',
    createdAt: Date.now()
  });
  state.profile = saveProfile(profile);
  state.modal = {
    type: 'fail',
    title: '本次职场闯关失利啦',
    copy: randomFrom(FAILURE_TEXTS),
    rewards: []
  };
  state.failOverlay = null;
  state.status = 'finished';
  trackEvent('round_fail', { rankIndex: profile.rankIndex });
}

function performCheckIn(auto) {
  const profile = loadProfile();
  if (!isProfileReady(profile) || !profile.leaderboardEnabled) {
    if (!auto) showAlert('游客暂不可打卡', '完善资料并开启排行榜后可参与打卡奖励');
    return;
  }
  const today = todayKey();
  if (profile.lastCheckInDate === today) {
    showAlert('今日已打卡', auto ? '自动打卡已完成，明天再来领取奖励' : '今日奖励已领取，不可重复打卡');
    return;
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = `${yesterday.getFullYear()}-${`${yesterday.getMonth() + 1}`.padStart(2, '0')}-${`${yesterday.getDate()}`.padStart(2, '0')}`;
  profile.checkInStreak = profile.lastCheckInDate === yKey ? profile.checkInStreak + 1 : 1;
  profile.checkInCount += 1;
  profile.lastCheckInDate = today;
  const checkInItem = randomFrom(ITEMS);
  profile.items[checkInItem.id] = (profile.items[checkInItem.id] || 0) + 1;
  const rewards = [`${checkInItem.name} +1`];
  state.profile = saveProfile(profile);
  showAlert(auto ? '自动打卡成功！' : '手动打卡成功！', `${randomFrom(CHECKIN_TEXTS)}｜${rewards.join('、')}`);
  trackEvent('check_in', { auto, streak: profile.checkInStreak });
}

function requestPrivacyThenStart() {
  if (!wx.requirePrivacyAuthorize) {
    const profile = loadProfile();
    profile.privacyAccepted = true;
    state.profile = saveProfile(profile);
    requestFriendAuthThenStart();
    return;
  }
  wx.requirePrivacyAuthorize({
    success() {
      const profile = loadProfile();
      profile.privacyAccepted = true;
      state.profile = saveProfile(profile);
      requestFriendAuthThenStart();
    },
    fail() {
      const profile = loadProfile();
      profile.privacyAccepted = false;
      profile.friendAuth = false;
      profile.leaderboardEnabled = false;
      state.profile = saveProfile(profile);
      showToast('游客模式体验，本局不计入排行榜');
      beginRound();
    }
  });
}

function requestFriendAuthThenStart() {
  if (!wx.authorize) {
    beginRound();
    return;
  }
  wx.authorize({
    scope: 'scope.WxFriendInteraction',
    success() {
      const profile = loadProfile();
      profile.friendAuth = true;
      profile.leaderboardEnabled = true;
      state.profile = saveProfile(profile);
      showToast('已开启排行榜记录');
      beginRound();
    },
    fail() {
      const profile = loadProfile();
      profile.friendAuth = false;
      profile.leaderboardEnabled = false;
      state.profile = saveProfile(profile);
      showToast('游客模式体验，本局不计入排行榜');
      beginRound();
    }
  });
}

function showToast(text, duration = 1800) {
  state.toast = {
    text,
    until: Date.now() + duration
  };
}

function openProfileInfo() {
  state.profile = loadProfile();
  state.panel = 'settings';
}

function authorizeWechatProfile(done) {
  if (!wx.getUserProfile) {
    showToast('请进入个人信息页完善资料');
    if (typeof done === 'function') done();
    return;
  }
  wx.getUserProfile({
    desc: '用于回填天工一号个人信息',
    success(res) {
      saveAuthorizedProfile(res.userInfo || {});
      state.toast = isProfileReady(state.profile) ? '已回填微信资料' : '请继续完善个人信息';
      trackEvent('profile_auth', {});
      if (typeof done === 'function') done();
    },
    fail() {
      showToast('请进行微信个人信息授权后开始');
      if (typeof done === 'function') done();
    }
  });
}

function editNickname() {
  wx.showModal({
    title: '修改昵称',
    editable: true,
    placeholderText: '输入昵称',
    content: state.profile.nickname === '游客身份' ? '' : state.profile.nickname,
    success(res) {
      if (!res.confirm) return;
      const value = (res.content || '').trim();
      if (!value) {
        state.toast = '昵称不能为空';
        return;
      }
      const profile = loadProfile();
      profile.nickname = value.slice(0, 12);
      profile.completedProfile = isProfileReady(Object.assign({}, profile, { completedProfile: true }));
      state.profile = saveProfile(maybeGrantProfileReward(profile));
      if (!state.modal) state.toast = '昵称已更新';
    }
  });
}

function chooseLocalAvatar() {
  const saveAvatar = (path) => {
    if (!path) {
      showToast('未选择头像');
      return;
    }
    const profile = loadProfile();
    profile.avatarUrl = path;
    profile.completedProfile = isProfileReady(Object.assign({}, profile, { completedProfile: true }));
    state.profile = saveProfile(maybeGrantProfileReward(profile));
    if (!state.modal) showToast('头像已更新');
  };
  const isCancel = (err) => /cancel|取消/i.test((err && (err.errMsg || err.message)) || '');
  const showChooseFail = (err) => {
    showToast(isCancel(err) ? '未选择头像' : `头像选择失败：${(err && err.errMsg) || '请检查相册权限'}`);
  };
  const chooseByMedia = (sourceType) => {
    if (!wx.chooseMedia) return false;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType,
      success(res) {
        const file = res.tempFiles && res.tempFiles[0];
        saveAvatar(file && file.tempFilePath);
      },
      fail(err) {
        showChooseFail(err);
      }
    });
    return true;
  };
  const chooseByImage = (sourceType) => {
    if (!wx.chooseImage) return false;
    wx.chooseImage({
      count: 1,
      sourceType,
      success(res) {
        saveAvatar(res.tempFilePaths && res.tempFilePaths[0]);
      },
      fail(err) {
        if (isCancel(err) || !chooseByMedia(sourceType)) showChooseFail(err);
      }
    });
    return true;
  };
  wx.showActionSheet({
    itemList: ['从相册选择', '拍照上传'],
    success(res) {
      const sourceType = [res.tapIndex === 0 ? 'album' : 'camera'];
      if (!chooseByImage(sourceType) && !chooseByMedia(sourceType)) {
        showToast('当前版本暂不支持头像选择');
      }
    },
    fail(err) {
      if (isCancel(err)) showToast('未选择头像');
    }
  });
}

function editMotto() {
  wx.showModal({
    title: '修改宣言',
    editable: true,
    placeholderText: '不超过20字',
    content: state.profile.motto || '',
    success(res) {
      if (!res.confirm) return;
      const value = (res.content || '').trim();
      if (!value) {
        state.toast = '宣言不能为空';
        return;
      }
      const profile = loadProfile();
      profile.motto = value.slice(0, 20);
      profile.completedProfile = isProfileReady(Object.assign({}, profile, { completedProfile: true }));
      state.profile = saveProfile(maybeGrantProfileReward(profile));
      if (!state.modal) state.toast = '宣言已更新';
    }
  });
}

function toggleCheckInMode() {
  const profile = loadProfile();
  profile.autoCheckIn = !profile.autoCheckIn;
  state.profile = saveProfile(profile);
  showAlert(profile.autoCheckIn ? '自动打卡已开启' : '手动打卡已开启', profile.autoCheckIn ? '主页手动打卡入口已隐藏' : '设置按钮右侧已出现打卡入口');
  trackEvent('checkin_mode_change', { auto: profile.autoCheckIn });
}

function toggleMusic() {
  const profile = loadProfile();
  profile.musicEnabled = profile.musicEnabled === false;
  profile.musicVolume = 0.3;
  state.profile = saveProfile(profile);
  showToast(profile.musicEnabled ? '背景音乐已开启' : '背景音乐已关闭');
  syncMusic();
}

function toggleSfx() {
  const profile = loadProfile();
  profile.sfxEnabled = profile.sfxEnabled === false;
  state.profile = saveProfile(profile);
  showToast(profile.sfxEnabled ? '音效震动已开启' : '音效震动已关闭');
}

function openSkinPicker() {
  const profile = loadProfile();
  const owned = SKINS.filter((skin) => profile.skins.includes(skin.id));
  if (!owned.length) {
    showToast('暂无可用皮肤');
    return;
  }
  wx.showActionSheet({
    itemList: owned.map((skin) => `${skin.name}${skin.id === profile.activeSkin ? ' ✓' : ''}`),
    success(res) {
      const selected = owned[res.tapIndex];
      if (!selected) return;
      profile.activeSkin = selected.id;
      state.profile = saveProfile(profile);
      showToast(`已切换：${selected.name}`);
    }
  });
}

function openCustomerService() {
  if (!wx.openCustomerServiceConversation) {
    showToast('当前版本暂不支持客服会话');
    return;
  }
  wx.openCustomerServiceConversation({
    fail() {
      showToast('客服会话打开失败，请检查客服配置');
    }
  });
}

function syncMusic() {
  if (!wx.createInnerAudioContext) return;
  if (!state.bgm) {
    state.bgm = wx.createInnerAudioContext();
    state.bgm.loop = true;
    state.bgm.src = 'assets/audio/tranquil-tunes-for-office-balance.wav';
  }
  if (state.profile.musicEnabled === false) {
    state.bgm.stop();
    return;
  }
  state.bgm.volume = state.profile.musicVolume || 0.3;
  if (state.bgm.src) state.bgm.play();
}

function draw() {
  state.buttons = [];
  drawBackground();
  drawWork();
  drawHangingMouseDock();
  if (state.panel === 'ranking') drawRankingPanel();
  if (state.panel === 'settings') drawSettingsPanel();
  if (state.toast) drawToast(state.toast);
  drawAlertOverlay();
  if (state.failOverlay) drawFailOverlay(state.failOverlay);
  if (state.modal) drawModal(state.modal);
}

function drawBackground() {
  const skin = SKINS.find((item) => item.id === state.profile.activeSkin) || SKINS[0];
  const colors = {
    calm: ['#eef5e9', '#f8faf0'],
    blue: ['#eaf4ff', '#eef5e9'],
    green: ['#e7f7ee', '#fbfcf4'],
    orange: ['#fff2df', '#eaf4ff'],
    aurora: ['#e7fff7', '#f4edff'],
    night: ['#243447', '#4b5f72']
  }[skin.tone] || ['#eef5e9', '#f8faf0'];
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.36, 10, W * 0.5, H * 0.36, W * 0.7);
  glow.addColorStop(0, 'rgba(94,184,132,.16)');
  glow.addColorStop(0.55, 'rgba(232,77,117,.08)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

function drawWork() {
  const rank = RANKS[state.profile.rankIndex];
  const layout = getWorkLayout();
  drawTopbar(rank, layout);

  drawAlarmClock(W / 2, layout.clockY, state.timeLeft);

  drawCodeTerminal(24, layout.panelTop, layout.panelW, layout.panelH, state.progress, () => {
    if (state.status === 'running' && !state.paused) state.progress = clamp(state.progress + GAME.progressTap);
  });
  drawMoodReactor(24 + layout.panelW + 8, layout.panelTop, layout.panelW, layout.panelH, state.mood, () => {
    if (state.status === 'running' && !state.paused) state.mood = clamp(state.mood + GAME.moodTap, 0, state.moodCap);
  });

  drawWorkspace(rank, layout);
}

function getWorkLayout() {
  const hangingSpace = H < 720 ? 38 : 54;
  const topbarY = safeTop + hangingSpace;
  const topbarH = 72;
  const workspaceH = H < 720 ? 158 : 178;
  const workspaceY = H - workspaceH - 24;
  const itemsY = workspaceY + 92;
  const panelTop = topbarY + topbarH + 68;
  const availablePanelH = workspaceY - panelTop - 18;
  const panelH = Math.max(190, Math.min(540, availablePanelH));
  return {
    topbarY,
    topbarH,
    clockY: topbarY + topbarH + 34,
    panelTop,
    panelH,
    panelW: (W - 56) / 2,
    workspaceY,
    workspaceH,
    itemsY
  };
}

function drawTopbar(rank, layout) {
  const y = layout.topbarY;
  drawCard(16, y, W - 32, layout.topbarH, 'rgba(255,255,255,.78)');
  drawText(rank.title, 32, y + 30, 21, '#27312d', 'bold');
  drawText(`${rank.tier} · ${state.profile.totalScore}/${rank.threshold}分`, 32, y + 56, 12, '#6f766f');
  drawRoleAvatar(W - 86, y + 36, state.profile.rankIndex);
}

function drawAlarmClock(cx, cy, seconds) {
  const urgent = seconds <= 5 && state.status === 'running';
  ctx.save();
  ctx.translate(cx, cy);
  if (urgent) ctx.rotate(Math.sin(Date.now() / 80) * 0.14);
  ctx.fillStyle = urgent ? '#8f3a3a' : '#2f5f50';
  circle(-14, -17, 6);
  circle(14, -17, 6);
  ctx.fillStyle = '#ffffff';
  circle(0, 0, 23);
  ctx.strokeStyle = urgent ? '#8f3a3a' : '#2f5f50';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = urgent ? '#8f3a3a' : '#2f5f50';
  drawText(`${seconds}`, 0, 6, 16, urgent ? '#8f3a3a' : '#2f5f50', 'bold', 'center');
  ctx.strokeStyle = urgent ? '#8f3a3a' : '#2f5f50';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-11, 25);
  ctx.lineTo(-18, 34);
  ctx.moveTo(11, 25);
  ctx.lineTo(18, 34);
  ctx.stroke();
  if (urgent) {
    ctx.strokeStyle = 'rgba(143,58,58,.45)';
    ctx.beginPath();
    ctx.arc(0, 0, 34, -0.6, 0.6);
    ctx.moveTo(-34, -7);
    ctx.arc(0, 0, 34, Math.PI - 0.6, Math.PI + 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRoleAvatar(cx, cy, rankIndex) {
  const palette = [
    ['#8e7560', '#f3e6d2', '牛马'],
    ['#826b58', '#ede0cf', '牛马'],
    ['#9b7b5d', '#f0e8d8', '预备'],
    ['#a77d55', '#ffffff', '工牌'],
    ['#5d7f73', '#eaf7f0', '组长'],
    ['#57789f', '#edf4ff', '经理'],
    ['#6b6aa8', '#f0efff', '团队'],
    ['#8a6bb0', '#f7efff', '大区'],
    ['#5f7698', '#eef7ff', 'CTO'],
    ['#3d4f63', '#fff7dc', '常务']
  ][rankIndex] || ['#8e7560', '#f3e6d2', '牛马'];
  ctx.save();
  ctx.fillStyle = palette[1];
  roundRect(cx - 34, cy - 28, 68, 56, 18, true);
  ctx.fillStyle = palette[0];
  circle(cx - 18, cy - 20, 12);
  circle(cx + 18, cy - 20, 12);
  roundRect(cx - 24, cy - 18, 48, 42, 18, true);
  ctx.fillStyle = '#27312d';
  circle(cx - 9, cy - 2, 2.5);
  circle(cx + 9, cy - 2, 2.5);
  ctx.strokeStyle = '#27312d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy + 6, 8, 0, Math.PI);
  ctx.stroke();
  if (rankIndex >= 3) {
    ctx.fillStyle = '#ffffff';
    roundRect(cx - 16, cy + 18, 32, 14, 4, true);
    drawText(rankIndex >= 8 ? 'CTO' : 'ID', cx, cy + 29, 8, palette[0], 'bold', 'center');
  }
  if (rankIndex >= 4) {
    ctx.fillStyle = '#f3c766';
    roundRect(cx - 22, cy - 36, 44, 10, 5, true);
  }
  ctx.restore();
}

function drawSpace() {
  const rank = RANKS[state.profile.rankIndex];
  drawCard(20, 28, W - 40, 128);
  addButton(20, 28, W - 40, 128, openProfileInfo);
  ctx.fillStyle = state.profile.avatarUrl ? '#2f5f50' : 'rgba(47,95,80,.16)';
  roundRect(W - 112, 48, 72, 72, 18, true);
  drawText(state.profile.avatarUrl ? '已授权' : '工', W - 76, state.profile.avatarUrl ? 88 : 94, state.profile.avatarUrl ? 12 : 30, state.profile.avatarUrl ? '#ffffff' : '#2f5f50', 'bold', 'center');
  drawText(state.profile.nickname, 44, 68, 25, '#27312d', 'bold');
  drawText(`${rank.title} · ${rank.tier}`, 44, 98, 14, '#2f5f50');
  drawText(state.profile.motto, 44, 126, 15, '#6f766f');
  drawText('编辑 >', W - 76, 140, 12, '#6f766f', 'bold', 'center');

  const stats = [
    ['总积分', state.profile.totalScore],
    ['累计通关', state.profile.passCount],
    ['完美通关', state.profile.perfectCount],
    ['最高段位', RANKS[state.profile.highestRankIndex].title],
    ['加班对局', state.profile.overtimeRounds],
    ['连续打卡', state.profile.checkInStreak]
  ];
  stats.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 20 + col * ((W - 52) / 2 + 12);
    const y = 180 + row * 82;
    drawCard(x, y, (W - 52) / 2, 66);
    drawText(String(item[1]), x + 14, y + 28, 18, '#27312d', 'bold');
    drawText(item[0], x + 14, y + 52, 12, '#6f766f');
  });

  drawText('我的皮肤', 24, 454, 20, '#27312d', 'bold');
  const owned = SKINS.filter((skin) => state.profile.skins.includes(skin.id));
  owned.slice(0, 4).forEach((skin, index) => {
    const x = 24 + (index % 2) * ((W - 60) / 2 + 12);
    const y = 474 + Math.floor(index / 2) * 76;
    drawCard(x, y, (W - 60) / 2, 62);
    drawText(skin.name, x + 12, y + 26, 13, '#27312d', 'bold');
    drawText(state.profile.activeSkin === skin.id ? '使用中' : skin.rarity, x + 12, y + 48, 11, '#6f766f');
    addButton(x, y, (W - 60) / 2, 62, () => {
      const profile = loadProfile();
      profile.activeSkin = skin.id;
      state.profile = saveProfile(profile);
    });
  });

  drawButton('手动打卡', 24, H - 118, W - 48, 44, () => performCheckIn(false), 'primary');
}

function drawProfileInfo() {
  const profile = state.profile;
  const rank = RANKS[profile.rankIndex];
  drawButton('← 空间', 20, 28, 82, 36, () => {
    state.profile = loadProfile();
    state.tab = 'space';
  }, 'ghost');
  drawCard(20, 92, W - 40, 132);
  ctx.fillStyle = profile.avatarUrl ? '#2f5f50' : 'rgba(47,95,80,.16)';
  roundRect(44, 122, 72, 72, 16, true);
  syncUserInfoButton('profile', 44, 122, 72, 72);
  drawText(profile.avatarUrl ? '已授权' : '工', 80, profile.avatarUrl ? 164 : 170, profile.avatarUrl ? 12 : 30, profile.avatarUrl ? '#ffffff' : '#2f5f50', 'bold', 'center');
  drawText(profile.nickname, 136, 128, 22, '#27312d', 'bold');
  drawText(`${rank.title} · ${rank.tier}`, 136, 156, 13, '#2f5f50');
  drawText(profile.motto, 136, 188, 13, '#6f766f');

  const listY = 246;
  drawCard(20, listY, W - 40, 420);
  drawProfileRow('昵称', profile.nickname, listY + 24, '修改', editNickname);
  drawProfileRow('头像', profile.avatarUrl ? '已设置' : '未设置', listY + 84, '上传', chooseLocalAvatar);
  drawProfileRow('宣言', profile.motto, listY + 144, '修改', editMotto);
  drawProfileRow('自动打卡', profile.autoCheckIn ? '开启' : '关闭', listY + 204, profile.autoCheckIn ? 'ON' : 'OFF', toggleCheckInMode, profile.autoCheckIn ? 'primary' : 'ghost');
  drawProfileRow('今日打卡', profile.lastCheckInDate === todayKey() ? '已完成' : '未完成', listY + 264, '打卡', () => performCheckIn(false));
  drawProfileRow('清空战绩', '保留资料、皮肤和道具', listY + 324, '清空', confirmClearRecords, 'danger');
}

function drawProfileRow(label, value, y, actionText, handler, theme = 'ghost') {
  ctx.fillStyle = 'rgba(61,85,73,.1)';
  ctx.fillRect(44, y + 46, W - 88, 1);
  const darkPanel = state.panel === 'settings' || state.panel === 'ranking';
  drawText(label, 44, y + 29, 15, theme === 'danger' ? '#ff9a9a' : (darkPanel ? '#eafff1' : '#27312d'), 'bold');
  drawText(value, 138, y + 29, 12, darkPanel ? 'rgba(234,255,241,.72)' : '#6f766f');
  drawButton(actionText, W - 116, y + 4, 72, 34, handler, theme);
}

function getCachedImage(src) {
  if (!src || !wx.createImage) return null;
  const cached = state.imageCache[src];
  if (cached) return cached.loaded ? cached.image : null;
  const image = wx.createImage();
  state.imageCache[src] = { image, loaded: false };
  image.onload = () => {
    state.imageCache[src].loaded = true;
  };
  image.onerror = () => {
    delete state.imageCache[src];
  };
  image.src = src;
  return null;
}

function drawAvatarPreview(src, cx, cy, r) {
  const image = getCachedImage(src);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (image) {
    ctx.drawImage(image, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = 'rgba(126,255,176,.14)';
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    drawText('头像', cx, cy + 4, 10, '#eafff1', 'bold', 'center');
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(126,255,176,.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCodeTerminal(x, y, w, h, value, onTap) {
  addButton(x, y, w, h, onTap);
  drawGamePanel(x, y, w, h, '#2f5f50');
  drawPill('开发终端', x + 16, y + 14, 86, 26, '#26342e', '#e8fff1');
  const screenX = x + 12;
  const screenY = y + 84;
  const screenW = w - 24;
  const screenH = h - 138;
  state.devScreen = { x: screenX, y: screenY, w: screenW, h: screenH };

  ctx.fillStyle = '#101815';
  roundRect(screenX, screenY, screenW, screenH, 18, true);
  ctx.strokeStyle = 'rgba(126,255,176,.26)';
  ctx.lineWidth = 2;
  ctx.stroke();
  const fillH = screenH * value / 100;
  const grad = ctx.createLinearGradient(0, screenY + screenH - fillH, 0, screenY + screenH);
  grad.addColorStop(0, 'rgba(34,113,71,.28)');
  grad.addColorStop(1, 'rgba(54,210,118,.62)');
  ctx.fillStyle = grad;
  roundRect(screenX, screenY + screenH - fillH, screenW, fillH, 12, true);
  ctx.fillStyle = 'rgba(142,255,185,.24)';
  const lines = Math.max(4, Math.floor(screenH / 28));
  for (let i = 0; i < lines; i += 1) {
    const lineW = screenW * (0.52 + (i % 3) * 0.13);
    roundRect(screenX + 16, screenY + screenH - fillH + 18 + i * 24, Math.min(lineW, screenW - 32), 8, 4, true);
  }
  ctx.fillStyle = 'rgba(122,255,164,.16)';
  ctx.fillRect(screenX, screenY + ((Date.now() / 12) % screenH), screenW, 18);
  ctx.fillStyle = 'rgba(47,95,80,.75)';
  ctx.fillRect(screenX, screenY + screenH * .6, screenW, 1);
  drawFallingInterference(state.devScreen);

  drawText(`${Math.round(value)}%`, x + w / 2, y + h - 28, 21, '#27312d', 'bold', 'center');
  drawText('开发进度', x + w / 2, y + h - 8, 13, '#27312d', 'bold', 'center');
}

function drawMoodReactor(x, y, w, h, value, onTap) {
  addButton(x, y, w, h, onTap);
  drawGamePanel(x, y, w, h, '#8f3a58');
  drawPill('心态反应炉', x + 16, y + 14, 96, 26, '#7e4152', '#fff4f6');
  const gaugeX = x + 20;
  const gaugeY = y + 54;
  ctx.fillStyle = 'rgba(255,255,255,.62)';
  roundRect(gaugeX, gaugeY, w - 40, 18, 10, true);
  ctx.fillStyle = value < 25 ? '#bf7d83' : value < 55 ? '#d9828f' : '#e84d75';
  roundRect(gaugeX, gaugeY, (w - 40) * value / 100, 18, 10, true);

  const glassW = Math.min(w - 42, 132);
  const glassH = h - 138;
  const gx = x + (w - glassW) / 2;
  const gy = y + 84;
  const glassGrad = ctx.createRadialGradient(gx + glassW / 2, gy + 90, 12, gx + glassW / 2, gy + 110, glassW);
  glassGrad.addColorStop(0, 'rgba(255,255,255,.95)');
  glassGrad.addColorStop(1, 'rgba(255,203,213,.45)');
  ctx.fillStyle = glassGrad;
  roundRect(gx, gy, glassW, glassH, 52, true);
  ctx.strokeStyle = 'rgba(126,65,82,.38)';
  ctx.lineWidth = 5;
  ctx.stroke();
  const fillH = glassH * value / 100;
  ctx.fillStyle = value < 25 ? 'rgba(183,99,99,.28)' : 'rgba(232,77,117,.46)';
  roundRect(gx, gy + glassH - fillH, glassW, fillH, 48, true);
  drawBoilingHearts(gx, gy, glassW, glassH, fillH, value);
  drawHeart(gx + glassW / 2, gy + glassH / 2 + 4, value, 0.64);
  ctx.fillStyle = 'rgba(47,95,80,.75)';
  ctx.fillRect(gx + 4, gy + glassH * .6, glassW - 8, 1);
  drawText(`${Math.round(value)}%`, x + w / 2, y + h - 28, 21, '#27312d', 'bold', 'center');
  drawText('心态指数', x + w / 2, y + h - 8, 13, '#27312d', 'bold', 'center');
}

function drawGamePanel(x, y, w, h, accent) {
  ctx.save();
  ctx.shadowColor = 'rgba(33,50,42,.16)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  drawCard(x, y, w, h, 'rgba(255,255,255,.74)');
  ctx.restore();
  ctx.fillStyle = accent;
  roundRect(x + 10, y + 10, 4, h - 20, 4, true);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  roundRect(x + 18, y + 10, w - 36, 2, 2, true);
}

function drawBoilingHearts(x, y, w, h, fillH, value) {
  const now = Date.now() / 1000;
  const baseY = y + h;
  const liquidTop = baseY - fillH;
  const color = value < 25 ? '#b9a2a8' : value < 55 ? '#d36f86' : '#ec4c7a';
  for (let i = 0; i < 12; i += 1) {
    const lane = (i % 4 + 0.55) / 4;
    const drift = Math.sin(now * 1.7 + i * 0.9) * 9;
    const rise = ((now * (22 + i * 2.4) + i * 31) % Math.max(fillH, 40));
    const cx = x + w * lane + drift;
    const cy = Math.max(liquidTop + 18, baseY - rise - 14);
    const size = 0.22 + (i % 3) * 0.05;
    const alpha = value < 25 ? 0.28 : 0.5 + (i % 4) * 0.08;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawSimpleHeart(cx, cy, color, size, Math.sin(now * 2 + i) * 0.8);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,.24)';
  for (let i = 0; i < 8; i += 1) {
    const bx = x + 18 + (i * 17 + Math.sin(now + i) * 8) % (w - 36);
    const by = baseY - ((now * 26 + i * 23) % Math.max(fillH, 36));
    circle(bx, by, 2 + (i % 3));
  }
}

function drawSimpleHeart(cx, cy, color, scale, rotate) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4 + rotate);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  roundRect(-25, -22, 50, 50, 12, true);
  circle(-25, -22, 25);
  circle(0, -47, 25);
  ctx.restore();
}

function drawHeart(cx, cy, value, scale = 1) {
  const color = value < 25 ? '#b9a2a8' : value < 55 ? '#d36f86' : '#ec4c7a';
  const blush = value < 35 ? 'rgba(180,120,130,.28)' : 'rgba(255,160,184,.5)';
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  cx = 0;
  cy = 0;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = color;
  roundRect(-25, -22, 50, 50, 12, true);
  circle(-25, -22, 25);
  circle(0, -47, 25);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  circle(cx - 15, cy - 29, 7);
  ctx.fillStyle = '#ffffff';
  circle(cx - 14, cy - 10, 5);
  circle(cx + 14, cy - 10, 5);
  ctx.fillStyle = color;
  circle(cx - 12, cy - 9, 2);
  circle(cx + 12, cy - 9, 2);
  ctx.fillStyle = blush;
  circle(cx - 25, cy + 4, 8);
  circle(cx + 25, cy + 4, 8);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (value < 35) ctx.arc(cx, cy + 16, 12, Math.PI, Math.PI * 2);
  else if (value < 55) {
    ctx.moveTo(cx - 12, cy + 12);
    ctx.lineTo(cx + 12, cy + 12);
  } else ctx.arc(cx, cy + 6, 14, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawFallingInterference(screen) {
  if (!screen) return;
  state.bugBalls.forEach((bug) => {
    const x = screen.x + screen.w * bug.x;
    const y = screen.y - 34 + (screen.h + 44) * bug.y;
    drawBugBall(x, y, bug.radius, bug.big);
  });
  state.needles.forEach((needle) => {
    const x = screen.x + screen.w * needle.x;
    const y = screen.y - 26 + (screen.h + 36) * needle.y;
    drawNeedle(x, y);
  });
}

function drawBugBall(x, y, r, big) {
  ctx.save();
  ctx.shadowColor = big ? 'rgba(128,33,54,.42)' : 'rgba(61,37,63,.3)';
  ctx.shadowBlur = big ? 16 : 9;
  ctx.fillStyle = big ? '#8f2948' : '#5b415f';
  circle(x, y, r);
  ctx.fillStyle = '#ffffff';
  circle(x - r * 0.34, y - r * 0.18, Math.max(2, r * 0.13));
  circle(x + r * 0.28, y - r * 0.16, Math.max(2, r * 0.13));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.34, y + r * 0.28);
  ctx.lineTo(x + r * 0.36, y + r * 0.28);
  ctx.stroke();
  ctx.strokeStyle = big ? '#f0839e' : '#a78caf';
  for (let i = 0; i < 6; i += 1) {
    const a = i * Math.PI / 3 + Date.now() / 500;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78);
    ctx.lineTo(x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNeedle(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(Date.now() / 260) * 0.28);
  ctx.strokeStyle = '#e7d45f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, 18);
  ctx.stroke();
  ctx.fillStyle = '#2f5f50';
  roundRect(-8, -22, 16, 10, 4, true);
  ctx.fillStyle = '#f7f0a1';
  circle(0, -24, 5);
  ctx.restore();
}

function drawToolCard(item, x, y, w, h) {
  if (isChargeItem(item.id)) {
    addButton(x, y, w, h, null, {
      onPress: () => startToolCharge(item.id),
      onRelease: () => releaseToolCharge(item.id)
    });
  } else {
    addButton(x, y, w, h, () => useItem(item.id));
  }
  drawCard(x, y, w, h, 'rgba(255,255,255,.82)');
  if (isChargeItem(item.id) && state.pressingTool && state.pressingTool.id === item.id) {
    const ratio = Math.min(1, (Date.now() - state.pressingTool.startedAt) / 2000);
    ctx.fillStyle = 'rgba(47,95,80,.16)';
    roundRect(x + 4, y + h - 7, (w - 8) * ratio, 4, 3, true);
  }
  drawText(item.icon, x + w / 2, y + 17, 15, '#2f5f50', 'bold', 'center');
  drawText(`x${state.profile.items[item.id] || 0}`, x + w / 2, y + 32, 12, '#2f5f50', 'bold', 'center');
  drawText(shortItemName(item.id), x + w / 2, y + 47, 9, '#6f766f', '', 'center');
}

function shortItemName(id) {
  return {
    time: '延时',
    mood: '回血',
    progress: '加急',
    needle: '破Bug',
    bean: '效率豆',
    mindstone: '心态石'
  }[id] || '道具';
}

function drawAlertOverlay() {
  if (!state.alertOverlay) return;
  const remain = state.alertOverlay.until - Date.now();
  if (remain <= 0) {
    state.alertOverlay = null;
    return;
  }
  const alpha = Math.min(1, remain / 260);
  ctx.save();
  ctx.globalAlpha = Math.min(.82, alpha);
  ctx.fillStyle = 'rgba(36,20,24,.34)';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const bandY = H * 0.28;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha + .18);
  ctx.fillStyle = 'rgba(133,42,62,.9)';
  ctx.fillRect(0, bandY, W, 58);
  drawText(state.alertOverlay.title, W / 2, bandY + 27, 20, '#ffffff', 'bold', 'center');
  drawText(state.alertOverlay.copy, W / 2, bandY + 49, 12, 'rgba(255,255,255,.86)', '', 'center');
  ctx.restore();
}

function drawPill(text, x, y, w, h, fill, color) {
  ctx.fillStyle = fill;
  roundRect(x, y, w, h, 8, true);
  drawText(text, x + w / 2, y + 18, 11, color, 'bold', 'center');
}

function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawWorkspace(rank, layout) {
  const y = layout.workspaceY;
  const x = 18;
  const w = W - 36;
  const h = layout.workspaceH;
  drawKeyboardBase(x, y, w, h);
  drawText('当前工位', x + 28, y + 34, 15, '#ecfff3', 'bold');
  drawText(rank.workspace, x + 28, y + 59, 12, 'rgba(236,255,243,.78)');
  const buttonText = state.status === 'running' && !state.paused ? 'Ⅱ 暂停' : '▶ 开始';
  const buttonX = W - 136;
  const buttonY = y + 22;
  drawButton(buttonText, buttonX, buttonY, 88, 42, () => {
    if (state.status === 'running') state.paused = !state.paused;
    else startGame();
  }, state.status === 'running' && !state.paused ? 'danger' : 'primary');
  if (state.panel !== 'settings') destroyStartAuthButton();
  const itemsTop = y + (h < 170 ? 76 : 88);
  drawInlineItems(itemsTop, x + 20, w - 40, y + h - itemsTop - 12);
}

function drawKeyboardBase(x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(11,28,24,.28)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  const body = ctx.createLinearGradient(0, y, 0, y + h);
  body.addColorStop(0, '#31443c');
  body.addColorStop(0.58, '#1f302b');
  body.addColorStop(1, '#182520');
  ctx.fillStyle = body;
  roundRect(x, y, w, h, 18, true);
  ctx.restore();
  ctx.strokeStyle = 'rgba(126,255,176,.32)';
  ctx.lineWidth = 2;
  roundRect(x + 3, y + 3, w - 6, h - 6, 15, false);
  ctx.stroke();

  const rows = [
    { y: y + 16, count: 9, xPad: 14, keyH: 24 },
    { y: y + 50, count: 8, xPad: 26, keyH: 24 },
    { y: y + 84, count: 7, xPad: 38, keyH: 24 },
    { y: y + 124, count: 5, xPad: 24, keyH: 28 }
  ];
  rows.forEach((row, rowIndex) => {
    const gap = 7;
    const keyW = (w - row.xPad * 2 - gap * (row.count - 1)) / row.count;
    for (let i = 0; i < row.count; i += 1) {
      const keyX = x + row.xPad + i * (keyW + gap);
      const glow = rowIndex === 3 && i === 2 ? 'rgba(119,255,184,.16)' : 'rgba(255,255,255,.07)';
      ctx.fillStyle = glow;
      roundRect(keyX, row.y, keyW, row.keyH, 7, true);
      ctx.strokeStyle = 'rgba(255,255,255,.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  const plate = ctx.createLinearGradient(0, y + 8, 0, y + 74);
  plate.addColorStop(0, 'rgba(17,29,26,.72)');
  plate.addColorStop(1, 'rgba(17,29,26,.42)');
  ctx.fillStyle = plate;
  roundRect(x + 14, y + 12, w - 28, 62, 14, true);
}

function drawInlineItems(y, x, availableW, sectionH) {
  ctx.fillStyle = 'rgba(12,22,20,.66)';
  roundRect(x, y, availableW, sectionH, 14, true);
  ctx.strokeStyle = 'rgba(126,255,176,.20)';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawText('随身道具', x + 14, y + 20, 13, '#ecfff3', 'bold');
  drawText('点按使用 · 豆/石可长按蓄力', x + 88, y + 20, 10, 'rgba(236,255,243,.62)');
  const startX = x + 12;
  const gap = 8;
  const toolH = Math.max(40, Math.min(52, sectionH - 28));
  const w = Math.min(54, (availableW - 24 - gap * (ITEMS.length - 1)) / ITEMS.length);
  ITEMS.forEach((item, index) => {
    const itemX = startX + index * (w + gap);
    drawMiniTool(item, itemX, y + 26, w, toolH);
  });
}

function drawMiniTool(item, x, y, w, h) {
  if (isChargeItem(item.id)) {
    addButton(x, y, w, h, null, {
      onPress: () => startToolCharge(item.id),
      onRelease: () => releaseToolCharge(item.id)
    });
  } else {
    addButton(x, y, w, h, () => useItem(item.id));
  }
  const charging = isChargeItem(item.id) && state.pressingTool && state.pressingTool.id === item.id;
  const chargeRatio = charging ? Math.min(1, (Date.now() - state.pressingTool.startedAt) / 2000) : 0;
  const pulse = charging && chargeRatio >= 1 ? 1 + Math.sin(Date.now() / 95) * 0.08 : 1;
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);
  ctx.translate(-cx, -cy);
  ctx.shadowColor = 'rgba(119,255,184,.22)';
  ctx.shadowBlur = charging && chargeRatio >= 1 ? 18 : 9;
  ctx.shadowOffsetY = charging && chargeRatio >= 1 ? 7 : 4;
  const fill = isChargeItem(item.id) ? (item.id === 'mindstone' ? '#5a3144' : '#284638') : '#eef8ee';
  ctx.fillStyle = fill;
  roundRect(x, y, w, h, 9, true);
  ctx.strokeStyle = isChargeItem(item.id) ? (chargeRatio >= 1 ? 'rgba(255,226,142,.72)' : 'rgba(126,255,176,.32)') : 'rgba(47,95,80,.16)';
  roundRect(x + 1, y + 1, w - 2, h - 2, 8, false);
  ctx.stroke();
  if (charging) {
    ctx.fillStyle = chargeRatio >= 1 ? 'rgba(255,226,142,.5)' : 'rgba(126,255,176,.28)';
    roundRect(x + 4, y + h - 5, (w - 8) * chargeRatio, 3, 2, true);
  }
  const darkKey = isChargeItem(item.id);
  drawText(item.icon, x + w / 2, y + 15, 14, darkKey ? '#eafff1' : '#2f5f50', 'bold', 'center');
  drawText(shortItemName(item.id), x + w / 2, y + 31, 9, darkKey ? 'rgba(234,255,241,.76)' : '#5f6962', 'bold', 'center');
  drawText(`x${state.profile.items[item.id] || 0}`, x + w / 2, y + h - 6, 9, darkKey ? 'rgba(234,255,241,.82)' : '#5f6962', 'bold', 'center');
  ctx.restore();
}

function syncUserInfoButton(mode, x, y, w, h) {
  const shouldShow = state.panel === 'settings';
  if (!shouldShow || !wx.createUserInfoButton) {
    destroyStartAuthButton();
    return;
  }
  const key = `${mode}-${Math.round(x)}-${Math.round(y)}-${Math.round(w)}-${Math.round(h)}`;
  if (state.userInfoButton && state.userInfoButtonKey === key) {
    state.userInfoButton.show();
    return;
  }
  destroyStartAuthButton();
  state.userInfoButtonKey = key;
  state.userInfoButton = wx.createUserInfoButton({
    type: 'text',
    text: '',
    style: {
      left: x,
      top: y,
      width: w,
      height: h,
      lineHeight: h,
      backgroundColor: 'rgba(0,0,0,0)',
      color: 'rgba(0,0,0,0)',
      textAlign: 'center',
      fontSize: 15,
      borderRadius: 8
    }
  });
  state.userInfoButton.onTap((res) => {
    if (res && res.userInfo) {
      saveAuthorizedProfile(res.userInfo);
      destroyStartAuthButton();
      trackEvent('profile_auth', { from: mode });
      showToast(isProfileReady(state.profile) ? '头像昵称已回填' : '头像昵称已回填，请补充宣言');
    } else {
      showToast('请确认微信个人信息授权后开始');
    }
  });
}

function destroyStartAuthButton() {
  if (state.userInfoButton) {
    state.userInfoButton.destroy();
    state.userInfoButton = null;
    state.userInfoButtonKey = '';
  }
}

function drawItems(layout) {
  const y = layout.itemsY;
  const toggleW = 76;
  drawButton(state.toolsExpanded ? '收起' : '道具', 24, y + 8, toggleW, 38, () => {
    state.toolsExpanded = !state.toolsExpanded;
  }, 'ghost');
  const visibleItems = state.toolsExpanded ? ITEMS : ITEMS.filter((item) => isChargeItem(item.id));
  const gap = 8;
  const startX = 24 + toggleW + 10;
  const itemW = state.toolsExpanded ? (W - startX - 24 - gap * (visibleItems.length - 1)) / visibleItems.length : Math.min(132, W - startX - 154);
  visibleItems.forEach((item, index) => {
    const x = startX + index * (itemW + gap);
    drawToolCard(item, x, y, itemW, 54);
  });
  if (!state.toolsExpanded) {
    drawText('点按+8 / 长按2秒+15', startX + itemW + 12, y + 33, 11, '#7a827b');
  }
}

function drawTabBar() {
  const y = H - 58;
  ctx.fillStyle = 'rgba(251,252,248,.96)';
  ctx.fillRect(0, y, W, 58);
  drawButton('上工', 30, y + 10, (W - 80) / 2, 36, () => {
    state.tab = 'work';
  }, state.tab === 'work' ? 'primary' : 'ghost');
  drawButton('空间', W / 2 + 10, y + 10, (W - 80) / 2, 36, () => {
    state.tab = 'space';
  }, state.tab === 'space' ? 'primary' : 'ghost');
}

function drawHangingMouseDock() {
  const mouseY = safeTop - 30;
  const spacing = W < 360 ? 82 : 92;
  const startCx = W < 360 ? 62 : 70;
  const items = [
    { label: '排行', type: 'ranking', cx: startCx },
    { label: '设置', type: 'settings', cx: startCx + spacing }
  ];
  items.forEach((item) => {
    drawHangingMouseButton(item.cx, mouseY, item.label, item.type, () => {
      state.panel = state.panel === item.type ? null : item.type;
      if (state.panel === 'ranking') fetchRankings();
    }, state.panel === item.type);
  });
  if (state.profile.autoCheckIn === false) {
    drawHangingMouseButton(startCx + spacing * 2, mouseY, '打卡', 'checkin', () => performCheckIn(false), false);
  }
}

function drawHangingMouseButton(cx, y, label, type, handler, active) {
  const w = 72;
  const h = 56;
  addButton(cx - w / 2, y, w, h, handler);

  const wireTop = Math.max(12, y - 54);
  ctx.save();
  ctx.strokeStyle = active ? 'rgba(84,244,156,.92)' : 'rgba(42,67,58,.55)';
  ctx.lineWidth = active ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(cx, wireTop);
  ctx.bezierCurveTo(cx - 8, y - 38, cx + 8, y - 22, cx, y + 1);
  ctx.stroke();
  ctx.fillStyle = active ? '#5cff9f' : '#2f5f50';
  circle(cx, wireTop, 4);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = active ? 'rgba(84,244,156,.48)' : 'rgba(17,31,27,.2)';
  ctx.shadowBlur = active ? 18 : 10;
  ctx.shadowOffsetY = 6;
  const body = ctx.createLinearGradient(0, y, 0, y + h);
  body.addColorStop(0, active ? '#3d755e' : '#f4fbf2');
  body.addColorStop(0.58, active ? '#244f42' : '#dfeee4');
  body.addColorStop(1, active ? '#183a31' : '#b9d0c1');
  ctx.fillStyle = body;
  roundRect(cx - w / 2, y, w, h, 28, true);
  ctx.restore();

  ctx.strokeStyle = active ? 'rgba(180,255,207,.62)' : 'rgba(47,95,80,.26)';
  ctx.lineWidth = 2;
  roundRect(cx - w / 2 + 2, y + 2, w - 4, h - 4, 26, false);
  ctx.stroke();
  ctx.strokeStyle = active ? 'rgba(234,255,241,.46)' : 'rgba(47,95,80,.34)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, y + 8);
  ctx.lineTo(cx, y + 24);
  ctx.stroke();
  ctx.fillStyle = active ? '#eafff1' : '#2f5f50';
  roundRect(cx - 5, y + 10, 10, 14, 5, true);

  if (type === 'ranking') {
    drawRankingGlyph(cx, y + 34, active);
  } else if (type === 'settings') {
    drawSettingsGlyph(cx, y + 34, active);
  } else {
    drawCheckInGlyph(cx, y + 34, active);
  }
  drawText(label, cx, y + 49, 12, active ? '#f3fff6' : '#244f42', 'bold', 'center');
}

function drawRankingGlyph(cx, cy, active) {
  const color = active ? '#f7f0a1' : '#3b7d60';
  ctx.fillStyle = color;
  roundRect(cx - 15, cy - 2, 8, 8, 2, true);
  roundRect(cx - 4, cy - 9, 8, 15, 2, true);
  roundRect(cx + 7, cy - 5, 8, 11, 2, true);
}

function drawSettingsGlyph(cx, cy, active) {
  ctx.save();
  ctx.strokeStyle = active ? '#f7f0a1' : '#3b7d60';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 9, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 6; i += 1) {
    const a = Math.PI * 2 / 6 * i;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 11, cy - 2 + Math.sin(a) * 11);
    ctx.lineTo(cx + Math.cos(a) * 14, cy - 2 + Math.sin(a) * 14);
    ctx.stroke();
  }
  ctx.fillStyle = active ? '#f7f0a1' : '#3b7d60';
  circle(cx, cy - 2, 3);
  ctx.restore();
}

function drawCheckInGlyph(cx, cy, active) {
  ctx.save();
  ctx.fillStyle = active ? '#f7f0a1' : '#3b7d60';
  roundRect(cx - 10, cy - 12, 20, 20, 5, true);
  ctx.strokeStyle = active ? '#f7f0a1' : '#3b7d60';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy - 15);
  ctx.lineTo(cx - 7, cy - 10);
  ctx.moveTo(cx + 7, cy - 15);
  ctx.lineTo(cx + 7, cy - 10);
  ctx.stroke();
  ctx.strokeStyle = active ? '#244f42' : '#f4fbf2';
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 2);
  ctx.lineTo(cx - 1, cy + 3);
  ctx.lineTo(cx + 7, cy - 6);
  ctx.stroke();
  ctx.restore();
}

function drawPanelShell(title, h) {
  const x = 24;
  const y = Math.max(safeTop + 92, H - 72 - h - 18);
  ctx.save();
  ctx.fillStyle = 'rgba(10,18,22,.42)';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.save();
  ctx.shadowColor = 'rgba(58,220,150,.34)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  drawCard(x, y, W - 48, h, 'rgba(20,34,37,.94)');
  ctx.restore();
  ctx.strokeStyle = 'rgba(119,255,184,.38)';
  ctx.lineWidth = 2;
  roundRect(x + 3, y + 3, W - 54, h - 6, 10, false);
  drawText(title, x + 18, y + 32, 18, '#eafff1', 'bold');
  drawCloseIconButton(W - 48, y + 26, () => {
    state.panel = null;
  });
  return { x, y, w: W - 48, h };
}

function drawCloseIconButton(cx, cy, handler) {
  const r = 15;
  addButton(cx - r, cy - r, r * 2, r * 2, handler);
  ctx.save();
  ctx.shadowColor = 'rgba(84,244,156,.34)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(12,24,24,.86)';
  circle(cx, cy, r);
  ctx.restore();
  ctx.strokeStyle = 'rgba(126,255,176,.38)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#eafff1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 5);
  ctx.lineTo(cx + 5, cy + 5);
  ctx.moveTo(cx + 5, cy - 5);
  ctx.lineTo(cx - 5, cy + 5);
  ctx.stroke();
}

function drawRankingPanel() {
  const panel = drawPanelShell('排行榜', 290);
  drawButton('朋友', panel.x + 20, panel.y + 50, 60, 30, () => {
    state.rankTab = 'friends';
    fetchRankings();
  }, state.rankTab === 'friends' ? 'primary' : 'ghost');
  drawButton('全部', panel.x + 90, panel.y + 50, 60, 30, () => {
    state.rankTab = 'all';
    fetchRankings();
  }, state.rankTab === 'all' ? 'primary' : 'ghost');
  const list = state.rankings[state.rankTab] || [];
  if (!list.length) {
    drawText('暂无排行数据', panel.x + 20, panel.y + 124, 14, 'rgba(234,255,241,.72)');
    addButton(panel.x + 20, panel.y + 96, panel.w - 40, 150, fetchRankings);
    return;
  }
  list.slice(0, 5).forEach((item, index) => {
    const y = panel.y + 104 + index * 34;
    ctx.fillStyle = item.avatarUrl ? '#2f5f50' : 'rgba(47,95,80,.14)';
    circle(panel.x + 34, y - 6, 12);
    drawText(`${index + 1}`, panel.x + 34, y - 2, 10, item.avatarUrl ? '#ffffff' : '#2f5f50', 'bold', 'center');
    drawText(item.nickname || '匿名打工人', panel.x + 58, y - 8, 13, '#eafff1', 'bold');
    drawText(`${RANKS[item.rankIndex || 0].title} · ${item.totalScore || 0}分`, panel.x + 58, y + 10, 11, 'rgba(234,255,241,.68)');
  });
}

function drawSettingsPanel() {
  const panel = drawPanelShell('设置', Math.min(548, H - safeTop - 96));
  const p = state.profile;
  addButton(panel.x + 18, panel.y + 50, 40, 40, chooseLocalAvatar);
  if (p.avatarUrl) {
    drawAvatarPreview(p.avatarUrl, panel.x + 38, panel.y + 70, 18);
  } else {
    ctx.fillStyle = 'rgba(47,95,80,.18)';
    circle(panel.x + 38, panel.y + 70, 18);
    drawText('游', panel.x + 38, panel.y + 76, 14, '#eafff1', 'bold', 'center');
  }
  drawText(p.nickname || '游客身份', panel.x + 70, panel.y + 66, 18, '#eafff1', 'bold');
  drawText(p.motto || '稳住心态写代码', panel.x + 70, panel.y + 92, 13, 'rgba(234,255,241,.68)');
  const skin = SKINS.find((item) => item.id === p.activeSkin) || SKINS[0];
  const rowY = panel.y + 112;
  drawSettingsRow(panel, rowY, '头像', '', 'avatar', chooseLocalAvatar, { avatarUrl: p.avatarUrl });
  drawSettingsRow(panel, rowY + 48, '昵称', p.nickname, 'edit', editNickname);
  drawSettingsRow(panel, rowY + 96, '宣言', p.motto, 'edit', editMotto);
  drawSettingsRow(panel, rowY + 144, '皮肤', skin.name, 'skin', openSkinPicker);
  drawSettingsRow(panel, rowY + 192, '客服', '微信客服会话', 'service', openCustomerService);
  drawSettingsSwitchRow(panel, rowY + 240, '自动打卡', p.autoCheckIn !== false, toggleCheckInMode);
  drawSettingsSwitchRow(panel, rowY + 288, '音乐', p.musicEnabled !== false, toggleMusic);
  drawSettingsSwitchRow(panel, rowY + 336, '音效', p.sfxEnabled !== false, toggleSfx);
}

function drawSettingsRow(panel, y, label, value, icon, handler, options = {}) {
  const x = panel.x + 18;
  const w = panel.w - 36;
  addButton(x, y, w, 42, handler);
  ctx.fillStyle = 'rgba(255,255,255,.045)';
  roundRect(x, y, w, 42, 10, true);
  ctx.strokeStyle = 'rgba(126,255,176,.11)';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawText(label, x + 14, y + 27, 14, '#eafff1', 'bold');
  if (value) {
    drawText(String(value).slice(0, 16), x + 86, y + 27, 12, 'rgba(234,255,241,.66)');
  }
  if (options.avatarUrl) {
    drawAvatarPreview(options.avatarUrl, x + w - 24, y + 21, 16);
  } else {
    drawSettingsIcon(icon, x + w - 24, y + 21, true);
  }
}

function drawSettingsSwitchRow(panel, y, label, enabled, handler) {
  const x = panel.x + 18;
  const w = panel.w - 36;
  addButton(x, y, w, 42, handler);
  ctx.fillStyle = 'rgba(255,255,255,.045)';
  roundRect(x, y, w, 42, 10, true);
  ctx.strokeStyle = 'rgba(126,255,176,.11)';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawText(label, x + 14, y + 27, 14, '#eafff1', 'bold');
  drawSwitchIcon(x + w - 42, y + 12, enabled);
}

function drawSwitchIcon(x, y, enabled) {
  ctx.save();
  ctx.shadowColor = enabled ? 'rgba(84,244,156,.34)' : 'rgba(0,0,0,.18)';
  ctx.shadowBlur = enabled ? 9 : 4;
  ctx.fillStyle = enabled ? '#2f9f68' : 'rgba(234,255,241,.18)';
  roundRect(x, y, 42, 22, 11, true);
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  circle(x + (enabled ? 30 : 12), y + 11, 8);
}

function drawSettingsIcon(type, cx, cy, active) {
  const color = active ? '#eafff1' : 'rgba(234,255,241,.45)';
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  if (type === 'avatar') {
    circle(cx, cy - 4, 5);
    ctx.beginPath();
    ctx.arc(cx, cy + 9, 10, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 9, cy - 8);
    ctx.lineTo(cx + 15, cy - 14);
    ctx.lineTo(cx + 15, cy - 4);
    ctx.stroke();
  } else if (type === 'edit') {
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 8);
    ctx.lineTo(cx - 4, cy + 6);
    ctx.lineTo(cx + 10, cy - 8);
    ctx.lineTo(cx + 6, cy - 12);
    ctx.lineTo(cx - 8, cy + 2);
    ctx.closePath();
    ctx.stroke();
  } else if (type === 'skin') {
    roundRect(cx - 10, cy - 9, 20, 18, 5, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 2);
    ctx.lineTo(cx + 10, cy - 2);
    ctx.stroke();
  } else if (type === 'service') {
    ctx.beginPath();
    ctx.arc(cx, cy, 11, Math.PI * .12, Math.PI * 1.88);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 11, cy + 2);
    ctx.lineTo(cx - 14, cy + 2);
    ctx.moveTo(cx + 11, cy + 2);
    ctx.lineTo(cx + 14, cy + 2);
    ctx.stroke();
    circle(cx + 6, cy + 9, 2);
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 8);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx - 8, cy + 8);
    ctx.stroke();
  }
  ctx.restore();
}

function fetchRankings() {
  if (!wx.cloud) return;
  wx.cloud.callFunction({
    name: 'getRankings',
    config: { env: CLOUD_ENV },
    data: { type: state.rankTab },
    success(res) {
      const list = res.result && Array.isArray(res.result.list) ? res.result.list : [];
      state.rankings[state.rankTab] = list;
    },
    fail() {
      showToast('排行榜加载失败');
    }
  });
}

function drawModal(modal) {
  ctx.fillStyle = 'rgba(31,39,35,.45)';
  ctx.fillRect(0, 0, W, H);
  const x = 32;
  const y = modal.modalType === 'overtime' ? 120 : H / 2 - 150;
  const h = modal.modalType === 'overtime' ? 260 : 300;
  drawCard(x, y, W - 64, h, '#ffffff');
  drawText(modal.modalType === 'overtime' ? `【${modal.title}】` : modal.title, W / 2, y + 44, 22, '#27312d', 'bold', 'center');
  drawMultiline(modal.desc || modal.copy, x + 24, y + 82, W - 112, 16, '#5f6962');
  if (modal.rewards && modal.rewards.length) {
    drawMultiline(modal.rewards.join('、'), x + 24, y + 150, W - 112, 13, '#2f5f50');
  }
  if (modal.modalType === 'overtime') {
    drawButton('接受', x + 24, y + h - 96, W - 112, 38, acceptOvertime);
    drawButton('准时下班', x + 24, y + h - 48, W - 112, 38, rejectOvertime, 'ghost');
  } else if (modal.type === 'fail') {
    drawButton('原地复活', x + 24, y + h - 100, W - 112, 38, revive);
    drawButton('关闭退出', x + 24, y + h - 52, W - 112, 38, closeModal, 'ghost');
  } else if (modal.type === 'profile') {
    drawButton('去完善信息', x + 24, y + h - 74, W - 112, 42, () => {
      state.modal = null;
      state.tab = 'profile';
    });
  } else {
    drawButton('知道了', x + 24, y + h - 74, W - 112, 42, closeModal);
  }
}

function revive() {
  state.modal = null;
  state.failOverlay = null;
  state.status = 'running';
  state.paused = false;
  state.timeLeft = Math.max(state.timeLeft, 10);
  state.progress = Math.max(state.progress, 35);
  state.mood = Math.max(state.mood, 35);
  state.lastTick = Date.now();
  trackEvent('revive_click', {});
}

function closeModal() {
  state.modal = null;
  if (state.status === 'finished') state.status = 'idle';
}

function confirmClearRecords() {
  wx.showModal({
    title: '清空个人战绩',
    content: '将清空积分、段位、统计和历史记录，保留头像昵称、皮肤和道具。',
    confirmText: '清空',
    confirmColor: '#8f3a3a',
    success(res) {
      if (!res.confirm) return;
      clearRecords();
    }
  });
}

function clearRecords() {
  const profile = loadProfile();
  Object.assign(profile, {
    totalScore: 0,
    rankIndex: 0,
    highestRankIndex: 0,
    passCount: 0,
    failCount: 0,
    perfectCount: 0,
    overtimeRounds: 0,
    overtimeCount: 0,
    overtimeSeconds: 0,
    totalRounds: 0,
    reviveAdCount: 0,
    reviveShareCount: 0,
    records: []
  });
  state.profile = saveProfile(profile);
  state.toast = '已清空个人战绩';
  trackEvent('records_clear', {});
}

function handleTouch(event) {
  const touch = event.touches[0];
  if (!touch) return;
  const x = touch.clientX;
  const y = touch.clientY;
  state.touchStartX = x;
  state.touchStartY = y;
  state.touchStartPanel = state.panel;
  for (let i = state.buttons.length - 1; i >= 0; i -= 1) {
    const item = state.buttons[i];
    if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) {
      if (typeof item.onPress === 'function') {
        state.activePressButton = item;
        tapFeedback();
        item.onPress();
      } else if (typeof item.handler === 'function') {
        tapFeedback();
        item.handler();
      }
      break;
    }
  }
}

function handleTouchEnd() {
  const touch = arguments[0] && arguments[0].changedTouches && arguments[0].changedTouches[0];
  if (state.activePressButton && typeof state.activePressButton.onRelease === 'function') {
    state.activePressButton.onRelease();
  }
  state.activePressButton = null;
}

function drawButton(text, x, y, w, h, handler, theme = 'primary') {
  addButton(x, y, w, h, handler);
  const fill = theme === 'danger' ? '#8f3a3a' : theme === 'ghost' ? 'rgba(255,255,255,.78)' : '#2f5f50';
  const color = theme === 'ghost' ? '#2f5f50' : '#ffffff';
  ctx.fillStyle = fill;
  roundRect(x, y, w, h, 8, true);
  drawText(text, x + w / 2, y + h / 2 + 5, Math.min(15, Math.max(11, w / text.length)), color, 'bold', 'center');
}

function addButton(x, y, w, h, handler, options = {}) {
  if (typeof handler === 'function' || typeof options.onPress === 'function') {
    state.buttons.push({
      x,
      y,
      w,
      h,
      handler,
      onPress: options.onPress,
      onRelease: options.onRelease
    });
  }
}

function drawCard(x, y, w, h, color = 'rgba(255,255,255,.82)') {
  ctx.fillStyle = color;
  roundRect(x, y, w, h, 8, true);
  ctx.strokeStyle = 'rgba(61,85,73,.12)';
  ctx.stroke();
}

function drawToast(toast) {
  const text = typeof toast === 'string' ? toast : toast.text;
  if (typeof toast === 'string') {
    state.toast = {
      text,
      until: Date.now() + 1800
    };
  } else if (toast.until && toast.until <= Date.now()) {
    state.toast = null;
    return;
  }
  drawCard(24, 98, W - 48, 44, 'rgba(45,57,52,.92)');
  drawText(text, W / 2, 126, 13, '#ffffff', 'bold', 'center');
}

function drawFailOverlay(overlay) {
  ctx.fillStyle = overlay.reason === 'progress' ? 'rgba(16,29,28,.82)' : 'rgba(34,20,24,.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.08);
  ctx.fillStyle = overlay.reason === 'progress' ? 'rgba(30,118,85,.9)' : 'rgba(190,48,66,.9)';
  ctx.fillRect(-W * 0.62, -48, W * 1.24, 96);
  ctx.restore();
  drawMultiline(overlay.title, 36, H / 2 - 18, W - 72, 30, '#ffffff');
  drawText('本局强制结束，先把自己捞回来。', W / 2, H / 2 + 86, 15, '#ffffff', '', 'center');
}

function drawText(text, x, y, size, color, weight = '', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight ? `${weight} ` : ''}${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(text), x, y);
}

function drawMultiline(text, x, y, maxWidth, size, color) {
  const chars = String(text).split('');
  let line = '';
  let lineY = y;
  ctx.font = `${size}px sans-serif`;
  chars.forEach((char) => {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      drawText(line, x, lineY, size, color);
      line = char;
      lineY += size + 8;
    } else {
      line = testLine;
    }
  });
  if (line) drawText(line, x, lineY, size, color);
}

function roundRect(x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
}

function createEventSchedule(count, duration) {
  const result = [];
  const safeDuration = Math.max(8, duration - 5);
  for (let i = 0; i < count; i += 1) {
    const min = 6 + i * 4;
    const max = Math.max(min + 1, safeDuration);
    result.push(Math.min(max, min + Math.floor(Math.random() * Math.max(2, max - min))));
  }
  return result;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

init();

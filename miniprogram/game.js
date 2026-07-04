const { RANKS, GAME, EVENTS, OVERTIME, INTERFERENCE, ITEMS, SKINS, FAILURE_TEXTS, CHECKIN_TEXTS } = require('./utils/config');
const { createDefaultProfile, isProfileReady, isFormalProfile, loadProfile, saveProfile, trackEvent, randomFrom, randomItems, randomSkin, rankByScore, todayKey, isTestAccount, isSkinUnlocked } = require('./utils/store');
const { EXAM_BANKS } = require('./utils/examBank');
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
const HOME_BGM_SRC = 'assets/audio/popbgm.mp3';
const GAME_BGM_SRC = 'assets/audio/startgamebgm.mp3';
const ROBOT_IMG_SRC = 'assets/img/robot.png';
const WELCOME_TITLE = '亲爱的天选打工人';
const WELCOME_COPY = '欢迎来到天工一号';

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
  status: 'launching',
  paused: false,
  launchHome: true,
  launchProgress: 6,
  launchStartedAt: 0,
  launchDuration: 4300,
  launchEntered: false,
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
  freezeDrops: [],
  slowdownDrops: [],
  nextBugAt: INTERFERENCE.firstAt,
  nextNeedleAt: 12,
  nextFreezeAt: 0,
  nextSlowdownAt: 0,
  bugSpawnedThisRound: false,
  droppedItemsThisRound: {},
  droppedAnyItemThisRound: false,
  overtimeTriggeredThisRound: false,
  freezeUntil: 0,
  slowdownUntil: 0,
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
  rankingLoading: false,
  rankingError: '',
  rankingRequested: false,
  touchStartX: 0,
  touchStartY: 0,
  touchStartPanel: null,
  itemDockPage: 0,
  itemDockSwipeArea: null,
  profileAuthTried: false,
  userInfoButton: null,
  userInfoButtonKey: '',
  toolsExpanded: false,
  pressingTool: null,
  activePressButton: null,
  imageCache: {},
  toast: null,
  buttons: [],
  touchHandledByButton: false,
  lastTick: Date.now()
};

function init() {
  state.profile = loadProfile();
  grantTestBonus(state.profile);
  getCachedImage(ROBOT_IMG_SRC);
  startLaunchLoading();
  bindAppAutoCheckInHook();
  tryAutoCheckIn();
  wx.onTouchStart(handleTouch);
  wx.onTouchEnd(handleTouchEnd);
  wx.onTouchCancel(handleTouchEnd);
  wx.onShow(() => {
    tryAutoCheckIn();
    if (state.status === 'paused' && state.profile.autoCheckIn) {
      state.paused = false;
    }
  });
  wx.onHide(() => {
    if (state.status === 'running') state.paused = true;
  });
  setInterval(loop, 1000 / 30);
  trackEvent('game_open', {});
}

function bindAppAutoCheckInHook() {
  if (state.autoCheckInHookBound) return;
  state.autoCheckInHookBound = true;
  const app = typeof getApp === 'function' ? getApp() : null;
  if (app && app.globalData) {
    app.globalData.tryAutoCheckIn = () => {
      tryAutoCheckIn();
    };
  }
}

function tryAutoCheckInFromAppShow() {
  tryAutoCheckIn();
}

function tryAutoCheckIn() {
  const profile = loadProfile();
  state.profile = profile;
  if (!profile.autoCheckIn) return false;
  if (!isFormalProfile(profile)) return false;
  if (profile.lastCheckInDate === todayKey()) return false;
  performCheckIn(true);
  return true;
}

function loop() {
  const now = Date.now();
  stepLaunchLoading(now);
  if (state.status === 'running' && !state.paused && !state.modal && now - state.lastTick >= 1000) {
    stepGame();
    state.lastTick = now;
  }
  draw();
}

function startLaunchLoading() {
  state.launchHome = true;
  state.launchEntered = false;
  state.launchStartedAt = Date.now();
  state.launchProgress = 6;
  state.status = 'launching';
  syncMusic();
}

function stepLaunchLoading(now) {
  if (!state.launchHome || state.launchEntered) return;
  const elapsed = Math.max(0, now - state.launchStartedAt);
  const ratio = Math.min(1, elapsed / state.launchDuration);
  const eased = 1 - Math.pow(1 - ratio, 2.2);
  state.launchProgress = Math.min(100, Math.max(6, Math.floor(6 + eased * 94)));
  if (ratio >= 1) finishLaunchLoading();
}

function finishLaunchLoading() {
  if (state.launchEntered) return;
  state.launchEntered = true;
  state.launchProgress = 100;
  setTimeout(() => {
    state.launchHome = false;
    state.status = 'idle';
    showWelcomePrompt();
  }, 180);
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

function showWelcomePrompt() {
  state.alertOverlay = {
    title: WELCOME_TITLE,
    copy: WELCOME_COPY,
    theme: 'welcome',
    until: Date.now() + 3200
  };
  playWelcomeSfx();
}

function playWelcomeSfx() {
  if (state.profile.sfxEnabled === false || !wx.createInnerAudioContext) return;
  if (!state.welcomeAudio) {
    state.welcomeAudio = wx.createInnerAudioContext();
    state.welcomeAudio.src = 'assets/audio/click.wav';
    state.welcomeAudio.volume = 0.5;
  }
  state.welcomeAudio.stop();
  state.welcomeAudio.play();
}

function saveAuthorizedProfile(userInfo) {
  const profile = loadProfile();
  const prevReady = isProfileReady(profile);
  if (userInfo && userInfo.nickName) profile.nickname = userInfo.nickName;
  if (userInfo && userInfo.avatarUrl) profile.avatarUrl = userInfo.avatarUrl;
  if (!profile.motto) profile.motto = '稳住心态写代码';
  profile.testAccount = profile.testAccount || isTestAccount(profile);
  state.profile = saveProfile(maybeGrantProfileReward(profile));
  grantTestBonus(state.profile);
  if (!prevReady && isProfileReady(state.profile)) tryAutoCheckIn();
  return state.profile;
}

function isFormalRound(profile) {
  return isFormalProfile(profile);
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
  beginRound();
}

function beginRound() {
  state.profile = loadProfile();
  const rank = RANKS[state.profile.rankIndex];
  const ranked = isFormalRound(state.profile);
  Object.assign(state, {
    status: 'running',
    paused: false,
    timeLeft: GAME.duration,
    duration: GAME.duration,
    progress: GAME.initialProgress,
    mood: GAME.initialMood,
    moodCap: 100,
    currentRoundRanked: ranked,
    elapsed: 0,
    perfect: true,
    acceptedOvertimes: [],
    eventSchedule: createEventSchedule(rank.events, GAME.duration),
    bugBalls: [],
    needles: [],
    freezeDrops: [],
    slowdownDrops: [],
    nextBugAt: INTERFERENCE.firstAt,
    nextNeedleAt: 12 + Math.floor(Math.random() * 6),
    nextFreezeAt: shouldDropFreeze(state.profile.rankIndex) ? INTERFERENCE.freezeDropStart + Math.floor(Math.random() * (INTERFERENCE.freezeDropEnd - INTERFERENCE.freezeDropStart + 1)) : 0,
    nextSlowdownAt: INTERFERENCE.slowdownDropStart + Math.floor(Math.random() * (INTERFERENCE.slowdownDropEnd - INTERFERENCE.slowdownDropStart + 1)),
    bugSpawnedThisRound: false,
    droppedItemsThisRound: {},
    droppedAnyItemThisRound: false,
    overtimeTriggeredThisRound: false,
    freezeUntil: 0,
    slowdownUntil: 0,
    triggeredOvertime: {},
    alertOverlay: null,
    modal: null,
    failOverlay: null,
    itemDockPage: 0,
    toast: null,
    lastTick: Date.now()
  });
  syncMusic();
  trackEvent('round_start', { rankIndex: state.profile.rankIndex, ranked, guest: !ranked });
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
  if (!isFreezeActive()) {
    const drains = getActiveDrains(rank, overtimeDrain);
    state.progress = clamp(state.progress - drains.progress);
    state.mood = clamp(state.mood - drains.mood, 0, state.moodCap);
  }
  state.timeLeft = Math.max(state.duration - state.elapsed, 0);
  if (state.progress < GAME.perfectLine || state.mood < GAME.perfectLine) state.perfect = false;
  if (!isFreezeActive()) tryTriggerEvent();
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
  if (isFreezeActive()) {
    state.bugBalls = [];
  }
  if (!isFreezeActive() && shouldSpawnBugThisRound(rankIndex) && state.elapsed >= state.nextBugAt) {
    spawnBugBall(rankIndex);
    state.bugSpawnedThisRound = true;
    state.nextBugAt += Math.max(INTERFERENCE.minInterval, INTERFERENCE.baseInterval - Math.floor(rankIndex / 2));
  }
  trySpawnRoundDrop();
  const fallSpeed = (INTERFERENCE.baseFallSpeed + rankIndex * INTERFERENCE.speedStep) * (isSlowdownActive() ? INTERFERENCE.slowdownFallFactor : 1);
  state.bugBalls.forEach((bug) => {
    bug.y += fallSpeed;
    bug.age += 1;
    const growAfter = isSlowdownActive() ? INTERFERENCE.slowdownGrowAfter : INTERFERENCE.growAfter;
    if (!bug.big && bug.age >= growAfter) {
      bug.big = true;
      bug.radius = 16;
      if (!isFreezeActive()) {
        state.mood = clamp(state.mood - INTERFERENCE.growMoodDamage, 0, state.moodCap);
        showAlert('BUG 变大了！', `心态指数 -${INTERFERENCE.growMoodDamage}，落入终端将造成更高损耗`);
      } else {
        showAlert('冰封拦截中！', 'BUG 变大未扣除心态指数', 'freeze');
      }
    }
  });
  state.needles.forEach((needle) => {
    needle.y += 0.11;
  });
  state.freezeDrops.forEach((drop) => {
    drop.y += 0.1;
    drop.spin += 0.16;
  });
  state.slowdownDrops.forEach((drop) => {
    drop.y += 0.095;
    drop.spin += 0.13;
  });
  state.bugBalls = state.bugBalls.filter((bug) => {
    if (bug.y < 1) return true;
    const progressDamage = bug.big ? INTERFERENCE.bigDamage : INTERFERENCE.smallDamage;
    const moodDamage = bug.big ? INTERFERENCE.bigMoodDamage : INTERFERENCE.smallMoodDamage;
    if (!isFreezeActive()) {
      state.progress = clamp(state.progress - progressDamage);
      state.mood = clamp(state.mood - moodDamage, 0, state.moodCap);
      showAlert('BUG 击中开发终端！', `开发进度 -${progressDamage}，心态指数 -${moodDamage}`);
    } else {
      showAlert('冰封护盾挡住BUG！', '冻结期间未扣除开发进度和心态指数', 'freeze');
    }
    return false;
  });
  state.needles = state.needles.filter((needle) => {
    if (needle.y < 1) return true;
    collectDroppedItem('needle', '获得破Bug针！', '已进入随身道具，需手动使用');
    return false;
  });
  state.freezeDrops = state.freezeDrops.filter((drop) => {
    if (drop.y < 1) return true;
    collectDroppedItem('freeze', '获得冻结球雪花！', '已进入随身道具，使用后5秒内不再扣除双数值', 'freeze');
    return false;
  });
  state.slowdownDrops = state.slowdownDrops.filter((drop) => {
    if (drop.y < 1) return true;
    collectDroppedItem('slowdown', '获得宕速球！', '已进入随身道具，使用后8秒内放缓扣减和BUG', 'slowdown');
    return false;
  });
}

function trySpawnRoundDrop() {
  if (state.droppedAnyItemThisRound) return;
  const candidates = [];
  if (!state.droppedItemsThisRound.needle && state.elapsed >= state.nextNeedleAt && Math.random() < INTERFERENCE.needleDropChance) {
    candidates.push({
      id: 'needle',
      spawn: spawnNeedle,
      after: () => {
        state.nextNeedleAt = state.elapsed + 9 + Math.floor(Math.random() * 8);
      }
    });
  }
  if (!state.droppedItemsThisRound.freeze && state.nextFreezeAt && state.elapsed >= state.nextFreezeAt) {
    candidates.push({
      id: 'freeze',
      spawn: spawnFreezeDrop,
      after: () => {
        state.nextFreezeAt = 0;
      }
    });
  }
  if (!state.droppedItemsThisRound.slowdown && state.nextSlowdownAt && state.elapsed >= state.nextSlowdownAt) {
    candidates.push({
      id: 'slowdown',
      spawn: spawnSlowdownDrop,
      after: () => {
        state.nextSlowdownAt = 0;
      }
    });
  }
  if (!candidates.length) return;
  const chosen = randomFrom(candidates);
  chosen.spawn();
  state.droppedItemsThisRound[chosen.id] = true;
  state.droppedAnyItemThisRound = true;
  chosen.after();
}

function getActiveDrains(rank, overtimeDrain) {
  const progress = GAME.progressDrain + rank.drainBonus + overtimeDrain.progress;
  const mood = GAME.moodDrain + rank.drainBonus + overtimeDrain.mood;
  if (!isSlowdownActive()) return { progress, mood };
  return {
    progress: Math.min(progress, INTERFERENCE.slowdownDrain),
    mood: Math.min(mood, INTERFERENCE.slowdownDrain)
  };
}

function collectDroppedItem(itemId, title, copy, theme) {
  const profile = loadProfile();
  profile.items[itemId] = (profile.items[itemId] || 0) + 1;
  state.profile = saveProfile(profile);
  showAlert(title, copy, theme);
}

function shouldSpawnBugThisRound(rankIndex) {
  return rankIndex > INTERFERENCE.freezeRankLimit || !state.bugSpawnedThisRound;
}

function spawnBugBall(rankIndex) {
  if (isFreezeActive()) return;
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
  showAlert('破Bug针掉落！', '接住后进入随身道具，需手动使用');
}

function shouldDropFreeze(rankIndex) {
  return (rankIndex || 0) <= INTERFERENCE.freezeRankLimit;
}

function spawnFreezeDrop() {
  state.freezeDrops.push({
    id: Date.now() + Math.random(),
    x: 0.18 + Math.random() * 0.64,
    y: -0.06,
    spin: Math.random() * Math.PI * 2
  });
  showAlert('冻结雪花掉落！', '接住后进入随身道具，需手动使用', 'freeze');
}

function spawnSlowdownDrop() {
  state.slowdownDrops.push({
    id: Date.now() + Math.random(),
    x: 0.18 + Math.random() * 0.64,
    y: -0.06,
    spin: Math.random() * Math.PI * 2
  });
  showAlert('宕速球掉落！', '接住后进入随身道具，需手动使用', 'slowdown');
}

function isFreezeActive() {
  return state.freezeUntil && state.elapsed < state.freezeUntil;
}

function isSlowdownActive() {
  return state.slowdownUntil && state.elapsed < state.slowdownUntil;
}

function activateFreeze() {
  state.freezeUntil = Math.max(state.freezeUntil || 0, state.elapsed + INTERFERENCE.freezeDuration);
  state.bugBalls = [];
  showAlert('冻结雪花生效！', `${INTERFERENCE.freezeDuration}秒内冻结双容器，不触发扣减事件`, 'freeze');
}

function activateSlowdown() {
  state.slowdownUntil = Math.max(state.slowdownUntil || 0, state.elapsed + INTERFERENCE.slowdownDuration);
  showAlert('宕速球生效！', `${INTERFERENCE.slowdownDuration}秒内双数值每秒仅扣1，BUG速度放缓`, 'slowdown');
}

function showAlert(title, copy, theme = 'danger') {
  state.alertOverlay = { title, copy, theme, until: Date.now() + 1500 };
}

function tryTriggerEvent() {
  if (isFreezeActive()) return;
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
  if (state.overtimeTriggeredThisRound) return;
  if (!GAME.overtimeAt.includes(state.timeLeft) || state.triggeredOvertime[state.timeLeft]) return;
  state.overtimeTriggeredThisRound = true;
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
  const extraTime = modal.extraTime || 0;
  const moodPenalty = modal.acceptMoodPenalty || 0;
  state.duration += extraTime;
  state.timeLeft += extraTime;
  state.mood = clamp(state.mood - moodPenalty, 0, state.moodCap);
  if (modal.moodCapDrop) {
    state.moodCap = Math.max(70, state.moodCap - modal.moodCapDrop);
    state.mood = Math.min(state.mood, state.moodCap);
  }
  state.modal = null;
  if (moodPenalty) showAlert('加班通知已接受', `时长 +${extraTime}s，心态指数 -${moodPenalty}`);
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
  if (id === 'mood') state.mood = clamp(state.mood + 20, 0, state.moodCap);
  if (id === 'progress') {
    state.progress = clamp(state.progress + 15);
    state.mood = clamp(state.mood - 8, 0, state.moodCap);
    showAlert('工作加急卡生效！', '开发进度 +15%，心态指数 -8%');
  }
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
  if (id === 'freeze') {
    activateFreeze();
  }
  if (id === 'slowdown') {
    activateSlowdown();
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
  if (!isFormalRound(profile)) {
    state.modal = {
      type: 'success',
      title: '游客体验通关',
      copy: '本局未完成隐私授权，不计入排行榜和个人累计积分。',
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
      rewards.push('熬夜加班工位');
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
  if (!isFormalRound(profile)) {
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
  const bonusBean = state.mood > 20;
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
    copy: bonusBean
      ? '您的心态指数剩余较多，良好的心态是进度的基石，送您一颗效率豆，接下来一定更好！'
      : randomFrom(FAILURE_TEXTS),
    rewards: bonusBean ? ['效率豆 +1'] : [],
    bonusBean
  };
  state.failOverlay = null;
  state.status = 'finished';
  trackEvent('round_fail', { rankIndex: profile.rankIndex });
}

function claimFailureBean() {
  if (!state.modal || !state.modal.bonusBean) return;
  const profile = loadProfile();
  profile.items.bean = (profile.items.bean || 0) + 1;
  state.profile = saveProfile(profile);
  state.modal = null;
  state.status = 'idle';
  syncMusic();
  showToast('已获得效率豆', 1400);
  trackEvent('fail_bonus_claim', {});
}

function performCheckIn(auto) {
  const profile = loadProfile();
  if (!isFormalProfile(profile)) {
    if (!auto) showAlert('资料未完善', '请先完善个人信息,游客不能打卡签到');
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
  ensurePrivacyAccepted(() => {
    beginRound();
  }, () => {
    const profile = loadProfile();
    profile.friendAuth = false;
    profile.leaderboardEnabled = false;
    state.profile = saveProfile(profile);
    showToast('游客模式体验，本局不计入排行榜');
    beginRound();
  });
}

function requestFriendAuthThenStart() {
  requestFriendAuth(() => beginRound(), () => beginRound());
}

function ensurePrivacyAccepted(onAccepted, onRejected) {
  const profile = loadProfile();
  if (profile.privacyAccepted) {
    state.profile = profile;
    if (typeof onAccepted === 'function') onAccepted(profile);
    return;
  }
  const accept = () => {
    const current = loadProfile();
    current.privacyAccepted = true;
    state.profile = saveProfile(current);
    if (typeof onAccepted === 'function') onAccepted(state.profile);
  };
  const reject = () => {
    const current = loadProfile();
    current.privacyAccepted = false;
    state.profile = saveProfile(current);
    if (typeof onRejected === 'function') onRejected(state.profile);
  };
  if (!wx.requirePrivacyAuthorize) {
    accept();
    return;
  }
  wx.requirePrivacyAuthorize({
    success: accept,
    fail: reject
  });
}

function requestFriendAuth(onAccepted, onRejected) {
  const apply = (enabled) => {
    const profile = loadProfile();
    profile.friendAuth = !!enabled;
    profile.leaderboardEnabled = !!enabled;
    if (enabled) profile.privacyAccepted = true;
    state.profile = saveProfile(profile);
    if (enabled && typeof onAccepted === 'function') onAccepted(state.profile);
    if (!enabled && typeof onRejected === 'function') onRejected(state.profile);
  };
  if (state.profile.friendAuth || state.profile.leaderboardEnabled) {
    apply(true);
    return;
  }
  const authorizeWxFriend = (done) => {
    if (!wx.authorize) {
      done(true);
      return;
    }
    wx.authorize({
      scope: 'scope.WxFriendInteraction',
      success: () => done(true),
      fail: () => done(false)
    });
  };
  wx.showModal({
    title: '开启匿名排行榜',
    content: '开启后仅同步脱敏代号、段位、晋升积分、通关次数和完美通关次数；不上传头像、微信昵称原文、宣言、背包和历史对局明细。',
    confirmText: '开启',
    cancelText: '暂不开启',
    success(res) {
      if (!res.confirm) {
        apply(false);
        return;
      }
      authorizeWxFriend((ok) => {
        apply(ok);
        showToast(ok ? '已开启匿名排行榜' : '排行榜授权未完成');
      });
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
  grantTestBonus(state.profile);
  state.panel = 'settings';
}

function authorizeWechatProfile(done) {
  ensurePrivacyAccepted(() => {
    if (!wx.getUserProfile) {
      showToast('当前版本不支持微信资料授权，请手动完善资料');
      if (typeof done === 'function') done(false);
      return;
    }
    wx.getUserProfile({
      desc: '用于回填天工一号头像和昵称',
      success(res) {
        saveAuthorizedProfile(res.userInfo || {});
        state.toast = isProfileReady(state.profile) ? '已回填微信头像昵称' : '头像昵称已回填，请补充宣言';
        trackEvent('profile_auth', {});
        if (typeof done === 'function') done(true);
      },
      fail() {
        showToast('请授权微信头像昵称后回填');
        if (typeof done === 'function') done(false);
      }
    });
  }, () => {
    showToast('请先同意隐私协议后再授权头像昵称');
    if (typeof done === 'function') done(false);
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
      const prevReady = isProfileReady(profile);
      profile.nickname = value.slice(0, 12);
      state.profile = saveProfile(maybeGrantProfileReward(profile));
      if (!prevReady && isProfileReady(state.profile)) tryAutoCheckIn();
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
    const prevReady = isProfileReady(profile);
    profile.avatarUrl = path;
    state.profile = saveProfile(maybeGrantProfileReward(profile));
    if (!prevReady && isProfileReady(state.profile)) tryAutoCheckIn();
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

function grantTestBonus(profile) {
  const current = profile || loadProfile();
  const needsTopUp = current.items && Object.keys(createDefaultProfile().items).some((key) => (current.items[key] || 0) < 10);
  if (!isTestAccount(current) || (!needsTopUp && (current.testBonusVersion || 0) >= 1)) return;
  current.items = current.items || {};
  Object.keys(createDefaultProfile().items).forEach((key) => {
    current.items[key] = Math.max(current.items[key] || 0, 10);
  });
  current.testBonusGranted = true;
  current.testBonusVersion = 1;
  current.testAccount = true;
  state.profile = saveProfile(current);
  return state.profile;
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
      const prevReady = isProfileReady(profile);
      profile.motto = value.slice(0, 20);
      state.profile = saveProfile(maybeGrantProfileReward(profile));
      if (!prevReady && isProfileReady(state.profile)) tryAutoCheckIn();
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
  if (profile.autoCheckIn) tryAutoCheckIn();
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
  if (!isFormalRound(profile)) {
    showToast('请先完善个人信息,游客不能切换工位');
    return;
  }
  const owned = getVisibleSkins(profile);
  if (!owned.length) {
    showToast('暂无可用皮肤');
    return;
  }
  wx.showActionSheet({
    itemList: owned.map((skin) => `${skin.locked ? '🔒 ' : ''}${skin.name}${skin.id === profile.activeSkin ? ' ✓' : ''}`),
    success(res) {
      const selected = owned[res.tapIndex];
      if (!selected) return;
      if (selected.locked) {
        showToast('当前职级不够，晋升到第三关可解锁');
        return;
      }
      profile.activeSkin = selected.id;
      state.profile = saveProfile(profile);
      showToast(`已切换：${selected.name}`);
    }
  });
}

function getVisibleSkins(profile) {
  return SKINS
    .filter((skin) => profile.skins.includes(skin.id) || skin.unlockRankIndex !== undefined)
    .map((skin) => Object.assign({}, skin, {
      locked: !isSkinUnlocked(skin.id, profile.rankIndex)
    }));
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
  }
  const bgmSrc = getCurrentBgmSrc();
  if (state.bgmSrc !== bgmSrc) {
    state.bgm.stop();
    state.bgm.src = bgmSrc;
    state.bgmSrc = bgmSrc;
  }
  if (state.profile.musicEnabled === false) {
    state.bgm.stop();
    return;
  }
  state.bgm.volume = state.profile.musicVolume || 0.3;
  if (state.bgm.src) state.bgm.play();
}

function getCurrentBgmSrc() {
  return state.status === 'running' || state.status === 'ending' || state.status === 'finished'
    ? GAME_BGM_SRC
    : HOME_BGM_SRC;
}

function draw() {
  state.buttons = [];
  if (state.launchHome) {
    drawLaunchHome();
    if (state.toast) drawToast(state.toast);
    return;
  }
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
    chosen: ['#eef5e9', '#fff8e8'],
    calm: ['#e1f4dc', '#f5fbef'],
    knight: ['#101820', '#25313a'],
    blue: ['#e9f5ff', '#eff8ee'],
    green: ['#ddf7e9', '#fff8e8'],
    orange: ['#fff0d8', '#eaf4ff'],
    aurora: ['#e5fff5', '#f4edff'],
    night: ['#1f3144', '#3d4f62']
  }[skin.tone] || ['#eef5e9', '#f8faf0'];
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  drawSkinStageBackground(skin.tone);
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.36, 10, W * 0.5, H * 0.36, W * 0.72);
  const darkTone = skin.tone === 'night' || skin.tone === 'knight';
  glow.addColorStop(0, darkTone ? 'rgba(117,214,255,.12)' : 'rgba(94,184,132,.15)');
  glow.addColorStop(0.55, darkTone ? 'rgba(255,167,211,.06)' : 'rgba(255,196,137,.08)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

function drawSkinStageBackground(tone) {
  const top = Math.max(88, safeTop - 22);
  const bottom = H - 88;
  const stageH = Math.max(220, bottom - top);
  const isDark = tone === 'night' || tone === 'knight';
  const cream = isDark ? 'rgba(255,255,255,.05)' : 'rgba(255,252,235,.58)';
  const border = isDark ? 'rgba(174,224,255,.12)' : 'rgba(47,95,80,.08)';

  ctx.save();
  ctx.fillStyle = cream;
  roundRect(14, top, W - 28, stageH, 18, true);
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.4;
  roundRect(14.5, top + 0.5, W - 29, stageH - 1, 18, false);
  ctx.stroke();

  if (tone === 'chosen') drawChosenStage(top, bottom);
  else if (tone === 'blue') drawBlueStage(top, bottom);
  else if (tone === 'green') drawMintStage(top, bottom);
  else if (tone === 'orange') drawOrangeStage(top, bottom);
  else if (tone === 'aurora') drawAuroraStage(top, bottom);
  else if (tone === 'knight') drawKnightStage(top, bottom);
  else if (tone === 'night') drawNightStage(top, bottom);
  else drawCalmStage(top, bottom);

  ctx.restore();
}

function drawChosenStage(top, bottom) {
  drawSoftHill(-26, bottom - 124, W * 0.72, 112, '#d9efc8', 'rgba(107,180,122,.12)');
  drawSoftHill(W * 0.48, bottom - 108, W * 0.66, 94, '#f4e7b8', 'rgba(196,148,72,.1)');
  drawWindingPath([
    [W * 0.14, bottom - 34],
    [W * 0.34, bottom - 112],
    [W * 0.48, top + 188],
    [W * 0.54, top + 132],
    [W * 0.82, top + 76]
  ], 34, '#fff2c5', 'rgba(178,139,68,.18)');
  drawPixelSprinkles('#8bc785', '#f2c76f', 0.2);
}

function drawCalmStage(top, bottom) {
  const path = [
    [W * 0.16, bottom - 34],
    [W * 0.36, bottom - 112],
    [W * 0.29, top + 210],
    [W * 0.54, top + 148],
    [W * 0.78, top + 78]
  ];
  drawSoftHill(-30, bottom - 130, W * 0.74, 118, '#cfeeca', 'rgba(107,180,122,.14)');
  drawSoftHill(W * 0.43, bottom - 118, W * 0.72, 98, '#dff4ca', 'rgba(107,180,122,.12)');
  drawWindingPath(path, 34, '#eaf9cb', 'rgba(82,144,64,.2)');
  drawPathSideGrass(path, 28, '#77c985', '#4ba767');
  drawStageGrass(top, bottom, '#77c985', '#4ba767');
  drawPixelSprinkles('#79c48c', '#f3d28b', 0.22);
}

function drawBlueStage(top, bottom) {
  drawWindingPath([
    [W * 0.12, bottom - 40],
    [W * 0.26, bottom - 138],
    [W * 0.66, bottom - 176],
    [W * 0.73, top + 132],
    [W * 0.9, top + 70]
  ], 30, 'rgba(223,244,255,.84)', 'rgba(74,137,180,.2)');
  drawCircuitGrid(top, bottom, '#8dc7e8');
  drawPixelSprinkles('#80bce0', '#b6e4ff', 0.2);
}

function drawMintStage(top, bottom) {
  drawSoftHill(-40, bottom - 126, W * 0.82, 126, '#bff0d1', 'rgba(63,150,98,.14)');
  drawSoftHill(W * 0.48, bottom - 150, W * 0.62, 118, '#d8f6d6', 'rgba(63,150,98,.12)');
  drawWindingPath([
    [W * 0.2, bottom - 42],
    [W * 0.48, bottom - 120],
    [W * 0.4, top + 190],
    [W * 0.76, top + 116]
  ], 32, '#e9ffd7', 'rgba(85,165,94,.22)');
  drawStageGrass(top, bottom, '#5fcf91', '#2fa86d');
  drawPixelSprinkles('#5ecb91', '#f6e8a5', 0.22);
}

function drawOrangeStage(top, bottom) {
  drawSoftHill(-20, bottom - 130, W * 0.72, 110, '#ffdcae', 'rgba(218,142,64,.16)');
  drawSoftHill(W * 0.42, bottom - 112, W * 0.74, 96, '#ffe9c8', 'rgba(218,142,64,.12)');
  drawWindingPath([
    [W * 0.13, bottom - 34],
    [W * 0.34, bottom - 110],
    [W * 0.6, bottom - 178],
    [W * 0.56, top + 130],
    [W * 0.82, top + 74]
  ], 34, '#fff0bd', 'rgba(190,111,44,.22)');
  drawPixelSprinkles('#efb36a', '#f7d979', 0.22);
}

function drawAuroraStage(top, bottom) {
  const auroraA = ctx.createLinearGradient(0, top, W, bottom);
  auroraA.addColorStop(0, 'rgba(100,239,187,.2)');
  auroraA.addColorStop(0.5, 'rgba(170,143,255,.16)');
  auroraA.addColorStop(1, 'rgba(255,180,219,.12)');
  ctx.fillStyle = auroraA;
  ctx.beginPath();
  ctx.moveTo(20, top + 76);
  ctx.bezierCurveTo(W * 0.24, top + 18, W * 0.38, top + 146, W * 0.62, top + 82);
  ctx.bezierCurveTo(W * 0.78, top + 36, W * 0.86, top + 92, W - 22, top + 52);
  ctx.lineTo(W - 22, top + 138);
  ctx.bezierCurveTo(W * 0.76, top + 184, W * 0.48, top + 128, 20, top + 190);
  ctx.closePath();
  ctx.fill();
  drawWindingPath([
    [W * 0.18, bottom - 38],
    [W * 0.42, bottom - 116],
    [W * 0.38, top + 190],
    [W * 0.68, top + 118],
    [W * 0.84, top + 76]
  ], 30, 'rgba(242,255,239,.78)', 'rgba(126,104,190,.16)');
  drawPixelSprinkles('#84e8bd', '#c9b7ff', 0.24);
}

function drawNightStage(top, bottom) {
  ctx.fillStyle = 'rgba(11,25,36,.22)';
  ctx.fillRect(14, top, W - 28, bottom - top);
  drawCircuitGrid(top, bottom, '#6fd8ff', 0.28);
  drawWindingPath([
    [W * 0.15, bottom - 34],
    [W * 0.3, bottom - 126],
    [W * 0.66, bottom - 156],
    [W * 0.7, top + 132],
    [W * 0.88, top + 74]
  ], 28, 'rgba(87,121,144,.48)', 'rgba(155,226,255,.2)');
  drawPixelSprinkles('#6fd8ff', '#ff97cf', 0.28);
}

function drawKnightStage(top, bottom) {
  const panel = ctx.createLinearGradient(0, top, 0, bottom);
  panel.addColorStop(0, 'rgba(18,27,36,.72)');
  panel.addColorStop(0.56, 'rgba(33,44,54,.82)');
  panel.addColorStop(1, 'rgba(10,16,22,.9)');
  ctx.fillStyle = panel;
  ctx.fillRect(14, top, W - 28, bottom - top);
  drawKeyboardStage(top, bottom);
  drawPixelSprinkles('#6fd8ff', '#9b7cff', 0.18);
}

function drawKeyboardStage(top, bottom) {
  ctx.save();
  const pad = 30;
  const keyW = Math.max(26, Math.min(42, W / 9.5));
  const keyH = 24;
  const gap = 7;
  const startY = top + 34;
  let row = 0;
  for (let y = startY; y < bottom - 28; y += keyH + gap) {
    const offset = row % 2 ? keyW * 0.45 : 0;
    for (let x = pad + offset; x < W - pad - keyW; x += keyW + gap) {
      const glow = (row + Math.floor(x / keyW)) % 5 === 0;
      ctx.fillStyle = glow ? 'rgba(111,216,255,.2)' : 'rgba(255,255,255,.055)';
      roundRect(x, y, keyW, keyH, 5, true);
      ctx.strokeStyle = glow ? 'rgba(111,216,255,.34)' : 'rgba(111,216,255,.1)';
      ctx.lineWidth = 1;
      roundRect(x + 0.5, y + 0.5, keyW - 1, keyH - 1, 5, false);
      ctx.stroke();
    }
    row += 1;
  }
  ctx.restore();
}

function drawPathSideGrass(points, offset, color, dark) {
  ctx.save();
  points.forEach(([x, y], index) => {
    [-1, 1].forEach((side) => {
      const gx = x + side * offset;
      const gy = y + (index % 2 ? 5 : -4);
      ctx.strokeStyle = index % 2 ? dark : color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.quadraticCurveTo(gx + (i + side * .25) * 7, gy - 12, gx + (i + side * .5) * 14, gy - 17);
        ctx.stroke();
      }
    });
  });
  ctx.restore();
}

function drawWindingPath(points, width, fill, stroke) {
  if (!points.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width + 8;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    ctx.quadraticCurveTo(prev[0], prev[1], (prev[0] + current[0]) / 2, (prev[1] + current[1]) / 2);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.stroke();
  ctx.strokeStyle = fill;
  ctx.lineWidth = width;
  ctx.stroke();
  if (ctx.setLineDash) {
    ctx.setLineDash([2, 14]);
    ctx.strokeStyle = 'rgba(255,255,255,.36)';
    ctx.lineWidth = Math.max(2, width * 0.12);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawSoftHill(x, y, w, h, fill, shadow) {
  ctx.save();
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.9);
  ctx.bezierCurveTo(x + w * 0.18, y + h * 0.62, x + w * 0.82, y + h * 0.62, x + w, y + h * 0.9);
  ctx.bezierCurveTo(x + w * 0.82, y + h * 1.18, x + w * 0.18, y + h * 1.18, x, y + h * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.bezierCurveTo(x + w * 0.2, y + h * 0.2, x + w * 0.8, y + h * 0.2, x + w, y + h);
  ctx.lineTo(x + w, y + h + 20);
  ctx.lineTo(x, y + h + 20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStageGrass(top, bottom, color, dark) {
  ctx.save();
  const tufts = [
    [W * 0.16, top + 118, 0.9],
    [W * 0.84, top + 150, 0.75],
    [W * 0.1, bottom - 168, 0.8],
    [W * 0.86, bottom - 108, 1],
    [W * 0.52, bottom - 72, 0.7]
  ];
  tufts.forEach(([x, y, s], index) => {
    ctx.strokeStyle = index % 2 ? dark : color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + i * 8 * s, y - 13 * s, x + i * 16 * s, y - 18 * s);
      ctx.stroke();
    }
  });
  ctx.restore();
}

function drawCircuitGrid(top, bottom, color, alpha = 0.2) {
  ctx.save();
  ctx.strokeStyle = hexToRgba(color, alpha);
  ctx.lineWidth = 1;
  for (let x = 28; x < W; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, top + 20);
    ctx.lineTo(x, bottom - 20);
    ctx.stroke();
  }
  for (let y = top + 32; y < bottom; y += 42) {
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(W - 24, y);
    ctx.stroke();
  }
  ctx.fillStyle = hexToRgba(color, alpha + 0.12);
  for (let i = 0; i < 12; i += 1) {
    circle(34 + (i * 53) % Math.max(60, W - 68), top + 36 + (i * 71) % Math.max(80, bottom - top - 72), 2.4);
  }
  ctx.restore();
}

function drawPixelSprinkles(a, b, alpha) {
  ctx.save();
  const top = Math.max(98, safeTop + 10);
  const bottom = H - 116;
  for (let i = 0; i < 30; i += 1) {
    const x = 24 + (i * 47) % Math.max(80, W - 48);
    const y = top + (i * 83) % Math.max(100, bottom - top);
    const size = 3 + (i % 3) * 2;
    ctx.fillStyle = hexToRgba(i % 2 ? a : b, alpha * (0.6 + (i % 4) * 0.12));
    if (i % 5 === 0) circle(x, y, size * 0.58);
    else ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawLaunchHome() {
  const now = Date.now();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#b9f37d';
  ctx.fillRect(0, 0, W, H);
  drawLaunchSunPanel();
  drawLaunchSky(now);
  drawLaunchPillars();
  drawLaunchRunner(W / 2, Math.min(H * 0.41, 360), now);
  drawLaunchStatus();
  drawLaunchCompliance();
}

function drawLaunchSunPanel() {
  const panelH = Math.max(170, Math.min(245, H * 0.27));
  const notchY = panelH - 26;
  const grad = ctx.createLinearGradient(0, 0, 0, panelH);
  grad.addColorStop(0, '#ffe94a');
  grad.addColorStop(1, '#ffef62');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, notchY);
  ctx.lineTo(W * 0.84, panelH);
  ctx.lineTo(W * 0.5, notchY - 18);
  ctx.lineTo(W * 0.16, panelH);
  ctx.lineTo(0, notchY);
  ctx.closePath();
  ctx.fill();
  const titleSize = Math.max(40, Math.min(58, W * 0.135));
  drawText('天工一号', W / 2, safeTop * 0.45 + titleSize, titleSize, '#050505', '900', 'center');
  drawText('码农大闯关', W / 2, safeTop * 0.45 + titleSize * 2.04, titleSize, '#050505', '900', 'center');
}

function drawLaunchSky(now) {
  const top = Math.max(170, Math.min(245, H * 0.27)) - 8;
  const skyH = Math.max(330, H * 0.48);
  const grad = ctx.createLinearGradient(0, top, 0, top + skyH);
  grad.addColorStop(0, '#70d9e7');
  grad.addColorStop(0.78, '#84eee9');
  grad.addColorStop(1, '#fff6e8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, top, W, skyH);

  drawLaunchGrass(W * 0.18 + Math.sin(now / 800) * 4, top + skyH * 0.24, 1);
  drawLaunchGrass(W * 0.78 + Math.cos(now / 780) * 4, top + skyH * 0.18, 0.82);
  drawLaunchGrass(W * 0.9, top + skyH * 0.78, 0.72);

  const ropeY = top + skyH * 0.58;
  drawLaunchOutlineText('工作', 42, ropeY - 42, 22);
  drawLaunchOutlineText('生活', W - 66, ropeY - 42, 22);
  drawLaunchRope(W * 0.17, ropeY + 24, W * 0.84, ropeY - 36, 4);
  drawLaunchRope(W * 0.16, ropeY - 42, W * 0.84, ropeY + 22, 4);
  ctx.fillStyle = 'rgba(255,102,103,.55)';
  circle(W * 0.17, ropeY + 24, 15);
  circle(W * 0.84, ropeY + 22, 15);
}

function drawLaunchGrass(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = 'rgba(34,113,71,.36)';
  ctx.lineWidth = 3;
  [-12, 0, 12].forEach((offset, index) => {
    ctx.beginPath();
    ctx.arc(offset, 0, 13 + index * 2, Math.PI * 1.05, Math.PI * 1.72);
    ctx.stroke();
  });
  ctx.restore();
}

function drawLaunchRope(x1, y1, x2, y2, width) {
  ctx.save();
  ctx.strokeStyle = '#050505';
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(W * 0.36, y1 - 8, W * 0.58, y2 + 8, x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawLaunchOutlineText(text, x, y, size) {
  ctx.save();
  ctx.font = `900 ${size}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#101010';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLaunchRunner(cx, cy, now) {
  const bob = Math.sin(now / 160) * 7;
  const swing = Math.sin(now / 160);
  const s = Math.min(1.05, Math.max(0.82, W / 390));
  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.scale(s, s);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#050505';
  ctx.lineWidth = 6;
  ctx.fillStyle = '#173a55';
  drawLimb(-20, 58, -48 - swing * 18, 106, 17);
  drawLimb(20, 58, 50 + swing * 16, 104, 17);
  ctx.fillStyle = '#050505';
  roundRect(-64 - swing * 18, 102, 42, 16, 9, true);
  roundRect(32 + swing * 16, 101, 42, 16, 9, true);

  ctx.fillStyle = '#f7fbf5';
  drawLimb(-44, -10, -78 + swing * 18, 36, 16);
  drawLimb(46, -18, 78 - swing * 18, -54, 16);
  ctx.fillStyle = '#ffd8aa';
  circle(-80 + swing * 18, 40, 15);
  circle(80 - swing * 18, -56, 15);

  ctx.fillStyle = '#f7fbf5';
  roundRect(-48, -18, 96, 86, 10, true);
  ctx.strokeStyle = '#050505';
  ctx.stroke();
  ctx.strokeStyle = '#75bad1';
  ctx.lineWidth = 2;
  [-22, 0, 22].forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, -14);
    ctx.lineTo(x, 64);
    ctx.stroke();
  });
  [-2, 20, 42].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(-44, y);
    ctx.lineTo(44, y);
    ctx.stroke();
  });

  ctx.strokeStyle = '#050505';
  ctx.lineWidth = 6;
  ctx.fillStyle = '#ffd8aa';
  circle(0, -72, 45);
  ctx.stroke();
  ctx.fillStyle = '#050505';
  roundRect(-45, -116 + swing * 2, 88, 38, 24, true);
  roundRect(-52, -98 + swing * 2, 46, 54, 22, true);
  ctx.fillStyle = '#ffd8aa';
  circle(-43, -62, 14);
  ctx.stroke();
  drawLaunchGlasses();
  ctx.fillStyle = '#f28b64';
  circle(10, -62, 4);
  ctx.strokeStyle = '#050505';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(15, -52, 13, 0.2, Math.PI - 0.1);
  ctx.stroke();

  ctx.restore();
}

function drawLimb(x1, y1, x2, y2, width) {
  ctx.save();
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo((x1 + x2) / 2, (y1 + y2) / 2);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawLaunchGlasses() {
  ctx.strokeStyle = '#050505';
  ctx.lineWidth = 4;
  roundRect(-21, -77, 26, 24, 7, false);
  ctx.stroke();
  roundRect(13, -77, 26, 24, 7, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(5, -65);
  ctx.lineTo(13, -65);
  ctx.stroke();
  ctx.fillStyle = '#050505';
  circle(-8, -65, 3);
  circle(26, -65, 3);
}

function drawLaunchPillars() {
  const h = Math.max(240, H * 0.36);
  const top = H - h;
  const midW = W * 0.44;
  ctx.fillStyle = '#ffb2b8';
  ctx.fillRect(0, top, (W - midW) / 2, h);
  ctx.fillStyle = '#82ebe7';
  ctx.fillRect((W - midW) / 2, top, midW, h);
  ctx.fillStyle = '#ff9faa';
  ctx.fillRect((W + midW) / 2, top, (W - midW) / 2, h);
  ctx.fillStyle = '#fff7e9';
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.lineTo((W - midW) / 2, top);
  ctx.lineTo((W - midW) / 4, top + 42);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo((W + midW) / 2, top);
  ctx.lineTo(W, top);
  ctx.lineTo((W + (W + midW) / 2) / 2, top + 42);
  ctx.closePath();
  ctx.fill();
}

function drawLaunchStatus() {
  const y = Math.min(H - 190, H * 0.73);
  const w = Math.min(230, W - 150);
  const x = (W - w) / 2;
  ctx.fillStyle = 'rgba(255,255,245,.96)';
  roundRect(x, y, w, 58, 29, true);
  ctx.strokeStyle = '#050505';
  ctx.lineWidth = 5;
  ctx.stroke();
  drawText(state.launchProgress >= 100 ? '进入游戏' : '加载中', W / 2, y + 39, 24, '#050505', '900', 'center');
}

function drawLaunchCompliance() {
  const progress = Math.round(state.launchProgress);
  const y = H - 124;
  drawText('健康游戏忠告', W / 2, y, 14, 'rgba(22,43,31,.82)', 'bold', 'center');
  drawText('抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。', W / 2, y + 22, 11, 'rgba(22,43,31,.78)', '', 'center');
  drawText('适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。', W / 2, y + 40, 11, 'rgba(22,43,31,.78)', '', 'center');
  drawText('著作权人：杭州斯滑工作室', W / 2, y + 60, 11, 'rgba(22,43,31,.78)', '', 'center');

  const badgeW = 54;
  const trackX = 30;
  const trackY = y + 74;
  const trackW = W - trackX * 2 - badgeW - 10;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(trackX, trackY, trackW, 18);
  ctx.strokeStyle = '#050505';
  ctx.lineWidth = 3;
  ctx.strokeRect(trackX, trackY, trackW, 18);
  ctx.fillStyle = '#050505';
  ctx.fillRect(trackX, trackY, trackW * progress / 100, 18);
  drawText(`load base config (${progress}%)`, trackX + trackW / 2, trackY + 38, 11, 'rgba(255,255,255,.62)', '', 'center');

  const bx = trackX + trackW + 12;
  const by = trackY - 20;
  ctx.fillStyle = '#69bb3c';
  roundRect(bx, by, badgeW, 64, 5, true);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.46)';
  ctx.lineWidth = 1.5;
  roundRect(bx - 1, by - 1, badgeW + 2, 66, 6, false);
  ctx.stroke();
  drawText('8+', bx + badgeW / 2, by + 28, 24, '#ffffff', '900', 'center');
  drawText('CADPA', bx + badgeW / 2, by + 43, 8, '#ffffff', 'bold', 'center');
  drawText('适龄提示', bx + badgeW / 2, by + 57, 9, '#ffffff', 'bold', 'center');
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
  const owned = getVisibleSkins(state.profile);
  owned.slice(0, 4).forEach((skin, index) => {
    const x = 24 + (index % 2) * ((W - 60) / 2 + 12);
    const y = 474 + Math.floor(index / 2) * 76;
    drawCard(x, y, (W - 60) / 2, 62);
    if (skin.locked) drawSmallLock(x + 12, y + 18);
    drawText(skin.name, x + (skin.locked ? 34 : 12), y + 26, 13, '#27312d', 'bold');
    drawText(skin.locked ? '第三关解锁' : (state.profile.activeSkin === skin.id ? '使用中' : skin.rarity), x + 12, y + 48, 11, '#6f766f');
    addButton(x, y, (W - 60) / 2, 62, () => {
      const profile = loadProfile();
      if (!isFormalRound(profile)) {
        showToast('请先完善个人信息,游客不能切换工位');
        return;
      }
      if (!isSkinUnlocked(skin.id, profile.rankIndex)) {
        showToast('当前职级不够，晋升到第三关可解锁');
        return;
      }
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

function drawSmallLock(x, y) {
  ctx.save();
  ctx.strokeStyle = '#6f766f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 8, y + 7, 6, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = 'rgba(47,95,80,.14)';
  roundRect(x + 1, y + 7, 14, 13, 3, true);
  ctx.strokeStyle = 'rgba(47,95,80,.45)';
  roundRect(x + 1.5, y + 7.5, 13, 12, 3, false);
  ctx.stroke();
  ctx.restore();
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
  const axisX = x + 14;
  const axisTop = y + 82;
  const axisH = Math.max(92, h - 158);
  const gaugeX = x + 50;
  const gaugeY = y + 60;
  drawValueAxis(axisX, axisTop, axisH, value, 'progress');
  drawCapsuleGauge(gaugeX, gaugeY, w - 70, 18, value, 'progress');

  const screenX = x + 38;
  const screenY = y + 88;
  const screenW = w - 58;
  const screenH = h - 158;
  state.devScreen = { x: screenX, y: screenY, w: screenW, h: screenH };

  const baseGrad = ctx.createRadialGradient(screenX + screenW * 0.44, screenY + screenH * 0.3, 8, screenX + screenW * 0.44, screenY + screenH * 0.34, screenW * 0.8);
  baseGrad.addColorStop(0, 'rgba(8,65,30,.9)');
  baseGrad.addColorStop(1, '#06150d');
  ctx.fillStyle = baseGrad;
  roundRect(screenX, screenY, screenW, screenH, 30, true);
  ctx.strokeStyle = 'rgba(126,255,176,.36)';
  ctx.lineWidth = 2;
  ctx.stroke();
  const fillH = screenH * value / 100;
  const grad = ctx.createLinearGradient(0, screenY + screenH - fillH, 0, screenY + screenH);
  grad.addColorStop(0, 'rgba(34,113,71,.24)');
  grad.addColorStop(0.45, 'rgba(22,181,84,.62)');
  grad.addColorStop(1, 'rgba(14,197,83,.86)');
  ctx.fillStyle = grad;
  roundRect(screenX, screenY + screenH - fillH, screenW, fillH, 28, true);
  ctx.fillStyle = 'rgba(142,255,185,.52)';
  const lines = Math.max(4, Math.floor(screenH / 38));
  for (let i = 0; i < lines; i += 1) {
    const lineW = screenW * (0.52 + (i % 3) * 0.14);
    const lineY = screenY + screenH - fillH + 22 + i * 34;
    if (lineY > screenY + 12 && lineY < screenY + screenH - 12) {
      roundRect(screenX + 18, lineY, Math.min(lineW, screenW - 36), 12, 7, true);
    }
  }
  ctx.fillStyle = 'rgba(122,255,164,.16)';
  ctx.fillRect(screenX, screenY + ((Date.now() / 12) % screenH), screenW, 18);
  ctx.fillStyle = 'rgba(47,95,80,.75)';
  ctx.fillRect(screenX, screenY + screenH * .6, screenW, 1);
  drawFallingInterference(state.devScreen);
  drawFreezeOverlay(screenX, screenY, screenW, screenH);

  drawText(`${Math.round(value)}%`, x + w / 2, y + h - 28, 21, '#27312d', 'bold', 'center');
  drawText('开发进度', x + w / 2, y + h - 8, 13, '#27312d', 'bold', 'center');
}

function drawMoodReactor(x, y, w, h, value, onTap) {
  addButton(x, y, w, h, onTap);
  drawGamePanel(x, y, w, h, '#8f3a58');
  drawPill('心态反应炉', x + 16, y + 14, 96, 26, '#7e4152', '#fff4f6');
  const axisX = x + 14;
  const axisTop = y + 82;
  const axisH = Math.max(92, h - 158);
  const gaugeX = x + 50;
  const gaugeY = y + 60;
  drawValueAxis(axisX, axisTop, axisH, value, 'mood');
  drawCapsuleGauge(gaugeX, gaugeY, w - 70, 18, value, 'mood');

  const glassW = w - 58;
  const glassH = h - 158;
  const gx = x + 38;
  const gy = y + 88;
  const glassGrad = ctx.createRadialGradient(gx + glassW * 0.48, gy + glassH * 0.24, 8, gx + glassW * 0.48, gy + glassH * 0.34, glassW * 0.9);
  glassGrad.addColorStop(0, 'rgba(255,255,255,.86)');
  glassGrad.addColorStop(0.48, 'rgba(255,219,228,.42)');
  glassGrad.addColorStop(1, 'rgba(255,164,190,.32)');
  ctx.fillStyle = glassGrad;
  roundRect(gx, gy, glassW, glassH, 30, true);
  ctx.strokeStyle = 'rgba(158,65,84,.82)';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  const fillH = glassH * value / 100;
  drawWarmMoodScene(gx, gy, glassW, glassH, fillH, value);
  drawFreezeOverlay(gx, gy, glassW, glassH, 48);
  drawText(`${Math.round(value)}%`, x + w / 2, y + h - 28, 21, '#27312d', 'bold', 'center');
  drawText('心态指数', x + w / 2, y + h - 8, 13, '#27312d', 'bold', 'center');
}

function drawValueAxis(x, y, h, value, type) {
  const mood = type === 'mood';
  const railX = x + 11;
  const topY = y + 14;
  const railH = h - 18;
  const v = clamp(value);
  const thumbY = topY + railH * (1 - v / 100);

  ctx.save();
  const topGrad = ctx.createLinearGradient(0, y - 30, 0, y + 22);
  if (mood) {
    topGrad.addColorStop(0, '#d93d69');
    topGrad.addColorStop(0.65, '#ff7895');
    topGrad.addColorStop(1, '#ffe6ea');
  } else {
    topGrad.addColorStop(0, '#05b553');
    topGrad.addColorStop(0.65, '#3fd96e');
    topGrad.addColorStop(1, '#f0ffd3');
  }
  ctx.shadowColor = mood ? 'rgba(255,105,140,.42)' : 'rgba(92,255,141,.48)';
  ctx.shadowBlur = 7;
  ctx.fillStyle = topGrad;
  roundRect(x + 4, y - 30, 22, 52, 12, true);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = mood ? 'rgba(255,216,226,.78)' : 'rgba(195,255,212,.78)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = mood ? 'rgba(255,240,243,.9)' : 'rgba(229,255,219,.9)';
  [0, 1, 2].forEach((i) => {
    roundRect(x + 11, y - 14 + i * 10, 8, 2.5, 2, true);
  });

  const railGrad = ctx.createLinearGradient(0, topY, 0, topY + railH);
  if (mood) {
    railGrad.addColorStop(0, 'rgba(130,43,65,.98)');
    railGrad.addColorStop(0.5, 'rgba(233,78,117,.95)');
    railGrad.addColorStop(1, 'rgba(126,42,61,.98)');
  } else {
    railGrad.addColorStop(0, 'rgba(12,92,50,.98)');
    railGrad.addColorStop(0.5, 'rgba(38,196,91,.95)');
    railGrad.addColorStop(1, 'rgba(9,93,51,.98)');
  }
  ctx.shadowColor = mood ? 'rgba(232,77,117,.32)' : 'rgba(56,230,106,.35)';
  ctx.shadowBlur = 7;
  ctx.fillStyle = railGrad;
  roundRect(railX, topY, 6, railH, 4, true);
  ctx.shadowBlur = 0;
  ctx.fillStyle = mood ? 'rgba(255,234,238,.95)' : 'rgba(236,255,219,.95)';
  for (let tickY = topY + 10; tickY < topY + railH - 6; tickY += 13) {
    roundRect(railX + 1.8, tickY, 2.5, 4, 2, true);
  }

  ctx.shadowColor = mood ? 'rgba(255,124,158,.78)' : 'rgba(177,255,124,.86)';
  ctx.shadowBlur = 10;
  const thumbGrad = ctx.createRadialGradient(railX + 3, thumbY, 2, railX + 3, thumbY, 12);
  if (mood) {
    thumbGrad.addColorStop(0, '#ffffff');
    thumbGrad.addColorStop(0.48, '#ffd0dc');
    thumbGrad.addColorStop(1, '#ff7d9a');
  } else {
    thumbGrad.addColorStop(0, '#ffffff');
    thumbGrad.addColorStop(0.48, '#d9ffbd');
    thumbGrad.addColorStop(1, '#8cf276');
  }
  ctx.fillStyle = thumbGrad;
  circle(railX + 3, thumbY, 12);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = mood ? '#ffe3e9' : '#dfffd3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(railX + 3, thumbY, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCapsuleGauge(x, y, w, h, value, type) {
  const mood = type === 'mood';
  const v = clamp(value);
  ctx.save();
  const bg = ctx.createLinearGradient(0, y, 0, y + h);
  if (mood) {
    bg.addColorStop(0, 'rgba(255,214,223,.38)');
    bg.addColorStop(1, 'rgba(232,77,117,.22)');
  } else {
    bg.addColorStop(0, 'rgba(179,255,199,.38)');
    bg.addColorStop(1, 'rgba(24,151,70,.22)');
  }
  ctx.fillStyle = bg;
  roundRect(x, y, w, h, h / 2, true);
  ctx.strokeStyle = mood ? 'rgba(255,184,202,.58)' : 'rgba(143,244,173,.58)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const fillW = v <= 0 ? 0 : Math.max(h, w * v / 100);
  const fill = ctx.createLinearGradient(x, y, x + w, y);
  if (mood) {
    fill.addColorStop(0, 'rgba(255,205,216,.94)');
    fill.addColorStop(0.42, value < 25 ? '#caa4a7' : value < 55 ? '#eea06b' : '#ff7f9d');
    fill.addColorStop(1, value < 25 ? '#bf7d83' : '#e84d75');
  } else {
    fill.addColorStop(0, 'rgba(183,255,156,.94)');
    fill.addColorStop(0.42, value < 25 ? '#6fa667' : '#19c769');
    fill.addColorStop(1, value < 25 ? '#376b4b' : '#03a94b');
  }
  ctx.shadowColor = mood ? 'rgba(232,77,117,.38)' : 'rgba(73,235,105,.44)';
  ctx.shadowBlur = 8;
  if (fillW > 0) {
    ctx.fillStyle = fill;
    roundRect(x, y, fillW, h, h / 2, true);
  }
  ctx.shadowBlur = 0;

  ctx.fillStyle = mood ? 'rgba(255,236,240,.82)' : 'rgba(236,255,216,.82)';
  for (let tickX = x + 12; tickX < x + w - 7; tickX += 10) {
    roundRect(tickX, y + 5, 3, 4, 2, true);
    roundRect(tickX, y + h - 9, 3, 4, 2, true);
  }
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  circle(x + 14, y + h / 2, 2.2);
  ctx.restore();
}

function drawWarmMoodScene(x, y, w, h, fillH, value) {
  const t = Date.now() / 1000;
  const v = clamp(value);
  const active = state.status === 'running' && !state.paused;
  const liquidTop = y + h - fillH;
  const lowMood = v <= 25;
  const criticalMood = v <= 10;

  ctx.save();
  roundRect(x + 2, y + 2, w - 4, h - 4, 28, false);
  ctx.clip();

  const liquid = ctx.createLinearGradient(0, Math.max(y, liquidTop), 0, y + h);
  liquid.addColorStop(0, lowMood ? 'rgba(178,166,171,.42)' : 'rgba(255,151,181,.72)');
  liquid.addColorStop(0.55, lowMood ? 'rgba(151,130,138,.5)' : 'rgba(255,107,156,.72)');
  liquid.addColorStop(1, lowMood ? 'rgba(128,108,118,.58)' : 'rgba(255,134,181,.82)');
  ctx.fillStyle = liquid;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, liquidTop + h * 0.04);
  ctx.bezierCurveTo(x + w * 0.22, liquidTop - h * 0.08, x + w * 0.58, liquidTop - h * 0.04, x + w, liquidTop - h * 0.1);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();

  const glow = ctx.createRadialGradient(x + w * 0.48, y + h * 0.42, 8, x + w * 0.48, y + h * 0.42, w * 0.55);
  glow.addColorStop(0, 'rgba(255,255,255,.42)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = lowMood ? 'rgba(116,105,110,.52)' : 'rgba(142,60,78,.58)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + h * 0.58);
  ctx.lineTo(x + w - 8, y + h * 0.58);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,.58)';
  roundRect(x + 12, y + 38, 6, h * 0.2, 4, true);
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  circle(x + w * 0.78, y + h * 0.18, 3);
  circle(x + w * 0.16, y + h * 0.48, 5);
  circle(x + w * 0.65, y + h * 0.88, 3);
  circle(x + w * 0.78, y + h * 0.78, 4);

  drawMoodCloudBubbles(x, y, w, h, fillH, v, active, t);

  if (v > 55) drawMoodCloud(x + w * 0.22, y + h * 0.2 + Math.sin(t * 1.2) * 1.2, 0.34, 'small', v, 0.96);
  if (v > 35) drawMoodCloud(x + w * 0.78, y + h * 0.25 + Math.cos(t * 1.1) * 1.2, 0.34, 'small', v, 0.94);
  if (v > 4) drawMoodCloud(x + w * 0.48, y + h * 0.46 + Math.sin(t * 1.4) * 1.4, criticalMood ? 0.48 : 0.58, 'main', v, criticalMood ? 0.72 : 1);
  if (v > 70) drawMoodCloud(x + w * 0.18, y + h * 0.66, 0.24, 'tiny', v, 0.78);
  if (v > 60) drawMoodCloud(x + w * 0.84, y + h * 0.64, 0.25, 'tiny', v, 0.78);

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.58)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + w * 0.48, y + h * 0.28, w * 0.38, Math.PI * 1.06, Math.PI * 1.38);
  ctx.stroke();
  ctx.strokeStyle = lowMood ? 'rgba(218,212,215,.68)' : 'rgba(255,214,224,.9)';
  ctx.lineWidth = 1.2;
  roundRect(x + 4, y + 4, w - 8, h - 8, 26, false);
  ctx.stroke();
  ctx.restore();
}

function drawMoodCloudBubbles(x, y, w, h, fillH, value, active, t) {
  const v = clamp(value);
  const count = active ? Math.max(0, Math.round(v / 13)) : Math.max(0, Math.round(v / 40));
  if (!count) return;
  const bottom = y + h;
  const liquidTop = bottom - fillH;
  const travel = Math.max(46, fillH + h * 0.32);
  for (let i = 0; i < count; i += 1) {
    const seed = i * 37.17;
    const speed = 0.12 + i * 0.017;
    const loop = (t * speed + i * 0.19) % 1;
    const lane = (0.16 + ((i * 0.173) % 0.7));
    const wobble = Math.sin(t * 1.7 + seed) * (4 + (i % 3) * 1.6);
    const cx = x + w * lane + wobble;
    const cy = bottom - loop * travel - 8;
    if (cy < y + 18 || cy > bottom - 6) continue;
    const scale = (0.13 + (i % 4) * 0.025) * (0.68 + v / 160);
    const alpha = Math.min(0.82, Math.max(0.18, (1 - loop) * 0.75 + v / 260));
    drawMoodCloud(cx, Math.max(liquidTop + 8, cy), scale, 'bubble', v, alpha);
  }
}

function drawMoodCloud(cx, cy, scale, variant, value = 100, alpha = 1) {
  const v = clamp(value);
  const lowMood = v <= 25;
  const criticalMood = v <= 10;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  const stroke = lowMood ? '#8f8589' : (variant === 'main' ? '#93485a' : '#9f4e60');
  const faceColor = lowMood ? '#766d72' : '#7e3345';
  ctx.fillStyle = criticalMood ? 'rgba(222,220,221,.82)' : lowMood ? 'rgba(240,238,239,.9)' : 'rgba(255,255,255,.96)';
  ctx.strokeStyle = stroke;
  ctx.lineWidth = variant === 'main' ? 4 : variant === 'bubble' ? 3 : 3.4;
  ctx.beginPath();
  ctx.moveTo(-54, 12);
  ctx.bezierCurveTo(-62, -4, -46, -22, -26, -19);
  ctx.bezierCurveTo(-18, -47, 22, -50, 33, -21);
  ctx.bezierCurveTo(55, -20, 69, -1, 58, 18);
  ctx.bezierCurveTo(48, 35, 20, 35, 10, 24);
  ctx.bezierCurveTo(-2, 39, -36, 34, -39, 18);
  ctx.bezierCurveTo(-47, 21, -52, 18, -54, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const faceY = variant === 'main' ? 2 : 4;
  const eyeDx = variant === 'main' ? 18 : 15;
  ctx.fillStyle = faceColor;
  circle(-eyeDx, faceY, variant === 'main' ? 4.2 : 3.8);
  circle(eyeDx, faceY, variant === 'main' ? 4.2 : 3.8);
  ctx.strokeStyle = faceColor;
  ctx.lineWidth = variant === 'main' ? 4 : 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (criticalMood) ctx.arc(0, faceY + 18, variant === 'main' ? 14 : 10, 1.18 * Math.PI, 1.82 * Math.PI);
  else if (lowMood) {
    ctx.moveTo(variant === 'main' ? -12 : -9, faceY + 12);
    ctx.lineTo(variant === 'main' ? 12 : 9, faceY + 12);
  } else ctx.arc(0, faceY + 2, variant === 'main' ? 17 : 12, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = lowMood ? 'rgba(174,166,170,.32)' : 'rgba(255,174,195,.5)';
  circle(-30, faceY + 12, variant === 'main' ? 9 : 6);
  circle(30, faceY + 12, variant === 'main' ? 9 : 6);
  ctx.restore();
}

function drawFreezeOverlay(x, y, w, h, radius = 16) {
  if (!isFreezeActive()) return;
  ctx.save();
  ctx.globalAlpha = 0.88;
  const frost = ctx.createLinearGradient(x, y, x + w, y + h);
  frost.addColorStop(0, 'rgba(224,249,255,.62)');
  frost.addColorStop(0.5, 'rgba(147,218,244,.42)');
  frost.addColorStop(1, 'rgba(255,255,255,.7)');
  ctx.fillStyle = frost;
  roundRect(x, y, w, h, radius, true);
  ctx.strokeStyle = 'rgba(229,250,255,.88)';
  ctx.lineWidth = 2;
  roundRect(x + 2, y + 2, w - 4, h - 4, Math.max(4, radius - 2), false);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.58)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i += 1) {
    const px = x + (w / 8) * (i + 1);
    ctx.beginPath();
    ctx.moveTo(px, y + 10);
    ctx.lineTo(px - 28 + (i % 3) * 12, y + h - 12);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i += 1) {
    const sx = x + w * (0.18 + i * 0.16);
    const sy = y + h * (0.18 + ((i * 23) % 46) / 100);
    drawSnowflake(sx, sy, 7 + (i % 2) * 3, Date.now() / 700 + i);
  }
  ctx.globalAlpha = 1;
  drawText(`${Math.max(1, Math.ceil((state.freezeUntil - state.elapsed)))}s`, x + w / 2, y + h / 2 + 6, 24, '#f5fdff', 'bold', 'center');
  ctx.restore();
}

function drawGamePanel(x, y, w, h, accent) {
  ctx.save();
  ctx.shadowColor = 'rgba(33,50,42,.16)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  drawCard(x, y, w, h, 'rgba(255,255,255,.74)');
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  roundRect(x + 14, y + 10, w - 28, 2, 2, true);
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
  state.freezeDrops.forEach((drop) => {
    const x = screen.x + screen.w * drop.x;
    const y = screen.y - 28 + (screen.h + 38) * drop.y;
    drawFreezeDrop(x, y, drop.spin);
  });
  state.slowdownDrops.forEach((drop) => {
    const x = screen.x + screen.w * drop.x;
    const y = screen.y - 28 + (screen.h + 38) * drop.y;
    drawSlowdownDrop(x, y, drop.spin);
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

function drawFreezeDrop(x, y, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.shadowColor = 'rgba(125,211,252,.45)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = 'rgba(226,248,255,.94)';
  circle(0, 0, 16);
  ctx.strokeStyle = '#60bfe8';
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 6; i += 1) {
    const a = i * Math.PI / 3;
    const x1 = Math.cos(a) * 4;
    const y1 = Math.sin(a) * 4;
    const x2 = Math.cos(a) * 18;
    const y2 = Math.sin(a) * 18;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const bx = Math.cos(a) * 12;
    const by = Math.sin(a) * 12;
    const sideA = a + Math.PI * 0.78;
    const sideB = a - Math.PI * 0.78;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(sideA) * 6, by + Math.sin(sideA) * 6);
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(sideB) * 6, by + Math.sin(sideB) * 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#f7fdff';
  circle(0, 0, 4);
  ctx.restore();
}

function drawSlowdownDrop(x, y, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.shadowColor = 'rgba(31,108,165,.38)';
  ctx.shadowBlur = 15;
  const grad = ctx.createRadialGradient(-5, -6, 3, 0, 0, 18);
  grad.addColorStop(0, '#e5f7ff');
  grad.addColorStop(0.54, '#5aa7d8');
  grad.addColorStop(1, '#1f5d8d');
  ctx.fillStyle = grad;
  circle(0, 0, 16);
  ctx.strokeStyle = 'rgba(238,250,255,.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 10, Math.PI * 0.85, Math.PI * 1.95);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(7, -5);
  ctx.stroke();
  ctx.fillStyle = '#eefaff';
  circle(0, 0, 3);
  ctx.restore();
}

function drawSnowflake(x, y, r, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.strokeStyle = 'rgba(245,253,255,.82)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i += 1) {
    const a = i * Math.PI / 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
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
    freeze: '冻结球',
    slowdown: '宕速球',
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
  const frozen = state.alertOverlay.theme === 'freeze';
  const slowed = state.alertOverlay.theme === 'slowdown';
  const welcome = state.alertOverlay.theme === 'welcome';
  ctx.save();
  ctx.globalAlpha = Math.min(.82, alpha);
  ctx.fillStyle = frozen || slowed ? 'rgba(214,244,255,.24)' : welcome ? 'rgba(16,29,28,.36)' : 'rgba(36,20,24,.34)';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const bandY = H * 0.28;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha + .18);
  if (frozen || slowed) {
    const grad = ctx.createLinearGradient(0, bandY, W, bandY + 58);
    grad.addColorStop(0, slowed ? 'rgba(31,93,141,.94)' : 'rgba(61,159,205,.92)');
    grad.addColorStop(0.48, slowed ? 'rgba(75,153,203,.94)' : 'rgba(151,222,247,.94)');
    grad.addColorStop(1, slowed ? 'rgba(178,226,247,.9)' : 'rgba(225,249,255,.9)');
    ctx.fillStyle = grad;
  } else if (welcome) {
    const grad = ctx.createLinearGradient(0, bandY, W, bandY + 58);
    grad.addColorStop(0, 'rgba(31,98,74,.94)');
    grad.addColorStop(0.5, 'rgba(47,132,92,.94)');
    grad.addColorStop(1, 'rgba(40,88,76,.94)');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = 'rgba(133,42,62,.9)';
  }
  ctx.fillRect(0, bandY, W, 58);
  if (frozen || slowed || welcome) {
    ctx.strokeStyle = welcome ? 'rgba(126,255,176,.48)' : 'rgba(240,253,255,.82)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, bandY + 2);
    ctx.lineTo(W, bandY + 2);
    ctx.moveTo(0, bandY + 56);
    ctx.lineTo(W, bandY + 56);
    ctx.stroke();
    if (frozen || slowed) {
      drawSnowflake(26, bandY + 30, 11, Date.now() / 500);
      drawSnowflake(W - 26, bandY + 30, 11, -Date.now() / 520);
    }
  }
  drawFloatingRobot(18, bandY - 34, 72, 'alert');
  drawText(state.alertOverlay.title, W / 2, bandY + 27, 20, '#ffffff', 'bold', 'center');
  drawText(state.alertOverlay.copy, W / 2, bandY + 49, 12, frozen || slowed ? 'rgba(245,253,255,.94)' : 'rgba(255,255,255,.86)', '', 'center');
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
  state.itemDockSwipeArea = { x, y, w: availableW, h: sectionH };
  const startX = x + 12;
  const gap = 8;
  const toolH = Math.max(40, Math.min(52, sectionH - 28));
  const hasMoreItems = ITEMS.length > 5;
  const arrowW = hasMoreItems ? 34 : 0;
  const itemAreaW = availableW - 24 - arrowW - (hasMoreItems ? gap : 0);
  const visibleItems = getVisibleDockItems();
  const w = Math.min(54, (itemAreaW - gap * (visibleItems.length - 1)) / Math.max(1, visibleItems.length));
  visibleItems.forEach((item, index) => {
    const itemX = startX + index * (w + gap);
    drawMiniTool(item, itemX, y + 26, w, toolH);
  });
  if (hasMoreItems) {
    const arrowX = x + availableW - 12 - arrowW;
    drawItemDockArrow(arrowX, y + 26, arrowW, toolH);
  }
}

function getVisibleDockItems() {
  if (ITEMS.length <= 5) return ITEMS;
  return state.itemDockPage === 1 ? ITEMS.slice(ITEMS.length - 5) : ITEMS.slice(0, 5);
}

function toggleItemDockPage() {
  if (ITEMS.length <= 5) return;
  state.itemDockPage = state.itemDockPage === 1 ? 0 : 1;
}

function drawItemDockArrow(x, y, w, h) {
  addButton(x, y, w, h, toggleItemDockPage);
  ctx.save();
  const activeLeft = state.itemDockPage === 1;
  ctx.shadowColor = activeLeft ? 'rgba(236,255,243,.24)' : 'rgba(119,255,184,.24)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  const fill = ctx.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, activeLeft ? 'rgba(238,255,244,.92)' : '#3c806a');
  fill.addColorStop(1, activeLeft ? 'rgba(207,242,222,.86)' : '#21483d');
  ctx.fillStyle = fill;
  roundRect(x, y, w, h, 10, true);
  ctx.strokeStyle = activeLeft ? 'rgba(47,95,80,.34)' : 'rgba(198,255,220,.52)';
  ctx.lineWidth = 1.4;
  roundRect(x + 1, y + 1, w - 2, h - 2, 9, false);
  ctx.stroke();
  ctx.fillStyle = activeLeft ? '#2f5f50' : '#e8fff1';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(activeLeft ? '‹' : '›', x + w / 2, y + h / 2 - 1);
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#ffffff';
  roundRect(x + 5, y + 5, w - 10, 7, 5, true);
  ctx.restore();
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
    ensurePrivacyAccepted(() => {
      if (res && res.userInfo) {
        saveAuthorizedProfile(res.userInfo);
        destroyStartAuthButton();
        trackEvent('profile_auth', { from: mode });
        showToast(isProfileReady(state.profile) ? '头像昵称已回填' : '头像昵称已回填，请补充宣言');
      } else {
        authorizeWechatProfile();
      }
    }, () => showToast('请先同意隐私协议后再授权头像昵称'));
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
      if (state.panel === 'ranking') openRankingPanel();
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
  const panel = drawPanelShell('匿名排行榜', 290);
  drawButton('匿名榜', panel.x + 20, panel.y + 50, 82, 30, () => {
    state.rankTab = 'all';
    openRankingPanel();
  }, 'primary');
  const list = state.rankings.all || state.rankings[state.rankTab] || [];
  if (state.rankingLoading) {
    drawText('排行榜加载中...', panel.x + 20, panel.y + 124, 14, 'rgba(234,255,241,.72)');
    return;
  }
  if (state.rankingError) {
    drawMultiline(state.rankingError, panel.x + 20, panel.y + 116, panel.w - 40, 13, 'rgba(234,255,241,.72)');
    drawButton('重试', panel.x + 20, panel.y + 210, panel.w - 40, 34, openRankingPanel, 'primary');
    return;
  }
  if (!list.length) {
    drawText(state.rankingRequested ? '暂无排行数据' : '点击加载排行榜', panel.x + 20, panel.y + 124, 14, 'rgba(234,255,241,.72)');
    addButton(panel.x + 20, panel.y + 96, panel.w - 40, 150, openRankingPanel);
    return;
  }
  list.slice(0, 5).forEach((item, index) => {
    const y = panel.y + 104 + index * 34;
    ctx.fillStyle = item.isMine ? '#2f5f50' : 'rgba(47,95,80,.14)';
    circle(panel.x + 34, y - 6, 12);
    drawText(`${item.position || index + 1}`, panel.x + 34, y - 2, 10, item.isMine ? '#ffffff' : '#2f5f50', 'bold', 'center');
    drawText(item.displayName || '匿名打工人', panel.x + 58, y - 8, 13, '#eafff1', 'bold');
    drawText(`${RANKS[item.rankIndex || 0].title} · ${item.totalScore || 0}分`, panel.x + 58, y + 10, 11, 'rgba(234,255,241,.68)');
  });
}

function drawSettingsPanel() {
  const panel = drawPanelShell('设置', Math.min(548, H - safeTop - 96));
  const p = state.profile;
  addButton(panel.x + 18, panel.y + 50, 40, 40, authorizeWechatProfile);
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
  drawSettingsRow(panel, rowY, '头像', p.avatarUrl ? '已回填' : '点击授权回填', 'avatar', authorizeWechatProfile, { avatarUrl: p.avatarUrl });
  drawSettingsRow(panel, rowY + 48, '昵称', p.nickname === '游客身份' ? '点击授权回填' : p.nickname, 'edit', authorizeWechatProfile);
  drawSettingsRow(panel, rowY + 96, '宣言', p.motto, 'edit', editMotto);
  drawSettingsRow(panel, rowY + 144, '工位', skin.name, 'skin', openSkinPicker);
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
  if (!wx.cloud) {
    state.rankingError = '云开发未初始化，排行榜加载失败';
    showToast('排行榜加载失败');
    return;
  }
  state.rankingLoading = true;
  state.rankingError = '';
  state.rankingRequested = true;
  wx.cloud.callFunction({
    name: 'getRankings',
    config: { env: CLOUD_ENV },
    data: { limit: 50 },
    success(res) {
      if (res.result && res.result.ok === false) {
        state.rankings.all = [];
        state.rankings.friends = [];
        state.rankingLoading = false;
        state.rankingError = formatRankingError(res.result.error);
        return;
      }
      const list = res.result && Array.isArray(res.result.list) ? res.result.list : [];
      state.rankings.all = list;
      state.rankings.friends = list;
      state.rankingLoading = false;
      state.rankingError = '';
    },
    fail(err) {
      state.rankingLoading = false;
      state.rankingError = formatRankingError(err && err.errMsg);
      showToast('排行榜加载失败');
    }
  });
}

function formatRankingError(message) {
  const text = String(message || '');
  if (text.includes('-502005') || text.includes('collection not exists') || text.includes('ResourceNotFound') || text.includes('Db or Table not exist')) {
    return '排行榜数据表正在初始化，请重新部署云函数后重试。';
  }
  return text || '排行榜加载失败，请稍后重试';
}

function openRankingPanel() {
  if (!isFormalProfile(loadProfile())) {
    showToast('请先完善个人信息,游客不能查看排行榜');
    return;
  }
  state.panel = 'ranking';
  if (state.rankingLoading) return;
  state.profile = loadProfile();
  ensurePrivacyAccepted(() => {
    requestFriendAuth(() => {
      fetchRankings();
    }, () => {
      state.rankingError = '未开启排行榜授权，暂无法查看排行榜';
      showToast('未开启排行榜授权');
    });
  }, () => {
    state.rankingError = '请先同意隐私协议后查看排行榜';
    showToast('请先同意隐私协议');
  });
}

function drawModal(modal) {
  ctx.fillStyle = 'rgba(31,39,35,.45)';
  ctx.fillRect(0, 0, W, H);
  const x = 32;
  const y = modal.modalType === 'overtime' ? 120 : H / 2 - 150;
  const h = modal.modalType === 'overtime' ? 260 : 300;
  drawCard(x, y, W - 64, h, '#ffffff');
  drawFloatingRobot(x - 18, y - 46, 92, 'modal');
  drawText(modal.modalType === 'overtime' ? `【${modal.title}】` : modal.title, W / 2, y + 44, 22, '#27312d', 'bold', 'center');
  drawMultiline(modal.desc || modal.copy, x + 24, y + 82, W - 112, 16, '#5f6962');
  if (modal.rewards && modal.rewards.length) {
    drawMultiline(modal.rewards.join('、'), x + 24, y + 150, W - 112, 13, '#2f5f50');
  }
  if (modal.modalType === 'overtime') {
    drawButton('接受', x + 24, y + h - 96, W - 112, 38, acceptOvertime);
    drawButton('准时下班', x + 24, y + h - 48, W - 112, 38, rejectOvertime, 'ghost');
  } else if (modal.type === 'fail') {
    if (modal.bonusBean) {
      drawButton('确认领取', x + 24, y + h - 100, W - 112, 38, claimFailureBean);
      drawButton('暂不领取', x + 24, y + h - 52, W - 112, 38, closeModal, 'ghost');
    } else {
      drawButton('原地复活', x + 24, y + h - 100, W - 112, 38, revive);
      drawButton('关闭退出', x + 24, y + h - 52, W - 112, 38, closeModal, 'ghost');
    }
  } else if (modal.type === 'profile') {
    drawButton('去完善信息', x + 24, y + h - 74, W - 112, 42, () => {
      state.modal = null;
      state.tab = 'profile';
    });
  } else {
    drawButton('知道了', x + 24, y + h - 74, W - 112, 42, closeModal);
  }
}

function drawFloatingRobot(x, y, size, variant = 'modal') {
  const image = getCachedImage(ROBOT_IMG_SRC);
  const t = Date.now() / 1000;
  const bob = Math.sin(t * 3.2) * (variant === 'alert' ? 4 : 6);
  const tilt = Math.sin(t * 2.2) * 0.045;
  const h = size * 1.036;
  const leftEyeScale = .72 + (Math.sin(t * 6.2) + 1) * .26;
  const rightEyeScale = .72 + (Math.sin(t * 6.8 + 1.4) + 1) * .28;

  ctx.save();
  ctx.translate(x + size / 2, y + bob + h / 2);
  ctx.rotate(tilt);
  if (image) {
    ctx.drawImage(image, -size / 2, -h / 2, size, h);
  } else {
    ctx.fillStyle = 'rgba(89,221,255,.2)';
    roundRect(-size / 2, -h / 2, size, h, 8, true);
  }
  drawRobotEye(-size * .105, -h * .062, size * .076, size * .18 * leftEyeScale, '#59ddff');
  drawRobotEye(size * .142, -h * .062, size * .076, size * .18 * rightEyeScale, '#ff63d3');
  ctx.restore();
}

function drawRobotEye(cx, bottomY, w, h, color) {
  const x = cx - w / 2;
  const y = bottomY - h;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  roundRect(x, y, w, h, w / 2, true);
  ctx.restore();
}

function revive() {
  if (!isFormalProfile(loadProfile())) {
    state.modal = null;
    showAlert('资料未完善', '请先完善个人信息,游客不能原地复活');
    return;
  }
  startReviveExam('canvas');
}

function startReviveExam(type) {
  if (!isFormalProfile(loadProfile())) {
    state.modal = null;
    showAlert('资料未完善', '请先完善个人信息,游客不能原地复活');
    return;
  }
  const questions = [
    formatExamQuestion(randomFrom(EXAM_BANKS.dev), '开发题'),
    formatExamQuestion(randomFrom(EXAM_BANKS.mind), '心态题')
  ];
  askReviveQuestion(questions, 0, {}, type);
}

function formatExamQuestion(question, label) {
  return Object.assign({}, question, { label });
}

function askReviveQuestion(questions, index, answers, type) {
  const question = questions[index];
  if (!question) {
    const passed = questions.every((item, idx) => normalizeExamAnswer(answers[idx]) === normalizeExamAnswer(item.answer));
    if (passed) finishReviveExam(type);
    else showAlert('复活答题未通过', '两题都答对才能原地复活');
    trackEvent(passed ? 'revive_exam_success' : 'revive_exam_fail', { type });
    return;
  }
  const content = question.type === 'choice'
    ? `${question.label}：${question.question}\n${question.options.map((option) => `${option.key}. ${option.text}`).join('\n')}\n\n请输入选项字母`
    : `${question.label}：${question.question}\n\n请输入答案`;
  wx.showModal({
    title: `复活答题 ${index + 1}/2`,
    content,
    editable: true,
    placeholderText: question.type === 'choice' ? 'A/B/C/D' : '输入答案',
    confirmText: index === questions.length - 1 ? '提交' : '下一题',
    success(res) {
      if (!res.confirm) return;
      answers[index] = res.content;
      askReviveQuestion(questions, index + 1, answers, type);
    }
  });
}

function normalizeExamAnswer(value) {
  return String(value || '')
    .trim()
    .replace(/[（）()\s]/g, '')
    .toLowerCase();
}

function finishReviveExam(type) {
  const profile = loadProfile();
  profile.reviveShareCount += 1;
  state.profile = saveProfile(profile);
  state.modal = null;
  state.failOverlay = null;
  state.status = 'running';
  state.paused = false;
  state.progress = 20;
  state.mood = 20;
  state.lastTick = Date.now();
  trackEvent('revive_exam_success', { type });
}

function closeModal() {
  state.modal = null;
  if (state.status === 'finished') {
    state.status = 'idle';
    syncMusic();
  }
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
  state.touchHandledByButton = false;
  for (let i = state.buttons.length - 1; i >= 0; i -= 1) {
    const item = state.buttons[i];
    if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) {
      state.touchHandledByButton = true;
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
  if (touch && !state.touchHandledByButton) handleItemDockSwipe(touch.clientX, touch.clientY);
  state.touchHandledByButton = false;
}

function handleItemDockSwipe(x, y) {
  const area = state.itemDockSwipeArea;
  if (!area || ITEMS.length <= 5) return;
  if (state.touchStartX < area.x || state.touchStartX > area.x + area.w || state.touchStartY < area.y || state.touchStartY > area.y + area.h) return;
  if (y < area.y - 18 || y > area.y + area.h + 18) return;
  const deltaX = x - state.touchStartX;
  if (Math.abs(deltaX) < 32) return;
  const nextPage = deltaX < 0 ? 1 : 0;
  if (nextPage !== state.itemDockPage) {
    state.itemDockPage = nextPage;
    tapFeedback();
  }
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

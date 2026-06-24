const { RANKS, GAME, EVENTS, OVERTIME, ITEMS, SKINS, FAILURE_TEXTS, CHECKIN_TEXTS } = require('../../utils/config');
const { isProfileReady, loadProfile, saveProfile, trackEvent, randomFrom, randomItems, randomSkin, rankByScore, todayKey } = require('../../utils/store');

Page({
  data: {
    profile: loadProfile(),
    rank: RANKS[0],
    maxRankIndex: RANKS.length - 1,
    activeSkin: SKINS[0],
    items: ITEMS,
    itemDock: [],
    status: 'idle',
    paused: false,
    showGuide: true,
    timeLeft: GAME.duration,
    duration: GAME.duration,
    progress: GAME.initialProgress,
    mood: GAME.initialMood,
    progressText: GAME.initialProgress,
    moodText: GAME.initialMood,
    moodLevel: 'high',
    moodCap: 100,
    overtimeModal: null,
    resultModal: null,
    checkInModal: null,
    eventToast: null,
    failOverlay: null
  },

  onLoad() {
    this.timer = null;
    this.game = this.createGameState();
    this.refreshProfile();
  },

  onShow() {
    this.refreshProfile();
    if (wx.getStorageSync('pendingAutoCheckIn')) {
      wx.removeStorageSync('pendingAutoCheckIn');
      this.performCheckIn(true);
    }
  },

  onUnload() {
    this.clearTimer();
  },

  onShareAppMessage() {
    if (this.data.resultModal && this.data.resultModal.type === 'fail') {
      this.revive('share');
    }
    return {
      title: '我在天工一号稳住工作和心态',
      path: '/pages/work/work'
    };
  },

  pauseGameFromAppHide() {
    if (this.data.status === 'running') {
      this.setData({ paused: true });
      this.clearTimer();
    }
  },

  refreshProfile() {
    const profile = loadProfile();
    const rank = RANKS[profile.rankIndex];
    const activeSkin = SKINS.find((skin) => skin.id === profile.activeSkin) || SKINS[0];
    const itemDock = ITEMS.map((item) => Object.assign({}, item, {
      count: profile.items[item.id] || 0,
      shortName: this.shortItemName(item.id)
    }));
    this.setData({ profile, rank, activeSkin, itemDock });
  },

  shortItemName(id) {
    return {
      time: '延时',
      mood: '回血',
      progress: '加急',
      needle: '破Bug',
      bean: '效率豆'
    }[id] || '道具';
  },

  createGameState() {
    return {
      elapsed: 0,
      perfect: true,
      acceptedOvertimes: [],
      triggeredOvertime: {},
      triggeredEvents: 0,
      eventSchedule: [],
      rewardItems: [],
      rewardSkins: [],
      overtimeSeconds: 0,
      revived: false
    };
  },

  startGame() {
    const profile = loadProfile();
    if (!isProfileReady(profile)) {
      this.requestProfileForStart();
      return;
    }
    const rank = RANKS[profile.rankIndex];
    this.game = this.createGameState();
    this.game.eventSchedule = this.createEventSchedule(rank.events, GAME.duration);
    this.setData({
      profile,
      rank,
      status: 'running',
      paused: false,
      showGuide: true,
      duration: GAME.duration,
      timeLeft: GAME.duration,
      progress: GAME.initialProgress,
      mood: GAME.initialMood,
      progressText: GAME.initialProgress,
      moodText: GAME.initialMood,
      moodLevel: 'high',
      moodCap: 100,
      overtimeModal: null,
      resultModal: null,
      eventToast: null,
      failOverlay: null
    });
    trackEvent('round_start', { rankIndex: profile.rankIndex });
    this.tickTimer();
    setTimeout(() => this.setData({ showGuide: false }), 3000);
  },

  requestProfileForStart() {
    if (!wx.getUserProfile) {
      wx.showToast({ title: '请完善头像昵称后再开始', icon: 'none' });
      return;
    }
    wx.getUserProfile({
      desc: '用于开始天工一号闯关',
      success: (res) => {
        const userInfo = res.userInfo || {};
        const profile = loadProfile();
        if (userInfo.nickName) profile.nickname = userInfo.nickName;
        if (userInfo.avatarUrl) profile.avatarUrl = userInfo.avatarUrl;
        if (!profile.motto) profile.motto = '稳住心态写代码';
        profile.completedProfile = isProfileReady(Object.assign({}, profile, { completedProfile: true }));
        const saved = saveProfile(profile);
        this.setData({ profile: saved });
        trackEvent('profile_auth', { from: 'start' });
        if (isProfileReady(saved)) this.startGame();
        else wx.showToast({ title: '请完善头像昵称后再开始', icon: 'none' });
      },
      fail: () => {
        wx.showToast({ title: '请确认微信个人信息授权后开始', icon: 'none' });
      }
    });
  },

  tickTimer() {
    this.clearTimer();
    this.timer = setInterval(() => {
      if (this.data.paused || this.data.status !== 'running') return;
      this.stepGame();
    }, 1000);
  },

  stepGame() {
    const elapsed = this.game.elapsed + 1;
    this.game.elapsed = elapsed;
    const rank = this.data.rank;
    const overtimeDrain = this.game.acceptedOvertimes.reduce((sum, key) => {
      const item = OVERTIME[key];
      return {
        progress: sum.progress + item.progressDrain,
        mood: sum.mood + item.moodDrain
      };
    }, { progress: 0, mood: 0 });

    const progress = this.clamp(this.data.progress - GAME.progressDrain - rank.drainBonus - overtimeDrain.progress);
    const mood = this.clamp(this.data.mood - GAME.moodDrain - rank.drainBonus - overtimeDrain.mood, 0, this.data.moodCap);
    const timeLeft = Math.max(this.data.duration - elapsed, 0);
    const updates = Object.assign(this.createMeterUpdates(progress, mood), {
      timeLeft
    });
    if (progress < GAME.perfectLine || mood < GAME.perfectLine) {
      this.game.perfect = false;
    }
    this.setData(updates);
    this.tryTriggerEvent(elapsed);
    this.tryTriggerOvertime(timeLeft);
    if (progress <= 0 || mood <= 0) {
      this.finishRound(progress <= 0 ? 'progress' : 'mood');
      return;
    }
    if (timeLeft <= 0) {
      this.finishRound();
    }
  },

  tryTriggerEvent(elapsed) {
    if (!this.game.eventSchedule.includes(elapsed)) return;
    const event = randomFrom(EVENTS);
    const progress = this.clamp(this.data.progress + event.progress);
    const mood = this.clamp(this.data.mood + event.mood, 0, this.data.moodCap);
    this.game.triggeredEvents += 1;
    this.setData(Object.assign(this.createMeterUpdates(progress, mood), {
      eventToast: event
    }));
    setTimeout(() => this.setData({ eventToast: null }), 1800);
  },

  tryTriggerOvertime(timeLeft) {
    if (!GAME.overtimeAt.includes(timeLeft) || this.game.triggeredOvertime[timeLeft]) return;
    this.game.triggeredOvertime[timeLeft] = true;
    const type = this.data.profile.rankIndex >= 4 && timeLeft === 15 ? 'night' : 'normal';
    this.setData({ overtimeModal: Object.assign({ type }, OVERTIME[type]) });
    trackEvent('overtime_popup', { type, rankIndex: this.data.profile.rankIndex });
  },

  acceptOvertime() {
    const modal = this.data.overtimeModal;
    if (!modal) return;
    this.game.acceptedOvertimes.push(modal.type);
    this.game.overtimeSeconds += modal.type === 'night' ? 8 * 3600 : 2 * 3600;
    const extraTimes = this.createEventSchedule(modal.extraEvents, this.data.timeLeft);
    this.game.eventSchedule = this.game.eventSchedule.concat(extraTimes.map((left) => this.game.elapsed + left));
    const moodCap = modal.moodCapDrop ? Math.max(70, this.data.moodCap - modal.moodCapDrop) : this.data.moodCap;
    this.setData({
      moodCap,
      mood: Math.min(this.data.mood, moodCap),
      moodText: Math.round(Math.min(this.data.mood, moodCap)),
      moodLevel: this.getMoodVisual(Math.min(this.data.mood, moodCap)).level,
      overtimeModal: null
    });
    trackEvent('overtime_accept', { type: modal.type });
  },

  rejectOvertime() {
    const modal = this.data.overtimeModal;
    this.setData({ overtimeModal: null });
    trackEvent('overtime_reject', { type: modal && modal.type });
  },

  tapProgress() {
    if (this.data.status !== 'running' || this.data.paused) return;
    const progress = this.clamp(this.data.progress + GAME.progressTap);
    this.setData(this.createMeterUpdates(progress, this.data.mood));
  },

  tapMood() {
    if (this.data.status !== 'running' || this.data.paused) return;
    const mood = this.clamp(this.data.mood + GAME.moodTap, 0, this.data.moodCap);
    this.setData(this.createMeterUpdates(this.data.progress, mood));
  },

  togglePause() {
    if (this.data.status !== 'running') return;
    const paused = !this.data.paused;
    this.setData({ paused });
    if (paused) this.clearTimer();
    else this.tickTimer();
  },

  controlGame() {
    if (this.data.status === 'running') {
      this.togglePause();
      return;
    }
    this.startGame();
  },

  useItem(event) {
    if (this.data.status !== 'running') return;
    const id = event.currentTarget.dataset.id;
    const profile = loadProfile();
    if (!profile.items[id]) {
      wx.showToast({ title: '道具不足', icon: 'none' });
      return;
    }
    profile.items[id] -= 1;
    const hasOvertime = this.game.acceptedOvertimes.length > 0;
    const updates = { profile: saveProfile(profile) };
    if (id === 'time') {
      updates.duration = this.data.duration + (hasOvertime ? 15 : 10);
      updates.timeLeft = this.data.timeLeft + (hasOvertime ? 15 : 10);
    }
    if (id === 'mood') {
      const add = hasOvertime ? 65 : 50;
      Object.assign(updates, this.createMeterUpdates(this.data.progress, this.clamp(this.data.mood + add, 0, this.data.moodCap)));
    }
    if (id === 'progress') {
      const add = hasOvertime ? 60 : 50;
      Object.assign(updates, this.createMeterUpdates(this.clamp(this.data.progress + add), this.data.mood));
    }
    if (id === 'needle') {
      profile.items[id] += 1;
      updates.profile = saveProfile(profile);
      wx.showToast({ title: '针用于小游戏干扰球', icon: 'none' });
    }
    this.setData(updates);
    this.refreshProfile();
    trackEvent('item_use', { itemId: id });
  },

  finishNow() {
    this.finishRound();
  },

  finishRound(reason) {
    if (this.data.status !== 'running') return;
    this.clearTimer();
    const passed = this.data.progress > GAME.passLine && this.data.mood > GAME.passLine && this.data.timeLeft <= 0;
    if (passed) this.handleSuccess();
    else this.triggerFailure(reason);
  },

  triggerFailure(reason) {
    const title = reason === 'mood' ? '崩溃啦，心态指数归零！！' : reason === 'progress' ? '宕机啦，开发进度归零！！' : '本次职场闯关失利啦';
    this.setData({
      status: 'ending',
      failOverlay: {
        title,
        reason: reason || 'timeout'
      }
    });
    setTimeout(() => this.handleFailure(), 900);
  },

  handleSuccess() {
    const profile = loadProfile();
    const oldRankIndex = profile.rankIndex;
    const rank = RANKS[oldRankIndex];
    const perfect = this.game.perfect && this.data.progress >= GAME.perfectLine && this.data.mood >= GAME.perfectLine;
    const multiplier = this.game.acceptedOvertimes.reduce((value, type) => {
      const config = OVERTIME[type];
      return Math.max(value, perfect ? config.perfectMultiplier : config.normalMultiplier);
    }, 1);
    const baseScore = perfect ? rank.perfectScore : rank.normalScore;
    const gainedScore = Math.ceil(baseScore * multiplier);
    const overtimeRewardItems = this.game.acceptedOvertimes.reduce((count, type) => count + OVERTIME[type].items, 0);
    const droppedItems = randomItems(Math.max(1, overtimeRewardItems));
    const rewards = [`晋升积分 +${gainedScore}`];

    droppedItems.forEach((item) => {
      profile.items[item.id] = (profile.items[item.id] || 0) + 1;
      rewards.push(`${item.name} +1`);
    });

    this.game.acceptedOvertimes.forEach((type) => {
      const skinId = OVERTIME[type].skinId;
      if (skinId && !profile.skins.includes(skinId)) {
        profile.skins.push(skinId);
        rewards.push('熬夜加班工位皮肤');
      }
    });

    profile.totalScore += gainedScore;
    profile.passCount += 1;
    profile.totalRounds += 1;
    profile.overtimeRounds += this.game.acceptedOvertimes.length ? 1 : 0;
    profile.overtimeCount += this.game.acceptedOvertimes.length;
    profile.overtimeSeconds += this.game.overtimeSeconds;
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
      time: this.data.duration - this.data.timeLeft,
      overtime: this.game.acceptedOvertimes.join(',') || '无',
      result: '通关',
      perfect,
      rewards: rewards.join('、'),
      createdAt: Date.now()
    });

    const saved = saveProfile(profile);
    const newRank = RANKS[saved.rankIndex];
    const promoted = saved.rankIndex > oldRankIndex;
    this.setData({
      status: 'finished',
      profile: saved,
      rank: newRank,
      resultModal: {
        type: 'success',
        title: promoted ? '晋升成功' : '本局顺利通关',
        copy: promoted ? `当前${RANKS[oldRankIndex].title}晋升到${newRank.title}` : `双线守住，距离${newRank.title}更近一步`,
        rewards
      }
    });
    trackEvent('round_success', { rankIndex: saved.rankIndex, perfect, gainedScore, overtime: this.game.acceptedOvertimes });
  },

  handleFailure() {
    const profile = loadProfile();
    profile.failCount += 1;
    profile.totalRounds += 1;
    profile.records.unshift({
      id: `${Date.now()}`,
      time: this.data.duration - this.data.timeLeft,
      overtime: this.game.acceptedOvertimes.join(',') || '无',
      result: '失败',
      perfect: false,
      rewards: '无',
      createdAt: Date.now()
    });
    const saved = saveProfile(profile);
    this.setData({
      status: 'finished',
      profile: saved,
      resultModal: {
        type: 'fail',
        title: '本次职场闯关失利啦',
        copy: randomFrom(FAILURE_TEXTS),
        rewards: []
      }
    });
    trackEvent('round_fail', { rankIndex: saved.rankIndex, overtime: this.game.acceptedOvertimes });
  },

  reviveByAd() {
    this.revive('ad');
  },

  reviveByShare() {
    this.revive('share');
  },

  revive(type) {
    const profile = loadProfile();
    if (type === 'ad') profile.reviveAdCount += 1;
    if (type === 'share') profile.reviveShareCount += 1;
    const saved = saveProfile(profile);
    this.game.revived = true;
    this.setData(Object.assign({
      profile: saved,
      resultModal: null,
      status: 'running',
      paused: false,
      timeLeft: Math.max(this.data.timeLeft, 10),
      failOverlay: null
    }, this.createMeterUpdates(Math.max(this.data.progress, 35), Math.max(this.data.mood, 35))));
    trackEvent(type === 'ad' ? 'revive_ad' : 'revive_share', {});
    this.tickTimer();
  },

  closeResult() {
    this.setData({ resultModal: null, status: 'idle', failOverlay: null });
    this.refreshProfile();
  },

  performCheckIn(auto) {
    const profile = loadProfile();
    const today = todayKey();
    if (profile.lastCheckInDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${`${yesterday.getMonth() + 1}`.padStart(2, '0')}-${`${yesterday.getDate()}`.padStart(2, '0')}`;
    profile.checkInStreak = profile.lastCheckInDate === yKey ? profile.checkInStreak + 1 : 1;
    profile.checkInCount += 1;
    profile.lastCheckInDate = today;
    profile.items.bean = (profile.items.bean || 0) + 1;
    const rewards = ['效率豆 +1'];
    if (profile.checkInStreak >= 2 && profile.checkInStreak % 2 === 0) {
      const skin = randomSkin(profile.rankIndex);
      if (skin && !profile.skins.includes(skin.id)) {
        profile.skins.push(skin.id);
        rewards.push(`连续打卡赠送：${skin.name}`);
      } else {
        const item = randomFrom(ITEMS);
        profile.items[item.id] = (profile.items[item.id] || 0) + 1;
        rewards.push(`连续打卡赠送：${item.name}`);
      }
    }
    const saved = saveProfile(profile);
    this.setData({
      profile: saved,
      checkInModal: {
        auto,
        copy: randomFrom(CHECKIN_TEXTS),
        reward: rewards.join('、')
      }
    });
    trackEvent('check_in', { auto, streak: saved.checkInStreak });
  },

  closeCheckIn() {
    this.setData({ checkInModal: null });
  },

  createEventSchedule(count, duration) {
    const result = [];
    const safeDuration = Math.max(8, duration - 5);
    for (let i = 0; i < count; i += 1) {
      const min = 6 + i * 4;
      const max = Math.max(min + 1, safeDuration);
      result.push(Math.min(max, min + Math.floor(Math.random() * Math.max(2, max - min))));
    }
    return result;
  },

  clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  },

  getMoodVisual(mood) {
    if (mood <= 0) return { level: 'empty' };
    if (mood < 25) return { level: 'low' };
    if (mood < 55) return { level: 'mid' };
    return { level: 'high' };
  },

  createMeterUpdates(progress, mood) {
    const visual = this.getMoodVisual(mood);
    return {
      progress,
      mood,
      progressText: Math.round(progress),
      moodText: Math.round(mood),
      moodLevel: visual.level
    };
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  goSpace() {
    wx.switchTab({ url: '/pages/space/space' });
  }
});

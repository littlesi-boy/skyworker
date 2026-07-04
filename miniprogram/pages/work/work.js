const { RANKS, GAME, EVENTS, OVERTIME, INTERFERENCE, ITEMS, SKINS, FAILURE_TEXTS } = require('../../utils/config');
const { isProfileReady, isFormalProfile, loadProfile, saveProfile, trackEvent, randomFrom, randomItems, randomSkin, rankByScore, isTestAccount, shouldAutoCheckIn, checkInProfile } = require('../../utils/store');
const { EXAM_BANKS } = require('../../utils/examBank');

Page({
  data: {
    profile: loadProfile(),
    rank: RANKS[0],
    maxRankIndex: RANKS.length - 1,
    activeSkin: SKINS[0],
    items: ITEMS,
    itemDock: [],
    visibleItemDock: [],
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
    freezeActive: false,
    slowdownActive: false,
    overtimeModal: null,
    resultModal: null,
    reviveExamModal: null,
    checkInModal: null,
    eventToast: null,
    freezeToast: null,
    failOverlay: null,
    itemDockScrolled: false,
    itemDockScrollLeft: 0,
    progressEffectList: [],
    moodEffectList: [],
    fxAnchor: {
      progress: null,
      mood: null
    },
    showHome: true,
    homeLoading: false,
    homeProgress: 6,
    homeProgressText: 'load base config',
    homeMuted: false,
    welcomeToast: false
  },

  onLoad() {
    this.timer = null;
    this.homeProgressTimer = null;
    this.effectTimers = {};
    this.effectSeed = 0;
    this.fxTimer = null;
    this.game = this.createGameState();
    this.homeEntered = false;
    this.createHomeAudio();
    this.startHomeLoading();
    this.refreshProfile();
  },

  onShow() {
    this.refreshProfile();
    if (this.data.showHome && !this.data.homeMuted) this.playHomeBgm();
    if (wx.getStorageSync('pendingAutoCheckIn')) {
      wx.removeStorageSync('pendingAutoCheckIn');
      this.tryAutoCheckInFromAppShow();
    }
  },

  onHide() {
    this.pauseHomeBgm();
  },

  onReady() {
    this.measureEffectAnchors();
  },

  onUnload() {
    this.clearHomeProgressTimer();
    this.clearTimer();
    this.clearEffectTimers();
    this.destroyHomeAudio();
    this.destroyGameAudio();
    this.destroyWelcomeAudio();
    if (this.fxTimer) clearTimeout(this.fxTimer);
    if (this.welcomeTimer) clearTimeout(this.welcomeTimer);
    if (this.freezeTimer) clearTimeout(this.freezeTimer);
    if (this.slowdownTimer) clearTimeout(this.slowdownTimer);
    if (this.freezeToastTimer) clearTimeout(this.freezeToastTimer);
  },

  onShareAppMessage() {
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
    const saved = this.grantTestBonus(profile) || profile;
    const rank = RANKS[saved.rankIndex];
    const activeSkin = SKINS.find((skin) => skin.id === saved.activeSkin) || SKINS[0];
    const itemDock = ITEMS.map((item) => Object.assign({}, item, {
      count: saved.items[item.id] || 0,
      shortName: this.shortItemName(item.id)
    }));
    this.setData({
      profile: saved,
      rank,
      activeSkin,
      itemDock,
      visibleItemDock: this.visibleDockItems(itemDock, this.data.itemDockScrolled)
    });
  },

  visibleDockItems(itemDock, scrolled) {
    if (!itemDock || itemDock.length <= 5) return itemDock || [];
    return scrolled ? itemDock.slice(itemDock.length - 5) : itemDock.slice(0, 5);
  },

  toggleItemDockScroll() {
    const nextScrolled = !this.data.itemDockScrolled;
    this.setData({
      itemDockScrolled: nextScrolled,
      itemDockScrollLeft: nextScrolled ? 9999 : 0,
      visibleItemDock: this.visibleDockItems(this.data.itemDock, nextScrolled)
    });
  },

  onItemDockTouchStart(event) {
    const touch = event.touches && event.touches[0];
    this.itemDockTouchX = touch ? touch.clientX : 0;
  },

  onItemDockTouchEnd(event) {
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch || !this.itemDockTouchX) return;
    const deltaX = touch.clientX - this.itemDockTouchX;
    if (Math.abs(deltaX) < 28) return;
    const nextScrolled = deltaX < 0;
    if (nextScrolled === this.data.itemDockScrolled) return;
    this.setData({
      itemDockScrolled: nextScrolled,
      itemDockScrollLeft: nextScrolled ? 9999 : 0,
      visibleItemDock: this.visibleDockItems(this.data.itemDock, nextScrolled)
    });
  },

  shortItemName(id) {
    return {
      mood: '回血',
      progress: '加急',
      needle: '破Bug',
      freeze: '冻结球',
      slowdown: '宕速球',
      bean: '效率豆',
      mindstone: '心态石'
    }[id] || '道具';
  },

  createGameState() {
    return {
      elapsed: 0,
      freezeUntil: 0,
      slowdownUntil: 0,
      perfect: true,
      acceptedOvertimes: [],
      triggeredOvertime: {},
      overtimeTriggeredThisRound: false,
      triggeredEvents: 0,
      eventSchedule: [],
      rewardItems: [],
      rewardSkins: [],
      overtimeSeconds: 0,
      revived: false
    };
  },

  createHomeAudio() {
    if (!wx.createInnerAudioContext || this.homeAudio) return;
    const audio = wx.createInnerAudioContext();
    audio.src = '/assets/audio/popbgm.mp3';
    audio.loop = true;
    audio.volume = 0.28;
    audio.obeyMuteSwitch = true;
    this.homeAudio = audio;
  },

  playHomeBgm() {
    const profile = loadProfile();
    if (!this.homeAudio || this.data.homeMuted || profile.musicEnabled === false) return;
    this.homeAudio.play();
  },

  pauseHomeBgm() {
    if (this.homeAudio) this.homeAudio.pause();
  },

  createGameAudio() {
    if (!wx.createInnerAudioContext || this.gameAudio) return;
    const audio = wx.createInnerAudioContext();
    audio.src = '/assets/audio/startgamebgm.mp3';
    audio.loop = true;
    audio.volume = 0.3;
    audio.obeyMuteSwitch = true;
    this.gameAudio = audio;
  },

  playGameBgm() {
    const profile = loadProfile();
    if (profile.musicEnabled === false) return;
    this.createGameAudio();
    if (!this.gameAudio) return;
    this.gameAudio.stop();
    this.gameAudio.volume = profile.musicVolume || 0.3;
    this.gameAudio.seek(3);
    this.gameAudio.play();
  },

  stopGameBgm() {
    if (this.gameAudio) this.gameAudio.stop();
  },

  playWelcomeSfx() {
    const profile = loadProfile();
    if (profile.sfxEnabled === false || !wx.createInnerAudioContext) return;
    if (!this.welcomeAudio) {
      const audio = wx.createInnerAudioContext();
      audio.src = '/assets/audio/click.wav';
      audio.volume = 0.5;
      audio.obeyMuteSwitch = true;
      this.welcomeAudio = audio;
    }
    this.welcomeAudio.stop();
    this.welcomeAudio.play();
  },

  destroyHomeAudio() {
    if (!this.homeAudio) return;
    this.homeAudio.stop();
    this.homeAudio.destroy();
    this.homeAudio = null;
  },

  destroyGameAudio() {
    if (!this.gameAudio) return;
    this.gameAudio.stop();
    this.gameAudio.destroy();
    this.gameAudio = null;
  },

  destroyWelcomeAudio() {
    if (!this.welcomeAudio) return;
    this.welcomeAudio.stop();
    this.welcomeAudio.destroy();
    this.welcomeAudio = null;
  },

  tryShowWelcomePrompt() {
    const app = typeof getApp === 'function' ? getApp({ allowDefault: true }) : null;
    if (app && app.globalData && app.globalData.welcomeShown) return;
    if (app && app.globalData) app.globalData.welcomeShown = true;
    this.setData({ welcomeToast: true });
    this.playWelcomeSfx();
    this.welcomeTimer = setTimeout(() => {
      this.setData({ welcomeToast: false });
      this.welcomeTimer = null;
    }, 3200);
  },

  toggleHomeBgm() {
    const homeMuted = !this.data.homeMuted;
    this.setData({ homeMuted });
    if (homeMuted) this.pauseHomeBgm();
    else this.playHomeBgm();
  },

  startHomeLoading() {
    this.setData({
      homeLoading: true,
      homeProgress: 6,
      homeProgressText: 'load base config'
    });
    this.advanceHomeProgress(100, 2, 72, () => this.finishHomeLoading());
  },

  advanceHomeProgress(target, step, speed, done) {
    this.clearHomeProgressTimer();
    this.homeProgressTimer = setInterval(() => {
      const current = this.data.homeProgress;
      if (current >= target) {
        this.clearHomeProgressTimer();
        if (done) done();
        return;
      }
      const next = Math.min(target, current + step + Math.floor(Math.random() * 2));
      this.setData({
        homeProgress: next,
        homeProgressText: next >= 100 ? 'enter game' : next > 88 ? 'build workspace' : 'load base config'
      });
    }, speed);
  },

  clearHomeProgressTimer() {
    if (this.homeProgressTimer) {
      clearInterval(this.homeProgressTimer);
      this.homeProgressTimer = null;
    }
  },

  finishHomeLoading() {
    if (this.homeEntered) return;
    this.homeEntered = true;
    this.setData({
      showHome: false,
      homeLoading: false,
      homeProgress: 100,
      homeProgressText: 'enter game'
    }, () => this.tryShowWelcomePrompt());
  },

  startGame(options) {
    const allowGuest = !!(options && options.allowGuest);
    const profile = loadProfile();
    const saved = this.grantTestBonus(profile) || profile;
    if (!allowGuest && !this.canStartGameWithProfile(saved)) {
      this.requestProfileForStart();
      return;
    }
    const rank = RANKS[saved.rankIndex];
    this.game = this.createGameState();
    this.game.eventSchedule = this.createEventSchedule(rank.events, GAME.duration);
    this.clearEffectTimers();
    this.pauseHomeBgm();
    this.playGameBgm();
    this.setData({
      profile: saved,
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
      freezeActive: false,
      slowdownActive: false,
      overtimeModal: null,
      resultModal: null,
      reviveExamModal: null,
      eventToast: null,
      freezeToast: null,
      failOverlay: null,
      itemDockScrolled: false,
      itemDockScrollLeft: 0,
      visibleItemDock: this.visibleDockItems(this.data.itemDock, false),
      progressEffectList: [],
      moodEffectList: [],
      fxAnchor: { progress: null, mood: null }
    });
    trackEvent('round_start', { rankIndex: saved.rankIndex });
    this.tickTimer();
    this.measureEffectAnchors();
    setTimeout(() => this.setData({ showGuide: false }), 3000);
  },

  canStartGameWithProfile(profile) {
    return isFormalProfile(profile);
  },

  requestProfileForStart(onReady) {
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
        if (this.canStartGameWithProfile(saved)) {
          if (onReady) onReady(saved);
          else this.startGame();
        }
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

    const frozen = this.isFreezeActive(elapsed);
    const slowed = this.isSlowdownActive(elapsed);
    const drains = this.getActiveDrains(rank, overtimeDrain, slowed);
    const progress = frozen ? this.data.progress : this.clamp(this.data.progress - drains.progress);
    const mood = frozen ? this.data.mood : this.clamp(this.data.mood - drains.mood, 0, this.data.moodCap);
    const timeLeft = Math.max(this.data.duration - elapsed, 0);
    const updates = Object.assign(this.createMeterUpdates(progress, mood), {
      timeLeft,
      freezeActive: frozen,
      slowdownActive: slowed
    });
    if (progress < GAME.perfectLine || mood < GAME.perfectLine) {
      this.game.perfect = false;
    }
    this.setData(updates);
    if (!frozen) {
      setTimeout(() => {
        this.pushMeterEffect('progress', `-${this.formatDelta(drains.progress)}`);
        this.pushMeterEffect('mood', `-${this.formatDelta(drains.mood)}`);
      }, 0);
    }
    if (!frozen) this.tryTriggerEvent(elapsed);
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
    if (this.isFreezeActive(elapsed)) return;
    if (!this.game.eventSchedule.includes(elapsed)) return;
    const event = randomFrom(EVENTS);
    const progress = this.clamp(this.data.progress + event.progress);
    const mood = this.clamp(this.data.mood + event.mood, 0, this.data.moodCap);
    this.game.triggeredEvents += 1;
    this.setData(Object.assign(this.createMeterUpdates(progress, mood), {
      eventToast: event
    }));
    if (event.progress) this.pushMeterEffect('progress', this.effectText(event.progress));
    if (event.mood) this.pushMeterEffect('mood', this.effectText(event.mood));
    setTimeout(() => this.setData({ eventToast: null }), 1800);
  },

  tryTriggerOvertime(timeLeft) {
    if (this.game.overtimeTriggeredThisRound) return;
    if (!GAME.overtimeAt.includes(timeLeft) || this.game.triggeredOvertime[timeLeft]) return;
    this.game.overtimeTriggeredThisRound = true;
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
    const moodPenalty = modal.acceptMoodPenalty || 0;
    const mood = this.clamp(this.data.mood - moodPenalty, 0, this.data.moodCap);
    this.setData({
      mood,
      moodText: Math.round(mood),
      moodLevel: this.getMoodVisual(mood).level,
      duration: this.data.duration + (modal.extraTime || 0),
      timeLeft: this.data.timeLeft + (modal.extraTime || 0),
      overtimeModal: null
    });
    if (moodPenalty) this.pushMeterEffect('mood', `-${moodPenalty}`, 'loss');
    if (modal.extraTime) this.pushMeterEffect('progress', `+${modal.extraTime}s`, 'bonus');
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
    this.pushMeterEffect('progress', `+${GAME.progressTap}`);
  },

  tapMood() {
    if (this.data.status !== 'running' || this.data.paused) return;
    const mood = this.clamp(this.data.mood + GAME.moodTap, 0, this.data.moodCap);
    this.setData(this.createMeterUpdates(this.data.progress, mood));
    this.pushMeterEffect('mood', `+${GAME.moodTap}`);
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
    const updates = { profile: saveProfile(profile) };
    if (id === 'mood') {
      Object.assign(updates, this.createMeterUpdates(this.data.progress, this.clamp(this.data.mood + 20, 0, this.data.moodCap)));
      this.pushMeterEffect('mood', '+20');
    }
    if (id === 'progress') {
      Object.assign(updates, this.createMeterUpdates(this.clamp(this.data.progress + 15), this.clamp(this.data.mood - 8, 0, this.data.moodCap)));
      this.pushMeterEffect('progress', '+15');
      this.pushMeterEffect('mood', '-8');
    }
    if (id === 'needle') {
      profile.items[id] += 1;
      updates.profile = saveProfile(profile);
      wx.showToast({ title: '针用于小游戏干扰球', icon: 'none' });
    }
    if (id === 'bean') {
      Object.assign(updates, this.createMeterUpdates(this.clamp(this.data.progress + 8), this.clamp(this.data.mood + 4, 0, this.data.moodCap)));
      this.pushMeterEffect('progress', '+8');
      this.pushMeterEffect('mood', '+4');
    }
    if (id === 'mindstone') {
      Object.assign(updates, this.createMeterUpdates(this.clamp(this.data.progress + 4), this.clamp(this.data.mood + 8, 0, this.data.moodCap)));
      this.pushMeterEffect('progress', '+4');
      this.pushMeterEffect('mood', '+8');
    }
    if (id === 'freeze') {
      this.activateFreeze();
      this.showFreezeToast('冻结雪花生效', '5秒内冻结双容器，不触发扣减事件');
    }
    if (id === 'slowdown') {
      this.activateSlowdown();
      this.showFreezeToast('宕速球生效', '8秒内双数值每秒仅扣1');
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
    const bonusBean = this.data.mood > 20;
    this.setData({
      status: 'ending',
      failOverlay: {
        title,
        reason: reason || 'timeout'
      }
    });
    setTimeout(() => this.handleFailure(), 900);
    this.failBonusBean = bonusBean;
  },

  handleSuccess() {
    const profile = loadProfile();
    const oldRankIndex = profile.rankIndex;
    const rank = RANKS[oldRankIndex];
    const perfect = this.game.perfect && this.data.progress >= GAME.perfectLine && this.data.mood >= GAME.perfectLine;
    const multiplier = this.game.acceptedOvertimes.reduce((value, type) => {
      const config = OVERTIME[type];
      return value * (perfect ? config.perfectMultiplier : config.normalMultiplier);
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
    const bonusBean = !!this.failBonusBean;
    this.setData({
      status: 'finished',
      profile: saved,
      resultModal: {
        type: 'fail',
        title: '本次职场闯关失利啦',
        copy: bonusBean
          ? '您的心态指数剩余较多，良好的心态是进度的基石，送您一颗效率豆，接下来一定更好！'
          : randomFrom(FAILURE_TEXTS),
        rewards: bonusBean ? ['效率豆 +1'] : [],
        bonusBean
      }
    });
    trackEvent('round_fail', { rankIndex: saved.rankIndex, overtime: this.game.acceptedOvertimes });
  },

  claimFailureBean() {
    const modal = this.data.resultModal;
    if (!modal || !modal.bonusBean) return;
    const profile = loadProfile();
    profile.items.bean = (profile.items.bean || 0) + 1;
    const saved = saveProfile(profile);
    this.setData({
      profile: saved,
      resultModal: null,
      status: 'idle',
      failOverlay: null
    });
    this.stopGameBgm();
    this.playHomeBgm();
    wx.showToast({ title: '已获得效率豆', icon: 'none' });
    trackEvent('fail_bonus_claim', {});
  },

  reviveByAd() {
    this.startReviveExam('ad');
  },

  reviveByShare() {
    this.startReviveExam('share');
  },

  startReviveExam(type) {
    if (!isFormalProfile(loadProfile())) {
      wx.showToast({ title: '请先完善个人信息,游客不能原地复活', icon: 'none' });
      return;
    }
    const questions = this.createReviveExam(type);
    this.setData({
      resultModal: null,
      reviveExamModal: {
        type,
        questions,
        answers: {},
        error: ''
      }
    });
    trackEvent('revive_exam_start', { type });
  },

  createReviveExam(type) {
    const dev = randomFrom(EXAM_BANKS.dev);
    const mind = randomFrom(EXAM_BANKS.mind);
    return [
      this.formatExamQuestion(dev, '开发题'),
      this.formatExamQuestion(mind, '心态题')
    ];
  },

  formatExamQuestion(question, label) {
    return Object.assign({}, question, {
      label,
      displayAnswer: '',
      displayOptions: question.options && question.options.length
        ? question.options.map((option) => Object.assign({}, option, {
            label: `${option.key}. ${option.text}`
          }))
        : []
    });
  },

  chooseExamAnswer(event) {
    const index = Number(event.currentTarget.dataset.index);
    const value = event.currentTarget.dataset.value;
    const modal = this.data.reviveExamModal;
    if (!modal) return;
    this.setData({
      'reviveExamModal.answers': Object.assign({}, modal.answers, { [index]: value }),
      'reviveExamModal.error': ''
    });
  },

  inputExamAnswer(event) {
    const index = Number(event.currentTarget.dataset.index);
    const value = event.detail.value;
    const modal = this.data.reviveExamModal;
    if (!modal) return;
    this.setData({
      'reviveExamModal.answers': Object.assign({}, modal.answers, { [index]: value }),
      'reviveExamModal.error': ''
    });
  },

  submitReviveExam() {
    const modal = this.data.reviveExamModal;
    if (!modal) return;
    const correct = modal.questions.every((question, index) => {
      const value = modal.answers[index];
      return this.normalizeExamAnswer(value) === this.normalizeExamAnswer(question.answer);
    });
    if (!correct) {
      this.setData({
        'reviveExamModal.error': '答题未通过，两个题目都答对才能原地复活。'
      });
      trackEvent('revive_exam_fail', { type: modal.type });
      return;
    }
    this.revive(modal.type);
  },

  normalizeExamAnswer(value) {
    return String(value || '')
      .trim()
      .replace(/[（）()\\s]/g, '')
      .toLowerCase();
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
      reviveExamModal: null,
      status: 'running',
      paused: false,
      failOverlay: null
    }, this.createMeterUpdates(20, 20)));
    this.pushMeterEffect('progress', '20%', 'bonus');
    this.pushMeterEffect('mood', '20%', 'bonus');
    trackEvent('revive_exam_success', { type });
    this.tickTimer();
  },

  closeResult() {
    this.setData({ resultModal: null, reviveExamModal: null, status: 'idle', failOverlay: null });
    this.stopGameBgm();
    this.playHomeBgm();
    this.refreshProfile();
  },

  performCheckIn(auto) {
    if (!isFormalProfile(loadProfile())) {
      if (!auto) wx.showToast({ title: '请先完善个人信息,游客不能打卡签到', icon: 'none' });
      return;
    }
    const result = checkInProfile(auto);
    if (!result.checkedIn) {
      if (!auto && result.reason === 'already_checked_in') {
        wx.showToast({ title: '今日已打卡', icon: 'none' });
      } else if (!auto && result.reason === 'profile_not_ready') {
        wx.showToast({ title: '请先补全头像昵称宣言', icon: 'none' });
      }
      return;
    }
    this.setData({
      profile: result.profile,
      checkInModal: {
        auto: result.modal.auto,
        copy: result.modal.copy,
        reward: result.modal.reward
      }
    });
    this.refreshProfile();
  },

  tryAutoCheckInFromAppShow() {
    if (!shouldAutoCheckIn(loadProfile())) return;
    this.performCheckIn(true);
  },

  closeCheckIn() {
    this.setData({ checkInModal: null });
  },

  createEventSchedule(count, duration) {
    const result = [];
    const safeDuration = Math.max(8, duration - 5);
    const actualCount = Math.max(0, count);
    for (let i = 0; i < actualCount; i += 1) {
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

  isFreezeActive(elapsed = this.game.elapsed) {
    return !!(this.game.freezeUntil && elapsed < this.game.freezeUntil);
  },

  isSlowdownActive(elapsed = this.game.elapsed) {
    return !!(this.game.slowdownUntil && elapsed < this.game.slowdownUntil);
  },

  getActiveDrains(rank, overtimeDrain, slowed = this.isSlowdownActive()) {
    const progress = GAME.progressDrain + rank.drainBonus + overtimeDrain.progress;
    const mood = GAME.moodDrain + rank.drainBonus + overtimeDrain.mood;
    if (!slowed) return { progress, mood };
    return {
      progress: Math.min(progress, INTERFERENCE.slowdownDrain),
      mood: Math.min(mood, INTERFERENCE.slowdownDrain)
    };
  },

  activateFreeze() {
    this.game.freezeUntil = Math.max(this.game.freezeUntil || 0, this.game.elapsed + INTERFERENCE.freezeDuration);
    this.setData({ freezeActive: true });
    if (this.freezeTimer) clearTimeout(this.freezeTimer);
    this.freezeTimer = setTimeout(() => {
      if (!this.isFreezeActive()) this.setData({ freezeActive: false });
    }, INTERFERENCE.freezeDuration * 1000 + 80);
  },

  activateSlowdown() {
    this.game.slowdownUntil = Math.max(this.game.slowdownUntil || 0, this.game.elapsed + INTERFERENCE.slowdownDuration);
    this.setData({ slowdownActive: true });
    if (this.slowdownTimer) clearTimeout(this.slowdownTimer);
    this.slowdownTimer = setTimeout(() => {
      if (!this.isSlowdownActive()) this.setData({ slowdownActive: false });
    }, INTERFERENCE.slowdownDuration * 1000 + 80);
  },

  showFreezeToast(title, desc) {
    this.setData({ freezeToast: { title, desc } });
    if (this.freezeToastTimer) clearTimeout(this.freezeToastTimer);
    this.freezeToastTimer = setTimeout(() => {
      this.setData({ freezeToast: null });
      this.freezeToastTimer = null;
    }, 1500);
  },

  formatDelta(value) {
    const num = Number(value) || 0;
    return Number.isInteger(num) ? `${Math.abs(num)}` : `${Math.abs(num).toFixed(1)}`;
  },

  effectText(value) {
    const num = Number(value) || 0;
    const sign = num > 0 ? '+' : '-';
    return `${sign}${this.formatDelta(num)}`;
  },

  pushMeterEffect(zone, text, variant) {
    const key = zone === 'mood' ? 'moodEffectList' : 'progressEffectList';
    if (this.effectTimers[key]) {
      clearTimeout(this.effectTimers[key]);
      this.effectTimers[key] = null;
    }
    const anchor = this.getEffectAnchor(zone);
    const bubbleWidth = 128;
    const bubbleHeight = 64;
    const overlayWidth = Math.max(180, anchor.width || 0);
    const leftBase = Math.max(12, Math.round((overlayWidth - bubbleWidth) / 2));
    const leftJitter = Math.max(10, Math.round(overlayWidth * 0.1));
    const topBase = zone === 'mood' ? 90 : 72;
    const effect = {
      id: `${Date.now()}_${this.effectSeed += 1}`,
      text,
      cls: variant || (String(text).startsWith('-') ? 'loss' : 'gain'),
      leftPx: Math.max(8, leftBase + Math.floor(Math.random() * leftJitter) - Math.floor(leftJitter / 2)),
      topPx: topBase
    };
    this.setData({ [key]: [effect] });
    this.effectTimers[key] = setTimeout(() => {
      const current = this.data[key];
      if (Array.isArray(current) && current[0] && current[0].id === effect.id) {
        this.setData({ [key]: [] });
      }
      this.effectTimers[key] = null;
    }, 1520);
  },

  clearEffectTimers() {
    Object.keys(this.effectTimers || {}).forEach((key) => {
      clearTimeout(this.effectTimers[key]);
      this.effectTimers[key] = null;
    });
  },

  getEffectAnchor(zone) {
    const defaultProgress = { width: 330, height: 260 };
    const defaultMood = { width: 330, height: 260 };
    const anchor = this.data.fxAnchor && this.data.fxAnchor[zone];
    if (anchor && anchor.width && anchor.height) return anchor;
    return zone === 'mood' ? defaultMood : defaultProgress;
  },

  measureEffectAnchors(done) {
    if (!this.createSelectorQuery) {
      if (done) done();
      return;
    }
    const query = this.createSelectorQuery();
    query.select('.progress-effects').boundingClientRect();
    query.select('.mood-effects').boundingClientRect();
    query.exec((rects) => {
      const progress = rects && rects[0] ? rects[0] : null;
      const mood = rects && rects[1] ? rects[1] : null;
      this.setData({
        fxAnchor: {
          progress: progress
            ? {
                left: Math.round(progress.left),
                top: Math.round(progress.top),
                width: Math.round(progress.width),
                height: Math.round(progress.height)
              }
            : null,
          mood: mood
            ? {
                left: Math.round(mood.left),
                top: Math.round(mood.top),
                width: Math.round(mood.width),
                height: Math.round(mood.height)
              }
            : null
        }
      }, () => {
        if (done) done();
      });
    });
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  goSpace() {
    wx.switchTab({ url: '/pages/space/space' });
  },

  grantTestBonus(profile) {
    const current = profile || loadProfile();
    const needsTopUp = current.items && ITEMS.some((item) => (current.items[item.id] || 0) < 10);
    const shouldGrant = isTestAccount(current) && ((current.testBonusVersion || 0) < 1 || needsTopUp);
    if (!shouldGrant) return null;
    const items = current.items || {};
    ITEMS.forEach((item) => {
      items[item.id] = Math.max(items[item.id] || 0, 10);
    });
    current.items = items;
    current.testBonusGranted = true;
    current.testBonusVersion = 1;
    current.testAccount = true;
    const saved = saveProfile(current);
    this.setData({ profile: saved });
    wx.showToast({ title: '测试账号已发放道具+10', icon: 'none' });
    return saved;
  }
});

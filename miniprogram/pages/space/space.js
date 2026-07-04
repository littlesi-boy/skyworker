const { RANKS, SKINS, ITEMS } = require('../../utils/config');
const { loadProfile, saveProfile, todayKey, trackEvent, shouldAutoCheckIn, checkInProfile, isSkinUnlocked, isFormalProfile } = require('../../utils/store');

Page({
  data: {
    profile: loadProfile(),
    rank: RANKS[0],
    activeSkin: SKINS[0],
    ownedSkins: [],
    activeTab: 'skins',
    today: todayKey(),
    checkedInToday: false,
    growthStats: [],
    checkInModal: null
  },

  onLoad() {
    this.refresh();
  },

  onShow() {
    this.refresh();
    if (wx.getStorageSync('pendingAutoCheckIn')) {
      wx.removeStorageSync('pendingAutoCheckIn');
      this.tryAutoCheckInFromAppShow();
    }
  },

  refresh() {
    const profile = loadProfile();
    const rank = RANKS[profile.rankIndex];
    const activeSkin = SKINS.find((skin) => skin.id === profile.activeSkin) || SKINS[0];
    const ownedSkins = SKINS
      .filter((skin) => profile.skins.includes(skin.id) || skin.unlockRankIndex !== undefined)
      .map((skin) => Object.assign({}, skin, {
        locked: !isSkinUnlocked(skin.id, profile.rankIndex)
      }));
    this.setData({
      profile,
      rank,
      activeSkin,
      ownedSkins,
      today: todayKey(),
      checkedInToday: profile.lastCheckInDate === todayKey(),
      growthStats: this.createGrowthStats(profile)
    });
  },

  createGrowthStats(profile) {
    return [
      { label: '历史最高段位', value: RANKS[profile.highestRankIndex].title },
      { label: '累计通关次数', value: profile.passCount },
      { label: '总晋升积分', value: profile.totalScore },
      { label: '接受加班对局数', value: profile.overtimeRounds },
      { label: '完美通关场次', value: profile.perfectCount },
      { label: '累计加班次数', value: profile.overtimeCount },
      { label: '累计加班时长', value: `${Math.round(profile.overtimeSeconds / 3600)}h` },
      { label: '获得道具', value: this.itemSummary(profile.items) }
    ];
  },

  itemSummary(items) {
    return ITEMS.map((item) => `${item.name}${items[item.id] || 0}`).join(' / ');
  },

  openProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab });
  },

  switchSkin(event) {
    const id = event.currentTarget.dataset.id;
    const profile = loadProfile();
    if (!this.canSwitchSkin(profile)) {
      wx.showToast({ title: '请先完善个人信息,游客不能切换工位', icon: 'none' });
      return;
    }
    if (!isSkinUnlocked(id, profile.rankIndex)) {
      wx.showToast({ title: '当前职级不够，晋升到第三关可解锁', icon: 'none' });
      return;
    }
    if (!profile.skins.includes(id)) return;
    profile.activeSkin = id;
    saveProfile(profile);
    trackEvent('skin_switch', { id });
    this.refresh();
  },

  canSwitchSkin(profile) {
    return isFormalProfile(profile);
  },

  manualCheckIn() {
    this.performCheckIn(false);
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
      checkInModal: {
        auto: result.modal.auto,
        copy: result.modal.copy,
        reward: result.modal.reward
      }
    });
    this.refresh();
  },

  tryAutoCheckInFromAppShow() {
    if (!shouldAutoCheckIn(loadProfile())) return;
    this.performCheckIn(true);
  },

  closeCheckIn() {
    this.setData({ checkInModal: null });
  }
});

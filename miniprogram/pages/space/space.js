const { RANKS, SKINS, ITEMS, CHECKIN_TEXTS } = require('../../utils/config');
const { loadProfile, saveProfile, randomFrom, randomSkin, todayKey, trackEvent } = require('../../utils/store');

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
  },

  refresh() {
    const profile = loadProfile();
    const rank = RANKS[profile.rankIndex];
    const activeSkin = SKINS.find((skin) => skin.id === profile.activeSkin) || SKINS[0];
    const ownedSkins = SKINS.filter((skin) => profile.skins.includes(skin.id));
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
    if (!profile.skins.includes(id)) return;
    profile.activeSkin = id;
    saveProfile(profile);
    trackEvent('skin_switch', { id });
    this.refresh();
  },

  manualCheckIn() {
    this.performCheckIn(false);
  },

  performCheckIn(auto) {
    const profile = loadProfile();
    const today = todayKey();
    if (profile.lastCheckInDate === today) {
      wx.showToast({ title: '今日已打卡', icon: 'none' });
      return;
    }
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
    saveProfile(profile);
    this.setData({
      checkInModal: {
        auto,
        copy: randomFrom(CHECKIN_TEXTS),
        reward: rewards.join('、')
      }
    });
    trackEvent('check_in', { auto, streak: profile.checkInStreak });
    this.refresh();
  },

  closeCheckIn() {
    this.setData({ checkInModal: null });
  }
});

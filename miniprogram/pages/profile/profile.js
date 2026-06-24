const { RANKS, SKINS, ITEMS, CHECKIN_TEXTS } = require('../../utils/config');
const { isProfileReady, loadProfile, saveProfile, randomFrom, randomSkin, todayKey, trackEvent } = require('../../utils/store');

Page({
  data: {
    profile: loadProfile(),
    form: {},
    rank: RANKS[0],
    activeSkin: SKINS[0],
    checkedInToday: false,
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
    this.setData({
      profile,
      form: {
        nickname: profile.nickname === '游客身份' ? '' : profile.nickname,
        avatarUrl: profile.avatarUrl,
        motto: profile.motto
      },
      rank,
      activeSkin,
      checkedInToday: profile.lastCheckInDate === todayKey()
    });
  },

  onChooseAvatar(event) {
    this.setData({ 'form.avatarUrl': event.detail.avatarUrl });
  },

  chooseLocalAvatar() {
    const saveAvatar = (path) => {
      if (!path) {
        wx.showToast({ title: '未选择头像', icon: 'none' });
        return;
      }
      this.setData({ 'form.avatarUrl': path });
      const profile = loadProfile();
      profile.avatarUrl = path;
      profile.completedProfile = isProfileReady(Object.assign({}, profile, { completedProfile: true }));
      saveProfile(profile);
      wx.showToast({ title: '头像已更新', icon: 'success' });
      this.refresh();
    };
    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const file = res.tempFiles && res.tempFiles[0];
          saveAvatar(file && file.tempFilePath);
        },
        fail() {
          wx.showToast({ title: '未选择头像', icon: 'none' });
        }
      });
      return;
    }
    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: (res) => {
        saveAvatar(res.tempFilePaths && res.tempFilePaths[0]);
      },
      fail() {
        wx.showToast({ title: '未选择头像', icon: 'none' });
      }
    });
  },

  onNicknameInput(event) {
    this.setData({ 'form.nickname': event.detail.value });
  },

  onMottoInput(event) {
    this.setData({ 'form.motto': event.detail.value });
  },

  saveProfileInfo() {
    const form = this.data.form;
    const nickname = (form.nickname || '').trim();
    const motto = (form.motto || '').trim();
    if (!nickname || !form.avatarUrl || !motto) {
      wx.showToast({ title: '请补全头像昵称宣言', icon: 'none' });
      return;
    }
    if (motto.length > 20) {
      wx.showToast({ title: '宣言不能超过20字', icon: 'none' });
      return;
    }
    const profile = loadProfile();
    profile.nickname = nickname;
    profile.avatarUrl = form.avatarUrl;
    profile.motto = motto;
    profile.completedProfile = isProfileReady(Object.assign({}, profile, { completedProfile: true }));
    saveProfile(profile);
    trackEvent('profile_save', {});
    wx.showToast({ title: '已保存', icon: 'success' });
    this.refresh();
  },

  toggleAutoCheckIn(event) {
    const profile = loadProfile();
    profile.autoCheckIn = event.detail.value;
    saveProfile(profile);
    trackEvent('checkin_mode_change', { auto: profile.autoCheckIn });
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
  },

  clearRecords() {
    wx.showModal({
      title: '清空个人战绩',
      content: '将清空积分、段位、统计和历史记录，保留头像昵称、皮肤和道具。',
      confirmText: '清空',
      confirmColor: '#8f3a3a',
      success: (res) => {
        if (!res.confirm) return;
        const profile = loadProfile();
        profile.totalScore = 0;
        profile.rankIndex = 0;
        profile.highestRankIndex = 0;
        profile.passCount = 0;
        profile.failCount = 0;
        profile.perfectCount = 0;
        profile.overtimeRounds = 0;
        profile.overtimeCount = 0;
        profile.overtimeSeconds = 0;
        profile.totalRounds = 0;
        profile.reviveAdCount = 0;
        profile.reviveShareCount = 0;
        profile.records = [];
        saveProfile(profile);
        trackEvent('records_clear', {});
        wx.showToast({ title: '已清空', icon: 'success' });
        this.refresh();
      }
    });
  }
});

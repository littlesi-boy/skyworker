const { RANKS, SKINS } = require('../../utils/config');
const { isProfileReady, isFormalProfile, loadProfile, saveProfile, todayKey, trackEvent, shouldAutoCheckIn, checkInProfile } = require('../../utils/store');

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
    if (wx.getStorageSync('pendingAutoCheckIn')) {
      wx.removeStorageSync('pendingAutoCheckIn');
      this.tryAutoCheckInFromAppShow();
    }
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

  toggleLeaderboard(event) {
    const enabled = !!event.detail.value;
    const profile = loadProfile();
    if (enabled && !isProfileReady(profile)) {
      wx.showToast({ title: '请先完善个人信息,游客不能查看排行榜', icon: 'none' });
      this.refresh();
      return;
    }
    if (!enabled) {
      profile.friendAuth = false;
      profile.leaderboardEnabled = false;
      saveProfile(profile);
      trackEvent('leaderboard_toggle', { enabled: false, from: 'profile' });
      this.refresh();
      return;
    }
    wx.showModal({
      title: '开启匿名排行榜',
      content: '开启后仅同步脱敏代号、段位、晋升积分、通关次数和完美通关次数；不上传头像、微信昵称原文、宣言、背包和历史对局明细。',
      confirmText: '开启',
      success: (res) => {
        if (!res.confirm) {
          this.refresh();
          return;
        }
        profile.privacyAccepted = true;
        profile.friendAuth = true;
        profile.leaderboardEnabled = true;
        saveProfile(profile);
        trackEvent('leaderboard_toggle', { enabled: true, from: 'profile' });
        this.refresh();
      }
    });
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
  },

  clearRecords() {
    wx.showModal({
      title: '清空个人战绩',
      content: '将清空积分、段位、统计和历史记录，保留头像昵称工位和道具。',
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

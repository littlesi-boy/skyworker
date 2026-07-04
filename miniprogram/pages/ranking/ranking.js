const { RANKS, SKINS } = require('../../utils/config');
const { isProfileReady, isFormalProfile, loadProfile, saveProfile, trackEvent } = require('../../utils/store');
const { CLOUD_ENV } = require('../../utils/env');

Page({
  data: {
    profile: loadProfile(),
    activeSkin: SKINS[0],
    rankings: [],
    mine: null,
    mineRankText: '未入榜',
    loading: false
  },

  onLoad() {
    this.refreshProfile();
  },

  onShow() {
    this.refreshProfile();
    if (isFormalProfile(this.data.profile) && this.data.profile.leaderboardEnabled) this.fetchRankings();
  },

  refreshProfile() {
    const profile = loadProfile();
    const activeSkin = SKINS.find((skin) => skin.id === profile.activeSkin) || SKINS[0];
    this.setData({
      profile,
      activeSkin,
      mineRankText: profile.leaderboardEnabled ? this.data.mineRankText : '未入榜'
    });
  },

  toggleLeaderboard(event) {
    const enabled = !!event.detail.value;
    if (enabled) {
      this.confirmEnableLeaderboard();
      return;
    }
    this.setLeaderboardEnabled(false);
  },

  confirmEnableLeaderboard() {
    const profile = loadProfile();
    if (!isProfileReady(profile)) {
      wx.showToast({ title: '请先完善个人信息,游客不能查看排行榜', icon: 'none' });
      this.refreshProfile();
      return;
    }
    wx.showModal({
      title: '开启匿名排行榜',
      content: '开启后仅同步脱敏代号、段位、晋升积分、通关次数和完美通关次数；不上传头像、微信昵称原文、宣言、背包和历史对局明细。',
      confirmText: '开启',
      success: (res) => {
        if (res.confirm) {
          this.setLeaderboardEnabled(true);
        } else {
          this.refreshProfile();
        }
      }
    });
  },

  setLeaderboardEnabled(enabled) {
    const profile = loadProfile();
    profile.privacyAccepted = profile.privacyAccepted || enabled;
    profile.friendAuth = enabled;
    profile.leaderboardEnabled = enabled;
    const saved = saveProfile(profile);
    this.setData({
      profile: saved,
      rankings: enabled ? this.data.rankings : [],
      mine: null,
      mineRankText: enabled ? '同步中' : '未入榜'
    });
    trackEvent('leaderboard_toggle', { enabled });
    if (enabled) {
      wx.showToast({ title: '已开启匿名入榜', icon: 'success' });
      setTimeout(() => this.fetchRankings(), 500);
    } else {
      wx.showToast({ title: '已关闭匿名入榜', icon: 'none' });
    }
  },

  fetchRankings() {
    if (!isFormalProfile(loadProfile())) {
      wx.showToast({ title: '请先完善个人信息,游客不能查看排行榜', icon: 'none' });
      return;
    }
    if (!wx.cloud) {
      wx.showToast({ title: '云服务不可用', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: 'getRankings',
      config: { env: CLOUD_ENV },
      data: { limit: 50 },
      success: (res) => {
        const result = res && res.result ? res.result : {};
        const list = (result.list || []).map((item, index) => this.formatRankingItem(item, index));
        const mine = result.mine || null;
        this.setData({
          rankings: list,
          mine,
          mineRankText: mine && mine.enabled
            ? (mine.rank ? `第 ${mine.rank} 名` : '同步中')
            : '未入榜',
          loading: false
        });
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '排行榜加载失败', icon: 'none' });
      }
    });
  },

  formatRankingItem(item, index) {
    const rank = RANKS[item.rankIndex || 0] || RANKS[0];
    return Object.assign({}, item, {
      position: item.position || index + 1,
      displayName: item.displayName || '匿名打工人',
      avatarText: String(item.displayName || '工').slice(-2),
      rankTitle: rank.title,
      totalScore: item.totalScore || 0,
      passCount: item.passCount || 0,
      perfectCount: item.perfectCount || 0
    });
  }
});

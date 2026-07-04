const { createDefaultProfile, saveProfile, loadProfile, shouldAutoCheckIn, checkInProfile } = require('./utils/store');
const { CLOUD_ENV } = require('./utils/env');

App({
  globalData: {
    envId: CLOUD_ENV,
    profile: null,
    welcomeShown: false
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.envId || undefined,
        traceUser: true
      });
    }

    const profile = wx.getStorageSync('profile') || createDefaultProfile();
    this.globalData.profile = profile;
    wx.setStorageSync('profile', profile);
    if (wx.cloud) {
      wx.cloud.callFunction({
        name: 'login',
        config: {
          env: this.globalData.envId || undefined
        },
        success: (res) => {
          const openid = res && res.result && res.result.openid ? res.result.openid : '';
          if (!openid) return;
          const next = saveProfile(Object.assign({}, wx.getStorageSync('profile') || createDefaultProfile(), {
            openid,
            testAccount: (wx.getStorageSync('profile') || {}).testAccount || openid === 'YOUR_TEST_OPENID'
          }));
          this.globalData.profile = next;
          const pages = getCurrentPages();
          const current = pages[pages.length - 1];
          if (current && current.refreshProfile) {
            current.refreshProfile();
          }
        },
        fail() {}
      });
    }

  },

  onHide() {
    const pages = getCurrentPages();
    const current = pages[pages.length - 1];
    if (current && current.pauseGameFromAppHide) {
      current.pauseGameFromAppHide();
    }
  },

  onShow() {
    this.tryAutoCheckInFromAppShow();
  },

  tryAutoCheckInFromAppShow() {
    const profile = loadProfile();
    if (!shouldAutoCheckIn(profile)) return;

    const pages = getCurrentPages();
    const current = pages[pages.length - 1];
    if (!current) {
      wx.setStorageSync('pendingAutoCheckIn', true);
      return;
    }

    if (current.tryAutoCheckInFromAppShow) {
      current.tryAutoCheckInFromAppShow();
      return;
    }

    const result = checkInProfile(true);
    if (!result.checkedIn) return;
    this.globalData.profile = result.profile;
    if (current.refreshProfile) current.refreshProfile();
    else if (current.refresh) current.refresh();
    else if (current.setData) current.setData({ profile: result.profile });
    if (current.data && Object.prototype.hasOwnProperty.call(current.data, 'checkInModal')) {
      current.setData({ checkInModal: result.modal });
    } else {
      wx.showToast({ title: '自动打卡成功', icon: 'success' });
    }
  }
});

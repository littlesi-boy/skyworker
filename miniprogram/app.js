const { createDefaultProfile, isProfileReady, todayKey } = require('./utils/store');
const { CLOUD_ENV } = require('./utils/env');

App({
  globalData: {
    envId: CLOUD_ENV,
    profile: null
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

    if (isProfileReady(profile) && profile.autoCheckIn && profile.lastCheckInDate !== todayKey()) {
      wx.setStorageSync('pendingAutoCheckIn', true);
    }
  },

  onHide() {
    const pages = getCurrentPages();
    const current = pages[pages.length - 1];
    if (current && current.pauseGameFromAppHide) {
      current.pauseGameFromAppHide();
    }
  }
});

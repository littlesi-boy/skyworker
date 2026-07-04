const RANKS = [
  { title: '短期兼职外包', tier: '底层牛马', drainBonus: 0, events: 0, threshold: 3, normalScore: 1, perfectScore: 2, workspace: '破旧折叠工位，无电脑，桌面杂乱' },
  { title: '长期外包', tier: '底层牛马', drainBonus: 0.1, events: 1, threshold: 6, normalScore: 1, perfectScore: 2, workspace: '老旧台式电脑，桌面满屏bug弹窗' },
  { title: '预备正式工', tier: '基层过渡', drainBonus: 0.2, events: 1, threshold: 10, normalScore: 1, perfectScore: 2, workspace: '全新单屏办公工位，摆放代码文档' },
  { title: '正式工', tier: '基层牛马', drainBonus: 0.35, events: 2, threshold: 18, normalScore: 1, perfectScore: 2, workspace: '标准职场工位，桌面增加绿植' },
  { title: '技术组长', tier: '基层管理', drainBonus: 0.5, events: 2, threshold: 30, normalScore: 1, perfectScore: 2, workspace: '双屏开发工位，实时组员消息弹窗' },
  { title: '部门经理', tier: '中层管理', drainBonus: 0.7, events: 2, threshold: 50, normalScore: 1, perfectScore: 2, workspace: '独立玻璃隔间，高频会议提醒' },
  { title: '团队经理', tier: '中高层管理', drainBonus: 0.9, events: 3, threshold: 80, normalScore: 1, perfectScore: 2, workspace: '独立单人办公室，跨部门沟通消息' },
  { title: '大区经理', tier: '高层管理', drainBonus: 1.1, events: 3, threshold: 120, normalScore: 1, perfectScore: 2, workspace: '落地窗高管办公室，全天项目会议' },
  { title: '轮值CTO', tier: '准顶层高管', drainBonus: 1.35, events: 3, threshold: 180, normalScore: 1, perfectScore: 2, workspace: '顶层全景办公室，全天线上故障预警' },
  { title: '集团常务CTO', tier: '职场天花板', drainBonus: 1.6, events: 4, threshold: 260, normalScore: 1, perfectScore: 2, workspace: '总裁顶层办公室，城市天际线背景，永久毕业标识' }
];

const GAME = {
  duration: 36,
  passLine: 0,
  perfectLine: 25,
  progressDrain: 2,
  moodDrain: 1.5,
  progressTap: 3,
  moodTap: 4,
  overtimeAt: [30, 15],
  initialProgress: 80,
  initialMood: 80
};

const INTERFERENCE = {
  firstAt: 8,
  baseInterval: 8,
  minInterval: 4,
  growAfter: 3,
  baseFallSpeed: 0.13,
  speedStep: 0.018,
  smallDamage: 5,
  bigDamage: 8,
  spawnMoodDamage: 1,
  growMoodDamage: 2,
  smallMoodDamage: 2,
  bigMoodDamage: 3,
  needleDropChance: 0.35,
  freezeRankLimit: 4,
  freezeDropStart: 8,
  freezeDropEnd: 18,
  freezeDuration: 5,
  slowdownDropStart: 10,
  slowdownDropEnd: 22,
  slowdownDuration: 8,
  slowdownDrain: 1,
  slowdownFallFactor: 0.45,
  slowdownGrowAfter: 7
};

const EVENTS = [
  { title: '线上突发bug', desc: '开发进度扣除20%，心态同步扣除25%', progress: -20, mood: -25 },
  { title: '下班临时排障通知', desc: '心态值瞬间扣除15%', progress: 0, mood: -15 },
  { title: '需求临时变更', desc: '双数值同步扣除10%', progress: -10, mood: -10 }
];

const OVERTIME = {
  normal: {
    title: '部门加班通知',
    desc: '版本即将上线，需要临时增补开发功能，是否自愿留下来加班？',
    accept: '接受加班',
    acceptNote: '时长+8s · 积分加成 · 随机道具×2 · 心态-10 · 心态流失提升至每秒2',
    reject: '准时下班（无收益无惩罚，正常对局）',
    normalMultiplier: 1.5,
    perfectMultiplier: 2,
    progressDrain: 0,
    moodDrain: 0.5,
    extraEvents: 1,
    items: 2,
    acceptMoodPenalty: 10,
    extraTime: 8
  },
  night: {
    title: '紧急运维通知',
    desc: '线上出现重大系统故障，需要通宵留守排查问题，是否接受通宵加班？',
    accept: '接受通宵加班',
    acceptNote: '时长+8s · 普通*2 / 完美*3 · 随机道具×4 · 高级工位 · 心态-10 · 心态流失提升至每秒2',
    reject: '准时下班（无收益无惩罚，正常对局）',
    normalMultiplier: 2,
    perfectMultiplier: 3,
    progressDrain: 0,
    moodDrain: 0.5,
    extraEvents: 2,
    items: 4,
    acceptMoodPenalty: 10,
    skinId: 'night-ops',
    extraTime: 8
  }
};

const ITEMS = [
  { id: 'mood', name: '心态回血卡', icon: '☕', desc: '心态值+20%' },
  { id: 'progress', name: '工作加急卡', icon: '⚡', desc: '点击开发进度+15%，心态值-8%' },
  { id: 'needle', name: '破Bug针', icon: '📌', desc: '刺破正在下落的bug球，本局和下局都可使用' },
  { id: 'freeze', name: '冻结雪花', icon: '❄️', desc: '5秒内冻结开发进度和心态指数，不再扣减数值' },
  { id: 'slowdown', name: '宕速球', icon: '🧊', desc: '8秒内双数值每秒仅扣1，并延缓bug球下落和变大' },
  { id: 'bean', name: '效率豆', icon: '🫘', desc: '点击开发进度+8、心态值+4，长按蓄力开发进度+15、心态值+8' },
  { id: 'mindstone', name: '心态石', icon: '💗', desc: '点击心态值+8、开发进度+4，长按蓄力心态值+15、开发进度+8' }
];

const SKINS = [
  { id: 'default', name: '天选打工人工位', rarity: '基础', tone: 'chosen', gradient: 'linear-gradient(145deg,#eef5e9,#fff8e8)' },
  { id: 'eye-care', name: '低调护眼工位', rarity: '基础', tone: 'calm', gradient: 'linear-gradient(145deg,#e1f4dc,#f5fbef)' },
  { id: 'dark-knight', name: '暗夜骑士工位', rarity: '基础', tone: 'knight', unlockRankIndex: 3, gradient: 'linear-gradient(145deg,#101820,#25313a)' },
  { id: 'mint-focus', name: '薄荷专注舱', rarity: '稀有', tone: 'green', gradient: 'linear-gradient(145deg,#e7f7ee,#fbfcf4)' },
  { id: 'sunset-release', name: '橙光发布台', rarity: '史诗', tone: 'orange', gradient: 'linear-gradient(145deg,#fff2df,#eaf4ff)' },
  { id: 'aurora-cto', name: '极光CTO顶楼', rarity: '传说', tone: 'aurora', gradient: 'linear-gradient(145deg,#e7fff7,#f4edff)' },
  { id: 'night-ops', name: '熬夜加班工位', rarity: '限定', tone: 'night', gradient: 'linear-gradient(145deg,#243447,#4b5f72)' }
];

const FAILURE_TEXTS = [
  '只干活不放松，迟早内耗耗尽；只摸鱼不工作，终究难以成长',
  '打工最好的状态：认真工作，也允许自己适时偷懒',
  '不必一直紧绷，平衡工作与放松，才是长久打工之道',
  '不用做满分打工人，及格且开心，已经胜过大多数人',
  '工作是生活的一部分，不是全部，照顾好心态远比KPI重要',
  '一次平衡失败没关系，慢慢找到属于自己的打工节奏就好',
  '不用焦虑进度落后，停下来喘口气，再出发就好',
  '努力工作值得肯定，偷偷放松也无需愧疚',
  '天天改bug已经很累了，适当摸鱼，不用一直硬扛所有线上故障',
  '代码永远写不完，需求永远改不完，心态崩了，代码永远写不好',
  '线上突发故障无法避免，不用因为一次意外，否定自己全部努力',
  '升职本来就很慢，不必急于求成，职场成长本就是循序渐进',
  '没人能一直保持高效编码，允许自己有摸鱼放松的片刻',
  '程序员最大的胜利，不是写完所有代码，而是守住自己的心态',
  '底层晋升漫漫无期，坚持下去，总能慢慢往上走',
  '加班能加速晋升，但别拿情绪和健康兑换职级',
  '临时加班换来的积分很诱人，可透支的心态很难补回',
  '不必强行熬夜冲进度，慢慢升级，也是一种职场选择',
  '通宵排障的奖励再丰厚，也要记得给自己留放松的时间',
  '有人靠加班快速晋升，也有人准点下班守住生活，没有对错'
];

const CHECKIN_TEXTS = [
  '准时打卡就位，元气开工，今日全力以赴！',
  '打卡成功，收拾好心情，认真奔赴每一份热爱',
  '早安打卡，活力拉满，踏实努力闪闪发光',
  '准时到岗打卡，满怀热忱，开启充实工作日',
  '清晨打卡蓄力，保持热忱，稳步向前冲'
];

module.exports = {
  RANKS,
  GAME,
  EVENTS,
  OVERTIME,
  INTERFERENCE,
  ITEMS,
  SKINS,
  FAILURE_TEXTS,
  CHECKIN_TEXTS
};

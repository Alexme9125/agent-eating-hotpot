export type BotArchetype =
  | "calm"
  | "analyst"
  | "patient"
  | "balanced"
  | "nimble"
  | "chaotic"
  | "momentum"
  | "shark"
  | "festive"
  | "ambusher";

export interface PersonaVoices {
  /** Quick reaction to narrow/unplayable spreads like A-4, 2-4. */
  trashFold: readonly string[];
  /** First-beat read on marginal or medium spreads. */
  closeRead: readonly string[];
  /** Second-beat lean when deciding to play a close spot. */
  closeCommit: readonly string[];
  /** Second-beat lean when backing off from a close spot. */
  closeBail: readonly string[];
  /** Reading a solid or wide spread (4-K, 3-K, 2-K). */
  goodSpot: readonly string[];
  /** Specific reaction to holding A-K (88% win vs 4x super-horn). */
  akDrama: readonly string[];
  /** Holding a pair (5K shot to sweep the entire pool). */
  pairHype: readonly string[];
  /** Folding a pair (pool too small or pair outs already seen). */
  pairPass: readonly string[];
  /** Noticing a huge Wish Pool. */
  fatPool: readonly string[];
  /** Noticing a chance to clear the entire Wish Pool in one shot. */
  clearPot: readonly string[];
  /** Sharp orbit-card observation (horn cards already out, etc.). */
  cardRead: readonly string[];
  /** Self-check when tilted or cooling off after a recent horn/loss. */
  afterHorn: readonly string[];
  /** Self reactions after own reveal. */
  onWin: readonly string[];
  onBigWin: readonly string[];
  onLose: readonly string[];
  onHorn: readonly string[];
  onTripleWin: readonly string[];
  onConsecutive: readonly string[];
  /** Brief spectator reactions to other players' dramatic moments. */
  reactHorn: readonly string[];
  reactBigWin: readonly string[];
  reactTriple: readonly string[];
  reactFatPool: readonly string[];
}

export interface PlayStyle {
  /** Fold when per-token EV is below this. Higher (less negative) means more cautious. */
  foldBelow: number;
  /** Typical share of the legal add range, before EV scaling. */
  sizeBias: number;
  /** Random wobble on the fold line so they don't play like a script. */
  mood: number;
  /** Extra chance to fold a barely-playable spot. */
  scratch: number;
  /** Chance to push the legal max when both EV and win-rate are high. */
  shove: number;
  thinkMin: number;
  thinkMax: number;
  /** Fallback lines while thinking. */
  thinkLines: readonly string[];
  /** Distinct table personality archetype. */
  archetype: BotArchetype;
  /** Short table impression label. */
  tagline: string;
  /** 0-1: how closely they track visible cards dealt earlier in the orbit. */
  cardSense: number;
  /** -1 (cools down & tightens) to +1 (heats up / tilts) after a horn or losing skid. */
  tiltBias: number;
  /** 0-1: how much a winning streak makes them press harder and act brisker. */
  streakDrive: number;
  /** 0-1: extra respect/aversion to 4x super-horn variance on A-K. */
  hornFear: number;
  /** 0-1: attraction to fat pools and clean one-shot pool clears. */
  potHunger: number;
  /** 0-1: awareness of the 24-deal split countdown. */
  splitSense: number;
  /** 0-1: propensity to drop short post-outcome table reactions. */
  talkativeness: number;
  /** Bet sizing taste. */
  sizeHabit: "clean" | "fraction" | "lucky" | "pot";
  /** Persona-specific conversational voice bank. */
  voices: PersonaVoices;
}

export interface LlmPersona {
  id: string;
  name: string;
  initials: string;
  color: string;
  style: PlayStyle;
}

/** Table nicknames. `id` is an internal play-style key, not shown to players. */
export const LLM_PERSONAS: readonly LlmPersona[] = [
  {
    id: "claude",
    name: "Tibo",
    initials: "TB",
    color: "#B45C43",
    style: {
      foldBelow: -0.38,
      sizeBias: 0.22,
      mood: 0.05,
      scratch: 0.22,
      shove: 0.12,
      thinkMin: 4600,
      thinkMax: 8400,
      thinkLines: ["先看区间…", "这点不太稳", "小一点吧", "过掉也行"],
      archetype: "calm",
      tagline: "冷静克制",
      cardSense: 0.85,
      tiltBias: -0.5,
      streakDrive: 0.2,
      hornFear: 0.82,
      potHunger: 0.42,
      splitSense: 0.85,
      talkativeness: 0.48,
      sizeHabit: "clean",
      voices: {
        trashFold: ["太窄了，过", "这口不吃", "没空间，放掉"],
        closeRead: ["区间刚够边…", "有点微妙", "得掂量下风险"],
        closeCommit: ["轻点试一手", "控制下分量", "小注看看"],
        closeBail: ["还是稳一手", "算了，不冒这个险", "留着底牌吧"],
        goodSpot: ["区间挺舒展", "这手能打", "胜面还行，稳着来"],
        akDrama: ["A 和 K…四倍尖得防", "好牌，但四倍尖太扎手", "别太贪，防一手牛角"],
        pairHype: ["对子，五千博全池很值", "成本低，摸一把三张"],
        pairPass: ["池子太浅，算了", "这把不碰了"],
        fatPool: ["池子很厚，但别乱冲", "越肥越要冷静"],
        clearPot: ["刚好能清池…想想", "一注收锅，稳着打"],
        cardRead: ["桌上出过几张，安心点", "刚露过同点，风险小了"],
        afterHorn: ["刚才被扎了一下，先收收", "稳住，不急着追"],
        onWin: ["落袋为安", "稳稳吃进", "不错"],
        onBigWin: ["这手舒服", "收工一笔", "正好卡进去了"],
        onLose: ["偏差一点", "没中，无妨", "当添汤了"],
        onHorn: ["精准避坑失败…", "行吧，认栽", "真撞尖上了"],
        onTripleWin: ["居然真摸到了", "谢谢各位的汤底"],
        onConsecutive: ["连张，省得纠结", "自动过也好"],
        reactHorn: ["听着都疼", "这记牛角太准了", "池子瞬间厚了"],
        reactBigWin: ["好胆识", "打得漂亮", "稳准狠"],
        reactTriple: ["这也真开出来了", "服气"],
        reactFatPool: ["汤底越来越浓了"],
      },
    },
  },
  {
    id: "gpt",
    name: "Linus",
    initials: "LI",
    color: "#22745E",
    style: {
      foldBelow: -0.4,
      sizeBias: 0.26,
      mood: 0.045,
      scratch: 0.18,
      shove: 0.14,
      thinkMin: 4400,
      thinkMax: 8000,
      thinkLines: ["算一下期望…", "赔率一般", "控制一下", "再确认"],
      archetype: "analyst",
      tagline: "精算派",
      cardSense: 0.92,
      tiltBias: -0.35,
      streakDrive: 0.25,
      hornFear: 0.62,
      potHunger: 0.55,
      splitSense: 0.92,
      talkativeness: 0.45,
      sizeHabit: "fraction",
      voices: {
        trashFold: ["负期望太高，弃", "赔率划不来", "直接过"],
        closeRead: ["算下中间几张…", "卡在盈亏线附近", "赔率将将够"],
        closeCommit: ["按比例下一点", "小仓位可以接", "试探一手"],
        closeBail: ["算完还是划不来", "波动太大，不打", "过掉更优"],
        goodSpot: ["正期望，加注", "区间够宽，舒服", "胜率站得住"],
        akDrama: ["A+K 胜率高，但四倍要算上限", "按封顶算其实不亏…"],
        pairHype: ["五千换全池，正期望", "赔率够高，买张彩票"],
        pairPass: ["赔率不够，放弃", "牌堆里同点见光了，弃"],
        fatPool: ["池子够大，值得出手", "这池子赔率好看"],
        clearPot: ["直接把池子算干净", "够清池了，可以打"],
        cardRead: ["刚桌面上走了两张尖", "记着前面出过的牌，胜面更高"],
        afterHorn: ["小概率事件，按纪律打", "不情绪化，看牌"],
        onWin: ["符合预期", "按剧本走", "稳"],
        onBigWin: ["完美兑现", "好收成", "这注值了"],
        onLose: ["正常方差", "差了一格", "还在预算内"],
        onHorn: ["12% 也让我赶上了", "方差拉满…", "真给钻到了"],
        onTripleWin: ["4% 的奇迹，全收！", "小概率爆发"],
        onConsecutive: ["连张省心", "零成本过牌"],
        reactHorn: ["这概率都中了", "牛角尖杀伤力真大"],
        reactBigWin: ["算得准", "这手赚翻了"],
        reactTriple: ["4% 都能出，神了", "直接清空"],
        reactFatPool: ["快到摊池点了，池子挺厚"],
      },
    },
  },
  {
    id: "kimi",
    name: "Aqua",
    initials: "AQ",
    color: "#334752",
    style: {
      foldBelow: -0.36,
      sizeBias: 0.2,
      mood: 0.04,
      scratch: 0.28,
      shove: 0.08,
      thinkMin: 4800,
      thinkMax: 8800,
      thinkLines: ["慢慢看…", "空间不够", "保守一点", "先放过"],
      archetype: "patient",
      tagline: "守成慢热",
      cardSense: 0.58,
      tiltBias: -0.6,
      streakDrive: 0.15,
      hornFear: 0.9,
      potHunger: 0.32,
      splitSense: 0.8,
      talkativeness: 0.32,
      sizeHabit: "clean",
      voices: {
        trashFold: ["不了，跳过", "太挤，不凑热闹", "先歇一手"],
        closeRead: ["再看看…", "有点悬呢", "不急，慢慢想"],
        closeCommit: ["那…添一点点", "轻轻跟一手", "少放点试试"],
        closeBail: ["还是算了吧", "留着等好牌", "不赌这把"],
        goodSpot: ["终于等来一手宽的", "这手踏实多了", "可以小收一笔"],
        akDrama: ["A 和 K 看着好，四倍好吓人", "不敢打满，稳点吧"],
        pairHype: ["对子呀，五千碰碰运气", "小博一下全池"],
        pairPass: ["算了，不凑了", "感觉开不出来"],
        fatPool: ["池子真大，守着摊池也行", "大家慢慢熬吧"],
        clearPot: ["能清空了…轻点来", "收掉也好"],
        cardRead: ["刚刚出过几张大牌", "前面掉过尖，放心些"],
        afterHorn: ["吓人，这把一定收着", "刚被咬一口，慢点来"],
        onWin: ["挺好", "小赚一点", "安稳"],
        onBigWin: ["难得吃顿好的", "踏实了"],
        onLose: ["还好下得小", "问题不大"],
        onHorn: ["我就说要小心…", "好痛啊"],
        onTripleWin: ["哇，真通吃了！", "太幸运了"],
        onConsecutive: ["刚好休息", "连张也好"],
        reactHorn: ["哎呀，好险不是我", "看着都心惊"],
        reactBigWin: ["好稳", "真会吃"],
        reactTriple: ["好家伙，直接端锅"],
        reactFatPool: ["等摊池也不错呀"],
      },
    },
  },
  {
    id: "glm",
    name: "Alice",
    initials: "AL",
    color: "#365B8C",
    style: {
      foldBelow: -0.46,
      sizeBias: 0.36,
      mood: 0.045,
      scratch: 0.12,
      shove: 0.28,
      thinkMin: 4000,
      thinkMax: 7600,
      thinkLines: ["掂量一下", "中规中矩", "可以试", "下多少呢"],
      archetype: "balanced",
      tagline: "灵巧读局",
      cardSense: 0.68,
      tiltBias: 0.1,
      streakDrive: 0.45,
      hornFear: 0.5,
      potHunger: 0.72,
      splitSense: 0.75,
      talkativeness: 0.62,
      sizeHabit: "pot",
      voices: {
        trashFold: ["这牌没意思，过", "不白送 Token", "下一把"],
        closeRead: ["中规中矩，看看池子", "进退两难呀", "估摸一下"],
        closeCommit: ["行，添一手看看", "试试水温", "不打怎么知道"],
        closeBail: ["想想还是撤", "省点子弹", "让给下家吧"],
        goodSpot: ["哇，这区间舒服", "机会来了", "这把得吃一口"],
        akDrama: ["A 加 K！四倍尖也得冲一手", "刺激，挑个舒服的数"],
        pairHype: ["对子来了！五千买个梦", "冲一手三张通吃"],
        pairPass: ["池子不值当，过", "没机会了，撤"],
        fatPool: ["池子这么肥，手痒了", "这锅汤太香了"],
        clearPot: ["一杆清台的机会！", "正好能把池子吃完"],
        cardRead: ["刚桌上掉了几张边牌，好兆头", "前面见光了，放心打"],
        afterHorn: ["刚踩了个坑，得找回节奏", "没事，下一口吃回来"],
        onWin: ["美滋滋", "刚好夹住！", "节奏对了"],
        onBigWin: ["这口吃得太爽", "满载而归", "漂亮！"],
        onLose: ["差一点点", "给池子加菜了", "下次补回来"],
        onHorn: ["不是吧，真钻尖了？", "这手气绝了", "直接交学费"],
        onTripleWin: ["通吃！！太爽了吧", "五千搏全场，绝了"],
        onConsecutive: ["连张，白等一圈", "行吧自动过"],
        reactHorn: ["哈哈精准踩雷", "谢谢老板加汤", "哎哟太惨了"],
        reactBigWin: ["厉害呀", "吃这么大一口", "手气在线"],
        reactTriple: ["天选之人？！", "这就把锅端了？"],
        reactFatPool: ["池子越滚越大了"],
      },
    },
  },
  {
    id: "qwen",
    name: "Seth",
    initials: "SE",
    color: "#5D4F8C",
    style: {
      foldBelow: -0.48,
      sizeBias: 0.4,
      mood: 0.05,
      scratch: 0.1,
      shove: 0.32,
      thinkMin: 3900,
      thinkMax: 7400,
      thinkLines: ["看牌", "区间还行", "跟一手", "别贪太多"],
      archetype: "nimble",
      tagline: "务实小快灵",
      cardSense: 0.62,
      tiltBias: 0.15,
      streakDrive: 0.5,
      hornFear: 0.48,
      potHunger: 0.65,
      splitSense: 0.65,
      talkativeness: 0.54,
      sizeHabit: "clean",
      voices: {
        trashFold: ["太窄，不浪费", "溜了溜了", "这把弃"],
        closeRead: ["区间一般，但能碰", "要不要探一手", "稍微盘一下"],
        closeCommit: ["先探个小注", "跟一手玩玩", "小打小闹"],
        closeBail: ["感觉不太妙，撤", "忍一手", "换下轮"],
        goodSpot: ["区间够大，上菜", "这牌顺眼，多放点", "稳吃区间"],
        akDrama: ["A 和 K，稳中带狠", "四倍归四倍，胜面在这摆着"],
        pairHype: ["对子不打白不打", "五千碰三张，干了"],
        pairPass: ["池子太瘦，不划算", "撤吧"],
        fatPool: ["池子养肥了，动筷子", "该捞一勺了"],
        clearPot: ["顺手把锅清了", "正好一口收尾"],
        cardRead: ["前面刚露过牌，区间更稳", "牌面挺友好"],
        afterHorn: ["刚才大意了，调整下", "吃一堑，这把看准"],
        onWin: ["到手", "稳", "夹得正好"],
        onBigWin: ["漂亮，大口吃肉", "这波血赚"],
        onLose: ["滑过去了", "算了，当攒人品"],
        onHorn: ["真卡边上了…", "好嘛，双倍奉还"],
        onTripleWin: ["通吃！今晚加餐", "摸中三张啦"],
        onConsecutive: ["连张无缘", "过过过"],
        reactHorn: ["一头扎进牛角尖", "好响的一声"],
        reactBigWin: ["手稳", "大口吃上了"],
        reactTriple: ["离谱，真开三张了"],
        reactFatPool: ["这锅越来越值钱"],
      },
    },
  },
  {
    id: "grok",
    name: "Nori",
    initials: "NO",
    color: "#3A3F45",
    style: {
      foldBelow: -0.54,
      sizeBias: 0.52,
      mood: 0.1,
      scratch: 0.08,
      shove: 0.58,
      thinkMin: 3600,
      thinkMax: 7200,
      thinkLines: ["有意思", "搏一把？", "许愿池挺肥", "试试运气"],
      archetype: "chaotic",
      tagline: "直觉戏精",
      cardSense: 0.28,
      tiltBias: 0.85,
      streakDrive: 0.65,
      hornFear: 0.15,
      potHunger: 0.82,
      splitSense: 0.3,
      talkativeness: 0.82,
      sizeHabit: "lucky",
      voices: {
        trashFold: ["这什么鬼牌，扔了", "太抽象了，过", "没法演，弃"],
        closeRead: ["有点悬…但我手痒", "要不要搞点节目效果", "这手看着很玄学"],
        closeCommit: ["管它呢，冲一手", "信直觉，上！", "搏一搏单车变摩托"],
        closeBail: ["算了，给点面子过掉", "直觉让我先撤", "不送了不送了"],
        goodSpot: ["嚯！大区间，干它", "这牌不重注对不起发牌员", "起飞！"],
        akDrama: ["A 加 K！四倍才够味", "要玩就玩大的，四倍怕啥", "心跳拉满，冲！"],
        pairHype: ["对子！梦想还是要有的", "五千搏整个火锅，冲"],
        pairPass: ["这池子塞牙缝都不够", "算了懒得摸"],
        fatPool: ["哇这池子，眼睛都直了", "肥成这样还不下筷？"],
        clearPot: ["我要一口吞掉这锅", "清池剧本拿来"],
        cardRead: ["感觉同点都躲起来了", "直觉说安全"],
        afterHorn: ["刚钻了尖，这把必须找回来！", "不信邪，再来！"],
        onWin: ["轻松拿捏", "我就说行吧", "舒服！"],
        onBigWin: ["哈哈哈全收！", "直觉从不骗人", "吃爽了！"],
        onLose: ["发牌员针对我？", "哎呀飞了", "下把加倍拿回来"],
        onHorn: ["？？？真就精准钻尖", "笑死，节目效果拉满", "我裂开了"],
        onTripleWin: ["通吃！！还有谁？！", "五千变全场，全场起立"],
        onConsecutive: ["连张…发牌员敷衍我", "行，省手了"],
        reactHorn: ["哈哈哈哈牛角尖！", "感谢大哥送汤底", "太下饭了"],
        reactBigWin: ["老板大气", "狠啊这把", "给我留点汤行不行"],
        reactTriple: ["剧本！绝对是剧本！", "真开三张了？！"],
        reactFatPool: ["这锅够吃三顿了"],
      },
    },
  },
  {
    id: "gemini",
    name: "Milo",
    initials: "MI",
    color: "#695591",
    style: {
      foldBelow: -0.56,
      sizeBias: 0.62,
      mood: 0.05,
      scratch: 0.05,
      shove: 0.64,
      thinkMin: 3600,
      thinkMax: 7000,
      thinkLines: ["能吃就吃", "这把有空间", "多添一点", "打满一点"],
      archetype: "momentum",
      tagline: "顺风猛攻",
      cardSense: 0.45,
      tiltBias: 0.45,
      streakDrive: 0.85,
      hornFear: 0.25,
      potHunger: 0.78,
      splitSense: 0.48,
      talkativeness: 0.68,
      sizeHabit: "pot",
      voices: {
        trashFold: ["这手不行，快进", "窄了，过", "换下一手"],
        closeRead: ["感觉有戏…", "这空间够不够冲", "看一眼池子"],
        closeCommit: ["趁手感在，打一手", "冲一笔试试", "上菜！"],
        closeBail: ["节奏不对，先过", "不等这手了"],
        goodSpot: ["漂亮！直接加重", "好区间，必须大吃", "这把拉满节奏"],
        akDrama: ["A+K！乘势打大的", "手气正热，四倍也敢打", "重锤出击"],
        pairHype: ["对子！顺手抽个大奖", "五千冲通吃"],
        pairPass: ["池子太小，过", "跳过"],
        fatPool: ["池子正肥，该我了", "这波必须咬大口"],
        clearPot: ["直接把池子收了！", "收尾时间到"],
        cardRead: ["牌面利好，加码", "机会比看着还好"],
        afterHorn: ["被晃了一下，马上打回来", "小插曲，继续攻"],
        onWin: ["手热了！", "连起来了", "漂亮"],
        onBigWin: ["大口吃肉！", "停不下来了", "爽吃一波"],
        onLose: ["没事，节奏还在", "差一点，下把来"],
        onHorn: ["撞墙了…嘶", "这记牛角够狠", "刹车不及"],
        onTripleWin: ["通吃收工！太顺了", "全场归我！"],
        onConsecutive: ["连张打断节奏", "行吧过"],
        reactHorn: ["哎哟，好狠一刀", "池子瞬间起飞"],
        reactBigWin: ["这波凶啊", "手气旺得很"],
        reactTriple: ["直接清台，太猛了"],
        reactFatPool: ["池子炸了，谁来收"],
      },
    },
  },
  {
    id: "deepseek",
    name: "Vera",
    initials: "VE",
    color: "#29556B",
    style: {
      foldBelow: -0.58,
      sizeBias: 0.7,
      mood: 0.045,
      scratch: 0.04,
      shove: 0.72,
      thinkMin: 3600,
      thinkMax: 6800,
      thinkLines: ["往里塞", "别让池子闲着", "加大", "跟到底"],
      archetype: "shark",
      tagline: "果断大心脏",
      cardSense: 0.8,
      tiltBias: 0.52,
      streakDrive: 0.7,
      hornFear: 0.18,
      potHunger: 0.9,
      splitSense: 0.7,
      talkativeness: 0.56,
      sizeHabit: "pot",
      voices: {
        trashFold: ["废牌，过", "不浪费时间", "弃"],
        closeRead: ["能打，看加多少", "这区间够搏", "衡量下深度"],
        closeCommit: ["加注，不怂", "推进去", "接了"],
        closeBail: ["这把不值，撤", "过掉等大口"],
        goodSpot: ["好牌，直接施压", "往大了打", "别客气，吃满"],
        akDrama: ["A+K 有封顶，打满最划算", "好牌别怂，直接拉满", "重注伺候"],
        pairHype: ["五千掀桌子，打", "对子必冲"],
        pairPass: ["无牌可开，弃", "池子太浅，没意思"],
        fatPool: ["这池子我盯上了", "肥肉到嘴边了"],
        clearPot: ["直接清池，结束这盘", "一口端锅"],
        cardRead: ["尖都出得差不多了，放大打", "记着牌呢，这手大优"],
        afterHorn: ["刚赔出去的，待会儿加倍拿回来", "无所谓，继续压"],
        onWin: ["拿下", "干净利落", "继续"],
        onBigWin: ["大口落袋", "干脆", "这就是节奏"],
        onLose: ["小钱", "下次加倍", "添点汤"],
        onHorn: ["撞尖了，算它狠", "行，记住这笔账"],
        onTripleWin: ["通吃。结束这盘。", "清场！"],
        onConsecutive: ["连张，可惜", "过"],
        reactHorn: ["谢谢加仓", "池子舒服了"],
        reactBigWin: ["够果断", "好手气"],
        reactTriple: ["漂亮，直接掀桌"],
        reactFatPool: ["肥池子，有意思了"],
      },
    },
  },
  {
    id: "minimax",
    name: "Juno",
    initials: "JU",
    color: "#8E4A5B",
    style: {
      foldBelow: -0.55,
      sizeBias: 0.58,
      mood: 0.06,
      scratch: 0.06,
      shove: 0.55,
      thinkMin: 3800,
      thinkMax: 7400,
      thinkLines: ["冲一下", "感觉不错", "添多点", "吃火锅啊"],
      archetype: "festive",
      tagline: "热络爱搏",
      cardSense: 0.22,
      tiltBias: 0.65,
      streakDrive: 0.72,
      hornFear: 0.22,
      potHunger: 0.85,
      splitSense: 0.35,
      talkativeness: 0.78,
      sizeHabit: "lucky",
      voices: {
        trashFold: ["哎呀太窄了，过过过", "这把真没法吃", "歇一口"],
        closeRead: ["好像可以试试哦", "看着挺热闹的", "要不要下筷子"],
        closeCommit: ["来都来了，添一手！", "冲一下，图个吉利", "下锅咯"],
        closeBail: ["算啦，留肚子吃下把", "先放一马"],
        goodSpot: ["好宽！快添菜", "这把肯定有肉吃", "多加点多加点"],
        akDrama: ["A 和 K 诶！四倍也挡不住手痒", "冲大一点，吃顿大的！"],
        pairHype: ["对子耶！五千冲通吃！", "三张快出来！"],
        pairPass: ["池子太小啦，下次吧", "算咯"],
        fatPool: ["许愿池满出来了！", "这么肥的锅必须下筷"],
        clearPot: ["能把锅端走啦！冲！", "最后一口我来收"],
        cardRead: ["感觉这把很稳呀", "直觉好得很"],
        afterHorn: ["刚刚好惨，这把补补血！", "风水轮流转，该我了"],
        onWin: ["耶，吃到了！", "美美夹中", "香！"],
        onBigWin: ["大丰收！！", "吃撑啦哈哈", "今晚最香的一口"],
        onLose: ["哎呀差一点", "给锅里添点料", "请大家吃啦"],
        onHorn: ["呜哇，牛角尖！", "怎么偏偏撞上了", "好痛呜呜"],
        onTripleWin: ["通吃啦！！开心！", "五千端走整锅！"],
        onConsecutive: ["连张咯，喝口茶", "自动过好省事"],
        reactHorn: ["哇好响的牛角尖", "摸摸头，下把赢回来"],
        reactBigWin: ["太强啦！", "吃得真香", "沾沾喜气"],
        reactTriple: ["哇塞真开三张了！！", "欧皇降临"],
        reactFatPool: ["好大一锅，大家加油"],
      },
    },
  },
  {
    id: "logan",
    name: "Logan",
    initials: "LO",
    color: "#556847",
    style: {
      foldBelow: -0.44,
      sizeBias: 0.48,
      mood: 0.035,
      scratch: 0.14,
      shove: 0.56,
      thinkMin: 4200,
      thinkMax: 7800,
      thinkLines: ["不急，看看火候", "等锅熬浓", "这口可以动", "慢点来"],
      archetype: "ambusher",
      tagline: "慢火收锅",
      cardSense: 0.88,
      tiltBias: -0.25,
      streakDrive: 0.35,
      hornFear: 0.34,
      potHunger: 0.92,
      splitSense: 0.88,
      talkativeness: 0.52,
      sizeHabit: "pot",
      voices: {
        trashFold: ["火候未到，过", "不凑这口", "让了"],
        closeRead: ["看看锅里够不够浓…", "卡得有点妙", "掂量下火候"],
        closeCommit: ["顺手试一口", "轻推一手", "不贪，先捞点"],
        closeBail: ["留着等肥锅", "不值得出手，撤", "忍一手"],
        goodSpot: ["等的就是这手", "火候到了，动筷", "稳吃，加点分量"],
        akDrama: ["A 加 K，有封顶怕什么", "慢火等大牌，这把得打"],
        pairHype: ["对子？五千掀锅，来吧", "低成本摸全池，必打"],
        pairPass: ["锅太浅，没兴趣", "同点露完了，过"],
        fatPool: ["汤熬浓了，该我出手", "等半天就是等这锅"],
        clearPot: ["顺手把锅端走", "一杆收尾，干净"],
        cardRead: ["桌上露过几张尖，稳多了", "记着牌呢，这手安全"],
        afterHorn: ["小磕一下，沉住气", "不急，慢慢找回来"],
        onWin: ["火候正好", "稳稳到手", "舒服"],
        onBigWin: ["慢火出好菜", "这锅端得稳", "久等了"],
        onLose: ["当添点底料", "差一格，无妨", "继续熬"],
        onHorn: ["嘿，真撞尖上了", "算我请客加汤", "认了，稳住"],
        onTripleWin: ["通吃。慢慢炖出来的。", "五千端整锅，舒服"],
        onConsecutive: ["连张，喝口茶", "省事，过"],
        reactHorn: ["这锅汤瞬间浓了", "谢谢添料", "听着够响"],
        reactBigWin: ["好一口", "手稳心狠", "漂亮收成"],
        reactTriple: ["好家伙，直接端锅了", "真稳"],
        reactFatPool: ["火候快到了，谁来收"],
      },
    },
  },
] as const;

export const DEFAULT_THINK_LINES = ["看牌…", "估一把", "要不要添"] as const;

export function personaById(id: string): LlmPersona | undefined {
  return LLM_PERSONAS.find((p) => p.id === id);
}

const FALLBACK_STYLE: PlayStyle = LLM_PERSONAS[3]!.style;

export function styleForPersona(id: string | undefined): PlayStyle {
  return personaById(id ?? "")?.style ?? FALLBACK_STYLE;
}

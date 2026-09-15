const app = document.querySelector("#app");
const ART_PIECE_COUNT = 9;

const state = {
  route: [],
  artPieces: [],
  selectedPiece: null,
  artMoveCount: 0,
  lastArtSignature: "",
  safeFound: new Set(),
  cluesFound: new Set(),
  clueKeywords: new Set(),
  inferenceAnswers: {},
  inferenceTimer: null,
  artMeaning: "",
  clueTier: "",
  riskOutcome: "direct",
  schoolTalkVariant: "normal",
  failReason: "",
  storyProgress: 0,
};

function markStoryProgress(step) {
  state.storyProgress = Math.max(state.storyProgress, step);
}

const cluePoints = [
  {
    id: "flyer",
    label: "画室传单无具体地址",
    x: 48,
    y: 63,
    mediaType: "图片线索",
    mediaTitle: "画室传单",
    detail: "传单上写着免费画室体验，却没有明确地址、机构名称和负责老师信息。",
    keywords: ["美术老师", "伪装身份"],
  },
  {
    id: "door",
    label: "安姐不断看侧门",
    x: 95,
    y: 39,
    mediaType: "视频线索",
    mediaTitle: "侧门方向",
    clueHeading: "发现线索——门外停了一辆面包车",
    detail: "安姐反复看向便利店侧门，像是在等待某个人或确认离开的路线。",
    keywords: [],
  },
  {
    id: "reflection",
    label: "手机聊天反光",
    x: 35,
    y: 53,
    mediaType: "图片线索",
    mediaTitle: "手机反光",
    videoSrc: "./assets/videos/web/clue-phone.mp4?v=20260909",
    detail: "玻璃反光里能看到安姐手机上的聊天内容，对方正在催她把小雨带到巷口。",
    keywords: ["人贩子"],
  },
  {
    id: "sketchbook",
    label: "画本被粗暴反折",
    x: 63,
    y: 56,
    mediaType: "图片线索",
    mediaTitle: "小雨的画本",
    videoSrc: "./assets/videos/web/clue-sketchbook.mp4?v=20260909",
    detail: "安姐嘴上说要帮小雨，却把她最在意的画本粗暴反折，只想控制她的行动。",
    keywords: ["欺骗", "帮助"],
  },
  {
    id: "cocoa",
    label: "热可可可制造动静",
    x: 50,
    y: 52,
    mediaType: "视频线索",
    mediaTitle: "热可可",
    detail: "热可可一直被推到小雨面前。它既可能是饮料，也可能藏着让人失去判断力的东西。",
    keywords: ["饮料", "迷药"],
  },
];

const videoMap = {
  V01: {
    label: "公共视频 V01",
    title: "教室回忆与妈妈短信",
    body: "小雨独自坐在教室里画画。父母不理解的声音在脑海里响起，手机震动，妈妈发来消息：怎么还没回来？又在闹什么脾气？",
    scene: "scene-classroom",
    src: "./assets/videos/web/V01.mp4",
    next: "choiceMom",
  },
  AV02: {
    label: "A线视频 A-V02",
    title: "回复妈妈后留在学校",
    body: "小雨回复自己有点难受。妈妈仍然急躁地说有什么事回家再说。小雨没有出校门，只是看着被划破的画纸。",
    scene: "scene-classroom",
    src: "./assets/videos/web/A-V02.mp4",
    next: "schoolTalk",
  },
  AV03: {
    label: "A线视频 A-V03",
    title: "妈妈来学校，小雨展示画",
    body: "陈老师联系妈妈来到学校。小雨没有解释，只把拼好的画推到桌面中央：小女孩坐在深渊边缘，家里的灯照不到她。",
    scene: "scene-school",
    src: "./assets/videos/web/A-V03.mp4?v=20260908-193846",
    next: "artPuzzle",
  },
  AV03_DANGER: {
    label: "安姐话术后视频 D-V03",
    title: "妈妈来学校，看到被撕毁后拼起的画",
    body: "小雨经历安姐完整话术和惊险脱身后回到学校。她把被撕毁又重新拼好的画推给妈妈，画纸上的裂痕比原来更明显，妈妈第一次意识到这次沉默已经差点变成危险。",
    scene: "scene-school",
    src: "./assets/videos/web/D-V03.mp4",
    next: "artPuzzle",
  },
  AV04A: {
    label: "A线视频 A-V04A",
    title: "妈妈开始理解",
    body: "妈妈看着画，声音慢下来：你是觉得我们一直在家里，可是没有真的看见你？小雨点头，妈妈坐到她身边。",
    scene: "scene-school",
    src: "./assets/videos/web/A-V04A.mp4?v=20260908-200002",
    next: "endingE01",
  },
  AV04B: {
    label: "A线视频 A-V04B",
    title: "妈妈真正听见",
    body: "妈妈看着画里的家门和灯，终于说：原来你不是不想回家，你是觉得回家以后，也没有人真的听你说话。",
    scene: "scene-school",
    src: "./assets/videos/web/A-V04B.mp4",
    next: "endingE01",
  },
  AV04A_DANGER: {
    label: "安姐话术后视频 D-V04A",
    title: "妈妈理解小雨的孤独与危险",
    body: "妈妈看着画上的裂痕，终于明白小雨不是单纯难过，而是在孤独里差点抓住了陌生人的假温柔。她没有急着责怪，只先问：你那时候是不是特别希望有人听你说话？",
    scene: "scene-school",
    src: "./assets/videos/web/D-V04A.mp4",
    next: "endingE01",
  },
  AV04B_DANGER: {
    label: "安姐话术后视频 D-V04B",
    title: "妈妈意识到家的灯没有照到她",
    body: "妈妈看见画里的家灯，也看见纸上被撕开的裂口。她慢慢说：原来不是你不想回家，是我们一直没有让你觉得回家能被保护。",
    scene: "scene-school",
    src: "./assets/videos/web/D-V04B.mp4",
    next: "endingE01",
  },
  BV02: {
    label: "B线视频 B-V02",
    title: "小雨出校门，遇到安姐",
    body: "小雨没有回复妈妈，走到校门外。天色变暗，便利店灯光很亮。安姐拿着热可可出现：小妹妹，下雨了，要不要进来坐会儿？",
    scene: "scene-store",
    src: "./assets/videos/web/B-V02.mp4",
    next: "choiceAnjie",
  },
  B1V03: {
    label: "B1线视频 B1-V03",
    title: "不和安姐对话，保持距离",
    body: "小雨没有接热可可，只说不用了。安姐仍试图靠近，还说自己看小雨一个人很久了。小雨意识到她知道得太多。",
    scene: "scene-store",
    src: "./assets/videos/web/B1-V03.mp4?v=20260908-193846",
    next: "safeHunt",
  },
  B2V03: {
    label: "B2线视频 B2-V03",
    title: "和安姐对话，进入完整话术",
    body: "安姐说自己懂小雨，注意她很多天了，还说画室里有很多一样的孩子。小雨被理解感击中，安姐突然说车在后面巷口。",
    scene: "scene-store",
    src: "./assets/videos/web/B2-V03.mp4",
    next: "clueHunt",
  },
  E02: {
    label: "阶段视频 E02",
    title: "及时避险，回到学校",
    body: "小雨靠近有灯、有监控、有人保护的位置。陈老师很快赶到，安姐无法继续靠近。事情暂时安全下来，陈老师联系妈妈来学校谈话。",
    scene: "scene-ending",
    src: "./assets/videos/web/E02.mp4?v=20260908-193846",
    next: "artPuzzle",
  },
  E03: {
    label: "阶段视频 E03",
    title: "惊险脱险结局",
    body: "小雨把线索串联起来，意识到安姐不是好心人。她打翻热可可制造动静，把画本和手机推向收银台，大声向店员求助。陈老师和民警赶到后，把妈妈也请到学校。",
    scene: "scene-ending",
    src: "./assets/videos/web/E03.mp4",
    next: "schoolTalk",
  },
  F01: {
    label: "失败视频 F01",
    title: "游戏失败",
    body: "小雨没有及时避开危险，陌生人的话术和错误选择让她离开了安全视线。",
    scene: "scene-ending",
    src: "./assets/videos/web/F01.mp4?v=20260909-144020",
    next: "gameFail",
  },
};

function shell(content, step = "互动影游逻辑壳", options = {}) {
  const brand = options.hideBrand ? "" : '<span class="pill">《被“好心人”带走的女孩》</span>';
  const header = options.hideHeader
    ? ""
    : `<header class="topbar ${options.hideBrand ? "topbar--single" : ""}">
        ${brand}
        <span>${step}</span>
      </header>`;
  app.classList.toggle("stage--fullscreen", Boolean(options.fullscreen));
  app.innerHTML = `
    ${header}
    ${content}
  `;
}

function renderLoading() {
  shell(`
    <section class="main-menu" aria-label="游戏主页面">
      <button class="exit-button" id="exitGame">
        <i class="exit-icon" aria-hidden="true"></i>
        <span>退出</span>
      </button>

      <div class="menu-atmosphere">
        <p class="eyebrow">国门教育互动影课</p>
        <img class="menu-title-image" src="./assets/images/title-critical-choice-transparent.png" alt="临界选择" />
      </div>

      <nav class="main-menu-actions" aria-label="主菜单">
        <button class="menu-option is-primary" id="startGame">
          <i class="menu-icon menu-icon--play" aria-hidden="true"></i>
          <span>开始课程</span>
        </button>
        <button class="menu-option" id="showChapters">
          <i class="menu-icon menu-icon--chapters" aria-hidden="true"></i>
          <span>章节进度</span>
        </button>
        <button class="menu-option" id="showSettings">
          <i class="menu-icon menu-icon--settings" aria-hidden="true"></i>
          <span>设置</span>
        </button>
      </nav>
    </section>
  `, "主页面", { hideBrand: true, hideHeader: true, fullscreen: true });

  document.querySelector("#startGame").addEventListener("click", startGame);
  document.querySelector("#showChapters").addEventListener("click", renderChapterProgress);
  document.querySelector("#showSettings").addEventListener("click", renderSettings);
  document.querySelector("#exitGame").addEventListener("click", renderExitScreen);
}

function startGame() {
  resetStoryState({ keepMenu: true });
  playVideo("V01");
}

function renderChapterProgress() {
  const chapterNodes = [
    { name: "公共开场", image: "mom-message-choice-background.jpg", complete: state.route.includes("V01") },
    { name: "妈妈的消息", image: "mom-message-choice-background.jpg", complete: state.storyProgress >= 2 },
    { name: "继续在学校画画", image: "art-puzzle-page-background.png", complete: state.route.includes("AV02") },
    { name: "遇到安姐", image: "anjie-dialogue-choice-background.jpg", complete: state.route.includes("BV02") },
    { name: "寻找安全路线", image: "safe-route-map.png", complete: state.route.includes("B1V03") },
    { name: "收集异常线索", image: "clue-hunt-background.jpg", complete: state.route.includes("B2V03") },
    { name: "拼好小雨的画", image: "xiaoyu-art-puzzle.png", complete: state.storyProgress >= 5 },
    { name: "选择画面含义", image: "art-meaning-choice-background.jpg", complete: state.storyProgress >= 6 },
    { name: "行为测评", image: "ending-assessment-background.jpg", complete: state.storyProgress >= 7 },
    { name: "安全提示", image: "safety-guide-background.png", complete: state.storyProgress >= 8 },
  ];
  const progress = Math.min(100, Math.round((state.storyProgress / 8) * 100));
  shell(`
    <section class="menu-panel chapter-flow-page">
      <button class="exit-button" id="backToMenu">返回</button>
      <article class="choice-card menu-panel-card chapter-flow-card">
        <h1>章节进度</h1>
        <div class="story-progress" role="progressbar" aria-label="总故事进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
          <span style="width: ${progress}%"></span>
        </div>
        <div class="chapter-node-grid">
          ${chapterNodes
            .map(
              (node) => `
                <figure class="chapter-node ${node.complete ? "is-complete" : ""}">
                  <div class="chapter-node-image" style="background-image: url('./assets/images/${node.image}')" role="img" aria-label="${node.name}"></div>
                  <figcaption>${node.name}</figcaption>
                </figure>
              `,
            )
            .join("")}
        </div>
      </article>
    </section>
  `, "章节进度", { hideBrand: true, hideHeader: true, fullscreen: true });

  document.querySelector("#backToMenu").addEventListener("click", renderLoading);
}

function renderSettings() {
  shell(`
    <section class="menu-panel">
      <button class="exit-button" id="backToMenu">返回</button>
      <article class="choice-card menu-panel-card">
        <p class="eyebrow">设置</p>
        <h1>体验设置</h1>
        <div class="settings-list">
          <label>
            <span>视频占位自动推进</span>
            <input type="checkbox" checked disabled />
          </label>
          <label>
            <span>显示互动提示文字</span>
            <input type="checkbox" checked disabled />
          </label>
          <label>
            <span>拼图显示进度</span>
            <input type="checkbox" checked disabled />
          </label>
        </div>
        <p class="subtitle">这里先放基础设置入口，后面接正式视频时可以继续加入音量、字幕、跳过已看片段等选项。</p>
      </article>
    </section>
  `, "设置", { hideBrand: true });

  document.querySelector("#backToMenu").addEventListener("click", renderLoading);
}

function renderExitScreen() {
  shell(`
    <section class="menu-panel menu-panel--quiet">
      <article class="choice-card menu-panel-card">
        <p class="eyebrow">已退出</p>
        <h1>游戏已暂停在主页面外</h1>
        <p>浏览器页面无法真正关闭，所以这里先进入退出状态。你可以返回主页面重新选择。</p>
        <div class="actions">
          <button class="btn btn--primary" id="backToMenu">返回主页面</button>
        </div>
      </article>
    </section>
  `, "退出", { hideBrand: true });

  document.querySelector("#backToMenu").addEventListener("click", renderLoading);
}

function renderSafetyGuide() {
  markStoryProgress(8);
  shell(`
    <main class="safety-page">
      <section class="safety-hero">
        <p class="eyebrow">给每一位正在长大的同学</p>
        <h1>让理解填满亲情的缝隙，让安全守护成长</h1>
        <p class="safety-lead">别因为一时的沟通隔阂，赌上自己的青春与安全。</p>
      </section>

      <article class="safety-article">
        <section class="safety-prose">
          <p>步入青春期，我们慢慢有了藏在心底的情绪和不愿言说的心事。和父母争执、被反复唠叨、想法不被理解，成了很多同学的常态。我们觉得父母不懂自己，一次次欲言又止，慢慢关上了沟通的大门，把委屈和孤独悄悄藏在心里。</p>
          <p>可很多人不知道，亲子间的沉默与隔阂，恰恰是危险最容易潜入的缝隙。那些无处安放的情绪、无人倾听的委屈，终究会让我们渴望一份理解、渴求一丝温柔。</p>
          <p>而所有针对青少年的欺骗与诱拐，抓住的正是这份孤独：网上的陌生人，耐心听你吐槽烦恼，无条件包容你的小脾气，顺着你的心意说话、共情你的所有委屈。对比父母的严厉管教、琐碎唠叨，这份突如其来的“懂得”，会让年少的我们轻易沦陷，误以为遇见了真正的知己。</p>
        </section>

        <blockquote>真正爱你的人，才会对你唠叨、对你严格；刻意无条件迎合你、纵容你的人，往往都藏着算计和恶意。</blockquote>

        <section class="safety-prose">
          <p>父母的爱或许笨拙、不够温柔，却纯粹且坚定；陌生人的体贴看似温暖，大多是精心布置的诱饵。</p>
          <p>坏人最擅长利用少年的叛逆与孤独。他们用几句暖心的话、一点微小的善意，轻松换取你的信任，再一步步诱导你泄露隐私、私自外出、充值转账，甚至怂恿你离家出走。一时的情绪慰藉，换来的可能是终身无法弥补的伤害。</p>
          <p class="warning-line">世间没有无缘无故的偏爱，突如其来的懂你，全是蓄谋已久的陷阱。</p>
          <p>你和父母有矛盾、有误会，是成长中最平常的小事。亲情的隔阂可以慢慢化解，争吵过后依然是最亲的家人，但人生的陷阱一旦踏入，再也没有重来的机会。</p>
          <p>愿每一位同学都能读懂这份温柔的警示，学会沟通、守住本心、保护好自己：</p>
        </section>

        <section class="safety-rules" aria-label="四条安全建议">
          <article><span>01</span><div><h2>接纳分歧，拒绝封闭自己</h2><p>父母的唠叨不是束缚，严苛不是苛责，只是他们不懂年少的心事，用最朴素的方式守护你。不要因为一次争吵、一场误会就封闭内心、消极冷战，别让负面情绪，给坏人可乘之机。</p></div></article>
          <article><span>02</span><div><h2>主动沟通，好好和家人说话</h2><p>不必事事隐忍、默默逞强。心里的委屈、学业的压力、成长的困惑，都可以静下心来和父母坦诚诉说。沟通不是争辩对错，而是彼此包容、互相理解。好好说话，是化解亲子矛盾、治愈内心孤独最好的方式。</p></div></article>
          <article><span>03</span><div><h2>保持警惕，守住安全底线</h2><p>无论线上线下，凡是刻意讨好你、安慰你，怂恿你隐瞒父母、独自赴约、花钱转账、逃离家庭的人，全部都是危险的陌生人。再暖心的话语、再契合的灵魂，都抵不过家人的一份真心，绝不轻易交付信任，绝不冒险触碰未知危险。</p></div></article>
          <article><span>04</span><div><h2>遇事倾诉，别独自硬扛所有</h2><p>遭遇搭讪、诱导、欺骗，或是心里积攒了太多委屈，第一时间告诉父母和老师。哪怕会被批评、被说教，家人永远是你最温暖的港湾、最坚实的后盾，会拼尽全力为你遮风挡雨、化解危机。</p></div></article>
        </section>

        <footer class="safety-closing">
          <p>成长最清醒的认知：别因为一时的沟通隔阂，赌上自己的青春与安全。</p>
          <p>学会和家人温柔相处，学会好好保护自己。拒绝轻信陌生人，勇敢倾诉心里话，让理解填满亲情的缝隙，让安全守护你的每一段成长旅途。</p>
          <button class="btn btn--primary" id="backToLoading">返回主页面</button>
        </footer>
      </article>
    </main>
  `, "", { hideHeader: true, fullscreen: true });

  window.scrollTo({ top: 0, behavior: "instant" });
  document.querySelector("#backToLoading").addEventListener("click", renderLoading);
}

function playVideo(id) {
  const video = videoMap[id];
  const videoProgressSteps = {
    V01: 1,
    AV02: 2,
    BV02: 2,
    AV03: 4,
    AV03_DANGER: 4,
    B1V03: 3,
    B2V03: 3,
    E02: 4,
    E03: 4,
    AV04A: 6,
    AV04B: 6,
    AV04A_DANGER: 6,
    AV04B_DANGER: 6,
    F01: 7,
  };
  markStoryProgress(videoProgressSteps[id] || 0);
  state.route.push(id);
  const media = video.src
    ? `<video class="story-video" id="storyVideo" preload="auto" playsinline controls aria-label="${video.title}">
        <source src="${video.src}" type="video/mp4" />
        当前浏览器无法播放这个视频。
      </video>`
    : `<div class="video-visual ${video.scene}" aria-hidden="true"></div>`;
  shell(`
    <section class="video-screen" id="videoCard" aria-label="${video.title}">
      ${media}
      <div class="progress" aria-hidden="true"><span id="videoProgress"></span></div>
    </section>
  `, "", { hideHeader: true, fullscreen: true });

  window.clearTimeout(state.videoTimer);
  const storyVideo = document.querySelector("#storyVideo");
  const progress = document.querySelector("#videoProgress");
  let didAdvance = false;

  const advanceNext = () => {
    if (didAdvance) return;
    didAdvance = true;
    routeNext(video.next);
  };

  if (!storyVideo) {
    advanceNext();
    return;
  }

  storyVideo.addEventListener("timeupdate", () => {
    if (!Number.isFinite(storyVideo.duration) || storyVideo.duration <= 0) return;
    progress.style.width = `${(storyVideo.currentTime / storyVideo.duration) * 100}%`;
  });
  storyVideo.addEventListener("ended", () => {
    progress.style.width = "100%";
    advanceNext();
  });
  storyVideo.addEventListener("error", () => {
    advanceNext();
  });

  storyVideo.play().catch(() => {});
}

function routeNext(next) {
  const routes = {
    choiceMom: renderMomChoice,
    artPuzzle: renderArtPuzzle,
    schoolTalk: () => playVideo(getSchoolTalkVideoId()),
    artMeaning: renderArtMeaningChoice,
    endingE01: () => renderEnding("E01"),
    gameFail: renderGameFailResult,
    choiceAnjie: renderAnjieChoice,
    safeHunt: renderSafeHunt,
    clueHunt: renderClueHunt,
  };
  routes[next]();
}

function renderMomChoice() {
  markStoryProgress(2);
  shell(`
    <div class="panel panel--center mom-choice-screen">
      <article class="choice-card mom-choice-card">
        <h2>妈妈发来消息，小雨心情烦闷</h2>
        <div class="choice-grid mom-choice-actions">
          <button class="choice-option" data-choice="reply">
            <strong>A 继续在学校</strong>
          </button>
          <button class="choice-option" data-choice="leave">
            <strong>B 不回消息，出去走走</strong>
          </button>
        </div>
      </article>
    </div>
  `, "", { hideHeader: true, fullscreen: true });

  document.querySelector('[data-choice="reply"]').addEventListener("click", () => {
    state.schoolTalkVariant = "normal";
    playVideo("AV02");
  });
  document.querySelector('[data-choice="leave"]').addEventListener("click", () => playVideo("BV02"));
}

function renderArtPuzzle() {
  markStoryProgress(5);
  startArtPuzzle();
  const isDangerTalk = state.schoolTalkVariant === "danger";
  shell(`
    <div class="panel panel--split art-puzzle-screen">
      <div class="choice-card art-puzzle-guide">
        <h2>拼小雨的画</h2>
        <p>${isDangerTalk ? "这张画在安姐拉扯小雨时被撕坏。点击任意两块碎片交换位置，把它重新拼起来。" : "点击任意两块碎片交换位置，将画面完整复原。"}</p>
        <div class="tag-list">
          <span class="tag" id="artStatus">画还没有拼完整</span>
          <span class="tag" id="artProgress">已归位 0 / ${ART_PIECE_COUNT}</span>
          <span class="tag" id="artMoves">交换 0 次</span>
        </div>
      </div>
      <div>
        <div class="art-board" id="artBoard"></div>
      </div>
    </div>
  `, "", { hideHeader: true, fullscreen: true });
  drawArtPieces();
}

function startArtPuzzle() {
  state.artPieces = shuffleArtPieces();
  state.selectedPiece = null;
  state.artMoveCount = 0;
}

function shuffleArtPieces() {
  let pieces = createSolvedArtPieces();
  let signature = "";
  let misplacedCount = 0;

  do {
    pieces = createSolvedArtPieces();
    for (let index = pieces.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [pieces[index], pieces[randomIndex]] = [pieces[randomIndex], pieces[index]];
    }
    signature = pieces.join("-");
    misplacedCount = pieces.filter((value, index) => value !== index + 1).length;
  } while (signature === state.lastArtSignature || misplacedCount < 6);

  state.lastArtSignature = signature;
  return pieces;
}

function createSolvedArtPieces() {
  return Array.from({ length: ART_PIECE_COUNT }, (_, index) => index + 1);
}

function drawArtPieces() {
  const board = document.querySelector("#artBoard");
  board.innerHTML = "";
  state.artPieces.forEach((value, index) => {
    const piece = document.createElement("button");
    piece.className = "art-piece";
    if (value === index + 1) piece.classList.add("is-correct");
    piece.dataset.pieceIndex = index;
    piece.setAttribute("aria-label", `碎片${value}`);
    const column = (value - 1) % 3;
    const row = Math.floor((value - 1) / 3);
    piece.style.setProperty("--piece-x", `${column * 50}%`);
    piece.style.setProperty("--piece-y", `${row * 50}%`);
    piece.addEventListener("click", () => selectArtPiece(index));
    board.appendChild(piece);
  });
  updateArtStatus();
}

function selectArtPiece(index) {
  if (state.selectedPiece === null) {
    state.selectedPiece = index;
    document.querySelectorAll(".art-piece")[index].classList.add("is-selected");
    return;
  }

  const previous = state.selectedPiece;
  if (previous === index) {
    state.selectedPiece = null;
    drawArtPieces();
    return;
  }

  [state.artPieces[previous], state.artPieces[index]] = [state.artPieces[index], state.artPieces[previous]];
  state.selectedPiece = null;
  state.artMoveCount += 1;
  drawArtPieces();

  const solved = state.artPieces.every((value, idx) => value === idx + 1);
  document.querySelector("#artStatus").textContent = solved ? "画拼好了，进入画面意义选择" : "继续拼，把画面复原";
  if (solved) window.setTimeout(() => routeNext("artMeaning"), 700);
}

function getSchoolTalkVideoId() {
  return state.schoolTalkVariant === "danger" ? "AV03_DANGER" : "AV03";
}

function updateArtStatus() {
  const correctCount = state.artPieces.filter((value, index) => value === index + 1).length;
  const progress = document.querySelector("#artProgress");
  const moves = document.querySelector("#artMoves");
  const status = document.querySelector("#artStatus");
  if (progress) progress.textContent = `已归位 ${correctCount} / ${ART_PIECE_COUNT}`;
  if (moves) moves.textContent = `交换 ${state.artMoveCount} 次`;
  if (status && correctCount < ART_PIECE_COUNT) status.textContent = "画还没有拼完整";
}

function renderArtMeaningChoice() {
  markStoryProgress(6);
  shell(`
    <div class="panel panel--center art-meaning-screen">
      <article class="choice-card art-meaning-card">
        <h2>这幅画真正表达的是什么？</h2>
        <p>小雨把拼好的画推到妈妈面前。画里小女孩坐在深渊边缘，身后的家门亮着灯，但灯照不到她。</p>
        <div class="choice-grid art-meaning-actions">
          <button class="choice-option" data-meaning="lonely">
            <strong>A 她很孤独</strong>
          </button>
          <button class="choice-option" data-meaning="unseen">
            <strong>B 家里的灯照不到自己</strong>
          </button>
        </div>
      </article>
    </div>
  `, "", { hideHeader: true, fullscreen: true });

  document.querySelector('[data-meaning="lonely"]').addEventListener("click", () => {
    state.artMeaning = "lonely";
    playVideo(getArtMeaningVideoId("lonely"));
  });
  document.querySelector('[data-meaning="unseen"]').addEventListener("click", () => {
    state.artMeaning = "unseen";
    playVideo(getArtMeaningVideoId("unseen"));
  });
}

function getArtMeaningVideoId(meaning) {
  if (state.schoolTalkVariant === "danger") {
    return meaning === "lonely" ? "AV04A_DANGER" : "AV04B_DANGER";
  }
  return meaning === "lonely" ? "AV04A" : "AV04B";
}

function renderAnjieChoice() {
  markStoryProgress(3);
  shell(`
    <div class="panel panel--center anjie-choice-screen">
      <article class="choice-card anjie-choice-card">
        <h2>便利店门口，安姐递来热可可。</h2>
        <p>她问：你怎么一个人坐在这里？</p>
        <div class="choice-grid anjie-choice-actions">
          <button class="choice-option" data-anjie="no">
            <strong>A 不和她对话</strong>
          </button>
          <button class="choice-option" data-anjie="yes">
            <strong>B 和她对话</strong>
          </button>
        </div>
      </article>
    </div>
  `, "", { hideHeader: true, fullscreen: true });

  document.querySelector('[data-anjie="no"]').addEventListener("click", () => playVideo("B1V03"));
  document.querySelector('[data-anjie="yes"]').addEventListener("click", () => playVideo("B2V03"));
}

function renderSafeHunt() {
  markStoryProgress(4);
  shell(`
    <div class="panel safe-hunt-screen">
      <div class="hunt-scene" id="huntScene">
        <svg class="route-map" viewBox="0 0 1000 562" preserveAspectRatio="xMidYMid slice" aria-label="从便利店到学校大门的三条可选路线">
          <g class="route-choice" data-route="safe" role="button" tabindex="0" aria-label="选择第一条路线">
            <path class="route-hit" d="M 118 468 C 92 480 70 470 58 445 C 44 416 49 391 72 360 L 265 182 L 626 336 L 704 186" />
            <path class="route-line" d="M 118 468 C 92 480 70 470 58 445 C 44 416 49 391 72 360 L 265 182 L 626 336 L 704 186" />
          </g>
          <g class="route-choice" data-route="danger" role="button" tabindex="0" aria-label="选择第二条路线">
            <path class="route-hit" d="M 186 466 C 178 490 184 515 206 532 L 380 305 L 596 408 L 741 200" />
            <path class="route-line" d="M 186 466 C 178 490 184 515 206 532 L 380 305 L 596 408 L 741 200" />
          </g>
        </svg>
        <span class="route-landmark route-landmark--start">便利店 · 起点</span>
        <span class="route-landmark route-landmark--end">学校大门 · 终点</span>
      </div>
      <div class="choice-card safe-hunt-card">
        <h2>寻找安全路线</h2>
        <p>小雨发现了陌生女人的不对，现在她想离开这里，请选择一条前往学校大门的路线</p>
      </div>
    </div>
  `, "", { hideHeader: true, fullscreen: true });

  const chooseRoute = (route) => {
    document.querySelectorAll(".route-choice").forEach((choice) => {
      choice.classList.toggle("is-selected", choice.dataset.route === route);
      choice.style.pointerEvents = "none";
    });

    window.setTimeout(() => {
      if (route === "safe") {
        state.riskOutcome = "safe";
        state.schoolTalkVariant = "normal";
        playVideo("E02");
        return;
      }
      renderGameFail("小雨选择了穿过偏僻街区的路线，没有沿人多明亮的主路返回学校。");
    }, 420);
  };

  document.querySelectorAll(".route-choice").forEach((choice) => {
    choice.addEventListener("click", () => chooseRoute(choice.dataset.route));
    choice.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      chooseRoute(choice.dataset.route);
    });
  });
}

function renderClueHunt() {
  markStoryProgress(4);
  shell(`
    <div class="panel clue-panel">
      <section class="clue-board">
        <h2 class="clue-title">请帮助小雨，收集相关信息。</h2>
        <div class="clue-scene" id="clueScene" aria-label="便利店内的异常线索画面"></div>
        <div class="clue-modal" id="clueModal" hidden></div>
      </section>

      <aside class="clue-collection">
        <h3>至少找到2条信息</h3>
        <div class="keyword-bank" id="keywordBank">
          <span class="keyword-empty">还没有发现关键词</span>
        </div>
        <button class="btn btn--primary" id="startInference" disabled>确认下一步</button>
      </aside>
    </div>
  `, "", { hideHeader: true, fullscreen: true });

  drawClueScene();
  updateClueCollection();
}

function drawClueScene() {
  const scene = document.querySelector("#clueScene");
  cluePoints.forEach((point) => {
    const button = document.createElement("button");
    button.className = "clue-hotspot";
    if (state.cluesFound.has(point.id)) button.classList.add("is-found");
    button.style.left = `${point.x}%`;
    button.style.top = `${point.y}%`;
    button.setAttribute("aria-label", point.label);
    button.addEventListener("click", () => revealClue(point.id));
    scene.appendChild(button);
  });
}

function revealClue(id) {
  const point = cluePoints.find((item) => item.id === id);
  if (!point) return;
  state.cluesFound.add(point.id);
  point.keywords.forEach((keyword) => state.clueKeywords.add(keyword));
  document.querySelectorAll(".clue-hotspot").forEach((button) => {
    if (button.getAttribute("aria-label") === point.label) button.classList.add("is-found");
  });
  updateClueCollection();
  renderClueModal(point);
}

function renderClueModal(point) {
  const modal = document.querySelector("#clueModal");
  modal.hidden = false;
  modal.innerHTML = `
    <article class="clue-modal-card clue-modal-card--${point.id}" role="dialog" aria-label="${point.clueHeading || "发现线索"}">
      ${
        point.videoSrc
          ? `<video class="clue-modal-video" src="${point.videoSrc}" autoplay playsinline controls preload="metadata"></video>`
          : ""
      }
      <button class="modal-close" id="closeClueModal" type="button">关闭</button>
      <div class="clue-modal-copy">
        <p class="eyebrow">${point.clueHeading || "发现线索"}</p>
        <p>${point.detail}</p>
      </div>
    </article>
  `;
  const clueVideo = modal.querySelector(".clue-modal-video");
  if (clueVideo) clueVideo.play().catch(() => {});
  document.querySelector("#closeClueModal").addEventListener("click", () => {
    if (clueVideo) clueVideo.pause();
    modal.hidden = true;
    modal.innerHTML = "";
  });
}

function updateClueCollection() {
  const bank = document.querySelector("#keywordBank");
  const startButton = document.querySelector("#startInference");
  const keywords = Array.from(state.clueKeywords);

  bank.innerHTML = keywords.length
    ? keywords.map((keyword) => `<span class="keyword-chip">${keyword}</span>`).join("")
    : '<span class="keyword-empty">还没有发现关键词</span>';

  const canInfer = state.cluesFound.size >= 2;
  startButton.disabled = !canInfer;
  startButton.textContent = "确认下一步";
  startButton.onclick = canInfer ? renderInferenceGame : null;
}

function renderHunt({ title, body, points, foundSet, finishLabel, onFinish }) {
  shell(`
    <div class="panel safe-hunt-screen">
      <div class="hunt-scene" id="huntScene"></div>
      <div class="choice-card safe-hunt-card">
        <h2>${title}</h2>
        <p>${body}</p>
        <div class="actions">
          <button class="btn btn--primary" id="finishHunt">${finishLabel}</button>
        </div>
      </div>
    </div>
  `, "", { hideHeader: true, fullscreen: true });

  const scene = document.querySelector("#huntScene");
  points.forEach((point) => {
    const button = document.createElement("button");
    button.className = `hotspot ${point.safe ? "" : "is-risk"}`;
    if (foundSet.has(point.id)) button.classList.add("is-found");
    button.style.left = `${point.x}%`;
    button.style.top = `${point.y}%`;
    button.setAttribute("aria-label", point.label);
    button.addEventListener("click", () => {
      if (point.safe === false) {
        renderGameFail(`你选择了危险点位：${point.label}。小雨离开了有灯、有监控、有人保护的位置。`);
        return;
      }
      foundSet.add(point.id);
      button.classList.add("is-found");
    });
    scene.appendChild(button);
  });

  document.querySelector("#finishHunt").addEventListener("click", onFinish);
}

function renderInferenceGame() {
  window.clearInterval(state.inferenceTimer);
  state.inferenceAnswers = {};
  const prompts = getInferencePrompts();

  if (!prompts.length) {
    renderGameFail("你找到了信息，但没有获得足够的关键字，无法完成推理。");
    return;
  }
  const inferenceSeconds = prompts.length * 5;

  shell(`
    <div class="panel panel--center">
      <article class="choice-card inference-card">
        <p class="eyebrow">限时推理</p>
        <h2>把关键词拖进对应空格</h2>
        <p>根据刚才找到的线索完成推理。本轮有 ${prompts.length} 个填空，倒计时 ${inferenceSeconds} 秒，完成正确推理后直接进入惊险脱险结局。</p>
        <div class="timer-strip">
          <span id="inferenceTimer">${inferenceSeconds}</span>
          <strong>秒</strong>
        </div>
        <div class="draggable-keywords" id="draggableKeywords">
          ${Array.from(state.clueKeywords).map((keyword) => `<button class="drag-keyword" draggable="true" data-keyword="${keyword}">${keyword}</button>`).join("")}
        </div>
        <div class="inference-lines" id="inferenceLines">
          ${prompts
            .map(
              (prompt) => `
                <p>
                  <span>${prompt.before}</span>
                  <span class="drop-blank" data-answers="${prompt.answers.join("|")}" data-id="${prompt.id}">拖入关键词</span>
                  <span>${prompt.after}</span>
                </p>
              `,
            )
            .join("")}
        </div>
      </article>
    </div>
  `, "限时推理");

  bindInferenceDrag();
  startInferenceTimer(inferenceSeconds);
}

function getInferencePrompts() {
  const keywords = state.clueKeywords;
  const prompts = [];
  if (keywords.has("人贩子") || keywords.has("伪装身份")) {
    prompts.push({
      id: "identity",
      before: "1、安姐是",
      after: "。",
      answers: ["伪装身份", "人贩子"],
    });
  }
  if (keywords.has("迷药")) {
    prompts.push({
      id: "drink",
      before: "2、她给小雨的是",
      after: "。",
      answers: ["迷药"],
    });
  }
  if (keywords.has("欺骗")) {
    prompts.push({
      id: "action",
      before: "3、她想",
      after: "小雨。",
      answers: ["欺骗"],
    });
  }
  return prompts;
}

function bindInferenceDrag() {
  document.querySelectorAll(".drag-keyword").forEach((keyword) => {
    keyword.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", keyword.dataset.keyword);
    });
  });

  document.querySelectorAll(".drop-blank").forEach((blank) => {
    blank.addEventListener("dragover", (event) => event.preventDefault());
    blank.addEventListener("drop", (event) => {
      event.preventDefault();
      const keyword = event.dataTransfer.getData("text/plain");
      blank.textContent = keyword;
      blank.dataset.value = keyword;
      state.inferenceAnswers[blank.dataset.id] = keyword;
      checkInferenceResult();
    });
  });
}

function startInferenceTimer(totalSeconds) {
  let seconds = totalSeconds;
  const timer = document.querySelector("#inferenceTimer");
  state.inferenceTimer = window.setInterval(() => {
    seconds -= 1;
    timer.textContent = seconds;
    if (seconds <= 0) {
      window.clearInterval(state.inferenceTimer);
      renderGameFail("推理时间结束，安姐带着小雨离开了便利店视线范围。");
    }
  }, 1000);
}

function checkInferenceResult() {
  const blanks = Array.from(document.querySelectorAll(".drop-blank"));
  const allFilled = blanks.every((blank) => blank.dataset.value);
  if (!allFilled) return;

  const allCorrect = blanks.every((blank) => blank.dataset.answers.split("|").includes(blank.dataset.value));
  window.clearInterval(state.inferenceTimer);
  if (allCorrect) {
    state.riskOutcome = "danger";
    state.schoolTalkVariant = "danger";
    state.clueTier = "reasoned";
    playVideo("E03");
  } else {
    renderGameFail("推理关键词放错了，小雨没有及时识破安姐的真实目的。");
  }
}

function renderGameFail(reason) {
  window.clearInterval(state.inferenceTimer);
  state.failReason = reason;
  playVideo("F01");
}

function renderGameFailResult() {
  window.clearInterval(state.inferenceTimer);
  const reason = state.failReason || "小雨没有及时识破骗局，落入陷阱。";
  shell(`
    <div class="panel panel--center game-fail-screen">
      <article class="result-card fail-card">
        <h2>游戏失败</h2>
        <p>小雨没有及时识破骗局，落入陷阱</p>
        <p>${reason}</p>
        <div class="assessment">
          <h3>提醒</h3>
          <p>当陌生人要求保密、引导你离开熟悉环境、让你喝下不确定的东西时，要立刻向店员、老师、家长或警察求助。</p>
        </div>
        <div class="actions actions--center">
          <button class="btn" id="restart">返回主页面</button>
        </div>
      </article>
    </div>
  `, "", { hideHeader: true, fullscreen: true });

  document.querySelector("#restart").addEventListener("click", resetGame);
}

function renderEnding(type) {
  markStoryProgress(7);
  const ending = getEndingProfile();
  shell(`
    <div class="panel panel--center ending-assessment-screen">
      <article class="result-card ending-assessment-card">
        <h2>${ending.title}</h2>
        <div class="assessment">
          <h3>${ending.assessment}</h3>
        </div>
        <div class="assessment">
          <h3>提示</h3>
          <p>${ending.tip}</p>
        </div>
        <div class="actions">
          <button class="btn btn--primary" id="continueSafety">继续观看安全提示</button>
          <button class="btn" id="restart">重新开始</button>
        </div>
      </article>
    </div>
  `, "", { hideHeader: true, fullscreen: true });

  document.querySelector("#restart").addEventListener("click", resetGame);
  document.querySelector("#continueSafety").addEventListener("click", renderSafetyGuide);
}

function getEndingProfile() {
  if (state.schoolTalkVariant === "danger" && state.artMeaning === "lonely") {
    return {
      title: "风险识别修复型",
      assessment: "你能看见小雨的孤独，也能意识到陌生人正是利用这份孤独接近她。你的选择说明你对情绪风险和外部危险都有一定敏感度。",
      tip: "请记住：真正的关心不会要求你保密、喝下不明饮料或跟着去陌生地方。感觉不对劲时，要马上离开，并向家长、老师、店员或警察求助。",
    };
  }

  if (state.schoolTalkVariant === "danger" && state.artMeaning === "unseen") {
    return {
      title: "高敏感保护型",
      assessment: "你能同时读懂亲子隔阂和诱拐风险：小雨不是不想回家，而是没有在家里感到被看见。你的判断更接近这条危险线背后的核心问题。",
      tip: "难过时可以暂时冷静，但不要独自跟陌生人离开，也不要切断与家长和老师的联系。真正值得信任的人，会尊重你的选择，并帮助你回到安全的地方。",
    };
  }

  if (state.artMeaning === "unseen") {
    return {
      title: "深层理解型",
      assessment: "你能读出画面更深的意思：小雨不是不需要家，而是希望在家里被看见、被听见。你看到了孩子沉默背后的真正需求。",
      tip: "和家人发生矛盾时，可以试着说：“我不是故意和你对着干，我只是希望你先听我说完。”有分歧并不可怕，愿意把真实感受说出来，才是修复关系的开始。",
    };
  }

  return {
    title: "情绪觉察型",
    assessment: "你看见了小雨藏在沉默里的孤独，也发现她其实很想得到家人的理解和帮助。能注意到别人没有说出口的难过，是一种温柔而重要的能力。",
    tip: "当自己或同学情绪低落时，不要急着说“没什么大不了”。可以先问一句：“你是不是有点难过？愿意和我说说吗？”认真倾听，有时就是最及时的帮助。",
  };
}

function resetStoryState() {
  state.route = [];
  state.artPieces = [];
  state.selectedPiece = null;
  state.artMoveCount = 0;
  state.lastArtSignature = "";
  state.safeFound = new Set();
  state.cluesFound = new Set();
  state.clueKeywords = new Set();
  state.inferenceAnswers = {};
  window.clearInterval(state.inferenceTimer);
  state.inferenceTimer = null;
  state.artMeaning = "";
  state.clueTier = "";
  state.riskOutcome = "direct";
  state.schoolTalkVariant = "normal";
  state.failReason = "";
  state.storyProgress = 0;
}

function resetGame() {
  resetStoryState();
  renderLoading();
}

renderLoading();

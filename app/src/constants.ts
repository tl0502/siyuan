import {isMobile} from "./util/functions";

declare const SIYUAN_VERSION: string;
declare const NODE_ENV: string;

const _SIYUAN_VERSION = SIYUAN_VERSION;
const _NODE_ENV = NODE_ENV;

const getFunctionKey = () => {
    const fData: { [key: number]: string } = {};
    for (let i = 1; i <= 32; i++) {
        fData[i + 111] = "F" + i;
    }
    return fData;
};

export abstract class Constants {
    public static readonly SIYUAN_VERSION: string = _SIYUAN_VERSION;
    public static readonly NODE_ENV: string = _NODE_ENV;
    public static readonly SIYUAN_APPID: string = Math.random().toString(36).substring(8);

    // 服务器地址
    public static readonly ASSETS_ADDRESS: string = "";
    public static readonly PROTYLE_CDN: string = "/stage/protyle";
    public static readonly UPLOAD_ADDRESS: string = "/upload";
    public static readonly SERVICE_WORKER_PATH: string = "/service-worker.js";

    // drop 事件
    public static readonly SIYUAN_DROP_FILE: string = "application/siyuan-file";
    public static readonly SIYUAN_DROP_GUTTER: string = "application/siyuan-gutter";
    public static readonly SIYUAN_DROP_TAB: string = "application/siyuan-tab";
    public static readonly SIYUAN_DROP_EDITOR: string = "application/siyuan-editor";

    // 渲染进程调主进程
    public static readonly SIYUAN_CMD: string = "siyuan-cmd";
    public static readonly SIYUAN_GET: string = "siyuan-get";
    public static readonly SIYUAN_EVENT: string = "siyuan-event";

    public static readonly SIYUAN_CONFIG_TRAY: string = "siyuan-config-tray";
    public static readonly SIYUAN_QUIT: string = "siyuan-quit";
    public static readonly SIYUAN_HOTKEY: string = "siyuan-hotkey";
    public static readonly SIYUAN_INIT: string = "siyuan-init";
    public static readonly SIYUAN_READY_TO_SHOW: string = "siyuan-ready-to-show";
    public static readonly SIYUAN_SEND_WINDOWS: string = "siyuan-send-windows"; // 主窗口和各新窗口之间的通信，{cmd: "closetab"|"lockscreen"|"lockscreenByMode", data: {}})
    public static readonly SIYUAN_SAVE_CLOSE: string = "siyuan-save-close";
    public static readonly SIYUAN_AUTO_LAUNCH: string = "siyuan-auto-launch";

    public static readonly SIYUAN_OPEN_WORKSPACE: string = "siyuan-open-workspace";
    public static readonly SIYUAN_OPEN_URL: string = "siyuan-open-url";
    public static readonly SIYUAN_OPEN_WINDOW: string = "siyuan-open-window";
    public static readonly SIYUAN_OPEN_FILE: string = "siyuan-open-file";

    public static readonly SIYUAN_EXPORT_PDF: string = "siyuan-export-pdf";
    public static readonly SIYUAN_EXPORT_NEWWINDOW: string = "siyuan-export-newwindow";

    public static readonly SIYUAN_CONTEXT_MENU: string = "siyuan-context-menu";
    public static readonly SIYUAN_CONFIRM_DIALOG: string = "siyuan-confirm-dialog";
    public static readonly SIYUAN_ALERT_DIALOG: string = "siyuan-alert-dialog";

    public static readonly SIYUAN_SHOW_WINDOW: string = "siyuan-show-window";

    // custom
    public static readonly CUSTOM_RIFF_DECKS: string = "custom-riff-decks";
    public static readonly CUSTOM_SY_READONLY: string = "custom-sy-readonly";
    public static readonly CUSTOM_SY_FULLWIDTH: string = "custom-sy-fullwidth";
    public static readonly CUSTOM_SY_AV_VIEW: string = "custom-sy-av-view";
    public static readonly CUSTOM_SY_TITLE_EMPTY: string = "custom-sy-title-empty";

    // size
    public static readonly SIZE_DATABASE_MAZ_SIZE: number = 102400;
    public static readonly SIZE_UPLOAD_TIP_SIZE: number = 268435456; // 256 M
    public static readonly SIZE_SCROLL_TB: number = 24;
    public static readonly SIZE_SCROLL_STEP: number = 256;
    public static readonly SIZE_LINK_TEXT_MAX: number = 64;
    public static readonly SIZE_TOOLBAR_HEIGHT: number = isMobile() ? 0 : 32;
    public static readonly SIZE_GET_MAX = 102400;
    public static readonly SIZE_UNDO = 64;
    public static readonly SIZE_TITLE = 512;
    public static readonly SIZE_EDITOR_WIDTH = 760;
    public static readonly SIZE_ZOOM = [
        {
            zoom: 0.67,
            position: {x: 0, y: 2}
        },
        {
            zoom: 0.75,
            position: {x: 1, y: 4}
        }, {
            zoom: 0.8,
            position: {x: 2, y: 4}
        }, {
            zoom: 0.9,
            position: {x: 5, y: 6}
        }, {
            zoom: 1,
            position: {x: 8, y: 8}
        }, {
            zoom: 1.1,
            position: {x: 12, y: 9}
        }, {
            zoom: 1.25,
            position: {x: 18, y: 12}
        }, {
            zoom: 1.5,
            position: {x: 27, y: 16}
        }, {
            zoom: 1.75,
            position: {x: 36, y: 20}
        }, {
            zoom: 2,
            position: {x: 45, y: 23}
        }, {
            zoom: 2.5,
            position: {x: 63, y: 31}
        }, {
            zoom: 3,
            position: {x: 80, y: 39}
        }];

    // ws callback
    public static readonly CB_MOVE_NOLIST = "cb-move-nolist";
    public static readonly CB_GET_APPEND = "cb-get-append"; // 向下滚动加载
    public static readonly CB_GET_BEFORE = "cb-get-before"; // 向上滚动加载
    public static readonly CB_GET_UNCHANGEID = "cb-get-unchangeid"; // 上下滚动，定位时不修改 blockid
    public static readonly CB_GET_HL = "cb-get-hl"; // 高亮
    public static readonly CB_GET_FOCUS = "cb-get-focus"; // 光标定位
    public static readonly CB_GET_FOCUSFIRST = "cb-get-focusfirst"; // 动态定位到第一个块
    public static readonly CB_GET_SETID = "cb-get-setid"; // 无折叠大纲点击 重置 blockid
    public static readonly CB_GET_OUTLINE = "cb-get-outline"; // 大纲点击
    public static readonly CB_GET_ALL = "cb-get-all"; // 获取所有块
    public static readonly CB_GET_BACKLINK = "cb-get-backlink"; // 悬浮窗为传递型需展示上下文
    public static readonly CB_GET_UNUNDO = "cb-get-unundo"; // 不需要记录历史
    public static readonly CB_GET_SCROLL = "cb-get-scroll"; // 滚动到指定位置，用于直接打开文档，必有 rootID
    public static readonly CB_GET_SEARCH = "cb-get-search"; // 通过搜索打开
    public static readonly CB_GET_CONTEXT = "cb-get-context"; // 包含上下文
    public static readonly CB_GET_ROOTSCROLL = "cb-get-rootscroll"; // 如果为 rootID 就滚动到指定位置，必有 rootID
    public static readonly CB_GET_HTML = "cb-get-html"; // 直接渲染，不需要再 /api/block/getDocInfo，否则搜索表格无法定位
    public static readonly CB_GET_HISTORY = "cb-get-history"; // 历史渲染
    public static readonly CB_GET_OPENNEW = "cb-get-opennew"; // 编辑器只读后新建文件需为临时解锁状态 & https://github.com/siyuan-note/siyuan/issues/12197
    public static readonly CB_GET_AV_NO_CREATE = "cb-get-av-no-create"; // 属性视图不自动创建

    // localstorage
    public static readonly LOCAL_ZOOM = "local-zoom";
    public static readonly LOCAL_SEARCHDATA = "local-searchdata";
    public static readonly LOCAL_SEARCHKEYS = "local-searchkeys";
    public static readonly LOCAL_SEARCHASSET = "local-searchasset";
    public static readonly LOCAL_SEARCHUNREF = "local-searchunref";
    public static readonly LOCAL_DOCINFO = "local-docinfo"; // only mobile
    public static readonly LOCAL_DAILYNOTEID = "local-dailynoteid"; // string
    public static readonly LOCAL_HISTORY = "local-history";
    public static readonly LOCAL_CODELANG = "local-codelang"; // string
    public static readonly LOCAL_FONTSTYLES = "local-fontstyles";
    public static readonly LOCAL_EXPORTPDF = "local-exportpdf";
    public static readonly LOCAL_EXPORTWORD = "local-exportword";
    public static readonly LOCAL_EXPORTIMG = "local-exportimg";
    public static readonly LOCAL_BAZAAR = "local-bazaar";
    public static readonly LOCAL_PDFTHEME = "local-pdftheme";
    public static readonly LOCAL_LAYOUTS = "local-layouts";
    public static readonly LOCAL_AI = "local-ai";
    public static readonly LOCAL_PLUGINTOPUNPIN = "local-plugintopunpin";
    public static readonly LOCAL_FLASHCARD = "local-flashcard";
    public static readonly LOCAL_FILEPOSITION = "local-fileposition";
    public static readonly LOCAL_FILESPATHS = "local-filespaths";
    public static readonly LOCAL_DIALOGPOSITION = "local-dialogposition";
    public static readonly LOCAL_SESSION_FIRSTLOAD = "local-session-firstload";
    public static readonly LOCAL_OUTLINE = "local-outline";
    public static readonly LOCAL_PLUGIN_DOCKS = "local-plugin-docks";
    public static readonly LOCAL_IMAGES = "local-images";
    public static readonly LOCAL_EMOJIS = "local-emojis";
    public static readonly LOCAL_MOVE_PATH = "local-move-path";
    public static readonly LOCAL_RECENT_DOCS = "local-recent-docs";
    public static readonly LOCAL_CLOSED_TABS = "local-closed-tabs";

    // dialog
    public static readonly DIALOG_CONFIRM = "dialog-confirm";
    public static readonly DIALOG_OPENCARD = "dialog-opencard";
    public static readonly DIALOG_MAKECARD = "dialog-makecard";
    public static readonly DIALOG_VIEWCARDS = "dialog-viewcards";
    public static readonly DIALOG_DIALYNOTE = "dialog-dialynote";
    public static readonly DIALOG_RECENTDOCS = "dialog-recentdocs";
    public static readonly DIALOG_SWITCHTAB = "dialog-switchtab";
    public static readonly DIALOG_SEARCH = "dialog-search";
    public static readonly DIALOG_REPLACE = "dialog-replace";
    public static readonly DIALOG_GLOBALSEARCH = "dialog-globalsearch";
    public static readonly DIALOG_HISTORYCOMPARE = "dialog-historycompare";

    public static readonly DIALOG_ACCESSAUTHCODE = "dialog-accessauthcode"; // 访问鉴权码
    public static readonly DIALOG_AICUSTOMACTION = "dialog-aicustomaction"; // AI 自定义操作
    public static readonly DIALOG_AIUPDATECUSTOMACTION = "dialog-aiupdatecustomaction"; // 更新 AI 自定义操作
    public static readonly DIALOG_BACKGROUNDLINK = "dialog-backgroundlink"; // 题头图-随机
    public static readonly DIALOG_BACKGROUNDRANDOM = "dialog-backgroundrandom"; // 题头图-链接
    public static readonly DIALOG_CHANGELOG = "dialog-changelog"; // 更新日志
    public static readonly DIALOG_COMMANDPANEL = "dialog-commandpanel"; // 插件命令面板
    public static readonly DIALOG_DEACTIVATEUSER = "dialog-deactivateuser"; // 注销账户
    public static readonly DIALOG_EMOJIS = "dialog-emojis"; // 文档、笔记本图表
    public static readonly DIALOG_EXPORTIMAGE = "dialog-exportimage"; // 导出为图片
    public static readonly DIALOG_EXPORTTEMPLATE = "dialog-exporttemplate"; // 导出为模板
    public static readonly DIALOG_EXPORTWORD = "dialog-exportword"; // 导出为 word
    public static readonly DIALOG_HISTORY = "dialog-history"; // 数据历史(Alt + H)
    public static readonly DIALOG_HISTORYDOC = "dialog-historydoc"; // 文档历史
    public static readonly DIALOG_MOVEPATHTO = "dialog-movepathto"; // 移动文档
    public static readonly DIALOG_RENAME = "dialog-rename"; // 重命名
    public static readonly DIALOG_RENAMEASSETS = "dialog-renameassets"; // 重命名资源文件
    public static readonly DIALOG_RENAMEBOOKMARK = "dialog-renamebookmark"; // 重命名书签
    public static readonly DIALOG_RENAMETAG = "dialog-renametag"; // 重命名标签
    public static readonly DIALOG_REPLACETYPE = "dialog-replacetype"; // 替换 - 替换类型
    public static readonly DIALOG_SAVECRITERION = "dialog-savecriterion"; // 保存查询条件
    public static readonly DIALOG_SEARCHTYPE = "dialog-searchtype"; // 搜索 - 类型
    public static readonly DIALOG_SEARCHASSETSTYPE = "dialog-searchassetstype"; // 搜索资源文件 - 类型
    public static readonly DIALOG_SETTING = "dialog-setting"; // 设置面板
    public static readonly DIALOG_SNAPSHOTTAG = "dialog-snapshottag"; // 标记快照
    public static readonly DIALOG_SNAPSHOTMEMO = "dialog-snapshotmemo"; // 快照备注
    public static readonly DIALOG_SNIPPETS = "dialog-snippets"; // 代码片段
    public static readonly DIALOG_SYNCADDCLOUDDIR = "dialog-syncaddclouddir"; // 新建云端同步目录
    public static readonly DIALOG_SYNCCHOOSEDIR = "dialog-syncchoosedir"; // 选择云端同步目录
    public static readonly DIALOG_SYNCCHOOSEDIRECTION = "dialog-syncchoosedirection"; // 选择云端同步方向
    public static readonly DIALOG_TRANSFERBLOCKREF = "dialog-transferblockref"; // 转移引用
    public static readonly DIALOG_PASSWORD = "dialog-password"; // 导入同步密钥
    public static readonly DIALOG_SETPASSWORD = "dialog-setpassword"; // 设置同步密钥
    public static readonly DIALOG_BOOTSYNCFAILED = "dialog-bootsyncfailed"; // 启动时同步数据失败
    public static readonly DIALOG_KERNELFAULT = "dialog-kernelfault"; // 内核退出
    public static readonly DIALOG_STATEEXCEPTED = "dialog-stateexcepted"; // 状态异常
    public static readonly DIALOG_ATTR = "dialog-attr"; // 设置块属性
    public static readonly DIALOG_SETCUSTOMATTR = "dialog-setcustomattr"; // 设置自定义属性
    public static readonly DIALOG_CREATENOTEBOOK = "dialog-createnotebook"; // 创建笔记本
    public static readonly DIALOG_NOTEBOOKCONF = "dialog-notebookconf"; // 笔记本设置
    public static readonly DIALOG_CREATEWORKSPACE = "dialog-createworkspace"; // 创建工作空间
    public static readonly DIALOG_OPENWORKSPACE = "dialog-openworkspace"; // 打开工作空间
    public static readonly DIALOG_SAVEWORKSPACE = "dialog-saveworkspace"; // 保存工作空间

    // menu
    public static readonly MENU_BAR_WORKSPACE = "barWorkspace"; // 顶栏主菜单
    public static readonly MENU_BAR_PLUGIN = "topBarPlugin"; // 顶栏插件菜单
    public static readonly MENU_BAR_ZOOM = "barZoom"; // 顶栏缩放菜单
    public static readonly MENU_BAR_MODE = "barmode"; // 顶栏外观菜单
    public static readonly MENU_BAR_MORE = "barmore"; // 顶栏更多菜单
    public static readonly MENU_STATUS_HELP = "statusHelp"; // 状态栏帮助菜单
    public static readonly MENU_STATUS_BACKGROUND_TASK = "statusBackgroundTask"; // 状态栏后台任务菜单
    public static readonly MENU_DOCK = "menu-dock"; // 桌面端 dock 图标菜单
    public static readonly MENU_DOCK_MOBILE = "dockMobileMenu"; // 移动端侧栏插件选项菜单

    public static readonly MENU_BLOCK_SINGLE = "block-single"; // 单选块菜单
    public static readonly MENU_BLOCK_MULTI = "block-multi"; // 多选块菜单
    public static readonly MENU_TITLE = "titleMenu"; // 文档块菜单
    public static readonly MENU_FROM_TITLE_PROTYLE = "title-protyle"; // 在 Protyle 触发的文档块菜单
    public static readonly MENU_FROM_TITLE_BREADCRUMB = "title-breadcrumb"; // 在面包屑触发的文档块菜单
    public static readonly MENU_BREADCRUMB_MORE = "breadcrumbMore"; // 面包屑更多菜单
    public static readonly MENU_BREADCRUMB_MOBILE_PATH = "breadcrumb-mobile-path"; // 移动端面包屑菜单

    public static readonly MENU_DOC_TREE_MORE = "docTreeMore"; // 侧栏文档树右键菜单
    public static readonly MENU_FROM_DOC_TREE_MORE_NOTEBOOK = "tree-notebook"; // 侧栏文档树右键菜单，单个笔记本
    public static readonly MENU_FROM_DOC_TREE_MORE_DOC = "tree-doc"; // 侧栏文档树右键菜单，单个文档
    public static readonly MENU_FROM_DOC_TREE_MORE_ITEMS = "tree-items"; // 侧栏文档树右键菜单，多个文档或笔记本
    public static readonly MENU_TAG = "tagMenu"; // 侧栏标签菜单
    public static readonly MENU_BOOKMARK = "bookmarkMenu"; // 侧栏书签菜单
    public static readonly MENU_OUTLINE_CONTEXT = "outline-context"; // 大纲标题右键菜单
    public static readonly MENU_OUTLINE_EXPAND_LEVEL = "outline-expand-level"; // 大纲展开层级菜单

    public static readonly MENU_AV_VIEW = "av-view"; // 数据库视图标题菜单
    public static readonly MENU_AV_HEADER_CELL = "av-header-cell"; // 数据库字段标题菜单
    public static readonly MENU_AV_HEADER_ADD = "av-header-add"; // 数据库添加字段菜单
    public static readonly MENU_AV_ADD_FILTER = "av-add-filter"; // 数据库添加筛选条件菜单
    public static readonly MENU_AV_ADD_SORT = "av-add-sort"; // 数据库添加排序条件菜单
    public static readonly MENU_AV_COL_OPTION = "av-col-option"; // 数据库单选多选字段的选项编辑菜单
    public static readonly MENU_AV_COL_FORMAT_NUMBER = "av-col-format-number"; // 数据库数字字段格式化菜单
    public static readonly MENU_AV_GROUP_DATE = "avGroupDate"; // 数据库日期字段分组菜单的日期菜单
    public static readonly MENU_AV_GROUP_SORT = "avGroupSort"; // 数据库日期字段分组菜单的排序菜单
    public static readonly MENU_AV_ASSET_EDIT = "av-asset-edit"; // 数据库资源字段链接或资源文件菜单
    public static readonly MENU_AV_CALC = "av-calc"; // 数据库计算菜单
    public static readonly MENU_AV_PAGE_SIZE = "av-page-size"; // 数据库条目数菜单

    public static readonly MENU_SEARCH_MORE = "searchMore"; // 搜索更多菜单
    public static readonly MENU_SEARCH_METHOD = "searchMethod"; // 搜索方式菜单
    public static readonly MENU_SEARCH_ASSET_MORE = "searchAssetMore"; // 资源文件搜索更多菜单
    public static readonly MENU_SEARCH_ASSET_METHOD = "searchAssetMethod"; // 资源文件搜索方式菜单
    public static readonly MENU_SEARCH_UNREF_MORE = "searchUnRefMore"; // 列出引用失效的块的更多菜单
    public static readonly MENU_SEARCH_HISTORY = "search-history"; // 搜索历史菜单
    public static readonly MENU_SEARCH_REPLACE_HISTORY = "search-replace-history"; // 替换历史菜单
    public static readonly MENU_SEARCH_ASSET_HISTORY = "search-asset-history"; // 资源文件搜索历史菜单
    public static readonly MENU_MOVE_PATH_HISTORY = "move-path-history"; // 移动文档窗口搜索历史菜单
    public static readonly MENU_CALLOUT_SELECT = "callout-select"; // 提示选择菜单

    public static readonly MENU_BACKGROUND_ASSET = "background-asset"; // 资源文件选择器菜单
    public static readonly MENU_AI = "ai"; // 块 AI 菜单
    public static readonly MENU_TAB = "tab"; // 页签右键菜单
    public static readonly MENU_TAB_LIST = "tabList"; // 页签切换菜单

    public static readonly MENU_INLINE_CONTEXT = "inline-context"; // 文本右键菜单
    public static readonly MENU_INLINE_IMG = "inline-img"; // 图片元素菜单
    public static readonly MENU_INLINE_FILE_ANNOTATION_REF = "inline-file-annotation-ref"; // PDF 标注元素菜单
    public static readonly MENU_INLINE_REF = "inline-block-ref"; // 块引用元素菜单
    public static readonly MENU_INLINE_A = "inline-a"; // 超链接元素菜单
    public static readonly MENU_INLINE_TAG = "inline-tag"; // 行级标签元素菜单
    public static readonly MENU_INLINE_MATH = "inline-math"; // 行级公式元素菜单

    // timeout
    public static readonly TIMEOUT_OPENDIALOG = 50;
    public static readonly TIMEOUT_DBLCLICK = 190;
    public static readonly TIMEOUT_RESIZE = 200;
    public static readonly TIMEOUT_INPUT = 256;
    public static readonly TIMEOUT_LOAD = 300;
    public static readonly TIMEOUT_TRANSITION = 300;
    public static readonly TIMEOUT_COUNT = 1000;

    // id
    public static readonly HELP_PATH: { [key: string]: string } = {
        ar_SA: "20210808180117-6v0mkxr",
        de_DE: "20210808180117-6v0mkxr",
        en_US: "20210808180117-6v0mkxr",
        es_ES: "20210808180117-6v0mkxr",
        fr_FR: "20210808180117-6v0mkxr",
        he_IL: "20210808180117-6v0mkxr",
        it_IT: "20210808180117-6v0mkxr",
        ja_JP: "20240530133126-axarxgx",
        ko_KR: "20210808180117-6v0mkxr",
        pl_PL: "20210808180117-6v0mkxr",
        pt_BR: "20210808180117-6v0mkxr",
        ru_RU: "20210808180117-6v0mkxr",
        sk_SK: "20210808180117-6v0mkxr",
        tr_TR: "20210808180117-6v0mkxr",
        zh_CHT: "20211226090932-5lcq56f",
        zh_CN: "20210808180117-czj9bvb",
    };
    public static readonly QUICK_DECK_ID = "20230218211946-2kw8jgx";

    public static KEYCODELIST: { [key: number]: string } = Object.assign(getFunctionKey(), {
        8: "⌫",
        9: "⇥",
        13: "↩",
        16: "⇧",
        17: "⌃",
        18: "⌥",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "←",
        38: "↑",
        39: "→",
        40: "↓",
        44: "PrintScreen",
        45: "Insert",
        46: "⌦",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        65: "A",
        66: "B",
        67: "C",
        68: "D",
        69: "E",
        70: "F",
        71: "G",
        72: "H",
        73: "I",
        74: "J",
        75: "K",
        76: "L",
        77: "M",
        78: "N",
        79: "O",
        80: "P",
        81: "Q",
        82: "R",
        83: "S",
        84: "T",
        85: "U",
        86: "V",
        87: "W",
        88: "X",
        89: "Y",
        90: "Z",
        91: "⌘",
        92: "⌘",
        93: "ContextMenu",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        144: "NumLock",
        145: "ScrollLock",
        182: "MyComputer",
        183: "MyCalculator",
        186: ";",
        187: "=",
        188: ",",
        189: "-",
        190: ".",
        191: "/",
        192: "`",
        219: "[",
        220: "\\",
        221: "]",
        222: "'",
    });
    // 冲突不使用 "⌘S/Q"
    // "⌘", "⇧", "⌥", "⌃"
    // "⌘A", "⌘X", "⌘C", "⌘V", "⌘-", "⌘=", "⌘0", "⇧⌘V", "⌘/", "⇧↑", "⇧↓", "⇧→", "⇧←", "⇧⇥", "⌃D", "⇧⌘→", "⇧⌘←",
    // "⌘Home", "⌘End", "⇧↩", "↩", "PageUp", "PageDown", "⌫", "⌦", "Escape" 不可自定义
    // "⌥↩" 写死，但可自定义
    public static readonly SIYUAN_KEYMAP: Config.IKeymap = {
        general: {
            mainMenu: {default: "⌥\\", custom: "⌥\\"},
            commandPanel: {default: "⌥⇧P", custom: "⌥⇧P"},
            editReadonly: {default: "⇧⌘G", custom: "⇧⌘G"},
            syncNow: {default: "F9", custom: "F9"},
            enterBack: {default: "⌥←", custom: "⌥←"},
            enter: {default: "⌥→", custom: "⌥→"},
            goForward: {default: "⌘]", custom: "⌘]"},
            goBack: {default: "⌘[", custom: "⌘["},
            newFile: {default: "⌘N", custom: "⌘N"},
            search: {default: "⌘F", custom: "⌘F"},
            globalSearch: {default: "⌘P", custom: "⌘P"},
            stickSearch: {default: "⇧⌘F", custom: "⇧⌘F"},
            replace: {default: "⌘R", custom: "⌘R"},
            closeTab: {default: "⌘W", custom: "⌘W"},
            fileTree: {default: "⌃1", custom: "⌃1"},
            outline: {default: "⌃2", custom: "⌃2"},
            bookmark: {default: "⌃3", custom: "⌃3"},
            tag: {default: "⌃4", custom: "⌃4"},
            dailyNote: {default: "⌃5", custom: "⌃5"},
            inbox: {default: "⌃6", custom: "⌃6"},
            backlinks: {default: "⌃7", custom: "⌃7"},
            graphView: {default: "⌃8", custom: "⌃8"},
            globalGraph: {default: "⌃9", custom: "⌃9"},
            riffCard: {default: "⌃0", custom: "⌃0"},
            config: {default: "⌥P", custom: "⌥P"},
            dataHistory: {default: "⌥H", custom: "⌥H"},
            toggleWin: {default: "⌥M", custom: "⌥M"},
            lockScreen: {default: "⌥N", custom: "⌥N"},
            recentDocs: {default: "⌘E", custom: "⌘E"},
            goToTab1: {default: "⌘1", custom: "⌘1"},
            goToTab2: {default: "⌘2", custom: "⌘2"},
            goToTab3: {default: "⌘3", custom: "⌘3"},
            goToTab4: {default: "⌘4", custom: "⌘4"},
            goToTab5: {default: "⌘5", custom: "⌘5"},
            goToTab6: {default: "⌘6", custom: "⌘6"},
            goToTab7: {default: "⌘7", custom: "⌘7"},
            goToTab8: {default: "⌘8", custom: "⌘8"},
            goToTab9: {default: "⌘9", custom: "⌘9"},
            goToTabNext: {default: "⇧⌘]", custom: "⇧⌘]"},
            goToTabPrev: {default: "⇧⌘[", custom: "⇧⌘["},
            goToEditTabNext: {default: "⌃⇥", custom: "⌃⇥"},
            goToEditTabPrev: {default: "⌃⇧⇥", custom: "⌃⇧⇥"},
            recentClosed: {default: "⇧⌘T", custom: "⇧⌘T"},
            move: {default: "", custom: ""},
            selectOpen1: {default: "", custom: ""},
            toggleDock: {default: "", custom: ""},
            splitLR: {default: "", custom: ""},
            splitMoveR: {default: "", custom: ""},
            splitTB: {default: "", custom: ""},
            splitMoveB: {default: "", custom: ""},
            closeOthers: {default: "", custom: ""},
            closeAll: {default: "", custom: ""},
            closeUnmodified: {default: "", custom: ""},
            closeLeft: {default: "", custom: ""},
            closeRight: {default: "", custom: ""},
            tabToWindow: {default: "", custom: ""},
            addToDatabase: {default: "", custom: ""},
            unsplit: {default: "", custom: ""},
            unsplitAll: {default: "", custom: ""},
        },
        editor: {
            general: {
                duplicate: {default: "⌘D", custom: "⌘D"},
                expandDown: {default: "⌥⇧↓", custom: "⌥⇧↓"},
                expandUp: {default: "⌥⇧↑", custom: "⌥⇧↑"},
                expand: {default: "⌘↓", custom: "⌘↓"},
                collapse: {default: "⌘↑", custom: "⌘↑"},
                insertBottom: {default: "⌥⌘.", custom: "⌥⌘."},
                refTab: {default: "⇧⌘.", custom: "⇧⌘."},
                openBy: {default: "⌥,", custom: "⌥,"},
                insertRight: {default: "⌥.", custom: "⌥."},
                attr: {default: "⌥⌘A", custom: "⌥⌘A"},
                quickMakeCard: {default: "⌥⌘F", custom: "⌥⌘F"},
                refresh: {default: "F5", custom: "F5"},
                copyBlockRef: {default: "⇧⌘C", custom: "⇧⌘C"},
                copyProtocol: {default: "⇧⌘H", custom: "⇧⌘H"},
                copyBlockEmbed: {default: "⇧⌘E", custom: "⇧⌘E"},
                copyHPath: {default: "⇧⌘P", custom: "⇧⌘P"},
                undo: {default: "⌘Z", custom: "⌘Z"},
                redo: {default: "⇧⌘Z", custom: "⇧⌘Z"},
                rename: {default: "F2", custom: "F2"},
                newNameFile: {default: "F3", custom: "F3"},
                newContentFile: {default: "F4", custom: "F4"},
                newNameSettingFile: {default: "⌘F3", custom: "⌘F3"},
                showInFolder: {default: "⌥A", custom: "⌥A"},
                outline: {default: "⌥O", custom: "⌥O"},
                backlinks: {default: "⌥B", custom: "⌥B"},
                graphView: {default: "⌥G", custom: "⌥G"},
                spaceRepetition: {default: "⌥F", custom: "⌥F"},
                fullscreen: {default: "⌥Y", custom: "⌥Y"},
                alignLeft: {default: "⌥L", custom: "⌥L"},
                alignCenter: {default: "⌥C", custom: "⌥C"},
                alignRight: {default: "⌥R", custom: "⌥R"},
                wysiwyg: {default: "⌥⌘7", custom: "⌥⌘7"},
                preview: {default: "⌥⌘9", custom: "⌥⌘9"},
                insertBefore: {default: "⇧⌘B", custom: "⇧⌘B"},
                insertAfter: {default: "⇧⌘A", custom: "⇧⌘A"},
                jumpToParentNext: {default: "⇧⌘N", custom: "⇧⌘N"},
                jumpToParentPrev: {default: "⇧⌘M", custom: "⇧⌘M"},
                jumpToParent: {default: "⇧⌘J", custom: "⇧⌘J"},
                moveToUp: {default: "⇧⌘↑", custom: "⇧⌘↑"},
                moveToDown: {default: "⇧⌘↓", custom: "⇧⌘↓"},
                duplicateCompletely: {default: "", custom: ""},
                copyPlainText: {default: "", custom: ""},
                copyID: {default: "", custom: ""},
                copyProtocolInMd: {default: "", custom: ""},
                netImg2LocalAsset: {default: "", custom: ""},
                netAssets2LocalAssets: {default: "", custom: ""},
                optimizeTypography: {default: "", custom: ""},
                hLayout: {default: "", custom: ""},
                vLayout: {default: "", custom: ""},
                refPopover: {default: "", custom: ""},
                copyText: {default: "", custom: ""},
                exitFocus: {default: "", custom: ""},
                ai: {default: "", custom: ""},
                switchReadonly: {default: "", custom: ""},
                switchAdjust: {default: "", custom: ""},
                rtl: {default: "", custom: ""},
                ltr: {default: "", custom: ""},
                aiWriting: {default: "", custom: ""},
                openInNewTab: {default: "", custom: ""},
            },
            insert: {
                appearance: {default: "⌥⌘X", custom: "⌥⌘X"},
                lastUsed: {default: "⌥X", custom: "⌥X"},
                ref: {default: "⌥[", custom: "⌥["},
                kbd: {default: "⌘'", custom: "⌘'"},
                sup: {default: "⌘H", custom: "⌘H"},
                sub: {default: "⌘J", custom: "⌘J"},
                bold: {default: "⌘B", custom: "⌘B"},
                "inline-math": {default: "⌘M", custom: "⌘M"},
                memo: {default: "⌥⌘M", custom: "⌥⌘M"},
                underline: {default: "⌘U", custom: "⌘U"},
                italic: {default: "⌘I", custom: "⌘I"},
                mark: {default: "⌥D", custom: "⌥D"},
                tag: {default: "⌘T", custom: "⌘T"},
                strike: {default: "⇧⌘S", custom: "⇧⌘S"},
                "inline-code": {default: "⌘G", custom: "⌘G"},
                link: {default: "⌘K", custom: "⌘K"},
                check: {default: "⌘L", custom: "⌘L"},
                "ordered-list": {default: "", custom: ""},
                list: {default: "", custom: ""},
                table: {default: "⌘O", custom: "⌘O"},
                code: {default: "⇧⌘K", custom: "⇧⌘K"},
                quote: {default: "", custom: ""},
                clearInline: {default: "⌘\\", custom: "⌘\\"},
            },
            heading: {
                paragraph: {default: "⌥⌘0", custom: "⌥⌘0"},
                heading1: {default: "⌥⌘1", custom: "⌥⌘1"},
                heading2: {default: "⌥⌘2", custom: "⌥⌘2"},
                heading3: {default: "⌥⌘3", custom: "⌥⌘3"},
                heading4: {default: "⌥⌘4", custom: "⌥⌘4"},
                heading5: {default: "⌥⌘5", custom: "⌥⌘5"},
                heading6: {default: "⌥⌘6", custom: "⌥⌘6"},
            },
            list: {
                indent: {default: "⇥", custom: "⇥"},
                outdent: {default: "⇧⇥", custom: "⇧⇥"},
                checkToggle: {default: "⌘↩", custom: "⌘↩"},
            },
            table: {
                insertRowAbove: {default: "", custom: ""},
                insertRowBelow: {default: "", custom: ""},
                insertColumnLeft: {default: "", custom: ""},
                insertColumnRight: {default: "", custom: ""},
                moveToUp: {default: "⌥⌘T", custom: "⌥⌘T"},
                moveToDown: {default: "⌥⌘B", custom: "⌥⌘B"},
                moveToLeft: {default: "⌥⌘L", custom: "⌥⌘L"},
                moveToRight: {default: "⌥⌘R", custom: "⌥⌘R"},
                "delete-row": {default: "⌘-", custom: "⌘-"},
                "delete-column": {default: "⇧⌘-", custom: "⇧⌘-"}
            }
        },
        plugin: {},
    };

    public static readonly SIYUAN_EMPTY_LAYOUT: Config.IUiLayout = {
        hideDock: false,
        layout: {
            "direction": "tb",
            "size": "0px",
            "type": "normal",
            "instance": "Layout",
            "children": [{
                "direction": "lr",
                "size": "auto",
                "type": "normal",
                "instance": "Layout",
                "children": [{
                    "direction": "tb",
                    "size": "0px",
                    "type": "left",
                    "instance": "Layout",
                    "children": [{
                        "instance": "Wnd",
                        "children": []
                    }, {
                        "instance": "Wnd",
                        "resize": "tb",
                        "children": []
                    }]
                }, {
                    "direction": "lr",
                    "resize": "lr",
                    "size": "auto",
                    "type": "center",
                    "instance": "Layout",
                    "children": [{
                        "instance": "Wnd",
                        "children": [{
                            "instance": "Tab",
                            "children": []
                        }]
                    }]
                }, {
                    "direction": "tb",
                    "size": "0px",
                    "resize": "lr",
                    "type": "right",
                    "instance": "Layout",
                    "children": [{
                        "instance": "Wnd",
                        "children": []
                    }, {
                        "instance": "Wnd",
                        "resize": "tb",
                        "children": []
                    }]
                }]
            }, {
                "direction": "lr",
                "size": "0px",
                "resize": "tb",
                "type": "bottom",
                "instance": "Layout",
                "children": [{
                    "instance": "Wnd",
                    "children": []
                }, {
                    "instance": "Wnd",
                    "resize": "lr",
                    "children": []
                }]
            }]
        },
        bottom: {
            pin: true,
            data: []
        },
        left: {
            pin: true,
            data: [
                [{
                    type: "file",
                    size: {width: 232, height: 0},
                    show: true,
                    icon: "iconFiles",
                    hotkeyLangId: "fileTree",
                }, {
                    type: "outline",
                    size: {width: 232, height: 0},
                    show: false,
                    icon: "iconAlignCenter",
                    hotkeyLangId: "outline",
                }], [{
                    type: "bookmark",
                    size: {width: 232, height: 0},
                    show: false,
                    icon: "iconBookmark",
                    hotkeyLangId: "bookmark",
                }, {
                    type: "tag",
                    size: {width: 232, height: 0},
                    show: false,
                    icon: "iconTags",
                    hotkeyLangId: "tag",
                }]
            ]
        },
        right: {
            pin: true,
            data: [
                [{
                    type: "graph",
                    size: {width: 320, height: 0},
                    show: false,
                    icon: "iconGraph",
                    hotkeyLangId: "graphView",
                }, {
                    type: "globalGraph",
                    size: {width: 320, height: 0},
                    show: false,
                    icon: "iconGlobalGraph",
                    hotkeyLangId: "globalGraph",
                }], [{
                    type: "backlink",
                    size: {width: 320, height: 0},
                    show: false,
                    icon: "iconLink",
                    hotkeyLangId: "backlinks",
                }]
            ]
        }
    };

    public static readonly SIYUAN_DEFAULT_REPLACETYPES: Required<Config.IUILayoutTabSearchConfigReplaceTypes> = {
        "text": true,
        "imgText": true,
        "imgTitle": true,
        "imgSrc": true,
        "aText": true,
        "aTitle": true,
        "aHref": true,
        "code": true,
        "em": true,
        "strong": true,
        "inlineMath": true,
        "inlineMemo": true,
        "blockRef": true,
        "fileAnnotationRef": true,
        "kbd": true,
        "mark": true,
        "s": true,
        "sub": true,
        "sup": true,
        "tag": true,
        "u": true,
        "docTitle": true,
        "codeBlock": true,
        "mathBlock": true,
        "htmlBlock": true
    };

    // assets
    public static readonly SIYUAN_ASSETS_IMAGE: string[] = [".apng", ".ico", ".cur", ".jpg", ".jpe", ".jpeg", ".jfif", ".pjp", ".pjpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".avif", ".tiff", ".tif"];
    public static readonly SIYUAN_ASSETS_AUDIO: string[] = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"];
    public static readonly SIYUAN_ASSETS_VIDEO: string[] = [".mov", ".weba", ".mkv", ".mp4", ".webm"];
    public static readonly SIYUAN_ASSETS_EXTS: string[] = [".pdf"].concat(Constants.SIYUAN_ASSETS_IMAGE, Constants.SIYUAN_ASSETS_AUDIO, Constants.SIYUAN_ASSETS_VIDEO);
    public static readonly SIYUAN_ASSETS_SEARCH: string[] = [".txt", ".md", ".markdown", ".docx", ".xlsx", ".pptx", ".pdf", ".json", ".log", ".sql", ".html", ".xml", ".java", ".h", ".c",
        ".cpp", ".go", ".rs", ".swift", ".kt", ".py", ".php", ".js", ".css", ".ts", ".sh", ".bat", ".cmd", ".ini", ".yaml",
        ".rst", ".adoc", ".textile", ".opml", ".org", ".wiki", ".epub", ".cs"];

    // protyle
    public static readonly SIYUAN_CONFIG_APPEARANCE_DARK_CODE: string[] = ["a11y-dark", "agate", "an-old-hope", "androidstudio",
        "arta", "atom-one-dark", "atom-one-dark-reasonable", "base16/3024", "base16/apathy", "base16/apprentice", "base16/ashes",
        "base16/atelier-cave", "base16/atelier-dune", "base16/atelier-estuary", "base16/atelier-forest", "base16/atelier-heath",
        "base16/atelier-lakeside", "base16/atelier-plateau", "base16/atelier-savanna", "base16/atelier-seaside", "base16/atelier-sulphurpool",
        "base16/atlas", "base16/bespin", "base16/black-metal", "base16/black-metal-bathory", "base16/black-metal-burzum",
        "base16/black-metal-dark-funeral", "base16/black-metal-gorgoroth", "base16/black-metal-immortal", "base16/black-metal-khold",
        "base16/black-metal-marduk", "base16/black-metal-mayhem", "base16/black-metal-nile", "base16/black-metal-venom",
        "base16/brewer", "base16/bright", "base16/brogrammer", "base16/brush-trees-dark", "base16/chalk", "base16/circus",
        "base16/classic-dark", "base16/codeschool", "base16/colors", "base16/danqing", "base16/darcula", "base16/dark-violet",
        "base16/darkmoss", "base16/darktooth", "base16/decaf", "base16/default-dark", "base16/dracula", "base16/edge-dark",
        "base16/eighties", "base16/embers", "base16/equilibrium-dark", "base16/equilibrium-gray-dark", "base16/espresso",
        "base16/eva", "base16/eva-dim", "base16/flat", "base16/framer", "base16/gigavolt", "base16/google-dark", "base16/grayscale-dark",
        "base16/green-screen", "base16/gruvbox-dark-hard", "base16/gruvbox-dark-medium", "base16/gruvbox-dark-pale", "base16/gruvbox-dark-soft",
        "base16/hardcore", "base16/harmonic16-dark", "base16/heetch-dark", "base16/helios", "base16/hopscotch", "base16/horizon-dark",
        "base16/humanoid-dark", "base16/ia-dark", "base16/icy-dark", "base16/ir-black", "base16/isotope", "base16/kimber",
        "base16/london-tube", "base16/macintosh", "base16/marrakesh", "base16/materia", "base16/material", "base16/material-darker",
        "base16/material-palenight", "base16/material-vivid", "base16/mellow-purple", "base16/mocha", "base16/monokai",
        "base16/nebula", "base16/nord", "base16/nova", "base16/ocean", "base16/oceanicnext", "base16/onedark", "base16/outrun-dark",
        "base16/papercolor-dark", "base16/paraiso", "base16/pasque", "base16/phd", "base16/pico", "base16/pop", "base16/porple",
        "base16/qualia", "base16/railscasts", "base16/rebecca", "base16/ros-pine", "base16/ros-pine-moon", "base16/sandcastle",
        "base16/seti-ui", "base16/silk-dark", "base16/snazzy", "base16/solar-flare", "base16/solarized-dark", "base16/spacemacs",
        "base16/summercamp", "base16/summerfruit-dark", "base16/synth-midnight-terminal-dark", "base16/tango", "base16/tender",
        "base16/tomorrow-night", "base16/twilight", "base16/unikitty-dark", "base16/vulcan", "base16/windows-10", "base16/windows-95",
        "base16/windows-high-contrast", "base16/windows-nt", "base16/woodland", "base16/xcode-dusk", "base16/zenburn", "codepen-embed",
        "cybertopia-cherry", "cybertopia-dimmer", "cybertopia-icecap", "cybertopia-saturated", "dark", "devibeans", "far",
        "felipec", "github-dark", "github-dark-dimmed", "gml", "gradient-dark", "hybrid", "ir-black", "isbl-editor-dark",
        "kimbie-dark", "lioshi", "monokai", "monokai-sublime", "night-owl", "nnfx-dark", "nord", "obsidian", "panda-syntax-dark",
        "paraiso-dark", "pojoaque", "qtcreator-dark", "rainbow", "rose-pine", "rose-pine-moon", "shades-of-purple", "srcery",
        "stackoverflow-dark", "sunburst", "tomorrow-night-blue", "tomorrow-night-bright", "tokyo-night-dark", "vs2015", "xt256"
    ];
    public static readonly SIYUAN_CONFIG_APPEARANCE_LIGHT_CODE: string[] = ["ant-design",
        "1c-light", "a11y-light", "arduino-light", "ascetic", "atom-one-light", "base16/atelier-cave-light", "base16/atelier-dune-light",
        "base16/atelier-estuary-light", "base16/atelier-forest-light", "base16/atelier-heath-light", "base16/atelier-lakeside-light",
        "base16/atelier-plateau-light", "base16/atelier-savanna-light", "base16/atelier-seaside-light", "base16/atelier-sulphurpool-light",
        "base16/brush-trees", "base16/classic-light", "base16/cupcake", "base16/cupertino", "base16/default-light", "base16/dirtysea",
        "base16/edge-light", "base16/equilibrium-gray-light", "base16/equilibrium-light", "base16/fruit-soda", "base16/github",
        "base16/google-light", "base16/grayscale-light", "base16/gruvbox-light-hard", "base16/gruvbox-light-medium",
        "base16/gruvbox-light-soft", "base16/harmonic16-light", "base16/heetch-light", "base16/humanoid-light", "base16/horizon-light",
        "base16/ia-light", "base16/material-lighter", "base16/mexico-light", "base16/one-light", "base16/papercolor-light",
        "base16/ros-pine-dawn", "base16/sagelight", "base16/shapeshifter", "base16/silk-light", "base16/solar-flare-light",
        "base16/solarized-light", "base16/summerfruit-light", "base16/synth-midnight-terminal-light", "base16/tomorrow",
        "base16/unikitty-light", "base16/windows-10-light", "base16/windows-95-light", "base16/windows-high-contrast-light",
        "brown-paper", "base16/windows-nt-light", "color-brewer", "docco", "foundation", "github", "googlecode", "gradient-light",
        "grayscale", "idea", "intellij-light", "isbl-editor-light", "kimbie-light", "lightfair", "magula", "mono-blue",
        "nnfx-light", "panda-syntax-light", "paraiso-light", "purebasic", "qtcreator-light", "rose-pine-dawn", "routeros",
        "school-book", "stackoverflow-light", "tokyo-night-light", "vs", "xcode", "default"];
    public static readonly ZWSP: string = "\u200b";
    public static readonly INLINE_TYPE: string[] = ["block-ref", "kbd", "text", "file-annotation-ref", "a", "strong", "em", "u", "s", "mark", "sup", "sub", "tag", "code", "inline-math", "inline-memo", "clear"];
    public static readonly BLOCK_HINT_KEYS: string[] = ["((", "[[", "（（", "【【"];
    public static readonly BLOCK_HINT_CLOSE_KEYS: IObject = {"((": "))", "[[": "]]", "（（": "））", "【【": "】】"};
    // common: "bash", "c", "csharp", "cpp", "css", "diff", "go", "xml", "json", "java", "javascript", "kotlin", "less", "lua", "makefile", "markdown", "objectivec", "php", "php-template", "perl", "plaintext", "python", "python-repl", "r", "ruby", "rust", "scss", "sql", "shell", "swift", "ini", "typescript", "vbnet", "yaml", "properties", "1c", "armasm", "avrasm", "actionscript", "ada", "angelscript", "accesslog", "apache", "applescript", "arcade", "arduino", "asciidoc", "aspectj", "abnf", "autohotkey", "autoit", "awk", "basic", "bnf", "dos", "brainfuck", "cal", "cmake", "csp", "cos", "capnproto", "ceylon", "clean", "clojure", "clojure-repl", "coffeescript", "coq", "crystal", "d", "dns", "dart", "delphi", "dts", "django", "dockerfile", "dust", "erb", "elixir", "elm", "erlang", "erlang-repl", "excel", "ebnf", "fsharp", "fix", "flix", "fortran", "gcode", "gams", "gauss", "glsl", "gml", "gherkin", "golo", "gradle", "groovy", "haml", "hsp", "http", "handlebars", "haskell", "haxe", "hy", "irpf90", "isbl", "inform7", "x86asm", "jboss-cli", "julia", "julia-repl", "ldif", "llvm", "lsl", "latex", "lasso", "leaf", "lisp", "livecodeserver", "livescript", "mel", "mipsasm", "matlab", "maxima", "mercury", "axapta", "routeros", "mizar", "mojolicious", "monkey", "moonscript", "n1ql", "nsis", "nestedtext", "nginx", "nim", "nix", "node-repl", "ocaml", "openscad", "ruleslanguage", "oxygene", "pf", "parser3", "pony", "pgsql", "powershell", "processing", "prolog", "protobuf", "puppet", "purebasic", "profile", "q", "qml", "reasonml", "rib", "rsl", "roboconf", "sas", "sml", "sqf", "step21", "scala", "scheme", "scilab", "smali", "smalltalk", "stan", "stata", "stylus", "subunit", "tp", "taggerscript", "tcl", "tap", "thrift", "twig", "vbscript", "vbscript-html", "vhdl", "vala", "verilog", "vim", "wasm", "mathematica", "wren", "xl", "xquery", "zephir", "crmsh", "dsconfig", "graphql",
    // third: "yul", "solidity", "abap", "hlsl", "gdscript", "moonbit", "mlir"
    public static readonly ALIAS_CODE_LANGUAGES: string[] = [
        "js", "ts", "html", "toml", "c#", "bat"
    ];
    public static readonly SIYUAN_RENDER_CODE_LANGUAGES: string[] = [
        "abc", "plantuml", "mermaid", "flowchart", "echarts", "mindmap", "graphviz", "math"
    ];
    public static readonly PROTYLE_TOOLBAR: string[] = isMobile() ? [
        "block-ref",
        "a",
        "|",
        "text",
        "strong",
        "em",
        "u",
        "clear",
        "|",
        "code",
        "tag",
        "inline-math",
        "inline-memo",
    ] : [
        "block-ref",
        "a",
        "|",
        "text",
        "strong",
        "em",
        "u",
        "s",
        "mark",
        "sup",
        "sub",
        "clear",
        "|",
        "code",
        "kbd",
        "tag",
        "inline-math",
        "inline-memo",
    ];
}

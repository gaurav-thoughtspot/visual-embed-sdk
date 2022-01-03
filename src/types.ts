/**
 * Copyright (c) 2020
 *
 * TypeScript type definitions for ThoughtSpot Visual Embed SDK
 *
 * @summary Type definitions for Embed SDK
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

/**
 * The authentication mechanism for allowing access to the
 * the embedded app
 */
// eslint-disable-next-line no-shadow
export enum AuthType {
    /**
     * No authentication. Use this only for testing purposes.
     */
    None = 'None',
    /**
     * SSO using SAML
     */
    SSO = 'SSO_SAML',
    /**
     * Trusted authentication server
     */
    AuthServer = 'AuthServer',
    /**
     * Use the ThoughtSpot login API to authenticate to the cluster directly.
     *
     * Warning: This feature is primarily intended for developer testing. It is
     * strongly advised not to use this authentication method in production.
     */
    Basic = 'Basic',
}

export type DOMSelector = string | HTMLElement;

/**
 * The configuration object for embedding ThoughtSpot content.
 * It includes the ThoughtSpot hostname or IP address,
 * the type of authentication, and the authentication endpoint
 * if a trusted authentication server is used.
 */
export interface EmbedConfig {
    /**
     * The ThoughtSpot cluster hostname or IP address.
     */
    thoughtSpotHost: string;
    /**
     * The authentication mechanism to use.
     */
    authType: AuthType;
    /**
     * [AuthServer] The trusted authentication endpoint to use to get the
     * authentication token. A GET request is made to the
     * authentication API endpoint, which  returns the token
     * as a plaintext response. For trusted authentication,
     * the `authEndpoint` or `getAuthToken` attribute is required.
     */
    authEndpoint?: string;
    /**
     * [AuthServer] A function that invokes the trusted authentication endpoint
     * and returns a Promise that resolves to the `auth token` string.
     * For trusted authentication, the `authEndpoint` or `getAuthToken`
     * attribute is required.
     */
    getAuthToken?: () => Promise<string>;
    /**
     * [AuthServer / Basic] The user name of the ThoughtSpot user. This attribute is
     * required for trusted authentication.
     */
    username?: string;

    /**
     * [Basic] The ThoughtSpot login password corresponding to the user name
     *
     * Warning: This feature is primarily intended for developer testing. It is
     * strongly advised not to use this authentication method in production.
     */
    password?: string;

    /**
     * [SSO] For SSO Authentication, if `noRedirect` is set to true, it will open the SAML auth
     * flow in a popup, instead of redirecting browser in place.
     *
     * @default false
     */
    noRedirect?: boolean;

    /** @internal */
    basepath?: string;

    /**
     * Should we encode URL Query Params using base64 encoding which thoughtspot
     * will generate for embedding. This provides additional security to
     * thoughtspot clusters against Cross site scripting attacks.
     * @default false
     */
    shouldEncodeUrlQueryParams?: boolean;

    /**
     * Suppress cookie access alert when third party cookies are blocked by the user's browser.
     * Third party cookie blocking is the default behaviour on Safari and opt-in for Firefox/Chrome.
     * If you set this to `true`, you are encouraged to handle `noCookieAccess` event, to show your own treatment
     * in this case.
     * @default false
     */
    suppressNoCookieAccessAlert?: boolean;

    /**
     * Re-login when session expires with the previous login options
     * @default true
     */
    autoLogin?: boolean;

    /**
     * Calls the prefetch method internally when set to true
     * @default false
     */
    callPrefetch?: boolean;

    /**
     * When there are multiple embeds, queue the render of embed to start
     *  after the previous embed's render is complete. This helps in the load performance
     *  by decreasing the load on the browser.
     * * _since: 1.5.0_
     * @default false
     */
    queueMultiRenders?: boolean;

    /**
     * Dynamic CSS Url to be injected in the loaded application.
     * * _since: 1.6.0_
     * @default ''
     */
    customCssUrl?: string;
}

export type MessagePayload = { type: string; data: any };
export type MessageCallback = (
    payload: MessagePayload,
    responder?: (data: any) => void,
) => void;

export type GenericCallbackFn = (...args: any[]) => any;

export type QueryParams = {
    [key: string]: string;
};

/**
 * A map of the supported runtime filter operations
 */
// eslint-disable-next-line no-shadow
export enum RuntimeFilterOp {
    /**
     * Equals
     */
    EQ = 'EQ',
    /**
     * Does not equal
     */
    NE = 'NE',
    /**
     * Less than
     */
    LT = 'LT',
    /**
     * Less than or equal to
     */
    LE = 'LE',
    /**
     * Greater than
     */
    GT = 'GT',
    /**
     * Greater than or equal to
     */
    GE = 'GE',
    /**
     * Contains
     */
    CONTAINS = 'CONTAINS',
    /**
     * Begins with
     */
    BEGINS_WITH = 'BEGINS_WITH',
    /**
     * Ends with
     */
    ENDS_WITH = 'ENDS_WITH',
    /**
     * Between, inclusive of higher value
     */
    BW_INC_MAX = 'BW_INC_MAX',
    /**
     * Between, inclusive of lower value
     */
    BW_INC_MIN = 'BW_INC_MIN',
    /**
     * Between, inclusive of both higher and lower value
     */
    BW_INC = 'BW_INC',
    /**
     * Between, non-inclusive
     */
    BW = 'BW',
    /**
     * Is included in this list of values
     */
    IN = 'IN',
}

/**
 * A filter that can be applied to ThoughtSpot answers, liveboards, or
 * visualizations at runtime.
 */
export interface RuntimeFilter {
    /**
     * The name of the column to filter on (case-sensitive)
     */
    columnName: string;
    /**
     * The operator to apply
     */
    operator: RuntimeFilterOp;
    /**
     * The list of operands. Some operators like EQ, LE accept
     * a single operand, whereas other operators like BW and IN accept multiple operands.
     */
    values: (number | boolean | string)[];
}

/**
 * Event types emitted by the embedded ThoughtSpot application.
 */
// eslint-disable-next-line no-shadow
export enum EmbedEvent {
    /**
     * Rendering has initialized.
     * @return timestamp - The timestamp when the event was generated.
     */
    Init = 'init',
    /**
     * Authentication has either succeeded or failed.
     * @return isLoggedIn - A Boolean specifying whether authentication was successful.
     */
    AuthInit = 'authInit',
    /**
     * The embed object container has loaded.
     * @return timestamp - The timestamp when the event was generated.
     */
    Load = 'load',
    /**
     * Data pertaining to answer or liveboard is received
     * @return data - The answer or liveboard data
     */
    Data = 'data',
    /**
     * Search/answer/liveboard filters have been applied/updated
     * @hidden
     */
    FiltersChanged = 'filtersChanged',
    /**
     * Search query has been updated
     */
    QueryChanged = 'queryChanged',
    /**
     * A drill down operation has been performed.
     * @return additionalFilters - Any additional filters applied
     * @return drillDownColumns - The columns on which drill down was performed
     * @return nonFilteredColumns - The columns that were not filtered
     */
    Drilldown = 'drillDown',
    /**
     * One or more data sources have been selected.
     * @return dataSourceIds - the list of data sources
     */
    DataSourceSelected = 'dataSourceSelected',
    /**
     * A custom action has been triggered
     * @return actionId - The id of the custom action
     * @return data - The answer or liveboard data
     */
    CustomAction = 'customAction',
    /**
     * A double click has been triggered on table/chart
     * @return ContextMenuInputPoints - data point that is double clicked
     * * _since: 1.5.0_
     */
    VizPointDoubleClick = 'vizPointDoubleClick',
    /**
     * An error has occurred.
     * @return error - An error object or message
     */
    Error = 'Error',
    /**
     * The embedded object has sent an alert
     * @return alert - An alert object
     */
    Alert = 'alert',
    /**
     * The ThoughtSpot auth session has expired.
     */
    AuthExpire = 'ThoughtspotAuthExpired',
    /**
     * The height of the embedded liveboard or visualization has been computed.
     * @return data - The height of the embedded liveboard or visualization
     * @hidden
     */
    EmbedHeight = 'EMBED_HEIGHT',
    /**
     * The center of visible iframe viewport is calculated.
     * @return data - The center of the visible Iframe viewport.
     * @hidden
     */
    EmbedIframeCenter = 'EmbedIframeCenter',
    /**
     * Detects the route change.
     * @hidden
     */
    RouteChange = 'ROUTE_CHANGE',
    /**
     * The v1 event type for Data
     * @hidden
     */
    V1Data = 'exportVizDataToParent',
    /**
     * Emitted when the embed does not have cookie access. This
     * happens on Safari where third-party cookies are blocked by default.
     *
     * @version 1.1.0
     */
    NoCookieAccess = 'noCookieAccess',
    /**
     * Emitted when SAML is complete
     * @private
     * @hidden
     */
    SAMLComplete = 'samlComplete',
    /**
     * Emitted when any modal is opened in the app
     * * _since: 1.6.0_
     */
    DialogOpen = 'dialog-open',
    /**
     * Emitted when any modal is closed in the app
     * * _since: 1.6.0_
     */
    DialogClose = 'dialog-close',
}

/**
 * Event types that can be triggered by the host application
 * to the embedded ThoughtSpot app
 */
// eslint-disable-next-line no-shadow
export enum HostEvent {
    /**
     * Trigger a search
     * @param dataSourceIds - The list of data source GUIDs
     * @param searchQuery - The search query
     */
    Search = 'search',
    /**
     * Trigger a drill on certain points by certain column
     * @param points - an object containing selectedPoints/clickedPoints
     *              eg. { selectedPoints: []}
     * @param columnGuid - a string guid of the column to drill by. This is optional,
     *                     if not provided it will auto drill by the configured column. \
     * * _since: 1.5.0_
     */
    DrillDown = 'triggerDrillDown',
    /**
     * Apply filters
     * @hidden
     */
    Filter = 'filter',
    /**
     * Reload the answer or visualization
     * @hidden
     */
    Reload = 'reload',
    /**
     * Set the visible Vizs on a pinboard/liveboard.
     * @param - an array of ids of vizs to show, the ids not passed
     *          will be hidden.
     * * _since: 1.6.0_
     */
    SetVisibleVizs = 'SetPinboardVisibleVizs',
}

/**
 * The different visual modes that the data sources panel within
 * search could appear in, i.e., hidden, collapsed, or expanded.
 */
// eslint-disable-next-line no-shadow
export enum DataSourceVisualMode {
    /**
     * Data source panel is hidden.
     */
    Hidden = 'hide',
    /**
     * Data source panel is collapsed, but the user can manually expand it.
     */
    Collapsed = 'collapse',
    /**
     * Data source panel is expanded, but the user can manually collapse it.
     */
    Expanded = 'expand',
}

/**
 * The query params passed down to the embedded ThoughtSpot app
 * containing configuration and/or visual information.
 */
// eslint-disable-next-line no-shadow
export enum Param {
    DataSources = 'dataSources',
    DataSourceMode = 'dataSourceMode',
    DisableActions = 'disableAction',
    DisableActionReason = 'disableHint',
    ForceTable = 'forceTable',
    preventLiveboardFilterRemoval = 'preventPinboardFilterRemoval', // update-TSCB
    SearchQuery = 'searchQuery',
    HideActions = 'hideAction',
    HideObjects = 'hideObjects',
    HostAppUrl = 'hostAppUrl',
    EnableVizTransformations = 'enableVizTransform',
    EnableSearchAssist = 'enableSearchAssist',
    HideResult = 'hideResult',
    UseLastSelectedDataSource = 'useLastSelectedSources',
    Tag = 'tag',
    searchTokenString = 'searchTokenString',
    executeSearch = 'executeSearch',
    fullHeight = 'isFullHeightPinboard',
    livedBoardEmbed = 'isLiveboardEmbed',
    Version = 'sdkVersion',
    ViewPortHeight = 'viewPortHeight',
    ViewPortWidth = 'viewPortWidth',
    VisibleActions = 'visibleAction',
    CustomCSSUrl = 'customCssUrl',
}

/**
 * The list of actions that can be performed on visual ThoughtSpot
 * entities, such as answers and liveboards.
 */
// eslint-disable-next-line no-shadow
export enum Action {
    Save = 'save',
    Update = 'update',
    SaveUntitled = 'saveUntitled',
    SaveAsView = 'saveAsView',
    MakeACopy = 'makeACopy',
    EditACopy = 'editACopy',
    CopyLink = 'embedDocument',
    /**
     * @hidden
     */
    PinboardSnapshot = 'pinboardSnapshot',
    LiveboardSnapshot = 'liveboardSnapshot', // update-TSCB
    ResetLayout = 'resetLayout',
    /**
     * @version 1.7.0
     */
    AddToFavorites = 'addToFavorites',
    EditDetails = 'editDetails',
    LiveboardUsers = 'liveboardUsers',

    Schedule = 'schedule',
    SchedulesList = 'schedule-list',
    Share = 'share',
    AddFilter = 'addFilter',
    ConfigureFilter = 'configureFilter',
    AddFormula = 'addFormula',
    SearchOnTop = 'searchOnTop',
    SpotIQAnalyze = 'spotIQAnalyze',
    ExplainInsight = 'explainInsight',
    SpotIQFollow = 'spotIQFollow',
    ShareViz = 'shareViz',
    ReplaySearch = 'replaySearch',
    ShowUnderlyingData = 'showUnderlyingData',
    Download = 'download',
    DownloadAsPdf = 'downloadAsPdf',
    DownloadAsCsv = 'downloadAsCSV',
    DownloadAsXlsx = 'downloadAsXLSX',
    DownloadTrace = 'downloadTrace',
    ExportTML = 'exportTSL',
    ImportTML = 'importTSL',
    UpdateTML = 'updateTSL',
    EditTML = 'editTSL',
    Present = 'present',
    ToggleSize = 'toggleSize',
    Edit = 'edit',
    EditTitle = 'editTitle',
    Remove = 'delete',
    Ungroup = 'ungroup',
    Describe = 'describe',
    Relate = 'relate',
    CustomizeHeadlines = 'customizeHeadlines',
    /**
     * @hidden
     */
    PinboardInfo = 'pinboardInfo',
    LiveboardInfo = 'liveboardInfo', // update-TSCB
    SendAnswerFeedback = 'sendFeedback',
    /**
     * @deprecated Will be removed in next version
     */
    CustomAction = 'customAction',
    DownloadEmbraceQueries = 'downloadEmbraceQueries',
    Pin = 'pin',
    AnalysisInfo = 'analysisInfo',
    Subscription = 'subscription',
    Explore = 'explore',
    DrillInclude = 'context-menu-item-include',
    DrillExclude = 'context-menu-item-exclude',
    CopyToClipboard = 'context-menu-item-copy-to-clipboard',
    DrillEdit = 'context-menu-item-edit',
    EditMeasure = 'context-menu-item-edit-measure',
    Separator = 'context-menu-item-separator',
    DrillDown = 'DRILL',
    RequestAccess = 'requestAccess',
    QueryDetailsButtons = 'queryDetailsButtons',
}

export interface SessionInterface {
    sessionId: string;
    genNo: number;
    acSession: { sessionId: string; genNo: number };
}

// eslint-disable-next-line no-shadow
export enum OperationType {
    GetChartWithData = 'GetChartWithData',
    GetTableWithHeadlineData = 'GetTableWithHeadlineData',
}

export interface AnswerServiceType {
    getAnswer?: (offset: number, batchSize: number) => any;
}

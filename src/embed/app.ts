/**
 * Copyright (c) 2021
 *
 * Full application embedding
 * https://developers.thoughtspot.com/docs/?pageid=full-embed
 *
 * @summary Full app embed
 * @module
 * @author Ayon Ghosh <ayon.ghosh@thoughtspot.com>
 */

import { getFilterQuery, getQueryParamString } from '../utils';
import { Param, RuntimeFilter, DOMSelector } from '../types';
import { V1Embed, ViewConfig } from './ts-embed';

/**
 * Pages within the ThoughtSpot app that can be embedded.
 */
// eslint-disable-next-line no-shadow
export enum Page {
    /**
     * Home page
     */
    Home = 'home',
    /**
     * Search page
     */
    Search = 'search',
    /**
     * Saved answers listing page
     */
    Answers = 'answers',
    /**
     * Liveboards listing page
     */
    Liveboards = 'liveboards',
    /**
     * @hidden
     */
    Pinboards = 'pinboards',
    /**
     * Data management page
     */
    Data = 'data',
}

/**
 * The view configuration for full app embedding.
 * @Category App Embed
 */
export interface AppViewConfig extends ViewConfig {
    /**
     * If true, the main navigation bar within the ThoughtSpot app
     * is displayed. By default, the navigation bar is hidden.
     */
    showPrimaryNavbar?: boolean;
    /**
     * If true, help and profile buttons will hide on NavBar. By default,
     * they are shown.
     */
    disableProfileAndHelp?: boolean;
    /**
     * A URL path within the app that is to be embedded.
     * If both path and pageId attributes are defined, the path definition
     * takes precedence.
     */
    path?: string;
    /**
     * The application page to set as the start page
     * in the embedded view.
     */
    pageId?: Page;
    /**
     * This puts a filter tag on the application. All metadata lists in the application, such as
     * liveboards and answers, would be filtered by this tag.
     */
    tag?: string;
    /**
     * The array of GUIDs to be hidden
     */
    hideObjects?: string[];
}

/**
 * Embeds full ThoughtSpot experience in a host application.
 * @Category App Embed
 */
export class AppEmbed extends V1Embed {
    protected viewConfig: AppViewConfig;

    // eslint-disable-next-line no-useless-constructor
    constructor(domSelector: DOMSelector, viewConfig: AppViewConfig) {
        super(domSelector, viewConfig);
    }

    /**
     * Constructs a map of parameters to be passed on to the
     * embedded liveboard or visualization.
     */
    private getEmbedParams() {
        const params = this.getBaseQueryParams();
        const { tag, hideObjects } = this.viewConfig;

        if (tag) {
            params[Param.Tag] = tag;
        }
        if (hideObjects && hideObjects.length) {
            params[Param.HideObjects] = JSON.stringify(hideObjects);
        }

        const queryParams = getQueryParamString(params, true);

        return queryParams;
    }

    /**
     * Constructs the URL of the ThoughtSpot app page to be rendered.
     * @param pageId The ID of the page to be embedded.
     */
    private getIFrameSrc(pageId: string, runtimeFilters: RuntimeFilter[]) {
        const filterQuery = getFilterQuery(runtimeFilters || []);
        const queryParams = this.getEmbedParams();
        const queryString = [filterQuery, queryParams]
            .filter(Boolean)
            .join('&');
        const url = `${this.getV1EmbedBasePath(
            queryString,
            this.viewConfig.showPrimaryNavbar,
            this.viewConfig.disableProfileAndHelp,
            true,
        )}/${pageId}`;

        return url;
    }

    /**
     * Gets the ThoughtSpot route of the page for a particular page ID.
     * @param pageId The identifier for a page in the ThoughtSpot app.
     */
    private getPageRoute(pageId: Page) {
        switch (pageId) {
            case Page.Search:
                return 'answer';
            case Page.Answers:
                return 'answers';
            case Page.Liveboards:
                return 'pinboards';
            case Page.Pinboards:
                return 'pinboards';
            case Page.Data:
                return 'data/tables';
            case Page.Home:
            default:
                return 'home';
        }
    }

    /**
     * Formats the path provided by the user.
     * @param path The URL path.
     * @returns The URL path that the embedded app understands.
     */
    private formatPath(path: string) {
        if (!path) {
            return null;
        }

        // remove leading slash
        if (path.indexOf('/') === 0) {
            return path.substring(1);
        }

        return path;
    }

    /**
     * Navigate to particular page for app embed. eg:answers/pinboards/home
     * This is used for embedding answers, pinboards, visualizations and full application only.
     * @param path The string, set to iframe src and navigate to new page
     * eg: appEmbed.navigateToPage('pinboards')
     */
    public navigateToPage(path: string): void {
        if (this.iFrame) {
            const iframeSrc = this.iFrame.src;
            const embedPath = '#/embed';
            const currentPath = iframeSrc.includes(embedPath) ? embedPath : '#';
            this.iFrame.src = `${
                iframeSrc.split(currentPath)[0]
            }${currentPath}/${path.replace(/^\/?#?\//, '')}`;
        } else {
            console.log('Please call render before invoking this method');
        }
    }

    /**
     * Renders the embedded application pages in the ThoughtSpot app.
     * @param renderOptions An object containing the page ID
     * to be embedded.
     */
    public render(): AppEmbed {
        super.render();

        const { pageId, runtimeFilters, path } = this.viewConfig;
        const pageRoute = this.formatPath(path) || this.getPageRoute(pageId);
        const src = this.getIFrameSrc(pageRoute, runtimeFilters);
        this.renderV1Embed(src);

        return this;
    }
}

import { AppEmbed, AppViewConfig, Page } from './app';
import { init } from '../index';
import { Action, AuthType, RuntimeFilterOp } from '../types';
import {
    executeAfterWait,
    getDocumentBody,
    getIFrameSrc,
    getRootEl,
} from '../test/test-utils';
import { version } from '../../package.json';
import * as config from '../config';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const thoughtSpotHost = 'tshost';
const defaultParams = `&hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}`;
const defaultParamsForPinboardEmbed = `hostAppUrl=local-host&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}`;

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
});

const cleanUp = () => {
    document.body.innerHTML = getDocumentBody();
};

describe('App embed tests', () => {
    beforeEach(() => {
        cleanUp();
    });

    test('should render home page by default', async () => {
        const appEmbed = new AppEmbed(getRootEl(), defaultViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false${defaultParams}#/home`,
            );
        });
    });

    test('should hide the primary nav bar', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showPrimaryNavbar: true,
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false&profileAndHelpInNavBarHidden=false${defaultParams}#/home`,
            );
        });
    });

    test('should hide the help and profile buttons from nav bar', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            disableProfileAndHelp: true,
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=true${defaultParams}#/home`,
            );
        });
    });

    describe('should render the correct routes for pages', () => {
        /* eslint-disable no-loop-func */
        const pageRouteMap = {
            [Page.Search]: 'answer',
            [Page.Answers]: 'answers',
            [Page.Pinboards]: 'pinboards',
            [Page.Liveboards]: 'pinboards',
            [Page.Data]: 'data/tables',
            [Page.Home]: 'home',
        };

        const pageIds = Object.keys(pageRouteMap);
        for (let i = 0; i < pageIds.length; i++) {
            const pageId = pageIds[i];

            test(`${pageId}`, async () => {
                const route = pageRouteMap[pageId];
                const appEmbed = new AppEmbed(getRootEl(), {
                    ...defaultViewConfig,
                    pageId: pageId as Page,
                } as AppViewConfig);
                appEmbed.render();

                await executeAfterWait(() => {
                    expect(getIFrameSrc()).toBe(
                        `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false${defaultParams}#/${route}`,
                    );
                    cleanUp();
                });
            });
        }
    });

    test('should navigate to a path', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            path: 'foo/bar',
        } as AppViewConfig);
        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false${defaultParams}#/foo/bar`,
            );
        });
    });

    test('should apply runtime filters', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showPrimaryNavbar: true,
            runtimeFilters: [
                {
                    columnName: 'sales',
                    operator: RuntimeFilterOp.EQ,
                    values: [1000],
                },
            ],
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false&profileAndHelpInNavBarHidden=false&col1=sales&op1=EQ&val1=1000${defaultParams}#/home`,
            );
        });
    });

    test('should disable and hide actions', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showPrimaryNavbar: true,
            disabledActions: [Action.Save, Action.Update],
            disabledActionReason: 'Access denied',
            hiddenActions: [Action.Download],
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=false&profileAndHelpInNavBarHidden=false${defaultParams}&disableAction=[%22save%22,%22update%22]&disableHint=Access%20denied&hideAction=[%22download%22]#/home`,
            );
        });
    });

    test('Should add the tag to the iframe src', async () => {
        const appEmbed = new AppEmbed(getRootEl(), {
            ...defaultViewConfig,
            showPrimaryNavbar: false,
            tag: 'Finance',
        } as AppViewConfig);

        appEmbed.render();
        await executeAfterWait(() => {
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false${defaultParams}&tag=Finance#/home`,
            );
        });
    });

    describe('Naviage to Page API', () => {
        const path = 'pinboard/e0836cad-4fdf-42d4-bd97-567a6b2a6058';
        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(
                () => 'http://tshost',
            );
        });

        test('when app is AppEmbed after navigateToPage function call, new path should be set to iframe', async () => {
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            await appEmbed.render();
            appEmbed.navigateToPage(path);
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}#/${path}`,
            );
        });

        test('navigateToPage function use before render', async () => {
            spyOn(console, 'log');
            const appEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            appEmbed.navigateToPage(path);
            await appEmbed.render();
            expect(console.log).toHaveBeenCalledWith(
                'Please call render before invoking this method',
            );
        });
    });
});

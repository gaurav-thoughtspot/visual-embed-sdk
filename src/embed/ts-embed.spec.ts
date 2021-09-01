/* eslint-disable dot-notation */
import {
    AuthType,
    init,
    EmbedEvent,
    SearchEmbed,
    PinboardEmbed,
    AppEmbed,
} from '../index';
import { getDocumentBody, getIFrameSrc, getRootEl } from '../test/test-utils';
import * as config from '../config';
import * as tsEmbedInstance from './ts-embed';
import * as mixpanelInstance from '../mixpanel-service';
import * as baseInstance from './base';
import { MIXPANEL_EVENT } from '../mixpanel-service';
import { version } from '../../package.json';

const defaultViewConfig = {
    frameParams: {
        width: 1280,
        height: 720,
    },
};
const thoughtSpotHost = 'tshost';
const defaultParamsForSearchEmbed = `hostAppUrl=localhost&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}&dataSourceMode=expand&useLastSelectedSources=false`;
const defaultParamsForPinboardEmbed = `hostAppUrl=localhost&viewPortHeight=768&viewPortWidth=1024&sdkVersion=${version}`;

describe('Unit test case for ts embed', () => {
    const mockMixPanelEvent = jest.spyOn(
        mixpanelInstance,
        'uploadMixpanelEvent',
    );
    describe('when thoughtSpotHost have value and authPromise return success response', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost,
                authType: AuthType.None,
            });
        });

        beforeEach(() => {
            document.body.innerHTML = getDocumentBody();
            jest.spyOn(window, 'addEventListener').mockImplementationOnce(
                (event, handler, options) => {
                    handler({
                        data: {
                            type: 'xyz',
                        },
                        ports: [3000],
                        source: null,
                    });
                },
            );
            const iFrame: any = document.createElement('div');
            jest.spyOn(
                baseInstance,
                'getAuthPromise',
            ).mockResolvedValueOnce(() => Promise.resolve());
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            iFrame.contentWindow = null;
            tsEmbed.on(EmbedEvent.CustomAction, jest.fn());
            jest.spyOn(iFrame, 'addEventListener').mockImplementationOnce(
                (event, handler, options) => {
                    handler({});
                },
            );
            tsEmbed.test_setIframe(iFrame);
            tsEmbed.render();
        });

        test('mixpanel should call with VISUAL_SDK_RENDER_COMPLETE', () => {
            expect(mockMixPanelEvent).toBeCalledWith(
                MIXPANEL_EVENT.VISUAL_SDK_RENDER_START,
            );
            expect(mockMixPanelEvent).toBeCalledWith(
                MIXPANEL_EVENT.VISUAL_SDK_RENDER_COMPLETE,
            );
        });
    });

    describe('when thoughtSpotHost have value and authPromise return error', () => {
        beforeAll(() => {
            init({
                thoughtSpotHost: 'tshost',
                authType: AuthType.None,
            });
        });

        beforeEach(() => {
            document.body.innerHTML = getDocumentBody();
            jest.spyOn(
                baseInstance,
                'getAuthPromise',
            ).mockRejectedValueOnce(() => Promise.reject());
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            const iFrame: any = document.createElement('div');
            iFrame.contentWindow = null;
            tsEmbed.test_setIframe(iFrame);
            tsEmbed.render();
        });

        test('mixpanel should call with VISUAL_SDK_RENDER_FAILED', () => {
            expect(mockMixPanelEvent).toBeCalledWith(
                MIXPANEL_EVENT.VISUAL_SDK_RENDER_START,
            );
            expect(mockMixPanelEvent).toBeCalledWith(
                MIXPANEL_EVENT.VISUAL_SDK_RENDER_FAILED,
            );
        });
    });

    describe('when thoughtSpotHost is empty', () => {
        beforeAll(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(
                () => '',
            );
            init({
                thoughtSpotHost: '',
                authType: AuthType.None,
            });
        });

        beforeEach(() => {
            document.body.innerHTML = getDocumentBody();
        });

        test('Error should be true', async () => {
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            tsEmbed.render();
            expect(tsEmbed['isError']).toBe(true);
        });
    });

    describe('V1Embed ', () => {
        test('when isRendered is true than isError will be true', () => {
            const viEmbedIns = new tsEmbedInstance.V1Embed(
                getRootEl(),
                defaultViewConfig,
            );
            expect(viEmbedIns['isError']).toBe(false);
            viEmbedIns.render();
            viEmbedIns.on(EmbedEvent.CustomAction, jest.fn()).render();
            expect(viEmbedIns['isError']).toBe(true);
        });
    });

    describe('Naviage to Page API', () => {
        beforeEach(() => {
            jest.spyOn(config, 'getThoughtSpotHost').mockImplementation(
                () => 'http://tshost',
            );
        });

        test('when app is PinboardEmbed after navigateToPage function call, new path should be set to iframe', async () => {
            const path = 'pinboard/e0836cad-4fdf-42d4-bd97-567a6b2a6058';
            const pinboardEmbed = new PinboardEmbed(getRootEl(), {
                pinboardId: '123',
            });
            await pinboardEmbed.render();
            pinboardEmbed.navigateToPage(
                'pinboard/e0836cad-4fdf-42d4-bd97-567a6b2a6058',
            );
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&${defaultParamsForPinboardEmbed}#/embed/${path}`,
            );
        });

        test('when app is SearchEmbed after navigateToPage function call, new path should be set to iframe', async () => {
            const path = 'saved-answer/204204be-7bcb-4099-b6af-93840f8c1a0c';
            const searchEmbed = new SearchEmbed(getRootEl(), {
                ...defaultViewConfig,
            });
            await searchEmbed.render();
            searchEmbed.navigateToPage(
                'saved-answer/204204be-7bcb-4099-b6af-93840f8c1a0c',
            );
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/v2/?${defaultParamsForSearchEmbed}#/embed/${path}`,
            );
        });

        test('when app is AppEmbed after navigateToPage function call, new path should be set to iframe', async () => {
            const path = 'pinboard/e0836cad-4fdf-42d4-bd97-567a6b2a6058';
            const pinboardEmbed = new AppEmbed(getRootEl(), {
                frameParams: {
                    width: '100%',
                    height: '100%',
                },
            });
            await pinboardEmbed.render();
            pinboardEmbed.navigateToPage(
                'pinboard/e0836cad-4fdf-42d4-bd97-567a6b2a6058',
            );
            expect(getIFrameSrc()).toBe(
                `http://${thoughtSpotHost}/?embedApp=true&primaryNavHidden=true&profileAndHelpInNavBarHidden=false&${defaultParamsForPinboardEmbed}#/${path}`,
            );
        });
    });
});

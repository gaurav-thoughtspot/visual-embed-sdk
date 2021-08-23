/* eslint-disable dot-notation */
import { AuthType, init, SearchEmbed, EmbedEvent } from '../index';
import {
    executeAfterWait,
    getAllIframeEl,
    getDocumentBody,
    getRootEl,
} from '../test/test-utils';
import * as config from '../config';
import * as baseInstance from './base';
import * as mixpanelInstance from '../mixpanel-service';

describe('Base TS Embed', () => {
    describe('when thoguthspotHost defined', () => {
        const thoughtSpotHost = 'tshost';

        beforeAll(() => {
            init({
                thoughtSpotHost,
                authType: AuthType.None,
            });
        });

        beforeEach(() => {
            document.body.innerHTML = getDocumentBody();
        });

        test('should clear previous content from the container node when rendering iframe', async () => {
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            tsEmbed.render();

            const tsEmbed2 = new SearchEmbed(getRootEl(), {});
            tsEmbed2.render();

            await executeAfterWait(() => {
                expect(getAllIframeEl().length).toBe(1);
            });
        });

        test('Should show an alert when third party cookie access is blocked', (done) => {
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            const iFrame: any = document.createElement('div');
            iFrame.contentWindow = null;
            tsEmbed.test_setIframe(iFrame);
            tsEmbed.render();

            window.postMessage(
                {
                    __type: EmbedEvent.NoCookieAccess,
                },
                '*',
            );
            jest.spyOn(window, 'alert').mockImplementation(() => {
                done();
            });
        });

        test('should called authPromise with success', (done) => {
            const mockMixPanelEvent = jest.spyOn(
                mixpanelInstance,
                'uploadMixpanelEvent',
            );
            jest.spyOn(window, 'addEventListener').mockImplementationOnce(
                (event, handler, options) => {
                    const gen = handler({
                        data: {
                            type: 'xyz',
                        },
                        ports: [3000],
                        source: null,
                    });
                },
            );
            Object.defineProperty(baseInstance, 'authPromise', {
                value: Promise.resolve(),
            });
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            const iFrame: any = document.createElement('div');
            iFrame.contentWindow = null;
            tsEmbed.test_setIframe(iFrame);

            jest.spyOn(iFrame, 'addEventListener').mockImplementationOnce(
                (event, handler, options) => {
                    handler({});
                },
            );

            tsEmbed.render();

            done();
            expect(iFrame.innerHTML).toBe('');
            expect(mockMixPanelEvent).toBeCalled();
        });

        test('when authPromise throw error', async (done) => {
            const mockMixPanelEvent = jest.spyOn(
                mixpanelInstance,
                'uploadMixpanelEvent',
            );
            Object.defineProperty(baseInstance, 'authPromise', {
                value: Promise.reject(),
            });
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            const iFrame: any = document.createElement('div');
            iFrame.contentWindow = null;
            tsEmbed.test_setIframe(iFrame);
            tsEmbed.render();
            done();
            expect(mockMixPanelEvent).toBeCalled();
            expect(tsEmbed['isError']).toBe(true);
        });
    });

    describe('when thoguthspotHost is empty', () => {
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

        test('throw error', async () => {
            const tsEmbed = new SearchEmbed(getRootEl(), {});
            tsEmbed.render();
            expect(tsEmbed['isError']).toBe(true);
        });
    });
});
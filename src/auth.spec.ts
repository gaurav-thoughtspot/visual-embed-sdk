import {
    EndPoints,
    getSessionInfo,
    doTokenAuth,
    loggedInStatus,
    doBasicAuth,
    doSamlAuth,
    authenticate,
    isAuthenticated,
    SSO_REDIRECTION_MARKER_GUID,
} from './auth';
import { AuthType } from './types';

describe('auth', () => {
    const originalWindow = window;
    const host = 'http://localhost:3000';
    const mockSessionInfo = {
        sessionId: '6588e7d9-710c-453e-a7b4-535fb3a8cbb2',
        genNo: 3,
        acSession: {
            sessionId: 'cb202c48-b14b-4466-8a70-899ea666d46q',
            genNo: 5,
        },
    };

    test('endpoints, SSO_LOGIN_TEMPLATE', () => {
        const targetUrl = 'http://localhost:3000';
        const ssoTemplateUrl = EndPoints.SSO_LOGIN_TEMPLATE(targetUrl);
        expect(ssoTemplateUrl).toBe(
            '/callosum/v1/saml/login?targetURLPath=http://localhost:3000',
        );
    });

    test('when session info giving response', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({ json: () => mockSessionInfo, status: 200 }),
        );
        expect(await getSessionInfo(host)).toStrictEqual(mockSessionInfo);
        global.fetch = window.fetch;
    });

    test('when session info giving error', async () => {
        global.fetch = jest.fn(() => Promise.reject());
        expect(await getSessionInfo(host)).toStrictEqual(mockSessionInfo);
        global.fetch = window.fetch;
    });

    test('doTokenAuth: when authEndpoint and getAuthToken are not there, it throw error', async () => {
        const embedConfig: any = {
            thoughtSpotHost: host,
            username: 'slgauravsharma',
            authEndpoint: '',
            getAuthToken: null,
        };
        try {
            await doTokenAuth(embedConfig);
        } catch (e) {
            expect(e.message).toBe(
                'Either auth endpoint or getAuthToken function must be provided',
            );
        }
    });

    test('doTokenAuth: when user is loggedIn', async () => {
        global.fetch = jest.fn(async (param) => {
            if (param === 'http://localhost:3000/callosum/v1/session/info') {
                return Promise.resolve({ status: 200, json: () => true });
            }
            return Promise.reject();
        });
        const embedConfig: any = {
            thoughtSpotHost: host,
            username: 'slgauravsharma',
            authEndpoint: 'auth',
            getAuthToken: jest.fn(() => Promise.resolve('authToken')),
        };
        await doTokenAuth(embedConfig);
        expect(loggedInStatus).toBe(true);
        global.fetch = window.fetch;
    });

    test('doTokenAuth: when user is not loggedIn & getAuthToken have response, isLoggedIn should called', async () => {
        const embedConfig: any = {
            thoughtSpotHost: host,
            username: 'slgauravsharma',
            authEndpoint: 'auth',
            getAuthToken: jest.fn(() => Promise.resolve('authToken')),
        };
        global.fetch = jest.fn(async (param, other) => {
            if (param === 'http://localhost:3000/callosum/v1/session/info') {
                return Promise.reject();
            }
            if (
                param ===
                'http://localhost:3000/callosum/v1/session/login/token?username=slgauravsharma&auth_token=authToken'
            ) {
                return Promise.resolve({ text: () => 'xyz' });
            }
            return Promise.reject();
        });

        await doTokenAuth(embedConfig);
        expect(window.fetch).toBeCalled();
        global.fetch = window.fetch;
    });

    test('doTokenAuth: when user is not loggedIn & getAuthToken not present, isLoggedIn should called', async () => {
        const embedConfig: any = {
            thoughtSpotHost: host,
            username: 'slgauravsharma',
            authEndpoint: 'auth',
            getAuthToken: null,
        };
        global.fetch = jest.fn(async (param, other) => {
            if (param === 'http://localhost:3000/callosum/v1/session/info') {
                return Promise.reject();
            }
            return Promise.resolve({ text: () => 'data' });
        });
        await doTokenAuth(embedConfig);
        expect(window.fetch).toBeCalled();
        global.fetch = window.fetch;
        expect(loggedInStatus).toBe(true);
    });

    describe('doBasicAuth', () => {
        const embedConfig: any = {
            thoughtSpotHost: host,
            username: 'slgauravsharma',
            password: '12345678',
        };

        it('when user is loggedIn', async () => {
            global.fetch = jest.fn(async (param) => {
                if (
                    param === 'http://localhost:3000/callosum/v1/session/info'
                ) {
                    return Promise.resolve({ status: 200, json: () => true });
                }
                return Promise.reject();
            });
            await doBasicAuth(embedConfig);
            expect(window.fetch).toBeCalled();
            expect(loggedInStatus).toBe(true);
            global.fetch = window.fetch;
        });

        it('when user is not loggedIn', async () => {
            global.fetch = jest.fn(async (param) => {
                if (
                    param ===
                    `${embedConfig.thoughtSpotHost}${EndPoints.BASIC_LOGIN}`
                ) {
                    return Promise.resolve({ status: 200 });
                }
                return Promise.reject();
            });
            await doBasicAuth(embedConfig);
            expect(window.fetch).toBeCalled();
            expect(loggedInStatus).toBe(true);
            global.fetch = window.fetch;
        });
    });

    describe('doSamlAuth', () => {
        const embedConfig: any = {
            thoughtSpotHost: host,
        };

        afterEach(() => {
            delete global.window;
            global.window = Object.create(originalWindow);
            global.window.open = jest.fn();
        });

        it('when user is loggedIn & isAtSSORedirectUrl is true', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    href: SSO_REDIRECTION_MARKER_GUID,
                    hash: '',
                },
            });
            global.fetch = jest.fn(async (param, other) => {
                if (
                    param ===
                        'http://localhost:3000/callosum/v1/session/info' &&
                    other.credentials
                ) {
                    return Promise.resolve({
                        status: 200,
                        json: () => 'sessionxyz',
                    });
                }
                return Promise.reject();
            });
            await doSamlAuth(embedConfig);
            expect(window.location.hash).toBe('');
            expect(loggedInStatus).toBe(true);
            global.fetch = window.fetch;
        });

        it('when user is not loggedIn & isAtSSORedirectUrl is true', async () => {
            global.fetch = jest.fn(async (param) => Promise.reject());
            await doSamlAuth(embedConfig);
            expect(window.location.hash).toBe('');
            expect(loggedInStatus).toBe(false);
            global.fetch = window.fetch;
        });

        it('when user is not loggedIn, in config noRedirect is false and isAtSSORedirectUrl is false', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    href: '',
                    hash: '',
                },
            });
            global.fetch = jest.fn(async (param) => Promise.reject());
            await doSamlAuth(embedConfig);
            expect(global.window.location.href).toBe(
                'http://localhost:3000/callosum/v1/saml/login?targetURLPath=%235e16222e-ef02-43e9-9fbd-24226bf3ce5b',
            );
            global.fetch = window.fetch;
        });

        // it.skip('when user is not loggedIn, in config noRedirect is true and isAtSSORedirectUrl is false', async () => {
        //     expect(
        //         await doSamlAuth({
        //             ...embedConfig,
        //             noRedirect: true,
        //         }),
        //     ).toBe(undefined);
        // });
    });

    it('authenticate: when authType is SSO', async () => {
        global.fetch = jest.fn(async (param) => {
            if (param === 'auth') {
                return Promise.resolve(true);
            }
            return Promise.reject();
        });
        const embedConfig: any = {
            authType: AuthType.SSO,
        };
        await authenticate(embedConfig);
        expect(window.location.hash).toBe('');
        global.fetch = window.fetch;
    });

    it('authenticate: when authType is AuthServer', async () => {
        const embedConfig: any = {
            thoughtSpotHost: host,
            username: 'slgauravsharma',
            authEndpoint: '',
            getAuthToken: null,
            authType: AuthType.AuthServer,
        };
        try {
            await authenticate(embedConfig);
        } catch (e) {
            expect(e.message).toBe(
                'Either auth endpoint or getAuthToken function must be provided',
            );
        }
    });

    it('authenticate: when authType is Basic', async () => {
        const embedConfig: any = {
            thoughtSpotHost: host,
            username: 'slgauravsharma',
            password: '12345678',
            authType: AuthType.Basic,
        };
        global.fetch = jest.fn(async (param) => {
            if (param === 'http://localhost:3000/callosum/v1/session/info') {
                return Promise.resolve({ status: 200, json: () => true });
            }
            return Promise.reject();
        });
        await authenticate(embedConfig);
        expect(window.fetch).toBeCalled();
        expect(loggedInStatus).toBe(true);
        global.fetch = window.fetch;
    });

    it('authenticate: when authType is None', async () => {
        const embedConfig: any = {
            thoughtSpotHost: host,
            username: 'slgauravsharma',
            password: '12345678',
            authType: AuthType.None,
        };
        expect(await authenticate(embedConfig)).not.toBeInstanceOf(Error);
    });

    it('user is authenticated when loggedInStatus is true', () => {
        expect(isAuthenticated()).toBe(loggedInStatus);
    });
});

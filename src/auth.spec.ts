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

const thoughtSpotHost = 'http://localhost:3000';
const sessionInfoUrl = `${thoughtSpotHost}/callosum/v1/session/info`;
const authTokenUrl = `${thoughtSpotHost}/callosum/v1/session/login/token?username=tsuser&auth_token=authToken`;
const samalLoginUrl = `${thoughtSpotHost}/callosum/v1/saml/login?targetURLPath=%235e16222e-ef02-43e9-9fbd-24226bf3ce5b`;

const embedConfig: any = {
    doTokenAuthSuccess: {
        thoughtSpotHost,
        username: 'tsuser',
        authEndpoint: 'auth',
        getAuthToken: jest.fn(() => Promise.resolve('authToken')),
    },
    doTokenAuthFailureWithoutAuthEndPoint: {
        thoughtSpotHost,
        username: 'tsuser',
        authEndpoint: '',
        getAuthToken: null,
    },
    doTokenAuthFailureWithoutGetAuthToken: {
        thoughtSpotHost,
        username: 'tsuser',
        authEndpoint: 'auth',
        getAuthToken: null,
    },
    doBasicAuth: {
        thoughtSpotHost,
        username: 'tsuser',
        password: '12345678',
    },
    doSamlAuth: {
        thoughtSpotHost,
    },
    SSOAuth: {
        authType: AuthType.SSO,
    },
    authServerFailure: {
        thoughtSpotHost,
        username: 'tsuser',
        authEndpoint: '',
        getAuthToken: null,
        authType: AuthType.AuthServer,
    },
    basicAuthSuccess: {
        thoughtSpotHost,
        username: 'tsuser',
        password: '12345678',
        authType: AuthType.Basic,
    },
    nonAuthSucess: {
        thoughtSpotHost,
        username: 'tsuser',
        password: '12345678',
        authType: AuthType.None,
    },
};

describe('Unit test for auth', () => {
    const originalWindow = window;
    const mockSessionInfo = {
        sessionId: '6588e7d9-710c-453e-a7b4-535fb3a8cbb2',
        genNo: 3,
        acSession: {
            sessionId: 'cb202c48-b14b-4466-8a70-899ea666d46q',
            genNo: 5,
        },
    };

    beforeEach(() => {
        global.fetch = window.fetch;
    });

    test('endpoints, SSO_LOGIN_TEMPLATE', () => {
        const ssoTemplateUrl = EndPoints.SSO_LOGIN_TEMPLATE(thoughtSpotHost);
        expect(ssoTemplateUrl).toBe(
            `/callosum/v1/saml/login?targetURLPath=${thoughtSpotHost}`,
        );
    });

    test('when session info giving response', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({ json: () => mockSessionInfo, status: 200 }),
        );
        expect(await getSessionInfo(thoughtSpotHost)).toStrictEqual(
            mockSessionInfo,
        );
    });

    test('when session info giving error', async () => {
        global.fetch = jest.fn(() => Promise.reject());
        expect(await getSessionInfo(thoughtSpotHost)).toStrictEqual(
            mockSessionInfo,
        );
    });

    test('doTokenAuth: when authEndpoint and getAuthToken are not there, it throw error', async () => {
        try {
            await doTokenAuth(
                embedConfig.doTokenAuthFailureWithoutAuthEndPoint,
            );
        } catch (e) {
            expect(e.message).toBe(
                'Either auth endpoint or getAuthToken function must be provided',
            );
        }
    });

    test('doTokenAuth: when user is loggedIn', async () => {
        global.fetch = jest.fn(async (param) => {
            if (param === sessionInfoUrl) {
                return Promise.resolve({ status: 200, json: () => true });
            }
            return Promise.reject();
        });
        await doTokenAuth(embedConfig.doTokenAuthSuccess);
        expect(loggedInStatus).toBe(true);
    });

    test('doTokenAuth: when user is not loggedIn & getAuthToken have response, isLoggedIn should called', async () => {
        global.fetch = jest.fn(async (param, other) => {
            if (param === sessionInfoUrl) {
                return Promise.reject();
            }
            if (param === authTokenUrl) {
                return Promise.resolve({ text: () => 'xyz' });
            }
            return Promise.reject();
        });

        await doTokenAuth(embedConfig.doTokenAuthSuccess);
        expect(window.fetch).toBeCalled();
    });

    test('doTokenAuth: when user is not loggedIn & getAuthToken not present, isLoggedIn should called', async () => {
        global.fetch = jest.fn(async (param, other) => {
            if (param === sessionInfoUrl) {
                return Promise.reject();
            }
            return Promise.resolve({ text: () => 'data' });
        });
        await doTokenAuth(embedConfig.doTokenAuthFailureWithoutGetAuthToken);
        expect(window.fetch).toBeCalled();

        expect(loggedInStatus).toBe(true);
    });

    describe('doBasicAuth', () => {
        beforeEach(() => {
            global.fetch = window.fetch;
        });

        it('when user is loggedIn', async () => {
            global.fetch = jest.fn(async (param) => {
                if (param === sessionInfoUrl) {
                    return Promise.resolve({ status: 200, json: () => true });
                }
                return Promise.reject();
            });
            await doBasicAuth(embedConfig.doBasicAuth);
            expect(window.fetch).toBeCalled();
            expect(loggedInStatus).toBe(true);
        });

        it('when user is not loggedIn', async () => {
            global.fetch = jest.fn(async (param) => {
                if (param === `${thoughtSpotHost}${EndPoints.BASIC_LOGIN}`) {
                    return Promise.resolve({ status: 200 });
                }
                return Promise.reject();
            });
            await doBasicAuth(embedConfig.doBasicAuth);
            expect(window.fetch).toBeCalled();
            expect(loggedInStatus).toBe(true);
        });
    });

    describe('doSamlAuth', () => {
        afterEach(() => {
            delete global.window;
            global.window = Object.create(originalWindow);
            global.window.open = jest.fn();
            global.fetch = window.fetch;
        });

        it('when user is loggedIn & isAtSSORedirectUrl is true', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    href: SSO_REDIRECTION_MARKER_GUID,
                    hash: '',
                },
            });
            global.fetch = jest.fn(async (param, other) => {
                if (param === sessionInfoUrl && other.credentials) {
                    return Promise.resolve({
                        status: 200,
                        json: () => 'sessionxyz',
                    });
                }
                return Promise.reject();
            });
            await doSamlAuth(embedConfig.doSamlAuth);
            expect(window.location.hash).toBe('');
            expect(loggedInStatus).toBe(true);
        });

        it('when user is not loggedIn & isAtSSORedirectUrl is true', async () => {
            global.fetch = jest.fn(async (param) => Promise.reject());
            await doSamlAuth(embedConfig.doSamlAuth);
            expect(window.location.hash).toBe('');
            expect(loggedInStatus).toBe(false);
        });

        it('when user is not loggedIn, in config noRedirect is false and isAtSSORedirectUrl is false', async () => {
            Object.defineProperty(window, 'location', {
                value: {
                    href: '',
                    hash: '',
                },
            });
            global.fetch = jest.fn(async (param) => Promise.reject());
            await doSamlAuth(embedConfig.doSamlAuth);
            expect(global.window.location.href).toBe(samalLoginUrl);
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
        await authenticate(embedConfig.SSOAuth);
        expect(window.location.hash).toBe('');
    });

    it('authenticate: when authType is AuthServer', async () => {
        try {
            await authenticate(embedConfig.authServerFailure);
        } catch (e) {
            expect(e.message).toBe(
                'Either auth endpoint or getAuthToken function must be provided',
            );
        }
    });

    it('authenticate: when authType is Basic', async () => {
        global.fetch = jest.fn(async (param) => {
            if (param === sessionInfoUrl) {
                return Promise.resolve({ status: 200, json: () => true });
            }
            return Promise.reject();
        });
        await authenticate(embedConfig.basicAuthSuccess);
        expect(window.fetch).toBeCalled();
        expect(loggedInStatus).toBe(true);
    });

    it('authenticate: when authType is None', async () => {
        expect(
            await authenticate(embedConfig.nonAuthSucess),
        ).not.toBeInstanceOf(Error);
    });

    it('user is authenticated when loggedInStatus is true', () => {
        expect(isAuthenticated()).toBe(loggedInStatus);
    });
});

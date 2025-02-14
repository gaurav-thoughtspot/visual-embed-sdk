import React from 'react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { getIFrameEl, getIFrameSrc } from '../test/test-utils';
import { SearchEmbed, AppEmbed, PinboardEmbed } from './index';
import { AuthType, init } from '../index';

const thoughtSpotHost = 'localhost';

beforeAll(() => {
    init({
        thoughtSpotHost,
        authType: AuthType.None,
    });
});

describe('React Components', () => {
    describe('SearchEmbed', () => {
        it('Should Render the Iframe with props', async () => {
            const { container } = render(
                <SearchEmbed hideDataSources={true} />,
            );

            await waitFor(() => getIFrameEl(container));

            expect(getIFrameSrc(container)).toBe(
                `http://${thoughtSpotHost}/?dataSourceMode=hide&useLastSelectedSources=false#/embed/answer`,
            );
        });

        it('Should attach event listeners', async (done) => {
            const { container } = render(
                <SearchEmbed
                    onInit={(e) => {
                        expect(e.data).toHaveProperty('timestamp');
                    }}
                    onAuthInit={(e) => {
                        expect(e.data).toHaveProperty('isLoggedIn');
                        done();
                    }}
                />,
            );

            await waitFor(() => getIFrameEl(container));
            const iframe = getIFrameEl(container);
        });
    });

    describe('AppEmbed', () => {
        //
    });

    describe('PinboardEmbed', () => {
        //
    });
});

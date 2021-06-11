import FetchAnswers from './fetchAnswers';

describe('FetchAnswers', () => {
    const session = {
        sessionId: '',
        genNo: 2,
        acSession: { sessionId: '', genNo: 1 },
    };
    const query = '';
    const thoughtSpotHost = 'http://10.79.135.124:3000'
    
    it('should return answer data', async () => {
        const mockAnswerResponse = { data: {} };
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => mockAnswerResponse,
            }),
        );
        const getAnswer = FetchAnswers(
            session,
            query,
            'GetTableWithHeadlineData',
            thoughtSpotHost,
        );
        const answerData = await getAnswer(1, 500);
        expect(answerData).toStrictEqual(mockAnswerResponse.data)
        expect(answerData).not.toBeInstanceOf(Error);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should return error', async () => {
        global.fetch = jest.fn(() => Promise.reject(new Error('failure')));
        const getAnswer = FetchAnswers(
             session,
             query,
            'GetChartWithData',
            thoughtSpotHost,
        );
        const answerData = await getAnswer(1, 500);
        expect(answerData).toBeInstanceOf(Error);
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});

import { SessionInterface, OperationType } from '../types';

function FetchAnswers(
    session: SessionInterface,
    query: string,
    operation: string,
    thoughtSpotHost: string,
): any {
    let variable: any;

    const fetchQuery = async (variables: any) => {
        try {
            const response = await fetch(
                `${thoughtSpotHost}/prism/?op=${operation}`,
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json;charset=UTF-8',
                        'x-requested-by': 'ThoughtSpot',
                        accept: '*/*',
                        'accept-language': 'en-us',
                    },
                    body: JSON.stringify({
                        operationName: operation,
                        query,
                        variables,
                    }),
                    credentials: 'include'
                },
            );
            const result = await response.json();
            return result.data;
        } catch (error) {
            return error;
        }
    };

    const getAnswer = (offset: number, batchSize: number) => {
        if (operation === OperationType.GetChartWithData) {
            variable = { batchSize, offset };
        } else {
            variable = {
                dataPaginationParams: {
                    isClientPaginated: true,
                    offset,
                    size: batchSize,
                },
            };
        }
        return fetchQuery({
            session,
            ...variable,
        });
    };

    return getAnswer;
}

export default FetchAnswers;

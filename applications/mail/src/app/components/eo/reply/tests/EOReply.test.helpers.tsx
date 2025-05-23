import type { RenderResult } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';

import { EORender } from '../../../../helpers/test/eo/EORender';
import type { EOOriginalMessageOptions } from '../../../../helpers/test/eo/helpers';
import { addApiMock, waitForNoNotification, waitForNotification } from '../../../../helpers/test/helper';
import EOReply from '../EOReply';

export const setup = async (options?: EOOriginalMessageOptions) => {
    const renderResult = await EORender(<EOReply setSessionStorage={jest.fn()} />, {
        routePath: '/eo/reply/:id',
        options,
        initialRoute: 'reply',
    });

    return renderResult;
};

export const clickSend = async (renderResult: RenderResult) => {
    const sendSpy = jest.fn(() => Promise.resolve({ Reply: {} }));
    addApiMock(`mail/v4/eo/reply`, sendSpy, 'post');

    const sendButton = await renderResult.findByTestId('send-eo');
    fireEvent.click(sendButton);

    await waitForNotification('Message sent');

    const sendRequest = (sendSpy.mock.calls[0] as any[])[0];

    expect(sendRequest.method).toBe('post');

    await waitForNoNotification();

    return sendRequest;
};

export const send = async () => {
    try {
        const renderResult = await setup();

        // Write a test "T" in the message body
        fireEvent.keyDown(renderResult.container, { key: 'T' });

        return { sendRequest: await clickSend(renderResult), renderResult };
    } catch (error: any) {
        throw error;
    }
};

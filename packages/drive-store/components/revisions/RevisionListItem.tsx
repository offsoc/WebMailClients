import { useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, TimeIntl } from '@proton/components';
import type { Revision } from '@proton/drive';

import { useContextMenuControls } from '../FileBrowser';
import { RevisionsItemContextMenu } from './RevisionsItemContextMenu';

import './RevisionListItem.scss';

const RevisionListItem = ({
    revision,
    formatType = 'date',
    isCurrent = false,
}: {
    revision: Revision;
    formatType?: 'date' | 'time';
    isCurrent?: boolean;
}) => {
    const contextMenuControls = useContextMenuControls();
    const ref = useRef<HTMLButtonElement>(null);
    const options: Intl.DateTimeFormatOptions =
        formatType === 'date'
            ? {
                  month: 'short',
                  day: 'numeric',
              }
            : {
                  hour: 'numeric',
                  minute: 'numeric',
              };
    return (
        <>
            <RevisionsItemContextMenu
                anchorRef={ref}
                isOpen={contextMenuControls.isOpen}
                position={contextMenuControls.position}
                open={contextMenuControls.open}
                close={contextMenuControls.close}
                revision={revision}
                isCurrent={isCurrent}
            />
            <li className="revision-list-item mb-4">
                <TimeIntl className="flex-1" options={options}>
                    {revision.creationTime}
                </TimeIntl>
                <p className="text-ellipsis text-center m-0">
                    {(revision.contentAuthor.ok
                        ? revision.contentAuthor.value
                        : revision.contentAuthor.error.claimedAuthor) || c('Info').t`Anonymous`}
                </p>
                <Button
                    className="ml-auto"
                    ref={ref}
                    shape="ghost"
                    size="small"
                    icon
                    onClick={(e) => {
                        contextMenuControls.handleContextMenu(e);
                    }}
                    onTouchEnd={(e) => {
                        contextMenuControls.handleContextMenuTouch(e);
                    }}
                >
                    <Icon name="three-dots-vertical" alt={c('Action').t`More options`} />
                </Button>
            </li>
        </>
    );
};

export default RevisionListItem;

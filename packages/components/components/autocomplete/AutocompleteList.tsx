import type { MouseEvent, ReactElement, RefObject } from 'react';
import { Children, cloneElement } from 'react';

import { c, msgid } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { verticalPopperPlacements } from '@proton/components/components/popper/utils';

import type { OptionProps } from '../option/Option';

interface Props<V> {
    id: string;
    children: ReactElement<OptionProps<V>>[];
    onClose: () => void;
    isOpen: boolean;
    highlightedIndex: number;
    anchorRef: RefObject<HTMLElement>;
    /**
     * In case we want to filter the number of items in the list for accessibility purposes
     */
    searchResultsCount?: number;
}

const AutocompleteList = <V,>({
    id,
    children,
    onClose,
    isOpen,
    highlightedIndex,
    anchorRef,
    searchResultsCount,
}: Props<V>) => {
    const items = Children.map(children, (child, index) => {
        return cloneElement(child, {
            active: highlightedIndex === index,
        });
    });

    const handleListMouseDown = (e: MouseEvent<HTMLUListElement>) => {
        /*
         * prevent blurs on the input field triggered by a mousedown
         * since otherwise you can't select an option from the list
         * before blur is triggered
         */
        e.preventDefault();
    };

    const itemsCount = searchResultsCount || items.length;

    return (
        <>
            <span className="sr-only" id={`${id}-autocomplete-suggest-text`}>
                {c('Hint')
                    .t`Use Up and Down keys to access and browse suggestions after input. Press Enter to confirm your choice, or Escape to close the suggestions box.`}
            </span>

            <div className="sr-only" aria-atomic="true" aria-live="assertive">
                {c('Hint').ngettext(
                    msgid`Found ${itemsCount} suggestion, use keyboard to navigate.`,
                    `Found ${itemsCount} suggestions, use keyboard to navigate.`,
                    itemsCount
                )}
            </div>

            <Dropdown
                autoClose={false}
                autoCloseOutside={false}
                isOpen={items.length > 0 && isOpen}
                anchorRef={anchorRef}
                onClose={onClose}
                offset={4}
                noCaret
                availablePlacements={verticalPopperPlacements}
                size={{
                    width: DropdownSizeUnit.Anchor,
                    height: DropdownSizeUnit.Dynamic,
                    maxWidth: DropdownSizeUnit.Viewport,
                }}
                disableFocusTrap
                disableDefaultArrowNavigation
            >
                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                <ul id={id} className="unstyled m-0 p-0" onMouseDown={handleListMouseDown}>
                    {items}
                </ul>
            </Dropdown>
        </>
    );
};

export default AutocompleteList;

import { type ReactNode, useEffect, useLayoutEffect, useRef } from 'react';

import useFocusTrap from '@proton/components/components/focus/useFocusTrap';
import { dialogRootClassName } from '@proton/shared/lib/busy';
import clsx from '@proton/utils/clsx';

import { useHotkeys } from '../../hooks/useHotkeys';
import { useModalPosition } from '../modalTwo/modalPositions';
import Portal from '../portal/Portal';

const CLASSES = {
    MODAL: 'modal',
    MODAL_IN: 'modal--in',
    MODAL_OUT: 'modal--out',
    MODAL_INTERMEDIATE: 'modal--intermediate',
    MODAL_SMALL: 'modal--smaller',
    MODAL_TINY: 'modal--tiny',
};

const ANIMATIONS = {
    MODAL_IN: 'anime-modal-in',
    MODAL_OUT: 'anime-modal-out',
};

export type Props = {
    onClose?: () => void;
    onEnter?: () => void;
    onExit?: () => void;
    intermediate?: boolean;
    small?: boolean;
    tiny?: boolean;
    isClosing?: boolean;
    modalTitleID?: string;
    children: ReactNode;
    className?: string;
    disableCloseOnOnEscape?: boolean;
    open?: any;
};

/**
 * @deprecated Please use ModalTwo instead
 * @type any
 */
const Dialog = ({
    onClose,
    onEnter,
    onExit,
    intermediate: isIntermediate = false,
    small: isSmall = false,
    tiny: isTiny = false,
    isClosing = false,
    modalTitleID,
    children,
    className: extraClassNames = '',
    disableCloseOnOnEscape,
    open, // To prevent it being passed in rest
    ...rest
}: Props) => {
    const rootRef = useRef(null);
    const hasCalledExit = useRef(false);
    const hasCalledClose = useRef(false);
    const focusTrapProps = useFocusTrap({ rootRef });
    const last = useModalPosition(true);

    useLayoutEffect(() => {
        hasCalledClose.current = isClosing;
    }, [isClosing]);

    useEffect(() => {
        return () => {
            // Safety measure to make sure cleanup functions always get called, even if the component gets forcefully removed
            if (!hasCalledClose.current) {
                onClose?.();
            }
            if (!hasCalledExit.current) {
                onExit?.();
            }
        };
    }, []);

    useHotkeys(rootRef, [
        [
            'Escape',
            (e) => {
                if (!disableCloseOnOnEscape) {
                    e.stopPropagation();
                    onClose?.();
                }
            },
        ],
    ]);

    return (
        <Portal>
            <div className={clsx([dialogRootClassName, !last && 'is-behind-backdrop'])}>
                <dialog
                    aria-labelledby={modalTitleID}
                    aria-modal="true"
                    open
                    className={clsx([
                        CLASSES.MODAL,
                        isSmall && CLASSES.MODAL_SMALL,
                        isTiny && CLASSES.MODAL_TINY,
                        isIntermediate && CLASSES.MODAL_INTERMEDIATE,
                        (isSmall || isTiny || isIntermediate) && 'modal--shorter-labels',
                        isClosing && CLASSES.MODAL_OUT,
                        extraClassNames,
                        'outline-none',
                    ])}
                    onAnimationEnd={({ animationName }) => {
                        if (animationName === ANIMATIONS.MODAL_OUT && isClosing) {
                            hasCalledExit.current = true;
                            onExit?.();
                        }
                        if (animationName === ANIMATIONS.MODAL_IN && !isClosing) {
                            onEnter?.();
                        }
                    }}
                    {...rest}
                    ref={rootRef}
                    {...focusTrapProps}
                >
                    {children}
                </dialog>
            </div>
        </Portal>
    );
};

export default Dialog;

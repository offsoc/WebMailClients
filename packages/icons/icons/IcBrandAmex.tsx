/*
 * This file is auto-generated. Do not modify it manually!
 * Run 'yarn workspace @proton/icons build' to update the icons react components.
 */
import React from 'react';

import type { IconSize } from '../types';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
    /** If specified, renders an inline title element */
    title?: string;
    /**
     * The size of the icon
     * Refer to the sizing taxonomy: https://design-system.protontech.ch/?path=/docs/components-icon--basic#sizing
     */
    size?: IconSize;
}

export const IcBrandAmex = ({ alt, title, size = 4, className = '', viewBox = '0 0 16 16', ...rest }: IconProps) => {
    return (
        <>
            <svg
                viewBox={viewBox}
                className={`icon-size-${size} ${className}`}
                role="img"
                focusable="false"
                aria-hidden="true"
                {...rest}
            >
                {title ? <title>{title}</title> : null}

                <path
                    fillRule="evenodd"
                    d="M13 4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1ZM3 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H3Z"
                ></path>
                <path d="m4.275 7.425.283.687h-.566l.283-.687Zm5.895.03H9.08v.304h1.072v.456H9.079v.338h1.091v.271l.76-.822-.76-.86v.312Zm-5.157-.86H6.48l.327.709.301-.713h3.801l.397.437.408-.437h1.744l-1.289 1.414 1.278 1.403h-1.774l-.396-.437-.412.437h-6.2l-.18-.437H4.07l-.18.437H2.457l1.205-2.817h1.256l.095.004Zm3.177.397h-.822l-.551 1.296-.595-1.296h-.816v1.763L4.65 6.992h-.731l-.874 2.02h.57l.18-.437h.958l.18.437h.999V7.568l.642 1.444h.437l.64-1.44v1.44h.536l.003-2.02Zm3.424 1.013.929-1.013h-.669l-.587.631-.57-.631h-2.16v2.023h2.13l.592-.639.57.64h.686l-.921-1.01Z"></path>
            </svg>
            {alt ? <span className="sr-only">{alt}</span> : null}
        </>
    );
};

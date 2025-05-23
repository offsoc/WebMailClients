import { useState } from 'react';

import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import generateUID from '@proton/utils/generateUID';

import LogoBase, { type LogoProps } from './LogoBase';

const VpnLogo = ({ variant = 'with-wordmark', hasTitle = true, ...rest }: LogoProps) => {
    const [uid] = useState(generateUID('logo'));

    let logoWidth: number;
    const logoHeight = 36;

    switch (variant) {
        case 'glyph-only':
            logoWidth = 36;
            break;
        case 'wordmark-only':
            logoWidth = 233;
            break;
        default:
            logoWidth = 138;
            break;
    }

    return (
        <LogoBase
            uid={uid}
            logoWidth={logoWidth}
            logoHeight={logoHeight}
            title={hasTitle ? VPN_APP_NAME : undefined}
            variant={variant}
            {...rest}
        >
            {variant === 'glyph-only' && (
                <>
                    <path
                        fill={`url(#${uid}-a)`}
                        fillRule="evenodd"
                        d="M15.247 29.149c1.064 1.913 3.797 2.017 5.005.19l11.265-17.035c1.195-1.806.052-4.228-2.111-4.475L7.263 5.31c-2.36-.269-4.041 2.22-2.893 4.285l.09.16 9.88 6.77-.12 10.77 1.027 1.854Z"
                        clipRule="evenodd"
                    />
                    <path
                        fill={`url(#${uid}-b)`}
                        d="m15.881 27.364 1-1.49 7.594-11.472c.664-1.003.03-2.349-1.17-2.487L4.456 9.752l9.764 17.552a.979.979 0 0 0 1.66.06Z"
                    />
                    <defs>
                        <linearGradient
                            id={`${uid}-a`}
                            x1="29.32"
                            x2="11.303"
                            y1="29.148"
                            y2="-1.922"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".066" stopColor="#8EFFEE" />
                            <stop offset=".45" stopColor="#C9C7FF" />
                            <stop offset="1" stopColor="#7341FF" />
                        </linearGradient>
                        <linearGradient
                            id={`${uid}-b`}
                            x1="30.967"
                            x2="5.738"
                            y1="-22.452"
                            y2="31.512"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".48" stopColor="#6D4AFF" />
                            <stop offset=".994" stopColor="#00F0C3" />
                        </linearGradient>
                    </defs>
                </>
            )}

            {variant === 'with-wordmark' && (
                <>
                    <path
                        fill={`url(#${uid}-a)`}
                        fillRule="evenodd"
                        d="M11.247 29.149c1.064 1.913 3.797 2.017 5.005.19l11.265-17.035c1.195-1.806.052-4.228-2.111-4.475L3.263 5.31C.903 5.041-.778 7.53.37 9.595l.09.16 9.88 6.77-.12 10.77 1.027 1.854Z"
                        clipRule="evenodd"
                    />
                    <path
                        fill={`url(#${uid}-b)`}
                        d="m11.881 27.364 1-1.49 7.594-11.472c.664-1.003.03-2.349-1.17-2.486L.456 9.752l9.764 17.552a.979.979 0 0 0 1.66.06Z"
                    />
                    <path
                        fill="var(--logo-text-product-color)"
                        d="M119.842 10.897h-6.572v14.25h2.604V21.6a1.303 1.303 0 0 1 1.301-1.303h2.667a4.682 4.682 0 0 0 4.684-4.689 4.688 4.688 0 0 0-2.887-4.352 4.65 4.65 0 0 0-1.797-.36Zm2.051 4.674a2.218 2.218 0 0 1-1.374 2.053 2.192 2.192 0 0 1-.85.168h-3.807v-4.44h3.807a2.222 2.222 0 0 1 2.219 2.233l.005-.014Zm-17.766 9.524-5.245-14.239h2.962l3.451 10.19c.136.366.235.742.292 1.127h.029c.044-.388.142-.767.293-1.126l3.462-10.19h2.982l-5.27 14.238h-2.956Zm21.373 0V10.853h2.283l6.716 8.832c.243.304.452.632.628.98h.041a11.14 11.14 0 0 1-.064-1.292v-8.52h2.69v14.239h-2.282l-6.737-8.832a6.517 6.517 0 0 1-.625-.98h-.023c.038.43.052.86.043 1.292v8.52h-2.67v.003Z"
                    />
                    <path
                        fill="var(--logo-text-proton-color)"
                        d="M38 21.26v3.664h2.56V21.42a1.282 1.282 0 0 1 1.279-1.286h2.624a4.592 4.592 0 0 0 3.261-1.361 4.652 4.652 0 0 0 1.351-3.28c0-1.228-.486-2.41-1.35-3.281a4.603 4.603 0 0 0-3.265-1.358H38v4.58h2.56v-2.159h3.73c.58 0 1.134.232 1.544.644a2.2 2.2 0 0 1 0 3.104c-.41.412-.964.644-1.544.644h-2.71a3.551 3.551 0 0 0-2.528 1.055 3.65 3.65 0 0 0-.776 1.166A3.54 3.54 0 0 0 38 21.259Zm11.47 3.664v-5.583c0-2.279 1.322-4.091 3.97-4.091a5.09 5.09 0 0 1 1.262.14v2.296c-.301-.02-.56-.02-.682-.02-1.402 0-2.005.646-2.005 1.955v5.303H49.47Zm5.994-4.734c0-2.802 2.104-4.937 5.033-4.937 2.929 0 5.033 2.135 5.033 4.937 0 2.802-2.104 4.957-5.033 4.957-2.929 0-5.033-2.158-5.033-4.957Zm7.558 0c0-1.592-1.064-2.722-2.525-2.722-1.465 0-2.525 1.127-2.525 2.722 0 1.612 1.063 2.722 2.525 2.722 1.464 0 2.525-1.113 2.525-2.722Zm10.646 0c0-2.802 2.104-4.937 5.032-4.937 2.926 0 5.03 2.135 5.03 4.937 0 2.802-2.104 4.957-5.03 4.957-2.928 0-5.032-2.158-5.032-4.957Zm7.554 0c0-1.592-1.063-2.722-2.524-2.722-1.462 0-2.525 1.127-2.525 2.722 0 1.612 1.063 2.722 2.525 2.722 1.461 0 2.525-1.113 2.525-2.722Zm3.831 4.734v-5.38c0-2.499 1.583-4.294 4.41-4.294 2.806 0 4.39 1.792 4.39 4.294v5.38h-2.525v-5.18c0-1.39-.623-2.259-1.865-2.259-1.243 0-1.865.867-1.865 2.259v5.18h-2.545Zm-12.147-7.436h-2.747v3.528c0 1.23.44 1.793 1.703 1.793.12 0 .42 0 .802-.02v2.075c-.52.14-.981.223-1.484.223-2.124 0-3.569-1.29-3.569-3.728v-3.87h-1.706v-2.036h.427a1.3 1.3 0 0 0 .489-.097 1.285 1.285 0 0 0 .694-.698 1.28 1.28 0 0 0 .096-.492v-1.918h2.545v3.205h2.747v2.035h.003Z"
                    />
                    <defs>
                        <linearGradient
                            id={`${uid}-a`}
                            x1="25.32"
                            x2="7.303"
                            y1="29.148"
                            y2="-1.922"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".066" stopColor="#8EFFEE" />
                            <stop offset=".45" stopColor="#C9C7FF" />
                            <stop offset="1" stopColor="#7341FF" />
                        </linearGradient>
                        <linearGradient
                            id={`${uid}-b`}
                            x1="26.967"
                            x2="1.738"
                            y1="-22.452"
                            y2="31.512"
                            gradientUnits="userSpaceOnUse"
                        >
                            <stop offset=".48" stopColor="#6D4AFF" />
                            <stop offset=".994" stopColor="#00F0C3" />
                        </linearGradient>
                    </defs>
                </>
            )}

            {variant === 'wordmark-only' && (
                <>
                    <path
                        d="M203.615 34.395V3.19281H208.335L224.096 24.9565C224.676 25.7506 225.074 26.4074 225.287 26.9266L225.379 26.8808C225.287 26.1477 225.242 25.2314 225.242 24.1317V3.19281H230.19V34.395H225.425L209.709 12.6314C209.159 11.8677 208.747 11.2263 208.472 10.707L208.426 10.7528C208.487 11.2415 208.518 12.1426 208.518 13.4561V34.395H203.615Z"
                        fill="var(--logo-text-proton-color)"
                    />
                    <path
                        d="M176.412 34.395V3.19281H188.921C191.762 3.19281 194.129 4.07862 196.023 5.85028C197.947 7.6219 198.909 9.88228 198.909 12.6314C198.909 15.3805 197.947 17.6561 196.023 19.4583C194.129 21.2299 191.762 22.1157 188.921 22.1157H181.315V34.395H176.412ZM181.315 17.5339H188.004C189.929 17.5339 191.395 17.0757 192.403 16.1594C193.411 15.243 193.915 14.067 193.915 12.6314C193.915 11.1957 193.411 10.035 192.403 9.14919C191.426 8.23282 189.99 7.77464 188.096 7.77464H181.315V17.5339Z"
                        fill="var(--logo-text-proton-color)"
                    />
                    <path
                        d="M155.192 34.395L143.371 3.19281H148.869L157.163 26.6976C157.498 27.5223 157.682 28.2096 157.712 28.7594H157.804C157.865 28.2706 158.048 27.5833 158.354 26.6976L166.693 3.19281H172.145L160.37 34.395H155.192Z"
                        fill="var(--logo-text-proton-color)"
                    />
                    <path
                        d="M109.822 21.8867C109.822 19.0765 110.677 16.8008 112.388 15.0598C114.099 13.3187 116.435 12.4481 119.398 12.4481C122.361 12.4481 124.698 13.3187 126.408 15.0598C128.119 16.8008 128.974 19.0765 128.974 21.8867V34.3951H124.163V22.2532C124.163 20.5427 123.751 19.2139 122.926 18.267C122.132 17.2896 120.956 16.8008 119.398 16.8008C117.84 16.8008 116.649 17.2896 115.824 18.267C115.03 19.2139 114.633 20.5427 114.633 22.2532V34.3951H109.822V21.8867Z"
                        fill="var(--logo-text-proton-color)"
                    />
                    <path
                        d="M94.1717 34.8532C90.9645 34.8532 88.2916 33.784 86.1536 31.6459C84.0155 29.5078 82.9463 26.8503 82.9463 23.6736C82.9463 20.4968 84.0155 17.8394 86.1536 15.7012C88.2916 13.5325 90.9645 12.4481 94.1717 12.4481C97.4095 12.4481 100.098 13.5325 102.236 15.7012C104.374 17.8394 105.443 20.4968 105.443 23.6736C105.443 26.8503 104.374 29.5078 102.236 31.6459C100.098 33.784 97.4095 34.8532 94.1717 34.8532ZM87.7572 23.6736C87.7572 25.659 88.3528 27.3085 89.5441 28.6219C90.7658 29.9048 92.3086 30.5463 94.1717 30.5463C96.0349 30.5463 97.5777 29.9048 98.7994 28.6219C100.021 27.3085 100.632 25.659 100.632 23.6736C100.632 21.6576 100.021 20.0081 98.7994 18.7252C97.5777 17.4118 96.0349 16.755 94.1717 16.755C92.3086 16.755 90.7658 17.4118 89.5441 18.7252C88.3528 20.0081 87.7572 21.6576 87.7572 23.6736Z"
                        fill="var(--logo-text-proton-color)"
                    />
                    <path
                        d="M76.573 34.7158C74.3125 34.7158 72.4644 34.0439 71.029 32.6997C69.6237 31.3252 68.9213 29.4314 68.9213 27.0183V16.8925H65.0268V12.9063H68.8755V5.71283H73.7322V12.9063H80.0093V16.8925H73.7322V26.4226C73.7322 27.8583 74.053 28.8815 74.6944 29.4925C75.3663 30.0728 76.4355 30.363 77.9017 30.363C78.4208 30.363 78.986 30.3477 79.597 30.3172V34.3034C78.5278 34.5783 77.5198 34.7158 76.573 34.7158Z"
                        fill="var(--logo-text-proton-color)"
                    />
                    <path
                        d="M51.713 34.8532C48.5057 34.8532 45.8329 33.784 43.6948 31.6459C41.5568 29.5078 40.4876 26.8503 40.4876 23.6736C40.4876 20.4968 41.5568 17.8394 43.6948 15.7012C45.8329 13.5325 48.5057 12.4481 51.713 12.4481C54.9507 12.4481 57.6389 13.5325 59.777 15.7012C61.9151 17.8394 62.9843 20.4968 62.9843 23.6736C62.9843 26.8503 61.9151 29.5078 59.777 31.6459C57.6389 33.784 54.9507 34.8532 51.713 34.8532ZM45.2985 23.6736C45.2985 25.659 45.8941 27.3085 47.0854 28.6219C48.3071 29.9048 49.8499 30.5463 51.713 30.5463C53.5762 30.5463 55.1189 29.9048 56.3407 28.6219C57.5624 27.3085 58.1734 25.659 58.1734 23.6736C58.1734 21.6576 57.5624 20.0081 56.3407 18.7252C55.1189 17.4118 53.5762 16.755 51.713 16.755C49.8499 16.755 48.3071 17.4118 47.0854 18.7252C45.8941 20.0081 45.2985 21.6576 45.2985 23.6736Z"
                        fill="var(--logo-text-proton-color)"
                    />
                    <path
                        d="M26.5155 21.1994C26.5155 18.5419 27.2638 16.419 28.7606 14.8307C30.2878 13.2423 32.3344 12.4481 34.9004 12.4481C35.6639 12.4481 36.5191 12.555 37.4662 12.7688V17.1674C37.1913 17.1369 36.6415 17.1216 35.8167 17.1216C34.3198 17.1216 33.1897 17.5034 32.426 18.267C31.6929 19.0307 31.3264 20.283 31.3264 22.0241V34.3951H26.5155V21.1994Z"
                        fill="var(--logo-text-proton-color)"
                    />
                    <path
                        d="M0 34.395V3.19281H12.5084C15.3491 3.19281 17.7164 4.07862 19.6102 5.85028C21.5345 7.6219 22.4967 9.88228 22.4967 12.6314C22.4967 15.3805 21.5345 17.6561 19.6102 19.4583C17.7164 21.2299 15.3491 22.1157 12.5084 22.1157H4.90255V34.395H0ZM4.90255 17.5339H11.592C13.5164 17.5339 14.9825 17.0757 15.9905 16.1594C16.9985 15.243 17.5025 14.067 17.5025 12.6314C17.5025 11.1957 16.9985 10.035 15.9905 9.14919C15.0131 8.23282 13.5775 7.77464 11.6836 7.77464H4.90255V17.5339Z"
                        fill="var(--logo-text-proton-color)"
                    />
                </>
            )}
        </LogoBase>
    );
};

export default VpnLogo;

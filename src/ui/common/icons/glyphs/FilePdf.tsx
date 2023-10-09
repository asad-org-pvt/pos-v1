/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const FilePdf: FC<IGlyphIcon> = ({ className, onClick, ...rest }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx(classes.root, className)}
      onClick={onClick}
      width="24"
      height="32"
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.0149 0H0.816558C0.365581 0 0 0.374286 0 1.10057V31.4286C0 31.6257 0.365581 32 0.816558 32H23.1834C23.6344 32 24 31.6257 24 31.4286V7.416C24 7.01829 23.9481 6.89029 23.8566 6.796L17.362 0.146857C17.27 0.0531429 17.1449 0 17.0149 0Z"
        fill="#E9E9E0"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.3023 0.0859375V6.8568H23.9157L17.3023 0.0859375Z"
        fill="#D9D7CA"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.2636 19.0423C7.06937 19.0423 6.88295 18.9777 6.72388 18.856C6.14286 18.4091 6.06472 17.9126 6.10156 17.5743C6.20314 16.6446 7.32667 15.6703 9.44202 14.6783C10.2815 12.7949 11.0802 10.4743 11.5563 8.53543C10.9992 7.29372 10.4584 5.684 10.8524 4.73886C10.9909 4.40857 11.1639 4.15429 11.4854 4.04457C11.6132 4.00115 11.9341 3.94629 12.0524 3.94629C12.3337 3.94629 12.581 4.31715 12.7563 4.54572C12.9209 4.76115 13.2943 5.21657 12.5481 8.43315C13.3004 10.0234 14.3659 11.644 15.3879 12.7537C16.1196 12.6183 16.7492 12.5491 17.2621 12.5491C18.1362 12.5491 18.6658 12.7583 18.8818 13.1874C19.0604 13.5429 18.9868 13.9583 18.6636 14.4217C18.3527 14.8669 17.9246 15.1023 17.4245 15.1023C16.7458 15.1023 15.9555 14.6634 15.0742 13.7966C13.4902 14.1354 11.6411 14.74 10.1464 15.4091C9.67979 16.4229 9.23272 17.2394 8.81635 17.8383C8.24537 18.6594 7.75198 19.0423 7.2636 19.0423ZM8.74937 16.1131C7.55607 16.7994 7.06993 17.3634 7.03532 17.6811C7.02974 17.7337 7.01467 17.872 7.27588 18.0766C7.35905 18.0497 7.84463 17.8229 8.74937 16.1131ZM16.3607 13.5749C16.8156 13.9331 16.9267 14.1143 17.2242 14.1143C17.3548 14.1143 17.7276 14.1086 17.8995 13.8623C17.9827 13.7429 18.015 13.6663 18.0273 13.6257C17.9592 13.588 17.8683 13.5131 17.3715 13.5131C17.0902 13.5131 16.7358 13.5251 16.3607 13.5749ZM12.1914 9.81372C11.7918 11.2274 11.2649 12.7537 10.699 14.136C11.8655 13.6726 13.1336 13.268 14.3246 12.9817C13.5711 12.0857 12.8182 10.9669 12.1914 9.81372ZM11.8526 4.97829C11.7979 4.99715 11.1103 5.98229 11.9062 6.816C12.4359 5.60743 11.8766 4.97029 11.8526 4.97829Z"
        fill="#CC4B4C"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.1834 32.0004H0.816558C0.365581 32.0004 0 31.6261 0 31.1644V22.2861H24V31.1644C24 31.6261 23.6344 32.0004 23.1834 32.0004Z"
        fill="#CC4B4C"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.07533 30.286H5.15942V24.5283H6.77747C7.01635 24.5283 7.253 24.5672 7.48687 24.6455C7.72073 24.7237 7.93059 24.8409 8.11645 24.9969C8.30231 25.1535 8.45245 25.342 8.56687 25.5632C8.68128 25.7849 8.73821 26.0335 8.73821 26.3095C8.73821 26.6015 8.68966 26.8655 8.59366 27.1026C8.49654 27.3397 8.36147 27.5386 8.18901 27.7003C8.01598 27.8615 7.80724 27.9866 7.56333 28.0752C7.31887 28.1637 7.04928 28.2077 6.75459 28.2077H6.07533V30.286ZM6.07533 25.2392V27.5203H6.91477C7.0264 27.5203 7.13691 27.5009 7.24631 27.462C7.3557 27.4226 7.45617 27.3592 7.5477 27.2706C7.6398 27.1815 7.71291 27.0586 7.76928 26.8992C7.8251 26.7403 7.853 26.5437 7.853 26.3095C7.853 26.2157 7.84017 26.1077 7.81505 25.9855C7.78938 25.8632 7.73747 25.746 7.65877 25.6335C7.57952 25.5215 7.46901 25.4277 7.32668 25.3523C7.18435 25.2769 6.9957 25.2392 6.76184 25.2392H6.07533Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.3548 27.2472C14.3548 27.7209 14.3051 28.126 14.2058 28.462C14.1064 28.798 13.9808 29.0792 13.8279 29.3055C13.6755 29.5323 13.5036 29.7106 13.3133 29.8409C13.1224 29.9706 12.9377 30.0683 12.7596 30.1335C12.5816 30.1992 12.4192 30.2403 12.2713 30.2586C12.1239 30.2769 12.0145 30.286 11.9431 30.286H9.81433V24.5283H11.5083C11.9816 24.5283 12.3974 24.6055 12.7563 24.7586C13.1146 24.9123 13.4121 25.1169 13.6488 25.3718C13.8854 25.6272 14.0618 25.9175 14.179 26.2432C14.2962 26.5683 14.3548 26.9032 14.3548 27.2472ZM11.6383 29.5986C12.2584 29.5986 12.7066 29.3952 12.9812 28.9889C13.2558 28.5832 13.3931 27.994 13.3931 27.2237C13.3931 26.9843 13.3652 26.7472 13.3094 26.5129C13.253 26.278 13.1453 26.066 12.9851 25.8758C12.8249 25.6855 12.6073 25.5323 12.3327 25.4152C12.0581 25.298 11.7014 25.2392 11.2644 25.2392H10.7302V29.5986H11.6383Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.6136 25.2392V27.0517H18.9639V27.6923H16.6136V30.286H15.6826V24.5283H19.2V25.2392H16.6136Z"
        fill="white"
      />
    </svg>
  );
};

export default FilePdf;

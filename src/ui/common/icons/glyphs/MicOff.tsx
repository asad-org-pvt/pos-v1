/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const MicOff: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path d="M1 1L23 23" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M9 9V12C9.00052 12.593 9.17675 13.1725 9.50643 13.6653C9.83611 14.1582 10.3045 14.5423 10.8523 14.7691C11.4002 14.996 12.0029 15.0554 12.5845 14.9399C13.1661 14.8243 13.7005 14.539 14.12 14.12L9 9ZM15 9.34V4C15.0007 3.25603 14.725 2.53832 14.2264 1.9862C13.7277 1.43408 13.0417 1.08694 12.3015 1.01217C11.5613 0.937406 10.8197 1.14034 10.2207 1.58159C9.62172 2.02283 9.20805 2.67091 9.06 3.4"
        fill={color}
      />
      <path
        d="M17 16.95C16.0238 17.9464 14.7721 18.6285 13.4056 18.9086C12.0391 19.1887 10.62 19.0542 9.3305 18.5223C8.04096 17.9903 6.93976 17.0853 6.16817 15.9232C5.39658 14.761 4.9898 13.3949 5 12V10M19 10V12C18.9996 12.4124 18.9628 12.824 18.89 13.23"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 19V23" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 23H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default MicOff;

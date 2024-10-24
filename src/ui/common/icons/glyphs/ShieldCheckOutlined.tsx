/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const ShieldCheckOutlined: FC<IGlyphIcon> = ({ className, color, onClick, ...rest }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      onClick={onClick}
      width="18"
      height="22"
      viewBox="0 0 18 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M9 0L17.217 1.826C17.674 1.928 18 2.333 18 2.802V12.789C18 14.795 16.997 16.669 15.328 17.781L9 22L2.672 17.781C1.002 16.668 0 14.795 0 12.79V2.802C0 2.333 0.326 1.928 0.783 1.826L9 0ZM9 2.049L2 3.604V12.789C2 14.126 2.668 15.375 3.781 16.117L9 19.597L14.219 16.117C15.332 15.375 16 14.127 16 12.79V3.604L9 2.05V2.049ZM13.452 7.222L14.867 8.636L8.503 15L4.26 10.757L5.674 9.343L8.502 12.171L13.452 7.221V7.222Z"
        fill={color}
      />
    </svg>
  );
};

export default ShieldCheckOutlined;

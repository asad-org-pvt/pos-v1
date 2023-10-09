/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const MembersFilled: FC<IGlyphIcon> = ({ className, color, onClick }) => {
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
      <path
        d="M2 22C2 19.8783 2.84285 17.8434 4.34315 16.3431C5.84344 14.8429 7.87827 14 10 14C12.1217 14 14.1566 14.8429 15.6569 16.3431C17.1571 17.8434 18 19.8783 18 22H2ZM10 13C6.685 13 4 10.315 4 7C4 3.685 6.685 1 10 1C13.315 1 16 3.685 16 7C16 10.315 13.315 13 10 13ZM17.363 15.233C18.8926 15.6261 20.2593 16.4918 21.2683 17.7068C22.2774 18.9218 22.8774 20.4242 22.983 22H20C20 19.39 19 17.014 17.363 15.233ZM15.34 12.957C16.178 12.2075 16.8482 11.2893 17.3066 10.2627C17.765 9.23616 18.0013 8.12429 18 7C18.0021 5.63347 17.6526 4.28937 16.985 3.097C18.1176 3.32459 19.1365 3.93737 19.8685 4.8312C20.6004 5.72502 21.0002 6.84473 21 8C21.0003 8.71247 20.8482 9.41676 20.5541 10.0657C20.26 10.7146 19.8305 11.2931 19.2946 11.7625C18.7586 12.2319 18.1285 12.5814 17.4464 12.7874C16.7644 12.9934 16.0462 13.0512 15.34 12.957Z"
        fill={color}
      />
    </svg>
  );
};

export default MembersFilled;

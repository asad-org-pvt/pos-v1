/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const ReplyThread: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      onClick={onClick}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11 20L1 12L11 4V9C16.523 9 21 13.477 21 19C21 19.273 20.99 19.543 20.968 19.81C19.505 17.036 16.638 15.119 13.313 15.005L13 15H11V20ZM9 13H13.034L13.381 13.007C14.666 13.05 15.905 13.317 17.057 13.773C15.59 12.075 13.42 11 11 11H9V8.161L4.202 12L9 15.839V13Z"
        fill={color}
      />
    </svg>
  );
};

export default ReplyThread;

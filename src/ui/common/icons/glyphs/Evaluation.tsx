/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const Evaluation: FC<IGlyphIcon> = ({ className, color = '#333C43', onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      onClick={onClick}
      width="18"
      height="20"
      viewBox="0 0 18 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 0V2H17.007C17.555 2 18 2.445 18 2.993V19.007C18 19.555 17.555 20 17.007 20H0.993C0.445 20 0 19.555 0 19.007V2.993C0 2.445 0.445 2 0.993 2H4V0H14ZM4 4H2V18H16V4H14V6H4V4ZM6 14V16H4V14H6ZM6 11V13H4V11H6ZM6 8V10H4V8H6ZM12 2H6V4H12V2Z"
        fill={color}
      />
    </svg>
  );
};

export default Evaluation;

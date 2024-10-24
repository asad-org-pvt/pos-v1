/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const Procedure: FC<IGlyphIcon> = ({ className, color = '#333C43', onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      onClick={onClick}
      width="16"
      height="18"
      viewBox="0 0 16 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.784 11L4.204 7H0V5H4.415L4.94 0H6.951L6.426 5H10.415L10.94 0H12.951L12.426 5H16V7H12.216L11.796 11H16V13H11.585L11.06 18H9.049L9.574 13H5.585L5.06 18H3.049L3.574 13H0V11H3.784ZM5.795 11H9.785L10.205 7H6.215L5.795 11Z"
        fill={color}
      />
    </svg>
  );
};

export default Procedure;

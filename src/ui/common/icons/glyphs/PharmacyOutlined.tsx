/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const PharmacyOutlined: FC<IGlyphIcon> = ({ className, color, onClick, ...rest }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      onClick={onClick}
      width="16"
      height="20"
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M15 0V2H13V5C14.657 5 16 6.343 16 8V19C16 19.552 15.552 20 15 20H1C0.448 20 0 19.552 0 19V8C0 6.343 1.343 5 3 5V2H1V0H15ZM13 7H3C2.448 7 2 7.448 2 8V18H14V8C14 7.448 13.552 7 13 7ZM9 9V11H11V13H8.999L9 15H7L6.999 13H5V11H7V9H9ZM11 2H5V5H11V2Z"
        fill={color}
      />
    </svg>
  );
};

export default PharmacyOutlined;

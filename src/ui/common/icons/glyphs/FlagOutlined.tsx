/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const FlagOutlined: FC<IGlyphIcon> = ({ className, color, onClick, ...rest }) => {
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
      {...rest}
    >
      <path
        d="M5 16V22H3V3H12.382C12.5677 3.0001 12.7496 3.05188 12.9075 3.14955C13.0654 3.24722 13.193 3.38692 13.276 3.553L14 5H20C20.2652 5 20.5196 5.10536 20.7071 5.29289C20.8946 5.48043 21 5.73478 21 6V17C21 17.2652 20.8946 17.5196 20.7071 17.7071C20.5196 17.8946 20.2652 18 20 18H13.618C13.4323 17.9999 13.2504 17.9481 13.0925 17.8504C12.9346 17.7528 12.807 17.6131 12.724 17.447L12 16H5ZM5 5V14H13.236L14.236 16H19V7H12.764L11.764 5H5Z"
        fill={color}
      />
    </svg>
  );
};

export default FlagOutlined;

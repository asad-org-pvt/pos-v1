/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const InProgress: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 0C10.4602 0 10.8333 0.373096 10.8333 0.833333V4.16667C10.8333 4.6269 10.4602 5 10 5C9.53976 5 9.16667 4.6269 9.16667 4.16667V0.833333C9.16667 0.373096 9.53976 0 10 0ZM10 15C10.4602 15 10.8333 15.3731 10.8333 15.8333V19.1667C10.8333 19.6269 10.4602 20 10 20C9.53976 20 9.16667 19.6269 9.16667 19.1667V15.8333C9.16667 15.3731 9.53976 15 10 15ZM2.92904 2.92891C3.25448 2.60348 3.78211 2.60348 4.10755 2.92891L6.46457 5.28593C6.79001 5.61137 6.79001 6.13901 6.46457 6.46445C6.13913 6.78988 5.6115 6.78988 5.28606 6.46445L2.92904 4.10742C2.6036 3.78199 2.6036 3.25435 2.92904 2.92891ZM13.5355 13.5356C13.861 13.2102 14.3886 13.2102 14.714 13.5356L17.0711 15.8926C17.3965 16.2181 17.3965 16.7457 17.0711 17.0711C16.7456 17.3966 16.218 17.3966 15.8925 17.0711L13.5355 14.7141C13.2101 14.3887 13.2101 13.861 13.5355 13.5356ZM17.0711 4.10755C17.3965 3.78211 17.3965 3.25448 17.0711 2.92904C16.7456 2.6036 16.218 2.6036 15.8926 2.92904L13.5356 5.28606C13.2101 5.6115 13.2101 6.13913 13.5356 6.46457C13.861 6.79001 14.3886 6.79001 14.7141 6.46457L17.0711 4.10755ZM6.4644 14.714C6.78983 14.3886 6.78983 13.861 6.4644 13.5355C6.13896 13.2101 5.61132 13.2101 5.28589 13.5355L2.92886 15.8925C2.60343 16.218 2.60343 16.7456 2.92886 17.0711C3.2543 17.3965 3.78194 17.3965 4.10737 17.0711L6.4644 14.714ZM20 10C20 10.4602 19.6269 10.8333 19.1667 10.8333L15.8333 10.8333C15.3731 10.8333 15 10.4602 15 10C15 9.53976 15.3731 9.16667 15.8333 9.16667H19.1667C19.6269 9.16667 20 9.53976 20 10ZM5 10C5 10.4602 4.6269 10.8333 4.16667 10.8333L0.833334 10.8333C0.373096 10.8333 0 10.4602 0 10C0 9.53976 0.373096 9.16667 0.833334 9.16667H4.16667C4.6269 9.16667 5 9.53976 5 10Z"
        fill={color}
      />
    </svg>
  );
};

export default InProgress;

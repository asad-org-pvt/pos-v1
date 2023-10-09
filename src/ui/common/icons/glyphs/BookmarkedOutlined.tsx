/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const BookmarkedOutlined: FC<IGlyphIcon> = ({ className, color, onClick }) => {
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
        d="M3 18.5V5C3 4.20435 3.31607 3.44129 3.87868 2.87868C4.44129 2.31607 5.20435 2 6 2H20C20.2652 2 20.5196 2.10536 20.7071 2.29289C20.8946 2.48043 21 2.73478 21 3V21C21 21.2652 20.8946 21.5196 20.7071 21.7071C20.5196 21.8946 20.2652 22 20 22H6.5C5.57174 22 4.6815 21.6313 4.02513 20.9749C3.36875 20.3185 3 19.4283 3 18.5V18.5ZM19 20V17H6.5C6.10218 17 5.72064 17.158 5.43934 17.4393C5.15804 17.7206 5 18.1022 5 18.5C5 18.8978 5.15804 19.2794 5.43934 19.5607C5.72064 19.842 6.10218 20 6.5 20H19ZM10 4H6C5.73478 4 5.48043 4.10536 5.29289 4.29289C5.10536 4.48043 5 4.73478 5 5V15.337C5.46869 15.1144 5.98115 14.9993 6.5 15H19V4H17V12L13.5 10L10 12V4Z"
        fill={color}
      />
    </svg>
  );
};

export default BookmarkedOutlined;

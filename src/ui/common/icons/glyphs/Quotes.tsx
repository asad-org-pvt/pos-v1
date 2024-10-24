/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const Quotes: FC<IGlyphIcon> = ({ className, color, onClick, ...rest }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx(classes.root, className)}
      onClick={onClick}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M19 0C19.552 0 20 0.448 20 1V15C20 15.552 19.552 16 19 16H4.455L0 19.5V1C0 0.448 0.448 0 1 0H19ZM18 2H2V15.385L3.763 14H18V2ZM8.515 4.412L8.962 5.1C7.294 6.003 7.323 7.452 7.323 7.764C7.478 7.744 7.641 7.74 7.803 7.755C8.705 7.839 9.416 8.58 9.416 9.5C9.416 10.466 8.632 11.25 7.666 11.25C7.129 11.25 6.616 11.005 6.292 10.66C5.777 10.114 5.5 9.5 5.5 8.505C5.5 6.755 6.728 5.187 8.515 4.412ZM13.515 4.412L13.962 5.1C12.294 6.003 12.323 7.452 12.323 7.764C12.478 7.744 12.641 7.74 12.803 7.755C13.705 7.839 14.416 8.58 14.416 9.5C14.416 10.466 13.632 11.25 12.666 11.25C12.129 11.25 11.616 11.005 11.292 10.66C10.777 10.114 10.5 9.5 10.5 8.505C10.5 6.755 11.728 5.187 13.515 4.412Z"
        fill={color}
      />
    </svg>
  );
};

export default Quotes;

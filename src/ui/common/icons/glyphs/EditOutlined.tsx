/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const EditOutlined: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M12.728 6.68596L11.314 5.27196L2 14.586V16H3.414L12.728 6.68596ZM14.142 5.27196L15.556 3.85796L14.142 2.44396L12.728 3.85796L14.142 5.27196ZM4.242 18H0V13.757L13.435 0.321961C13.6225 0.13449 13.8768 0.0291748 14.142 0.0291748C14.4072 0.0291748 14.6615 0.13449 14.849 0.321961L17.678 3.15096C17.8655 3.33849 17.9708 3.5928 17.9708 3.85796C17.9708 4.12313 17.8655 4.37743 17.678 4.56496L4.243 18H4.242Z"
        fill={color}
      />
    </svg>
  );
};

export default EditOutlined;

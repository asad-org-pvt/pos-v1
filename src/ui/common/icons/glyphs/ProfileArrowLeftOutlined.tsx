/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const ProfileArrowLeftOutlined: FC<IGlyphIcon> = ({ className, color, onClick, ...rest }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      onClick={onClick}
      width="20"
      height="22"
      viewBox="0 0 20 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M10 13.252V15.342C9.09492 15.022 8.12628 14.9239 7.1754 15.0558C6.22453 15.1877 5.3192 15.5459 4.53543 16.1002C3.75166 16.6545 3.11234 17.3888 2.67116 18.2414C2.22998 19.094 1.99982 20.04 2 21L2.58457e-07 20.999C-0.000310114 19.7779 0.278921 18.5729 0.816299 17.4764C1.35368 16.3799 2.13494 15.4209 3.10022 14.673C4.0655 13.9251 5.18918 13.4081 6.38515 13.1616C7.58113 12.9152 8.81766 12.9457 10 13.251V13.252ZM8 12C4.685 12 2 9.315 2 6C2 2.685 4.685 0 8 0C11.315 0 14 2.685 14 6C14 9.315 11.315 12 8 12ZM8 10C10.21 10 12 8.21 12 6C12 3.79 10.21 2 8 2C5.79 2 4 3.79 4 6C4 8.21 5.79 10 8 10ZM15.418 16H19.004V18H15.418L17.247 19.828L15.833 21.243L11.59 17L15.833 12.757L17.247 14.172L15.418 16Z"
        fill={color}
      />
    </svg>
  );
};

export default ProfileArrowLeftOutlined;

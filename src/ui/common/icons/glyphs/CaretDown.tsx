/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const CaretDown: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M0.859996 1.05999C0.813132 1.01351 0.775935 0.958208 0.75055 0.897279C0.725166 0.836349 0.712097 0.770996 0.712097 0.70499C0.712097 0.638984 0.725166 0.573632 0.75055 0.512702C0.775935 0.451772 0.813132 0.396472 0.859996 0.349991L1.06 0.14999C1.10654 0.101676 1.16251 0.0634331 1.22443 0.0376311C1.28635 0.0118291 1.35292 -0.000982226 1.42 -9.51882e-06H8.58C8.64707 -0.000982226 8.71364 0.0118291 8.77556 0.0376311C8.83749 0.0634331 8.89345 0.101676 8.94 0.14999L9.14 0.349991C9.18686 0.396472 9.22406 0.451772 9.24944 0.512702C9.27483 0.573632 9.2879 0.638984 9.2879 0.70499C9.2879 0.770996 9.27483 0.836349 9.24944 0.897279C9.22406 0.958208 9.18686 1.01351 9.14 1.05999L5.35 4.84999C5.30511 4.89782 5.25089 4.93594 5.19069 4.962C5.13049 4.98806 5.06559 5.00151 5 5.00151C4.9344 5.00151 4.8695 4.98806 4.8093 4.962C4.7491 4.93594 4.69489 4.89782 4.65 4.84999L0.859996 1.05999Z"
        fill={color}
      />
    </svg>
  );
};

export default CaretDown;

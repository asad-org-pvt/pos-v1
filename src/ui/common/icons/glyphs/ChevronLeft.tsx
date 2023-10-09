/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const ChevronLeft: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      width="7"
      height="12"
      viewBox="0 0 7 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M0.22 6.71997C0.0793078 6.57946 0.000175052 6.38882 0 6.18997V5.80997C0.00230401 5.61156 0.0811163 5.42169 0.22 5.27997L5.36 0.149974C5.40648 0.10311 5.46178 0.0659131 5.52271 0.0405288C5.58364 0.0151444 5.64899 0.0020752 5.715 0.0020752C5.78101 0.0020752 5.84636 0.0151444 5.90729 0.0405288C5.96822 0.0659131 6.02352 0.10311 6.07 0.149974L6.78 0.859974C6.82656 0.905597 6.86356 0.960053 6.88881 1.02015C6.91406 1.08025 6.92707 1.14478 6.92707 1.20997C6.92707 1.27516 6.91406 1.3397 6.88881 1.3998C6.86356 1.4599 6.82656 1.51435 6.78 1.55997L2.33 5.99997L6.78 10.44C6.82686 10.4865 6.86406 10.5418 6.88945 10.6027C6.91483 10.6636 6.9279 10.729 6.9279 10.795C6.9279 10.861 6.91483 10.9263 6.88945 10.9873C6.86406 11.0482 6.82686 11.1035 6.78 11.15L6.07 11.85C6.02352 11.8968 5.96822 11.934 5.90729 11.9594C5.84636 11.9848 5.78101 11.9979 5.715 11.9979C5.64899 11.9979 5.58364 11.9848 5.52271 11.9594C5.46178 11.934 5.40648 11.8968 5.36 11.85L0.22 6.71997Z"
        fill={color}
      />
    </svg>
  );
};

export default ChevronLeft;

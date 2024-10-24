/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const ArrowDownFilled: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      width="16"
      height="17"
      viewBox="0 0 16 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M0.86 9.06C0.813136 9.01352 0.775938 8.95822 0.750554 8.89729C0.72517 8.83636 0.712101 8.77101 0.712101 8.705C0.712101 8.63899 0.72517 8.57364 0.750554 8.51271C0.775938 8.45178 0.813136 8.39648 0.86 8.35L1.06 8.15C1.10654 8.10169 1.16251 8.06344 1.22443 8.03764C1.28636 8.01184 1.35292 7.99903 1.42 8H5V0.5C5 0.367392 5.05268 0.240215 5.14645 0.146447C5.24021 0.0526785 5.36739 0 5.5 0H10.5C10.6326 0 10.7598 0.0526785 10.8536 0.146447C10.9473 0.240215 11 0.367392 11 0.5V8H14.58C14.6471 7.99903 14.7136 8.01184 14.7756 8.03764C14.8375 8.06344 14.8935 8.10169 14.94 8.15L15.14 8.35C15.1869 8.39648 15.2241 8.45178 15.2494 8.51271C15.2748 8.57364 15.2879 8.63899 15.2879 8.705C15.2879 8.77101 15.2748 8.83636 15.2494 8.89729C15.2241 8.95822 15.1869 9.01352 15.14 9.06L8.35 15.85C8.30511 15.8978 8.25089 15.936 8.19069 15.962C8.1305 15.9881 8.0656 16.0015 8 16.0015C7.9344 16.0015 7.8695 15.9881 7.80931 15.962C7.74911 15.936 7.69489 15.8978 7.65 15.85L0.86 9.06Z"
        fill={color}
      />
    </svg>
  );
};

export default ArrowDownFilled;

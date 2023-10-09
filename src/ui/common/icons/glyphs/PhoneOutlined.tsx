/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const PhoneOutlined: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M4.244 5.12133C4.86956 6.22032 5.77968 7.13044 6.87867 7.756L7.468 6.93067C7.56277 6.79796 7.7029 6.70459 7.86187 6.66822C8.02084 6.63186 8.18762 6.65502 8.33067 6.73333C9.27355 7.24862 10.3148 7.55852 11.386 7.64267C11.5532 7.65592 11.7092 7.73169 11.823 7.85488C11.9368 7.97807 12 8.13963 12 8.30733V11.282C12 11.4471 11.9388 11.6063 11.8282 11.7288C11.7177 11.8513 11.5655 11.9285 11.4013 11.9453C11.048 11.982 10.692 12 10.3333 12C4.62667 12 0 7.37333 0 1.66667C0 1.308 0.018 0.952 0.0546667 0.598667C0.0715031 0.434465 0.148656 0.282347 0.271193 0.171756C0.39373 0.0611648 0.552937 -3.55718e-05 0.718 1.55115e-08H3.69267C3.86037 -2.10123e-05 4.02193 0.0631677 4.14512 0.176967C4.26831 0.290767 4.34408 0.446816 4.35733 0.614C4.44148 1.68519 4.75138 2.72645 5.26667 3.66933C5.34498 3.81238 5.36814 3.97916 5.33178 4.13813C5.29541 4.2971 5.20204 4.43723 5.06933 4.532L4.244 5.12133ZM2.56267 4.68333L3.82933 3.77867C3.46986 3.00273 3.22357 2.17923 3.098 1.33333H1.34C1.336 1.444 1.334 1.55533 1.334 1.66667C1.33333 6.63733 5.36267 10.6667 10.3333 10.6667C10.4447 10.6667 10.556 10.6647 10.6667 10.66V8.902C9.82077 8.77643 8.99727 8.53014 8.22133 8.17067L7.31667 9.43733C6.95244 9.29581 6.59867 9.12873 6.258 8.93733L6.21933 8.91533C4.91172 8.17115 3.82885 7.08828 3.08467 5.78067L3.06267 5.742C2.87127 5.40133 2.70419 5.04756 2.56267 4.68333Z"
        fill={color}
      />
    </svg>
  );
};

export default PhoneOutlined;

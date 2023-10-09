/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const ChatSquare: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      width="20"
      height="18"
      viewBox="0 0 20 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M1.34126e-06 5.99401C-0.000525832 5.20621 0.154353 4.42605 0.455768 3.69819C0.757183 2.97034 1.19921 2.30909 1.75655 1.75231C2.31388 1.19553 2.97558 0.754165 3.70373 0.453478C4.43189 0.152791 5.21221 -0.00130701 6 8.35025e-06H14C17.313 8.35025e-06 20 2.69501 20 5.99401V18H6C2.687 18 1.34126e-06 15.305 1.34126e-06 12.006V5.99401ZM18 16V5.99401C17.9974 4.93451 17.5749 3.91925 16.8251 3.17063C16.0754 2.42201 15.0595 2.00106 14 2.00001H6C5.47485 1.99869 4.9546 2.10106 4.4691 2.30123C3.98359 2.50141 3.54238 2.79546 3.17076 3.16652C2.79914 3.53758 2.50443 3.97835 2.30353 4.46356C2.10262 4.94876 1.99947 5.46886 2 5.99401V12.006C2.00265 13.0655 2.42511 14.0808 3.17486 14.8294C3.9246 15.578 4.9405 15.999 6 16H18ZM12 8.00001H14V10H12V8.00001ZM6 8.00001H8V10H6V8.00001Z"
        fill={color}
      />
    </svg>
  );
};

export default ChatSquare;

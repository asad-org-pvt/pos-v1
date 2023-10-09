/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const Menu: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      width="18"
      height="14"
      viewBox="0 0 18 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M17.5 2H0.5C0.367392 2 0.240215 1.94732 0.146447 1.85355C0.0526785 1.75979 0 1.63261 0 1.5V0.5C0 0.367392 0.0526785 0.240215 0.146447 0.146447C0.240215 0.0526785 0.367392 0 0.5 0H17.5C17.6326 0 17.7598 0.0526785 17.8536 0.146447C17.9473 0.240215 18 0.367392 18 0.5V1.5C18 1.63261 17.9473 1.75979 17.8536 1.85355C17.7598 1.94732 17.6326 2 17.5 2ZM18 7.5V6.5C18 6.36739 17.9473 6.24021 17.8536 6.14645C17.7598 6.05268 17.6326 6 17.5 6H0.5C0.367392 6 0.240215 6.05268 0.146447 6.14645C0.0526785 6.24021 0 6.36739 0 6.5V7.5C0 7.63261 0.0526785 7.75979 0.146447 7.85355C0.240215 7.94732 0.367392 8 0.5 8H17.5C17.6326 8 17.7598 7.94732 17.8536 7.85355C17.9473 7.75979 18 7.63261 18 7.5ZM18 13.5V12.5C18 12.3674 17.9473 12.2402 17.8536 12.1464C17.7598 12.0527 17.6326 12 17.5 12H0.5C0.367392 12 0.240215 12.0527 0.146447 12.1464C0.0526785 12.2402 0 12.3674 0 12.5V13.5C0 13.6326 0.0526785 13.7598 0.146447 13.8536C0.240215 13.9473 0.367392 14 0.5 14H17.5C17.6326 14 17.7598 13.9473 17.8536 13.8536C17.9473 13.7598 18 13.6326 18 13.5Z"
        fill={color}
      />
    </svg>
  );
};

export default Menu;

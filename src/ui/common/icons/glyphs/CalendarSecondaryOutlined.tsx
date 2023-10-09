/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const CalendarSecondaryOutlined: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      width="18"
      height="19"
      viewBox="0 0 18 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M16 2H15V0.5C15 0.367392 14.9473 0.240215 14.8536 0.146447C14.7598 0.0526785 14.6326 0 14.5 0H13.5C13.3674 0 13.2402 0.0526785 13.1464 0.146447C13.0527 0.240215 13 0.367392 13 0.5V2H5V0.5C5 0.367392 4.94732 0.240215 4.85355 0.146447C4.75979 0.0526785 4.63261 0 4.5 0H3.5C3.36739 0 3.24021 0.0526785 3.14645 0.146447C3.05268 0.240215 3 0.367392 3 0.5V2H2C1.46957 2 0.960859 2.21071 0.585786 2.58579C0.210714 2.96086 0 3.46957 0 4V17C0 17.5304 0.210714 18.0391 0.585786 18.4142C0.960859 18.7893 1.46957 19 2 19H16C16.5304 19 17.0391 18.7893 17.4142 18.4142C17.7893 18.0391 18 17.5304 18 17V4C18 3.46957 17.7893 2.96086 17.4142 2.58579C17.0391 2.21071 16.5304 2 16 2ZM16 17H2V6H16V17ZM8.5 10H9.5C9.63261 10 9.75979 9.94732 9.85355 9.85355C9.94732 9.75979 10 9.63261 10 9.5V8.5C10 8.36739 9.94732 8.24021 9.85355 8.14645C9.75979 8.05268 9.63261 8 9.5 8H8.5C8.36739 8 8.24021 8.05268 8.14645 8.14645C8.05268 8.24021 8 8.36739 8 8.5V9.5C8 9.63261 8.05268 9.75979 8.14645 9.85355C8.24021 9.94732 8.36739 10 8.5 10ZM12.5 10H13.5C13.6326 10 13.7598 9.94732 13.8536 9.85355C13.9473 9.75979 14 9.63261 14 9.5V8.5C14 8.36739 13.9473 8.24021 13.8536 8.14645C13.7598 8.05268 13.6326 8 13.5 8H12.5C12.3674 8 12.2402 8.05268 12.1464 8.14645C12.0527 8.24021 12 8.36739 12 8.5V9.5C12 9.63261 12.0527 9.75979 12.1464 9.85355C12.2402 9.94732 12.3674 10 12.5 10ZM4.5 10H5.5C5.63261 10 5.75979 9.94732 5.85355 9.85355C5.94732 9.75979 6 9.63261 6 9.5V8.5C6 8.36739 5.94732 8.24021 5.85355 8.14645C5.75979 8.05268 5.63261 8 5.5 8H4.5C4.36739 8 4.24021 8.05268 4.14645 8.14645C4.05268 8.24021 4 8.36739 4 8.5V9.5C4 9.63261 4.05268 9.75979 4.14645 9.85355C4.24021 9.94732 4.36739 10 4.5 10ZM8.5 14H9.5C9.63261 14 9.75979 13.9473 9.85355 13.8536C9.94732 13.7598 10 13.6326 10 13.5V12.5C10 12.3674 9.94732 12.2402 9.85355 12.1464C9.75979 12.0527 9.63261 12 9.5 12H8.5C8.36739 12 8.24021 12.0527 8.14645 12.1464C8.05268 12.2402 8 12.3674 8 12.5V13.5C8 13.6326 8.05268 13.7598 8.14645 13.8536C8.24021 13.9473 8.36739 14 8.5 14ZM4.5 14H5.5C5.63261 14 5.75979 13.9473 5.85355 13.8536C5.94732 13.7598 6 13.6326 6 13.5V12.5C6 12.3674 5.94732 12.2402 5.85355 12.1464C5.75979 12.0527 5.63261 12 5.5 12H4.5C4.36739 12 4.24021 12.0527 4.14645 12.1464C4.05268 12.2402 4 12.3674 4 12.5V13.5C4 13.6326 4.05268 13.7598 4.14645 13.8536C4.24021 13.9473 4.36739 14 4.5 14Z"
        fill={color}
      />
    </svg>
  );
};

export default CalendarSecondaryOutlined;

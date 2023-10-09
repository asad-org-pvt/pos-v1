/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const Routing: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx({
        [classes.root]: true,
        [className || '']: className,
      })}
      onClick={onClick}
      width="19"
      height="15"
      viewBox="0 0 19 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.33301 10.4999V5.08325C3.33301 4.08869 3.7281 3.13486 4.43136 2.4316C5.13462 1.72834 6.08845 1.33325 7.08301 1.33325C8.07757 1.33325 9.0314 1.72834 9.73466 2.4316C10.4379 3.13486 10.833 4.08869 10.833 5.08325V10.9166C10.833 11.4691 11.0525 11.999 11.4432 12.3897C11.8339 12.7804 12.3638 12.9999 12.9163 12.9999C13.4689 12.9999 13.9988 12.7804 14.3895 12.3897C14.7802 11.999 14.9997 11.4691 14.9997 10.9166V5.35825C14.4434 5.16166 13.9746 4.77475 13.676 4.26591C13.3775 3.75707 13.2684 3.15907 13.3682 2.57759C13.4679 1.99612 13.77 1.46863 14.221 1.08836C14.6721 0.708082 15.243 0.499512 15.833 0.499512C16.423 0.499512 16.9939 0.708082 17.445 1.08836C17.896 1.46863 18.1981 1.99612 18.2978 2.57759C18.3976 3.15907 18.2885 3.75707 17.99 4.26591C17.6914 4.77475 17.2226 5.16166 16.6663 5.35825V10.9166C16.6663 11.9111 16.2713 12.865 15.568 13.5682C14.8647 14.2715 13.9109 14.6666 12.9163 14.6666C11.9218 14.6666 10.968 14.2715 10.2647 13.5682C9.56143 12.865 9.16634 11.9111 9.16634 10.9166V5.08325C9.16634 4.53072 8.94685 4.00081 8.55615 3.61011C8.16545 3.21941 7.63554 2.99992 7.08301 2.99992C6.53047 2.99992 6.00057 3.21941 5.60987 3.61011C5.21917 4.00081 4.99967 4.53072 4.99967 5.08325V10.4999H7.49967L4.16634 14.6666L0.833008 10.4999H3.33301ZM15.833 3.83325C16.054 3.83325 16.266 3.74545 16.4223 3.58917C16.5785 3.43289 16.6663 3.22093 16.6663 2.99992C16.6663 2.7789 16.5785 2.56694 16.4223 2.41066C16.266 2.25438 16.054 2.16658 15.833 2.16658C15.612 2.16658 15.4 2.25438 15.2438 2.41066C15.0875 2.56694 14.9997 2.7789 14.9997 2.99992C14.9997 3.22093 15.0875 3.43289 15.2438 3.58917C15.4 3.74545 15.612 3.83325 15.833 3.83325Z"
        fill={color}
      />
    </svg>
  );
};

export default Routing;

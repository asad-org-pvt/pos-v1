/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const UserStar: FC<IGlyphIcon> = ({ className, color, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx(classes.root, className)}
      width="19"
      height="23"
      viewBox="0 0 19 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M8 13V15C6.4087 15 4.88258 15.6321 3.75736 16.7574C2.63214 17.8826 2 19.4087 2 21H0C0 18.8783 0.842855 16.8434 2.34315 15.3431C3.84344 13.8429 5.87827 13 8 13ZM8 12C4.685 12 2 9.315 2 6C2 2.685 4.685 0 8 0C11.315 0 14 2.685 14 6C14 9.315 11.315 12 8 12ZM8 10C10.21 10 12 8.21 12 6C12 3.79 10.21 2 8 2C5.79 2 4 3.79 4 6C4 8.21 5.79 10 8 10ZM14 20.5L11.061 22.045L11.622 18.773L9.245 16.455L12.531 15.977L14 13L15.47 15.977L18.755 16.455L16.378 18.773L16.938 22.045L14 20.5Z"
        fill={color}
      />
    </svg>
  );
};

export default UserStar;

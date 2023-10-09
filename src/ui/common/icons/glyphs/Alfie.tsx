/* eslint-disable max-len */
import { FC } from 'react';
import cx from 'clsx';

// types
import { IGlyphIcon } from './shared';

// styles
import { useStyles } from './shared/styles';

const AlfieOutlined: FC<IGlyphIcon> = ({ className, onClick }) => {
  const classes = useStyles();
  return (
    <svg
      className={cx(classes.root, className)}
      onClick={onClick}
      width="152"
      height="200"
      viewBox="0 0 152 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23.4251 106.664C18.8694 103.803 11.7176 98.525 7.273 123.479C3.37386 145.329 8.28314 167.614 8.28314 167.614C8.28314 167.614 59.4871 172.265 59.4163 162.417C59.3557 152.559 27.9808 109.526 23.4251 106.664Z"
        fill="white"
      />
      <path
        d="M32.5062 169.707C20.5664 169.707 9.1013 168.686 8.19218 168.605C7.75782 168.564 7.39417 168.241 7.29316 167.816C7.24265 167.594 2.39399 145.086 6.27292 123.287C8.35381 111.598 11.162 105.35 15.1015 103.611C18.2936 102.205 21.3644 104.147 23.6069 105.572L23.9604 105.795C28.9101 108.909 60.3557 152.316 60.4264 162.386C60.4366 163.519 59.9618 164.53 59.0123 165.4C55.3152 168.817 43.6986 169.707 32.5062 169.707ZM9.12152 166.663C21.4048 167.725 51.9615 169.151 57.6486 163.923C58.1637 163.448 58.4163 162.953 58.4062 162.417C58.3456 153.105 27.5464 110.446 22.8897 107.524L22.5261 107.291C20.4654 105.987 18.1219 104.5 15.9198 105.471C12.7479 106.877 10.1721 112.994 8.2629 123.651C4.83853 142.882 8.33361 162.67 9.12152 166.663Z"
        fill="#036AC9"
      />
      <path
        d="M98.0845 143.358C98.0845 143.358 118.297 137.979 126.439 123.227C134.571 108.475 136.712 90.9824 136.712 90.9824C136.712 90.9824 144.884 95.3201 142.884 107.969C144.743 105.896 147.733 100.821 147.733 100.821C147.733 100.821 157.572 122.468 143.399 132.195L150.551 132.913C150.551 132.913 141.096 145.421 122.045 148.201C119.944 148.504 111.984 149.859 111.56 149.9"
        fill="white"
      />
      <path
        d="M111.55 150.921C111.034 150.921 110.59 150.527 110.54 150.001C110.489 149.445 110.903 148.949 111.459 148.909C111.681 148.889 113.641 148.565 115.53 148.252C117.964 147.847 120.762 147.382 121.893 147.22C136.51 145.087 145.399 137.048 148.501 133.742L143.288 133.226C142.864 133.186 142.52 132.883 142.409 132.468C142.308 132.054 142.47 131.629 142.813 131.386C153.794 123.854 149.44 108.424 147.521 103.106C146.46 104.804 144.834 107.312 143.622 108.667C143.319 109 142.844 109.091 142.44 108.909C142.036 108.717 141.803 108.282 141.874 107.838C143.268 98.9903 139.51 94.5111 137.45 92.7821C136.692 97.5242 133.985 111.619 127.308 123.742C119.055 138.697 99.1754 144.136 98.3269 144.359C97.7916 144.5 97.236 144.177 97.0946 143.641C96.9531 143.105 97.2663 142.549 97.8117 142.407C98.0138 142.357 117.711 136.958 125.54 122.762C133.47 108.363 135.672 91.0632 135.692 90.8812C135.732 90.5476 135.934 90.2644 136.227 90.1128C136.52 89.9611 136.874 89.9611 137.167 90.1128C137.49 90.2847 144.389 94.0763 144.197 104.531C145.561 102.509 146.824 100.365 146.844 100.335C147.036 100.012 147.389 99.8194 147.763 99.8396C148.137 99.8599 148.47 100.092 148.632 100.426C148.733 100.638 157.693 120.8 145.965 131.467L150.632 131.932C150.996 131.973 151.309 132.195 151.46 132.529C151.612 132.862 151.561 133.247 151.339 133.54C150.945 134.066 141.419 146.411 122.166 149.212C121.045 149.374 118.257 149.839 115.843 150.233C112.954 150.709 111.843 150.891 111.62 150.911C111.61 150.911 111.58 150.921 111.55 150.921Z"
        fill="#036AC9"
      />
      <path
        d="M97.0239 106.664C101.58 103.803 108.731 98.525 113.176 123.479C117.075 145.329 112.166 167.614 112.166 167.614C112.166 167.614 60.962 172.265 61.0327 162.417C61.1034 152.559 92.4783 109.526 97.0239 106.664Z"
        fill="white"
      />
      <path
        d="M87.9528 169.707C76.7504 169.707 65.1439 168.807 61.4468 165.41C60.4973 164.54 60.0225 163.529 60.0326 162.397C60.1033 152.326 91.5389 108.919 96.4986 105.805L96.8623 105.583C99.1048 104.167 102.176 102.216 105.368 103.621C109.307 105.36 112.105 111.609 114.196 123.297C118.085 145.097 113.227 167.594 113.176 167.827C113.085 168.261 112.721 168.575 112.277 168.615C111.358 168.696 99.8927 169.707 87.9528 169.707ZM97.5694 107.514C92.9126 110.446 62.1135 153.095 62.0529 162.407C62.0529 162.953 62.2953 163.438 62.8105 163.914C68.4875 169.141 99.0543 167.715 111.338 166.654C112.115 162.66 115.621 142.852 112.196 123.641C110.297 112.974 107.721 106.857 104.539 105.461C102.337 104.491 99.9937 105.977 97.933 107.281L97.5694 107.514Z"
        fill="#036AC9"
      />
      <path
        d="M96.6906 154.591C96.6906 178.959 83.4375 172.215 61.9216 172.215C40.4056 172.215 24.102 174.824 24.102 150.446C24.102 141.305 22.607 110.84 27.8294 102.054C36.5267 87.4131 53.6485 83.9551 61.9216 83.9551C69.9724 83.9551 86.4073 87.9591 95.1046 102.054C100.691 111.113 96.6906 145.046 96.6906 154.591Z"
        fill="white"
      />
      <path
        d="M81.5182 174.075C79.0535 174.075 76.3463 173.893 73.427 173.701C69.9824 173.478 66.0732 173.216 61.9215 173.216C59.982 173.216 58.083 173.236 56.2344 173.256C44.4966 173.388 34.3548 173.499 28.4859 167.695C24.8595 164.106 23.0918 158.464 23.0918 150.435C23.0918 149.08 23.0615 147.25 23.0211 145.087C22.7988 132.559 22.3746 109.243 26.9606 101.528C37.6984 83.4493 59.4669 82.9336 61.9215 82.9336C69.7299 82.9336 86.8922 86.8163 95.9632 101.518C100.398 108.717 99.0744 130.223 98.1956 144.45C97.933 148.696 97.7107 152.367 97.7107 154.591C97.7107 162.69 96.2561 167.826 93.1247 170.759C90.3165 173.388 86.3669 174.075 81.5182 174.075ZM61.9215 171.193C66.1338 171.193 70.0834 171.456 73.5583 171.679C82.0233 172.235 88.1447 172.639 91.7408 169.272C94.4278 166.755 95.6804 162.083 95.6804 154.581C95.6804 152.296 95.9127 148.595 96.1753 144.318C96.9834 131.194 98.337 109.222 94.2459 102.569C85.6497 88.6262 69.346 84.9457 61.9215 84.9457C53.4666 84.9457 36.961 88.6565 28.698 102.549C24.405 109.779 24.8191 132.721 25.0413 145.046C25.0817 147.22 25.112 149.06 25.112 150.425C25.112 157.887 26.6778 163.054 29.9001 166.249C35.1629 171.456 44.4461 171.355 56.2041 171.224C58.0628 171.214 59.9719 171.193 61.9215 171.193Z"
        fill="#036AC9"
      />
      <path
        d="M38.5571 93.8638C29.2739 90.6788 22.011 85.6941 22.011 85.6941L25.102 81.6092C25.102 81.6092 19.8998 78.2119 17.7583 73.4799L23.1221 67.4739C23.1221 67.4739 18.1624 62.3577 17.7886 60.4467C25.8697 52.7622 24.7283 46.8978 25.102 43.0859C25.4859 39.274 28.6476 6.5646 33.971 1.75171C39.6177 -3.3645 50.0726 19.6383 52.204 22.075C54.588 21.6099 56.5072 21.4886 57.6184 21.4684H63.0024C64.1237 21.4886 66.0328 21.6099 68.4269 22.075C70.5583 19.6383 79.4273 -2.65671 85.074 2.4595C90.3873 7.27239 95.0541 30.0527 95.8218 43.9656C96.034 47.7876 94.7511 52.7622 102.832 60.4467C102.469 62.3577 97.5088 67.4739 97.5088 67.4739L102.862 73.4799C100.721 78.2119 95.5289 81.6092 95.5289 81.6092L98.6199 85.6941L87.7104 93.8638"
        fill="white"
      />
      <path
        d="M38.557 94.8749C38.4459 94.8749 38.3348 94.8547 38.2338 94.8243C28.9304 91.6292 21.7483 86.7455 21.4453 86.5332C21.213 86.3815 21.0614 86.1389 21.021 85.8659C20.9806 85.5929 21.0412 85.3098 21.2129 85.0974L23.6777 81.8417C22.0413 80.6182 18.5563 77.6961 16.8491 73.9044C16.6875 73.5404 16.7481 73.1158 17.0209 72.8124L21.7584 67.5041C20.2634 65.9065 17.1522 62.4081 16.8087 60.6488C16.738 60.305 16.8491 59.9612 17.1017 59.7186C23.6878 53.4598 23.8696 48.5053 24.0009 44.8856C24.0211 44.2081 24.0514 43.5812 24.1019 42.9948L24.1322 42.7016C25.506 28.9808 28.5263 5.33096 33.3043 1.0034C34.1932 0.194516 35.2741 -0.139153 36.4256 0.052958C40.8299 0.770846 45.7795 8.94063 50.4767 17.2519C51.3656 18.8192 52.1535 20.2246 52.6485 20.9728C54.9213 20.5684 56.7092 20.4774 57.6083 20.4673H63.0125C64.1237 20.4875 65.8308 20.5886 67.9925 20.9728C68.5077 20.1639 69.3158 18.5967 70.1643 16.9587C74.3665 8.83951 78.4878 1.49885 82.589 0.750626C83.7405 0.538293 84.8315 0.871972 85.7608 1.71119C91.3873 6.80719 96.0844 30.1032 96.842 43.9149C96.8724 44.4609 96.8724 45.0271 96.8724 45.6136C96.8724 49.0716 96.8825 53.389 103.539 59.7186C103.792 59.9511 103.903 60.305 103.832 60.6387C103.499 62.4081 100.388 65.8965 98.8926 67.494L103.63 72.8023C103.893 73.0956 103.964 73.5303 103.802 73.8943C102.085 77.6759 98.6199 80.598 96.9835 81.8214L99.4482 85.0772C99.6098 85.2895 99.6805 85.5626 99.6401 85.8254C99.5997 86.0883 99.4583 86.331 99.2462 86.4927L88.3367 94.6625C87.8922 94.9962 87.2558 94.9052 86.9225 94.4603C86.5891 94.0154 86.6801 93.3784 87.1245 93.0448L97.2259 85.4918L94.7511 82.2158C94.5793 81.9933 94.5086 81.7102 94.5591 81.4372C94.6096 81.1642 94.7713 80.9215 95.0036 80.7598C95.0541 80.7294 99.5492 77.7467 101.691 73.6415L96.7915 68.1411C96.438 67.7468 96.4481 67.1401 96.8219 66.766C98.5694 64.9662 101.014 62.125 101.701 60.7196C94.8824 54.026 94.8824 49.1727 94.8824 45.6136C94.8824 45.0575 94.8824 44.5317 94.8521 44.016C94.0238 29.0617 89.1953 7.51495 84.4375 3.20762C83.9729 2.79306 83.5082 2.64139 82.9829 2.73239C79.5182 3.35928 74.619 12.8031 71.9926 17.8788C70.6087 20.5381 69.8006 22.0749 69.2349 22.7321C69.0026 23.0051 68.6289 23.1265 68.2854 23.0557C65.851 22.5805 63.9519 22.4794 63.0327 22.4693H57.6689C56.7698 22.4895 54.8708 22.5805 52.4464 23.0557C52.0929 23.1265 51.7292 23.0051 51.4969 22.7321C50.9615 22.1255 50.1938 20.7706 48.7594 18.2327C45.6886 12.793 39.9611 2.6515 36.1428 2.03472C35.5973 1.94373 35.1428 2.0954 34.6983 2.48974C31.6174 5.2804 28.4354 20.3763 26.1828 42.8937L26.1525 43.1768C26.102 43.7228 26.0818 44.3093 26.0515 44.9361C25.9202 48.5964 25.7182 54.0766 19.0007 60.7094C19.6977 62.1149 22.1423 64.9561 23.8898 66.7559C24.2636 67.1401 24.2737 67.7367 23.9201 68.131L19.0108 73.6314C21.1523 77.7466 25.6576 80.7193 25.698 80.7496C25.9303 80.9013 26.0919 81.144 26.1424 81.4271C26.1929 81.7001 26.1222 81.9832 25.9505 82.2057L23.5161 85.421C25.7081 86.8163 31.7285 90.4159 38.9207 92.883C39.446 93.065 39.7288 93.6413 39.547 94.1671C39.3752 94.612 38.9813 94.8749 38.557 94.8749Z"
        fill="#036AC9"
      />
      <path
        d="M45.2846 24.441L32.5872 32.7422C32.5872 32.7422 34.9206 12.0549 37.254 11.4988C39.5975 10.9325 45.2846 24.441 45.2846 24.441Z"
        fill="#7CBFFD"
      />
      <path
        d="M75.5483 24.0568L88.2458 32.3581C88.2458 32.3581 84.2355 12.4392 81.9021 11.8831C79.5687 11.3169 75.5483 24.0568 75.5483 24.0568Z"
        fill="#7CBFFD"
      />
      <path
        d="M43.5975 57.9289C46.2363 57.9289 48.3755 55.7877 48.3755 53.1463C48.3755 50.505 46.2363 48.3638 43.5975 48.3638C40.9588 48.3638 38.8196 50.505 38.8196 53.1463C38.8196 55.7877 40.9588 57.9289 43.5975 57.9289Z"
        fill="#036AC9"
      />
      <path
        d="M77.0432 57.9289C79.682 57.9289 81.8212 55.7877 81.8212 53.1463C81.8212 50.505 79.682 48.3638 77.0432 48.3638C74.4044 48.3638 72.2653 50.505 72.2653 53.1463C72.2653 55.7877 74.4044 57.9289 77.0432 57.9289Z"
        fill="#036AC9"
      />
      <path
        d="M75.2049 53.1465C75.9301 53.1465 76.5181 52.558 76.5181 51.832C76.5181 51.1061 75.9301 50.5176 75.2049 50.5176C74.4796 50.5176 73.8917 51.1061 73.8917 51.832C73.8917 52.558 74.4796 53.1465 75.2049 53.1465Z"
        fill="white"
      />
      <path
        d="M41.4662 53.1465C42.1915 53.1465 42.7794 52.558 42.7794 51.832C42.7794 51.1061 42.1915 50.5176 41.4662 50.5176C40.741 50.5176 40.1531 51.1061 40.1531 51.832C40.1531 52.558 40.741 53.1465 41.4662 53.1465Z"
        fill="white"
      />
      <path
        d="M66.75 63.6313H53.6788C53.1535 63.6313 52.7292 64.056 52.7292 64.5818V65.5423C52.7292 68.06 54.7697 70.0923 57.2749 70.0923H63.1438C65.659 70.0923 67.6894 68.0499 67.6894 65.5423V64.5818C67.6995 64.056 67.2753 63.6313 66.75 63.6313Z"
        fill="#036AC9"
      />
      <path
        d="M63.962 65.8154H56.4263C56.1233 65.8154 55.8809 65.9469 55.8809 66.1087V66.4019C55.8809 67.1703 57.0526 67.7871 58.5072 67.7871H61.8912C63.3357 67.7871 64.5176 67.1703 64.5176 66.4019V66.1087C64.5176 65.9368 64.265 65.8154 63.962 65.8154Z"
        fill="#7CBFFD"
      />
      <path
        d="M53.6486 80.2241C49.4666 80.2241 46.0725 76.574 46.0725 72.0948V70.1029C46.0725 69.5468 46.5271 69.0918 47.0826 69.0918C47.6382 69.0918 48.0928 69.5468 48.0928 70.1029V72.0948C48.0928 75.4618 50.5878 78.2019 53.6486 78.2019C56.7093 78.2019 59.2043 75.4618 59.2043 72.0948V70.1029C59.2043 69.5468 59.6589 69.0918 60.2145 69.0918C60.77 69.0918 61.2246 69.5468 61.2246 70.1029V72.0948C61.2246 76.574 57.8305 80.2241 53.6486 80.2241Z"
        fill="#036AC9"
      />
      <path
        d="M66.7904 80.2241C62.6084 80.2241 59.2144 76.574 59.2144 72.0948V70.1029C59.2144 69.5468 59.6689 69.0918 60.2245 69.0918C60.7801 69.0918 61.2346 69.5468 61.2346 70.1029V72.0948C61.2346 75.4618 63.7297 78.2019 66.7904 78.2019C69.8511 78.2019 72.3462 75.4618 72.3462 72.0948V70.1029C72.3462 69.5468 72.8007 69.0918 73.3563 69.0918C73.9119 69.0918 74.3664 69.5468 74.3664 70.1029V72.0948C74.3664 76.574 70.9724 80.2241 66.7904 80.2241Z"
        fill="#036AC9"
      />
      <path
        d="M100.872 170.739C100.468 170.304 100.337 169.121 100.337 168.443C100.337 162.801 105.297 156.169 110.539 158.231C117.469 160.951 120.742 164.53 120.742 168.443C120.742 169.121 120.691 170.102 120.136 170.516C119.59 170.931 101.287 171.173 100.872 170.739Z"
        fill="white"
      />
      <path
        d="M106.357 171.992C100.66 171.992 100.428 171.75 100.135 171.446C99.3875 170.648 99.3269 168.959 99.3269 168.453C99.3269 164.49 101.479 160.263 104.549 158.16C106.57 156.785 108.822 156.472 110.903 157.301C119.863 160.82 121.752 165.309 121.752 168.453C121.752 169.09 121.752 170.577 120.742 171.335C120.449 171.547 120.055 171.851 110.459 171.972C108.853 171.982 107.499 171.992 106.357 171.992ZM101.529 169.849C104.054 170.091 117.408 169.92 119.6 169.606C119.661 169.465 119.742 169.151 119.742 168.443C119.742 164.834 116.439 161.628 110.176 159.171C108.327 158.443 106.721 159.121 105.701 159.819C103.186 161.537 101.357 165.157 101.357 168.433C101.357 169.02 101.438 169.545 101.529 169.849Z"
        fill="#036AC9"
      />
      <path
        d="M113.964 171.214C113.428 171.214 112.974 170.789 112.954 170.243L112.519 159.323C112.499 158.767 112.933 158.292 113.489 158.272C114.024 158.231 114.519 158.686 114.54 159.242L114.974 170.162C114.994 170.718 114.56 171.194 114.004 171.214C113.994 171.214 113.984 171.214 113.964 171.214Z"
        fill="#036AC9"
      />
      <path
        d="M107.873 171.002C107.337 171.002 106.883 170.577 106.863 170.031L106.428 159.111C106.408 158.555 106.842 158.08 107.398 158.059C107.933 158.009 108.428 158.474 108.448 159.03L108.883 169.95C108.903 170.506 108.469 170.981 107.913 171.002C107.893 171.002 107.883 171.002 107.873 171.002Z"
        fill="#036AC9"
      />
      <path
        d="M20.8897 170.738C21.2937 170.303 21.4251 169.12 21.4251 168.443C21.4251 162.801 16.4653 156.168 11.2227 158.231C4.2931 160.951 1.02026 164.53 1.02026 168.443C1.02026 169.12 1.07076 170.101 1.62634 170.516C2.17181 170.93 20.4755 171.173 20.8897 170.738Z"
        fill="white"
      />
      <path
        d="M15.4046 171.992C14.2632 171.992 12.9096 171.982 11.2934 171.962C1.69704 171.84 1.30308 171.547 1.01014 171.325C0 170.566 0 169.08 0 168.443C0 165.299 1.87887 160.809 10.8388 157.291C12.9197 156.472 15.1824 156.775 17.1926 158.15C20.2735 160.253 22.415 164.48 22.415 168.443C22.415 168.949 22.3544 170.637 21.6069 171.436C21.324 171.749 21.1018 171.992 15.4046 171.992ZM2.1617 169.606C4.3436 169.919 17.7077 170.081 20.2331 169.849C20.324 169.545 20.4149 169.019 20.4149 168.443C20.4149 165.167 18.5866 161.537 16.0713 159.828C15.0511 159.131 13.4349 158.453 11.5964 159.181C5.34365 161.638 2.03039 164.844 2.03039 168.453C2.02029 169.151 2.10109 169.464 2.1617 169.606Z"
        fill="#036AC9"
      />
      <path
        d="M7.79829 171.214C7.77809 171.214 7.76799 171.214 7.75789 171.214C7.20232 171.194 6.76795 170.718 6.78815 170.162L7.22252 160.253C7.24272 159.697 7.73768 159.252 8.27306 159.283C8.82863 159.303 9.263 159.778 9.2428 160.334L8.80843 170.243C8.77813 170.789 8.33367 171.214 7.79829 171.214Z"
        fill="#036AC9"
      />
      <path
        d="M13.8895 171.001C13.8794 171.001 13.8592 171.001 13.8491 171.001C13.2935 170.981 12.8591 170.506 12.8793 169.95L13.3137 159.03C13.3339 158.474 13.7986 158.019 14.3642 158.059C14.9198 158.079 15.3542 158.555 15.334 159.111L14.8996 170.031C14.8794 170.577 14.435 171.001 13.8895 171.001Z"
        fill="#036AC9"
      />
      <path
        d="M64.8207 171.234C68.4471 164.844 74.3059 154.096 76.8717 147.22C79.2455 140.88 80.0839 133.449 77.508 122.347C77.508 122.347 70.9219 126.583 68.1239 129.91L61.8105 116.674L61.7499 116.786L61.6893 116.674L55.3759 129.91C52.5778 126.583 45.9917 122.347 45.9917 122.347C43.4159 133.449 44.2543 140.88 46.6281 147.22C49.1939 154.065 55.0223 164.763 58.6386 171.163L64.8207 171.234Z"
        fill="#7CBFFD"
      />
      <path
        d="M84.8921 173.317L69.5885 173.57C69.5885 173.57 64.3762 179.484 57.6992 184.489C52.6687 188.271 46.6887 190.961 41.9713 193.316C34.1326 197.219 25.7182 191.294 28.9708 184.58C32.2235 177.867 54.9819 170.253 54.9819 170.253L76.3463 154.187"
        fill="white"
      />
      <path
        d="M36.7994 195.561C34.0114 195.561 31.3649 194.6 29.4961 192.74C27.1324 190.394 26.5869 187.179 28.0617 184.146C31.3447 177.351 52.2949 170.101 54.5071 169.353L75.7402 153.388C76.1847 153.054 76.8211 153.145 77.1545 153.59C77.4878 154.035 77.3969 154.672 76.9524 155.005L55.588 171.072C55.4971 171.133 55.4062 171.183 55.3051 171.224C49.0827 173.307 32.3952 179.838 29.89 185.025C28.7991 187.28 29.1728 189.575 30.9305 191.304C33.0013 193.357 37.2035 194.57 41.5369 192.417C42.244 192.063 42.9713 191.709 43.7289 191.335C48.0321 189.232 52.901 186.845 57.1133 183.681C63.6388 178.787 68.8006 172.953 68.8511 172.892C69.043 172.68 69.3057 172.558 69.5885 172.548L84.8921 172.295C84.9022 172.295 84.9022 172.295 84.9123 172.295C85.4578 172.295 85.9123 172.74 85.9225 173.286C85.9326 173.842 85.4881 174.308 84.9325 174.318L70.0734 174.57C68.8612 175.905 64.1843 180.9 58.3255 185.298C53.9617 188.574 49.0019 191.001 44.6179 193.145C43.8704 193.509 43.1431 193.862 42.436 194.216C40.6177 195.126 38.6783 195.561 36.7994 195.561Z"
        fill="#036AC9"
      />
      <path
        d="M35.3347 170.597C39.3248 172.69 63.8509 172.387 63.8509 172.387C63.8509 172.387 68.8612 191.345 75.7605 196.745C82.6597 202.144 93.1955 196.896 89.9428 190.172C86.6902 183.459 78.4676 169.07 78.4676 169.07L49.113 153.004"
        fill="white"
      />
      <path
        d="M82.2253 200C79.8616 200 77.3564 199.282 75.1442 197.543C68.7804 192.558 64.1236 177.078 63.0933 173.408C58.3759 173.448 38.6883 173.499 34.87 171.497C34.375 171.234 34.1831 170.627 34.4458 170.132C34.7084 169.636 35.3145 169.454 35.8095 169.707C38.5671 171.153 54.0829 171.507 63.8509 171.386H63.861C64.3156 171.386 64.7196 171.699 64.8408 172.134C64.8914 172.316 69.841 190.829 76.3968 195.956C80.0838 198.837 85.0335 198.342 87.6902 196.188C89.5387 194.692 90.0337 192.67 89.0438 190.627C86.0841 184.5 78.8515 171.77 77.7403 169.839L48.6382 153.914C48.1533 153.651 47.9715 153.034 48.2342 152.539C48.5069 152.053 49.113 151.871 49.6079 152.134L78.9626 168.201C79.1242 168.292 79.2656 168.423 79.3565 168.585C79.4374 168.726 87.6296 183.074 90.862 189.747C92.2762 192.659 91.559 195.662 88.9529 197.766C87.2558 199.12 84.8214 200 82.2253 200Z"
        fill="#036AC9"
      />
      <path
        d="M77.6291 185.753C77.6291 185.753 82.7404 191.406 75.7604 196.744L77.6291 185.753Z"
        fill="white"
      />
      <path
        d="M75.7603 197.755C75.4573 197.755 75.1542 197.614 74.9522 197.361C74.6189 196.916 74.6997 196.279 75.1441 195.946C77.1341 194.429 78.2251 192.761 78.3968 190.991C78.6392 188.453 76.8917 186.461 76.8715 186.441C76.4977 186.027 76.5381 185.39 76.9523 185.015C77.3664 184.641 78.0028 184.672 78.3766 185.086C78.4776 185.187 80.7302 187.725 80.4171 191.153C80.2049 193.519 78.8412 195.673 76.3765 197.553C76.1846 197.695 75.9725 197.755 75.7603 197.755Z"
        fill="#036AC9"
      />
      <path
        d="M84.8921 187.654C84.8921 187.654 89.1347 193.347 83.0637 198.979L84.8921 187.654Z"
        fill="white"
      />
      <path
        d="M83.0638 199.99C82.7911 199.99 82.5183 199.879 82.3264 199.667C81.9426 199.262 81.9729 198.615 82.3769 198.241C87.7205 193.286 84.2356 188.463 84.084 188.261C83.7507 187.816 83.8416 187.179 84.2861 186.846C84.7305 186.512 85.3669 186.603 85.7003 187.048C85.7508 187.109 90.4075 193.539 83.7507 199.717C83.5588 199.899 83.3062 199.99 83.0638 199.99Z"
        fill="#036AC9"
      />
      <path
        d="M41.2642 185.753C41.2642 185.753 36.0923 191.244 37.658 194.58L41.2642 185.753Z"
        fill="white"
      />
      <path
        d="M37.6581 195.591C37.2742 195.591 36.9106 195.379 36.7388 195.005C34.9408 191.153 39.9511 185.672 40.5269 185.056C40.9107 184.651 41.5471 184.631 41.9512 185.015C42.3552 185.399 42.3754 186.036 41.9915 186.441C40.7693 187.735 37.5267 191.931 38.5571 194.146C38.7894 194.651 38.5773 195.258 38.0722 195.49C37.951 195.561 37.7995 195.591 37.6581 195.591Z"
        fill="#036AC9"
      />
      <path
        d="M35.3347 183.802C35.3347 183.802 30.1627 189.293 31.7285 192.629L35.3347 183.802Z"
        fill="white"
      />
      <path
        d="M31.7184 193.64C31.3345 193.64 30.9709 193.428 30.7991 193.054C29.0011 189.201 34.0114 183.721 34.5872 183.104C34.971 182.7 35.6074 182.68 36.0115 183.064C36.4155 183.448 36.4357 184.085 36.0519 184.49C34.8296 185.784 31.587 189.98 32.6275 192.194C32.8598 192.7 32.6477 193.307 32.1426 193.539C32.0113 193.61 31.8699 193.64 31.7184 193.64Z"
        fill="#036AC9"
      />
    </svg>
  );
};

export default AlfieOutlined;

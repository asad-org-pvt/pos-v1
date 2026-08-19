import {createUseStyles} from 'react-jss';
import {Country} from 'react-phone-number-input';
import {ThemeInterface} from '../../../../interfaces/theme';

export interface ComponentProps {
  children?: JSX.Element[] | JSX.Element;
  label?: string;
  name?: string;
  placeholder?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  type?: 'text' | 'email' | 'number' | 'password' | 'checkbox' | 'phone' | 'calendar';
  labelClassName?: string;
  inputClassName?: string;
  inputContainerClassName?: string;
  errorClassName?: string;
  containerClassName?: string;
  optional?: boolean;
  value?: string;
  showTooltip?: boolean;
  requirements?: string[];
  isError?: boolean;
  isTouched?: boolean;
  defaultCountry?: Country;
  variant?: 'primary' | 'secondary';
  onChange?: (value: any | undefined) => void;
  mask?: string;
}

export const useStylesFromThemeFunction = createUseStyles((theme: ThemeInterface) => {
  return {
    inputDefault: {
      all: 'unset',
      width: '100%',
      height: 38,
      padding: '2px 8px',
      color: 'var(--text-primary, #0f172a)',
      backgroundColor: 'var(--input-bg, #ffffff)',
      '&::placeholder': {
        color: 'var(--input-placeholder, #94a3b8)',
      },
      '&:focus': {
        border: 'none',
        background: 'none',
      },
    },
    inputDisabled: {
      opacity: 0.3,
      pointerEvents: 'none',
    },
    inputNumber: {
      overflow: 'hidden',
      paddingLeft: 10,
      borderRadius: '10px',
      backgroundColor: 'var(--input-bg, #ffffff)',
      border: '1px solid var(--input-border, rgba(0, 0, 0, 0.2))',
      width: '100%',
      '& .PhoneInputInput': {
        border: 'none',
        font: 'inherit',
        fontSize: '15px',
        backgroundColor: 'transparent',
        color: 'var(--text-primary, #0f172a)',
        '&:focus': {
          outline: '0px',
          border: 'none',
        },
        padding: '9.5px',
        '&::placeholder': {
          color: 'var(--input-placeholder, #94a3b8)',
        },
      },
      '& .PhoneInputCountrySelect': {
        color: 'var(--text-primary, #0f172a)',
        backgroundColor: 'var(--input-bg, #ffffff)',
        '& option': {
          padding: 2,
          font: 'inherit',
          fontSize: '15px',
          backgroundColor: 'var(--bg-paper, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
        },
      },
    },
    contentContainer: {
      '& span': {
        paddingLeft: '10px',
      },
    },
    label: {
      paddingLeft: '10px',
      paddingRight: '10px',
      paddingBottom: '4px',
      fontSize: '13px',
      display: 'flex',
      justifyContent: 'space-between',
      color: 'var(--text-primary, #0f172a)',
      '& span': {
        fontWeight: 'normal',
        fontSize: '13px',
        color: 'var(--text-secondary, #64748b)',
      },
      fontWeight: 'bold',
    },
    passwordContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      width: '100%',
    },
    passwordSubContainer: {
      border: 'solid',
      borderWidth: '1px',
      borderRadius: '10px',
      borderColor: 'var(--input-border, rgba(0, 0, 0, 0.2))',
      backgroundColor: 'var(--input-bg, #ffffff)',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
    },
    passwordError: {
      borderColor: 'var(--error, #dc2626)',
    },
    passwordValid: {
      borderColor: 'var(--success, #16a34a)',
    },
    passwordInput: {
      border: 0,
      height: '100%',
      width: '100%',
      borderRadius: '10px 0px 0px 10px',
      backgroundColor: 'var(--input-bg, #ffffff)',
      color: 'var(--text-primary, #0f172a)',
      padding: '12px',
      fontSize: '15px',
      '&::placeholder': {
        color: 'var(--input-placeholder, #94a3b8)',
      },
      '&:focus': {
        outline: '0px',
        borderRadius: '10px',
        backgroundColor: 'var(--input-bg, #ffffff)',
      },
    },
    passwordIcon: {
      border: 0,
      paddingTop: 2,
      paddingBottom: 2,
      backgroundColor: 'transparent',
      color: 'var(--text-secondary, #64748b)',
    },
    inputContainer: {
      border: '1px solid',
      borderWidth: '1px',
      borderColor: 'var(--input-border, rgba(0, 0, 0, 0.2))',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      width: '100%',
      backgroundColor: 'var(--input-bg, #ffffff)',
    },
    labelDefault: {
      color: 'var(--text-primary, #0f172a)',
    },
  };
});

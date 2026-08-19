import {createUseStyles} from 'react-jss';
import {ThemeInterface} from '../../../../interfaces/theme';

export interface ComponentProps {
  label?: string;
  options: {value: any; label: string | undefined}[];
  value?: any;
  onChange?: (value: any) => void;
  onInputChange?: (value: any) => void;
  placeholder?: string;
  isClearable?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  isOptional?: boolean;
  name?: string;
  variant?: 'primary' | 'secondary';
  isError?: boolean;
  isTouched?: boolean;
}

export const useStylesFromThemeFunction = createUseStyles((theme: ThemeInterface) => {
  return {
    SelectLabel: {
      color: 'var(--text-primary, #0f172a)',
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 4,
      paddingLeft: '10px',
      paddingRight: '10px',
      paddingBottom: '4px',
      display: 'flex',
      justifyContent: 'space-between',
      '& span': {
        fontWeight: 'normal',
        fontSize: '13px',
        color: 'var(--text-secondary, #64748b)',
      },
    },
    container: {
      width: '100%',
    },
  };
});

interface CustomStyle {
  variant?: 'primary' | 'secondary';
  isFocus: boolean;
  isError: boolean;
  isTouched?: boolean;
}

export const customStyles = ({variant, isFocus, isError, isTouched}: CustomStyle) => {
  const color = () => {
    if (isTouched && !isError) {
      return 'var(--success, #16a34a)';
    }
    if (isError) {
      return 'var(--error, #dc2626)';
    }
    if (isFocus) {
      return 'var(--primary-color, #0d6efd)';
    }

    return 'var(--border-color, rgba(0, 0, 0, 0.15))';
  };
  return {
    control: (base: any, state: {isFocused: any}) => ({
      ...base,
      background: variant === 'primary' ? 'var(--input-bg, #ffffff)' : 'var(--bg-surface, #f1f5f9)',
      color: 'var(--text-primary, #0f172a)',
      borderRadius: 10,
      height: 42,
      border: `1px solid ${color()}`,
      boxShadow: 'none',
    }),
    menuList: (base: any) => ({
      ...base,
      padding: 0,
      borderRadius: 10,
      backgroundColor: 'var(--bg-paper, #ffffff)',
      color: 'var(--text-primary, #0f172a)',
      '&:focus': {
        outline: '0px',
        borderRadius: '10px',
        border: `var(--primary-color, #0d6efd) 1px solid`,
        backgroundColor: 'var(--bg-paper, #ffffff)',
      },
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: 10,
      backgroundColor: 'var(--bg-paper, #ffffff)',
      border: '1px solid var(--border-color, rgba(0, 0, 0, 0.12))',
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: 'var(--text-secondary, #64748b)',
      '&:hover': {
        color: 'var(--text-primary, #0f172a)',
      },
    }),
    option: (base: any, state: {isSelected: any}) => ({
      ...base,
      backgroundColor: state.isSelected ? 'var(--primary-color, #0d6efd)' : 'transparent',
      color: state.isSelected ? '#ffffff' : 'var(--text-primary, #0f172a)',
      '&:hover': {backgroundColor: !state.isSelected && 'var(--bg-surface-hover, rgba(0, 0, 0, 0.04))'},
      ':active': {
        ...base[':active'],
        backgroundColor: 'var(--bg-surface-hover, rgba(0, 0, 0, 0.04))',
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'var(--text-primary, #0f172a)',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'var(--input-placeholder, #94a3b8)',
    }),
    input: (base: any) => ({
      ...base,
      color: 'var(--text-primary, #0f172a)',
    }),
    valueContainer: (base: any) => ({
      ...base,
      color: 'var(--text-primary, #0f172a)',
    }),
  };
};

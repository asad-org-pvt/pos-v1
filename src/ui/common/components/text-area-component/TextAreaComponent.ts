import {ThemeInterface} from '../../../../interfaces/theme';
import {createUseStyles} from 'react-jss';

export interface ComponentProps {
  resizable?: boolean;
  errorClassName?: string;
  label?: string;
  onChange?: (e: any) => void;
  variant?: 'primary' | 'secondary';
  placeholder?: string;
}

export const useStylesFromThemeFunction = createUseStyles((theme: ThemeInterface) => {
  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      marginTop: 20,
      '& label': {
        marginLeft: 10,
        fontWeight: 600,
        fontSize: 13,
        color: 'var(--text-primary, #0f172a)',
      },
    },
    textAreaContainer: {
      position: 'relative',
    },
    textArea: {
      height: 100,
      border: '1px solid var(--input-border, rgba(0, 0, 0, 0.2))',
      backgroundColor: 'var(--input-bg, #ffffff)',
      color: 'var(--text-primary, #0f172a)',
      borderRadius: 10,
      padding: 10,
      fontFamily: 'inherit',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
      '&::placeholder': {
        color: 'var(--input-placeholder, #94a3b8)',
      },
      '&:focus': {
        border: '1px solid var(--primary-color, #0d6efd)',
      },
    },
    error: {
      color: 'var(--error, #dc2626)',
    },
    validated: {
      color: 'var(--success, #16a34a)',
    },
    errorChild: {
      border: '1px solid var(--error, #dc2626)',
    },
    validatedChild: {
      border: '1px solid var(--success, #16a34a)',
    },
    resizeDisabled: {
      resize: 'none',
    },
    textAreaSecondVariant: {
      backgroundColor: 'var(--bg-surface, #f1f5f9)',
    },
  };
});

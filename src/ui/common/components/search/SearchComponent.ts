import {createUseStyles} from 'react-jss';
import {ThemeInterface} from '../../../../interfaces/theme';

export interface ComponentProps {
  placeholder?: string;
  setSearch?: (search: string) => void;
}

export const useStylesFromThemeFunction = createUseStyles((theme: ThemeInterface) => {
  return {
    container: {
      height: 40,
      borderStyle: 'solid',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'var(--border-color, rgba(0, 0, 0, 0.12))',
      backgroundColor: 'var(--bg-surface, #f8fafc)',
      color: 'var(--text-primary, #0f172a)',
      overflow: 'hidden',
      paddingLeft: 6,
      paddingRight: 6,
      marginLeft: 0,
      marginRight: 4,
      width: '100%',
      display: 'flex',
      paddingTop: 5,
      paddingBottom: 5,
      alignItems: 'center',
      boxSizing: 'border-box',
    },
    input: {
      paddingLeft: 6,
      paddingRight: 6,
      borderRadius: 5,
      width: '100%',
      height: '100%',
      outline: 'none',
      border: 'none',
      fontSize: 14,
      backgroundColor: 'transparent',
      color: 'var(--text-primary, #0f172a)',
      '&::placeholder': {
        color: 'var(--input-placeholder, #94a3b8)',
      },
    },
    imageIcon: {
      width: 20,
      height: 20,
    },
  };
});

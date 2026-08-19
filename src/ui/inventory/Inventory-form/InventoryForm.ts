import {createUseStyles} from 'react-jss';
import {ThemeInterface} from '../../../interfaces/theme';

export interface ComponentProps {
  onSubmit: (data: any) => void;
  onChange?: (data: any) => void;
  onImageChange?: (data: any) => void;
  suppliers?: any[];
  categories?: any[];
  isLoading?: boolean;
  product?: any;
  disabled?: boolean;
}

export const useStylesFromThemeFunction = createUseStyles((theme: ThemeInterface) => {
  return {
    formBackground: {
      backgroundColor: 'var(--bg-paper, #ffffff)',
      color: 'var(--text-primary, #0f172a)',
    },
    container: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'row',
      padding: '10px',
      margin: '2px',
      backgroundColor: 'var(--bg-paper, #ffffff)',
      color: 'var(--text-primary, #0f172a)',
    },
    innerContainerLeft: {
      width: '70%',
      minWidth: 'fit-content',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px',
      margin: '2px',
      borderRadius: '10px',
      backgroundColor: 'var(--bg-paper, #ffffff)',
    },
    innerContainerRight: {
      width: '30%',
      minWidth: 'fit-content',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px',
      margin: '2px',
      borderRadius: '10px',
      backgroundColor: 'var(--bg-paper, #ffffff)',
    },
    productSearchContainer: {
      width: '100%',
      position: 'relative',
      top: 0,
      left: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '5px',
      margin: '5px',
      borderRadius: '5px',
      backgroundColor: 'var(--bg-surface, #f1f5f9)',
    },
    productSuggestionContainer: {
      width: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'row',
      height: '100%',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      minHeight: 'fit-content',
      padding: '10px',
      backgroundColor: 'var(--bg-surface, #f1f5f9)',
    },
    addedProductsContainer: {
      width: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'var(--bg-surface, #f1f5f9)',
    },
    labelHintWrapper: {
      fontSize: '12px',
      color: 'var(--text-secondary, #64748b)',
      fontWeight: 'bold',
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      width: '100%',
    },
    column: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      width: '100%',
      color: 'var(--text-primary, #0f172a)',
    },
    equallyDistantRow: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      width: '100%',
    },
    buttonsContainer: {
      width: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'row',
    },
    iconWrapper: {
      width: '20px',
      height: '20px',
      cursor: 'pointer',
    },
    colorRed: {
      color: 'var(--error, #dc2626)',
    },
    qualtityButtonWrapper: {
      width: '30px',
      height: '20px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    centeredRow: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    formWrapper: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: '10%',
      paddingRight: '10%',
    },
  };
});
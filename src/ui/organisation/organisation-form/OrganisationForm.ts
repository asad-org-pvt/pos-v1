import { createUseStyles } from "react-jss";
import { Colors } from "../../common/colors";
import { ThemeInterface } from "../../../interfaces/theme";

export interface ComponentProps {
  onSubmit: (data: any, {}: any) => void;
  onChange?: (data: any) => void;
  onImageChange?: (data: any) => void;
  options?: { value: any; label: string | undefined }[];
  isLoading?: boolean;
  organisation?: any;
  disabled?: boolean;
}

export const useStylesFromThemeFunction = createUseStyles(
  (theme: ThemeInterface) => {
    return {
      container: {
        width: "100%",
        minWidth: "fit-content",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px",
        margin: "2px",
        borderRadius: "10px",
        backgroundColor: Colors.blueGrayLight,
      },
      innerContainerLeft: {
        width: "70%",
        minWidth: "fit-content",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px",
        margin: "2px",
        borderRadius: "10px",
        backgroundColor: Colors.blueGrayLight,
        "@media (max-width: 768px)": {
          width: "100%",
          minWidth: "0",
        },
      },
      innerContainerRight: {
        width: "30%",
        minWidth: "fit-content",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px",
        margin: "2px",
        borderRadius: "10px",
        backgroundColor: Colors.blueGrayLight,
        "@media (max-width: 768px)": {
          width: "100%",
          minWidth: "0",
        },
      },
      productSearchContainer: {
        width: "100%",
        position: "relative",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "5px",
        margin: "5px",
        borderRadius: "5px",
        backgroundColor: Colors.blueGrayLightDim,
      },
      productSuggestionContainer: {
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "row",
        height: "100%",
        alignItems: "flex-start",
        justifyContent: "space-between",
        minHeight: "fit-content",
        padding: "10px",
        backgroundColor: Colors.blueGrayLight,
      },
      addedProductsContainer: {
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.blueGrayLight,
      },
      labelHintWrapper: {
        fontSize: "12px",
        color: Colors.gray,
        fontWeight: "bold",
      },
      row: {
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        width: "100%",
      },
      column: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        width: "100%",
      },
      equallyDistantRow: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        width: "100%",
      },
      buttonsContainer: {
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "row",
      },
      iconWrapper: {
        width: "20px",
        height: "20px",
        cursor: "pointer",
      },
      colorRed: {
        color: Colors.red,
      },
      qualtityButtonWrapper: {
        width: "30px",
        height: "20px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
      },
      centeredRow: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      },
      formWrapper: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: "10%",
        paddingRight: "10%",
        "@media (max-width: 768px)": {
          paddingLeft: "0",
          paddingRight: "0",
        },
      },
    };
  }
);

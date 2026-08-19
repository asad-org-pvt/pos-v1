import React from 'react';
import {ErrorMessage, Field, FieldProps, useFormik, useFormikContext} from 'formik';
import {createUseStyles} from 'react-jss';
import _, {drop} from 'lodash';
import {ThemeInterface} from '../../../../interfaces/theme';

interface ComponentProps {
  name: string;
  children: JSX.Element[] | JSX.Element;
  onChange?: (value: any) => void;
  variant?: 'primary' | 'secondary' | 'primary-outline' | 'secondary-outline';
}

const useStylesFromThemeFunction = createUseStyles((theme: ThemeInterface) => {
  return {
    errorMessage: {
      color: "var(--error, #dc2626)",
      fontSize: "12px",
      marginTop: "4px",
    },
  };
});

const FieldWrapper: React.FC<ComponentProps> = (props) => {
  const {setFieldTouched, getFieldMeta} = useFormikContext();
  const classes = useStylesFromThemeFunction();

  const {children, onChange: onChangeProp, name, variant = 'primary'} = props;
  const {value: initialValue} = getFieldMeta(name);
  React.useEffect(() => {
    if (!_.isEmpty(initialValue)) {
      setFieldTouched(name, true);
    }
  }, []);
  return (
    <>
      <Field {...props}>
        {(fieldProps: FieldProps) => {
          const {field, form, meta} = fieldProps;
          const onChange = (value: any) => {
            form.setFieldValue(field.name, value);
            if (onChangeProp) onChangeProp(value);
          };
          const isTouched = meta.touched;
          const isError = _.get(form.errors, field.name) && _.get(form.errors, field.name) && isTouched;
          return React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return (
                <div>
                  {React.cloneElement(child, {
                    onChange,
                    value: field.value,
                    isError,
                    isTouched,
                    isDirty: form.dirty,
                  })}
                  <ErrorMessage name={field.name}>
                    {(msg) => <div className={classes.errorMessage}>{msg}</div>}
                  </ErrorMessage>
                </div>
              );
            }
            return child;
          });
        }}
      </Field>
    </>
  );
};

export default FieldWrapper;

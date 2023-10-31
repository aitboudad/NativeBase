import get from 'lodash.get';
import isNil from 'lodash.isnil';
import mergeWith from 'lodash.mergewith';
import cloneDeep from 'lodash.clonedeep';
import { themePropertyMap } from './../../theme/base';
import {
  getClosestBreakpoint,
  findLastValidBreakpoint,
  hasValidBreakpointFormat,
  extractInObject,
} from './../../theme/tools';
import { useContrastText } from '../useContrastText';
import { isValidElement } from 'react';

export function isBlankString(value: any) {
  return value === '';
}

export function isObject(x: any) {
  return x != null && typeof x === 'object';
}

export function objAndSameType(obj1: any, obj2: any) {
  return (
    isObject(obj1) &&
    isObject(obj2) &&
    Object.getPrototypeOf(obj1) === Object.getPrototypeOf(obj2) &&
    !(Array.isArray(obj1) || Array.isArray(obj2))
  );
}

export function isFunction(value: any) {
  return typeof value === 'function';
}

export function clone(value: any): any {
  if (!isObject(value) || isValidElement(value) || isFunction(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0).map((v) => clone(v));
  }

  const newVal = {} as any;
  for (var i = 0, keys = Object.keys(value); i < keys.length; i++) {
    const prop = keys[i];
    newVal[prop] = clone(value[prop]);
  }

  return newVal;
}

export function reverseDeepMerge(...dest: any): any;
export function reverseDeepMerge(dest: any) {
  for (let index = 1; index < arguments.length; index++) {
    const src = arguments[index];
    for (const srcArg in src) {
      if (isNil(dest[srcArg]) || isBlankString(dest[srcArg])) {
        dest[srcArg] = srcArg === 'children' ?  src[srcArg] : clone(src[srcArg]);
      } else if (objAndSameType(dest[srcArg], src[srcArg]) && dest[srcArg] !== src[srcArg]) {
        reverseDeepMerge(dest[srcArg], src[srcArg]);
      }
    }
  }
  return dest;
}

/*
 Extract props from theme props and omit those from props
*/
/**
 *
 * @param props Props passed by the user
 * @param theme Theme object
 * @param colorModeProps `colorMode` object
 * @param componentTheme Theme for specific components
 * @param currentBreakpoint Current breakpoint values
 * @returns Extracting props from defaultProps while overriding the props that are already present
 */
export function extractProps(
  props: any,
  theme: any,
  {},
  componentTheme: any,
  currentBreakpoint: number
) {
  let newProps: any = {};
  for (let property in props) {
    // If the property exists in themePropertyMap then get its value
    if (themePropertyMap[property]) {
      let propValues = extractPropertyFromFunction(
        property,
        props,
        theme,
        componentTheme
      );
      if (typeof propValues === 'string' || typeof propValues === 'number') {
        newProps[property] = propValues;
      } else if (!isNil(propValues)) {
        for (let nestedProp in propValues) {
          newProps[nestedProp] = get(
            theme,
            `${themePropertyMap[nestedProp]}.${propValues[nestedProp]}`,
            propValues[nestedProp]
          );
        }
      } else if (property === 'shadow') {
        let shadowProps = theme[themePropertyMap[property]][props[property]];
        if (!isNil(shadowProps)) {
          newProps = { ...newProps, ...shadowProps };
        }
      } else {
        newProps[property] = resolveValueWithBreakpoint(
          props[property],
          theme.breakpoints,
          currentBreakpoint,
          property
        );
      }
    } else {
      newProps[property] = resolveValueWithBreakpoint(
        props[property],
        theme.breakpoints,
        currentBreakpoint,
        property
      );
    }
  }
  return cloneDeep(newProps);
}

/*
Remove props from defaultProps that are already present in props
*/
function filterDefaultProps(props: any, defaultProps: any) {
  let [, resultProps] = extractInObject(defaultProps, Object.keys(props));
  return resultProps;
}

/**
 * If property is functional in componentTheme, get its returned object
 *
 * @param property : name of the prop
 * @param props : all props
 * @param theme : provided theme without components
 * @param componentTheme : component specific theme
 * @returns
 */
export const extractPropertyFromFunction = (
  property: string,
  props: any,
  theme: any,
  componentTheme: any
) => {
  let propValues;
  // Check if the entry in the theme is a function then calling it with all theme and props as params
  if (
    componentTheme &&
    typeof componentTheme[themePropertyMap[property]] === 'function'
  ) {
    let funcProps = componentTheme[themePropertyMap[property]]({
      theme,
      ...props,
    });
    // Check if returned object from componentTheme is a nested object
    let isNested: boolean = Object.keys(funcProps).some(function (key) {
      return funcProps[key] && typeof funcProps[key] === 'object';
    });
    // If the returned value is nested object then find the property value in it, otherwise return the whole object
    propValues = isNested
      ? { ...get(funcProps, `${props[property]}`) }
      : { ...funcProps };
  } else {
    // If the entry is any value other than function then return the whole object or value
    propValues = get(
      componentTheme,
      `${themePropertyMap[property]}.${props[property]}`
    );
  }
  return propValues;
};

/*
Merge _props and apply contrastText color if not passed by theme or user
*/
export function mergeUnderscoreProps(newProps: any, props: any) {
  const _props = Object.keys(newProps).filter((propName) =>
    propName.startsWith('_')
  );
  _props.forEach((propName: string) => {
    // Adding color based on bg contrast if no color is given
    const bg = newProps.bg ?? newProps.backgroundColor;
    const textColor = bg
      ? {
          color: useContrastText(
            bg,
            newProps[propName]?.color ?? props[propName]?.color
          ),
        }
      : {};
    // Overriding calculated props with user added props
    newProps[propName] = {
      ...textColor,
      ...newProps[propName],
      ...props[propName],
    };
  });
  return newProps;
}

/**
 *
 * Checks the property and resolves it if it has breakpoints
 * @param values : value from props
 * @param currentBreakpoint : current value for which breakpoint will be calculated
 * @param property : property name
 * @returns
 */
export const resolveValueWithBreakpoint = (
  values: any,
  breakpointTheme: any,
  currentBreakpoint: number,
  property: any
) => {
  if (hasValidBreakpointFormat(values, breakpointTheme, property)) {
    // Check the last valid breakpoint value from all values
    // If current breakpoint is `md` and we have `base` then `lg`, then last value will be taken(`base` in this case)
    return findLastValidBreakpoint(values, breakpointTheme, currentBreakpoint);
  } else {
    return values;
  }
};

/**
 * Takes all prop related data and returns the props that needs to be applied to the component
 *
 * @param theme Theme object
 * @param colorModeProps Color mode information
 * @param componentTheme Theme object for the specific component
 * @param props Props passed by the user
 * @param windowWidth Width of the current window
 * @returns props to be applied
 */
export function calculateProps(
  theme: any,
  colorModeProps: any,
  componentTheme: any,
  props: any,
  windowWidth: any
) {
  let currentBreakpoint = getClosestBreakpoint(theme.breakpoints, windowWidth);
  if (!props) {
    props = {};
  }

  let newProps: any;
  if (componentTheme) {
    // Extracting props from defaultProps
    newProps = extractProps(
      filterDefaultProps(props, componentTheme.defaultProps),
      theme,
      colorModeProps,
      componentTheme,
      currentBreakpoint
    );
    // Extracting props from base style
    let componentBaseStyle =
      typeof componentTheme.baseStyle !== 'function'
        ? componentTheme.baseStyle
        : componentTheme.baseStyle({
            theme,
            ...newProps,
            ...props,
            ...colorModeProps,
          });
    newProps = mergeWith(
      newProps,
      componentBaseStyle,
      // @ts-ignore
      (objValue, srcValue, key) => {
        if (!isNil(objValue)) {
          delete newProps[key];
        }
      }
    );

    const variant =
      props.variant || get(componentTheme, 'defaultProps.variant');
    // Extracting props from variant
    if (
      variant &&
      componentTheme.variants &&
      componentTheme.variants[variant]
    ) {
      const colorScheme =
        props.colorScheme || get(componentTheme, 'defaultProps.colorScheme');
      let variantProps = componentTheme.variants[variant]({
        ...props,
        ...newProps,
        colorScheme,
        theme,
        ...colorModeProps,
      });
      variantProps = extractProps(
        variantProps,
        theme,
        colorModeProps,
        componentTheme,
        currentBreakpoint
      );
      // added this to handle order of props
      newProps = mergeWith(
        newProps,
        variantProps,
        // @ts-ignore
        (objValue, srcValue, key) => {
          if (!isNil(objValue)) {
            delete newProps[key];
          }
        }
      );
      delete newProps.variant;
      delete newProps.colorScheme;
    }
  }
  // Extracting props from normal props
  let extractedProps = extractProps(
    props,
    theme,
    colorModeProps,
    componentTheme,
    currentBreakpoint
  );
  // added this to handle order of props
  // @ts-ignore
  newProps = mergeWith(newProps, extractedProps, (objValue, srcValue, key) => {
    if (!isNil(objValue)) {
      delete newProps[key];
    }
  });
  newProps = mergeUnderscoreProps(newProps, props);
  return newProps;
}

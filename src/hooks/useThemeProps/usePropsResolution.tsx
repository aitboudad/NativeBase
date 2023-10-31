/* eslint-disable react-hooks/rules-of-hooks */
import { isValidElement, useMemo } from 'react';
import { useColorMode } from '../../core/color-mode';
import { useTheme } from '../useTheme';
import { _propsSpreader } from './useLegacyPropsResolution';
import { isObject, reverseDeepMerge } from './utils';
import { STATE_PROPS_MAP } from './propsFlattener';
import { Platform } from 'react-native';
import stableHash from 'stable-hash';

function getStyledPropsAndRestProps(component: string, props: any) {
  const styledProps: any = {};
  const restProps: any = {};

  for (const key in props) {
    const kind = typeof props[key];
    if (
      kind === 'function' ||
      key === 'children' ||
      isValidElement(props[key]) ||
      (component === 'FlatList' && key === 'data') ||
      key.startsWith('on')
    ) {
      restProps[key] = props[key];
    } else {
      styledProps[key] = props[key];
    }
  }

  return { styledProps, restProps };
}

export const useComponentProps = (
  component: any,
  componentProps: any,
  state: any = {},
  // @ts-ignore
  config: any = {}
) => {
  const { restProps, styledProps } = getStyledPropsAndRestProps(
    component,
    componentProps
  );
  const theme = useTheme();
  const { colorMode } = useColorMode();
  const themeComponent = (theme.components as any)[component];

  const { defaultStyleProps, defaultOrderProps } = useMemo(() => {
    const { baseStyle, defaultProps, variants, sizes } = themeComponent;
    const variant = styledProps.variant ?? defaultProps?.variant;
    const colorScheme = styledProps.colorScheme ?? defaultProps?.colorScheme;
    const key = `${component}_${colorMode}_${variant}_${colorScheme}_${styledProps.size}`;
    if (theme.runtimeCache.has(key)) {
      return theme.runtimeCache.get(key);
    }

    let themeProps = reverseDeepMerge(
      {},
      variants?.[variant]
        ? variants[variant]({ colorScheme, theme })
        : undefined,
      defaultProps
    );

    themeProps = _propsSpreader(
      reverseDeepMerge(
        {},
        themeProps['_' + Platform.OS],
        themeProps['_' + colorMode],
        themeProps
      )
    );

    const size = styledProps.size ?? themeProps.size;
    const sizeStyle = sizes?.[size] || size;
    const sizeStyleProps = sizeStyle
      ? isObject(sizeStyle)
        ? sizeStyle
        : { size: sizeStyle }
      : {};

    let baseStyleProps =
      (typeof baseStyle === 'function'
        ? baseStyle({ theme, colorMode, ...themeProps })
        : baseStyle) || {};

    baseStyleProps = reverseDeepMerge(
      {},
      baseStyleProps['_' + Platform.OS],
      baseStyleProps['_' + colorMode],
      baseStyleProps
    );

    delete themeProps.size;
    const defaultStyleProps = _propsSpreader(
      reverseDeepMerge(themeProps, sizeStyleProps, baseStyleProps)
    );

    const defaultOrderProps = Object.keys(defaultStyleProps).reduce((v, k) => {
      v[k] = undefined;
      return v;
    }, {} as any);

    delete defaultOrderProps.size;
    const result = {
      defaultOrderProps,
      defaultStyleProps,
    };
    theme.runtimeCache.set(key, result);

    return result;
  }, [
    styledProps.variant,
    styledProps.colorScheme,
    styledProps.size,
    themeComponent,
    colorMode,
    theme,
  ]);

  const props = useMemo(() => {
    const { size: _, ...baseProps } = styledProps;
    if (defaultStyleProps._pressed) {
      baseProps._pressed = baseProps._pressed || {};
      if (baseProps.bg && !baseProps._pressed.bg) {
        baseProps._pressed.bg = baseProps.bg;
      }
      if (baseProps.bgColor && !baseProps._pressed.bgColor) {
        baseProps._pressed.bgColor = baseProps.bgColor;
      }
    }

    let newProps = reverseDeepMerge(
      {},
      baseProps['_' + Platform.OS],
      baseProps['_' + colorMode],
      _propsSpreader(baseProps),
      defaultStyleProps
    );

    const stateProps: any = [];
    if (state) {
      for (const p in state) {
        if (state[p] && newProps[STATE_PROPS_MAP[p]]) {
          stateProps.push(newProps[STATE_PROPS_MAP[p]]);
        }
      }
    }

    newProps = _propsSpreader(
      reverseDeepMerge(
        {},
        defaultOrderProps,
        ...stateProps,
        newProps['_important'],
        newProps['_' + Platform.OS],
        newProps['_' + colorMode],
        newProps
      )
    );

    for (const p in newProps) {
      if (newProps[p] == null) {
        delete newProps[p];
      }
    }

    return newProps;
  }, [
    stableHash(styledProps),
    stableHash(state),
    colorMode,
    defaultStyleProps,
    defaultOrderProps,
  ]);

  for (const p in restProps) {
    props[p] = restProps[p];
  }

  return props;
};

export const usePropsResolution = (
  component: any,
  props: any,
  state?: any,
  config?: any
) => {
  return useComponentProps(component, props, state, config);
};

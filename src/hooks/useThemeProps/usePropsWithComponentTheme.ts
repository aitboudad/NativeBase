import type { ComponentTheme } from '../../theme';
import type { IStateProps } from './propsFlattener';
import { usePropsResolutionWithComponentTheme } from './useLegacyPropsResolution';

export function usePropsWithComponentTheme(
  localTheme: ComponentTheme,
  propsReceived: any,
  _state?: IStateProps
) {
  return usePropsResolutionWithComponentTheme(
    localTheme,
    propsReceived,
    _state
  );
}

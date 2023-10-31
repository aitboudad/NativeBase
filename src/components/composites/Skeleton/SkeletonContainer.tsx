import React, { memo, forwardRef } from 'react';
import { Animated, Platform } from 'react-native';
import { usePropsResolution } from '../../../hooks';
import { canUseDom } from '../../../utils';
import type { ISkeletonProps } from './types';
import Box from '../../primitives/Box';

const SkeletonContainer = (props: ISkeletonProps, ref: any) => {
  const isDomUsable = canUseDom();
  const {
    children,
    startColor,
    endColor,
    ...resolvedProps
  } = usePropsResolution('Skeleton', props);
  // Setting blink Animation
  const blinkAnim = React.useRef(new Animated.Value(0)).current;

  // Generating blink animation in a sequence
  React.useEffect(() => {
    //Check if window is loaded
    if (isDomUsable) {
      const blink = Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration:
            resolvedProps.fadeDuration * 10000 * (1 / resolvedProps.speed),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration:
            resolvedProps.fadeDuration * 10000 * (1 / resolvedProps.speed),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]);
      Animated.loop(blink).start();
    }
  }, [blinkAnim, isDomUsable, resolvedProps]);

  return (
    <Animated.View style={{ opacity: blinkAnim }}>
      <Box {...resolvedProps} ref={ref}>
        {children}
      </Box>
    </Animated.View>
  );
};

export default memo(forwardRef(SkeletonContainer));

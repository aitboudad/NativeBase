import React, { memo, forwardRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { usePropsResolution } from '../../../hooks';
import type { ISkeletonProps } from './types';
import { useToken } from '../../../hooks/useToken';
import { View } from '../../basic/View';

const Skeleton = (props: ISkeletonProps, ref: any) => {
  const {
    startColor,
    endColor,
    ...resolvedProps
  } = usePropsResolution('Skeleton', props);
  const tokenisedStartColor = useToken('colors', startColor);
  const skeletonStyle: any = {
    backgroundColor: tokenisedStartColor,
  };

  return (
    <View bg={endColor} {...resolvedProps} ref={ref}>
      <Animated.View style={[styles.container, skeletonStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
  },
});

export default memo(forwardRef(Skeleton));

import React, { memo, forwardRef, useMemo } from 'react';
import { usePropsResolution } from '../../../hooks';
import { Stack } from '../../primitives/Stack';
import Skeleton from './Skeleton';
import type { ISkeletonTextProps } from './types';

const SkeletonText = (
  //@ts-ignore
  props: ISkeletonTextProps,
  ref: any
) => {
  const {
    startColor,
    endColor,
    lines,
    _line,
    ...resolvedProps
  } = usePropsResolution('SkeletonText', props);

  const children = useMemo(() => {
    const computedChildren = [];
    //generating an array of skeleton components (same length as noOfLines)
    for (let i = 0; i < lines; i++) {
      //check for last line (to change the width of last line)
      if (i === lines - 1 && lines !== 1) {
        computedChildren.push(
          //Using Skeleton component with required props
          <Skeleton
            key={i}
            endColor={endColor}
            startColor={startColor}
            w="75%"
            {..._line}
          />
        );
      } else
        computedChildren.push(
          <Skeleton
            key={i}
            endColor={endColor}
            startColor={startColor}
            {..._line}
          />
        );
    }

    return computedChildren;
  }, [_line, endColor, lines, startColor]);

  return (
    <Stack {...resolvedProps} ref={ref}>
      {children}
    </Stack>
  );
};

export default memo(forwardRef(SkeletonText));

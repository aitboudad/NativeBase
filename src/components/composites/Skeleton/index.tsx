import type { ISkeletonComponentType } from './types';
import SkeletonMain from './Skeleton';
import SkeletonText from './SkeletonText';
import SkeletonContainer from './SkeletonContainer';


const SkeletonTemp: any = SkeletonMain;
SkeletonTemp.Text = SkeletonText;
SkeletonTemp.Container = SkeletonContainer;

// To add typings
const Skeleton = SkeletonTemp as ISkeletonComponentType;
export { Skeleton };
export type { ISkeletonProps, ISkeletonTextProps } from './types';

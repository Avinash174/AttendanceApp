import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Baseline dimensions based on standard iPhone 11 Pro / iPhone X dimensions
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Scales sizes proportionally based on screen width
export const scale = (size: number) => (width / guidelineBaseWidth) * size;

// Scales sizes proportionally based on screen height
export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

// A non-linear scale that prevents things from becoming too big on large screens
// Factor controls how much it scales. factor 0 = no scaling, factor 1 = full scaling
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Moderate vertical scale
export const moderateVerticalScale = (size: number, factor = 0.5) => size + (verticalScale(size) - size) * factor;

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

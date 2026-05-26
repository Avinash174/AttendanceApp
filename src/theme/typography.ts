import { TextStyle } from 'react-native';
import { Colors } from './colors';
import { moderateScale } from '../utils/responsive';

export const Typography = {
  display: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: moderateScale(38),
    color: Colors.text,
    letterSpacing: -0.6,
  } as TextStyle,
  title: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: moderateScale(26),
    color: Colors.text,
    letterSpacing: -0.4,
  } as TextStyle,
  heading: {
    fontFamily: 'Outfit_700Bold',
    fontSize: moderateScale(19),
    color: Colors.text,
    letterSpacing: -0.2,
  } as TextStyle,
  subheading: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: moderateScale(16),
    color: Colors.textSecondary,
    letterSpacing: -0.1,
  } as TextStyle,
  body: {
    fontFamily: 'Outfit_500Medium',
    fontSize: moderateScale(15),
    color: Colors.textSecondary,
    lineHeight: moderateScale(22),
  } as TextStyle,
  label: {
    fontFamily: 'Outfit_700Bold',
    fontSize: moderateScale(11),
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TextStyle,
  caption: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: moderateScale(12),
    color: Colors.textMuted,
  } as TextStyle,
};

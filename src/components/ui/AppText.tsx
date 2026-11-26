import {
  Text,
  type TextProps,
} from 'react-native';

import { fontFamilies } from '@/theme/typography';

type AppTextProps = TextProps;

export function AppText({ style, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: fontFamilies.regular },
        style,
      ]}
    />
  );
}

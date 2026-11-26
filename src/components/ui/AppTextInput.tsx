import {
  TextInput,
  type TextInputProps,
} from 'react-native';

import { fontFamilies } from '@/theme/typography';

export function AppTextInput({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      {...props}
      style={[
        { fontFamily: fontFamilies.regular },
        style,
      ]}
    />
  );
}

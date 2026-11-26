
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { AppText } from '@/components/ui/AppText';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fontFamilies } from '@/theme/typography';

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <AppText style={styles.subtitle}>Explore</AppText>

          <AppText style={styles.centerText} >
            This starter app includes example{'\n'}code to help you get started.
          </AppText>

          <ExternalLink href="https://docs.expo.dev" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.linkButton}>
                <AppText style={styles.linkText}>Expo documentation</AppText>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'arrow.up.right.square', android: 'link', web: 'link' }}
                  size={12}
                />
              </ThemedView>
            </Pressable>
          </ExternalLink>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <Collapsible title="File-based routing">
            <AppText style={styles.smallText}>
              This app has two screens: <AppText style={styles.codeText}>src/app/index.tsx</AppText> and{' '}
              <AppText style={styles.codeText}>src/app/explore.tsx</AppText>
            </AppText>

            <AppText style={styles.smallText}>
              The layout file in <AppText style={styles.codeText}>src/app/_layout.tsx</AppText> sets up
              the tab navigator.
            </AppText>

            <ExternalLink href="https://docs.expo.dev/router/introduction">
              <AppText style={styles.linkPrimaryText}>Learn more</AppText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Android, iOS, and web support">
            <ThemedView type="backgroundElement" style={styles.collapsibleContent}>
              <AppText style={styles.smallText}>
                You can open this project on Android, iOS, and the web. To open the web version,
                press <AppText style={styles.smallBoldText}>w</AppText> in the terminal running this
                project.
              </AppText>

              <Image
                source={require('@/assets/images/tutorial-web.png')}
                style={styles.imageTutorial}
              />
            </ThemedView>
          </Collapsible>

          <Collapsible title="Images">
            <AppText style={styles.smallText}>
              For static images, you can use the <AppText style={styles.codeText}>@2x</AppText> and{' '}
              <AppText style={styles.codeText}>@3x</AppText> suffixes to provide files for different
              screen densities.
            </AppText>

            <Image
              source={require('@/assets/images/react-logo.png')}
              style={styles.imageReact}
            />

            <ExternalLink href="https://reactnative.dev/docs/images">
              <AppText style={styles.linkPrimaryText}>Learn more</AppText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Light and dark mode components">
            <AppText style={styles.smallText}>
              This template has light and dark mode support. The{' '}
              <AppText style={styles.codeText}>useColorScheme()</AppText> hook lets you inspect what the
              user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
            </AppText>

            <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
              <AppText style={styles.linkPrimaryText}>Learn more</AppText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Animations">
            <AppText style={styles.smallText}>
              This template includes an example of an animated component. The{' '}
              <AppText style={styles.codeText}>src/components/ui/collapsible.tsx</AppText> component uses
              the powerful <AppText style={styles.codeText}>react-native-reanimated</AppText> library to
              animate opening this hint.
            </AppText>
          </Collapsible>
        </ThemedView>

        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  subtitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    color: '#000000',
  },
  centerText: {
    textAlign: 'center',
    fontFamily: fontFamilies.regular,
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  linkText: {
    fontFamily: fontFamilies.medium,
    color: '#0a7ea4',
  },
  linkPrimaryText: {
    fontFamily: fontFamilies.medium,
    color: '#0a7ea4',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  smallText: {
    fontFamily: fontFamilies.regular,
  },
  smallBoldText: {
    fontFamily: fontFamilies.bold,
  },
  codeText: {
    fontFamily: fontFamilies.medium,
  },
  collapsibleContent: {
    alignItems: 'center',
  },
  imageTutorial: {
    width: '100%',
    aspectRatio: 296 / 171,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  imageReact: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
});

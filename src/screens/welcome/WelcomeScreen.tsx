import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Image,
  SafeAreaView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { AppText } from "@/components/ui/AppText";
import { fontFamilies } from "@/theme/typography";

interface WelcomeScreenProps {
  onStart: () => void;
}

const LEAVES = [
  {
    viewBox: "82 0 24 9",
    left: 2,
    top: 4,
    endLeft: 19,
    endTop: 7,
    width: 46,
    animation: "a",
    delay: 0,
  },
  {
    viewBox: "28 26 32 17",
    left: 88,
    top: 14,
    endLeft: 73,
    endTop: 10,
    width: 38,
    animation: "b",
    delay: 300,
  },
  {
    viewBox: "64 11 17 22",
    left: 5,
    top: 29,
    endLeft: 3,
    endTop: 24,
    width: 55,
    animation: "c",
    delay: 600,
  },
  {
    viewBox: "0 9 35 15",
    left: 94,
    top: 43,
    endLeft: 84,
    endTop: 34,
    width: 40,
    animation: "d",
    delay: 900,
  },
  {
    viewBox: "82 0 24 9",
    left: 8,
    top: 59,
    endLeft: 2,
    endTop: 65,
    width: 48,
    animation: "b",
    delay: 1200,
  },
  {
    viewBox: "64 11 17 22",
    left: 91,
    top: 76,
    endLeft: 80,
    endTop: 83,
    width: 36,
    animation: "a",
    delay: 1500,
  },
  {
    viewBox: "28 26 32 17",
    left: 76,
    top: 5,
    endLeft: 96,
    endTop: 19,
    width: 40,
    animation: "d",
    delay: 200,
  },
  {
    viewBox: "0 9 35 15",
    left: 55,
    top: 20,
    endLeft: 3,
    endTop: 42,
    width: 54,
    animation: "c",
    delay: 500,
  },
  {
    viewBox: "82 0 24 9",
    left: 18,
    top: 36,
    endLeft: 82,
    endTop: 48,
    width: 36,
    animation: "a",
    delay: 800,
  },
  {
    viewBox: "64 11 17 22",
    left: 66,
    top: 51,
    endLeft: 97,
    endTop: 58,
    width: 48,
    animation: "b",
    delay: 1100,
  },
  {
    viewBox: "28 26 32 17",
    left: 42,
    top: 67,
    endLeft: 53,
    endTop: 91,
    width: 42,
    animation: "c",
    delay: 1400,
  },
  {
    viewBox: "0 9 35 15",
    left: 83,
    top: 82,
    endLeft: 13,
    endTop: 96,
    width: 56,
    animation: "d",
    delay: 1700,
  },
] as const;

const ROTATIONS = {
  a: ["-35deg", "35deg"],
  b: ["40deg", "-25deg"],
  c: ["-20deg", "55deg"],
  d: ["30deg", "-45deg"],
};

function LeafIllustration({
  viewBox,
  width,
}: {
  viewBox: string;
  width: number;
}) {
  const [, , viewWidth, viewHeight] = viewBox.split(" ").map(Number);

  return (
    <Svg
      width={width}
      height={width * (viewHeight / viewWidth)}
      viewBox={viewBox}
    >
      <Path
        d="M99.8,7.3c-6,4.3-16.3.9-16.6.8h0s1.7-5.1,7-7.4c4.7-2.1,6.6,1.2,12.4.9.8,0,1.6-.1,2.5-.3h0c0,.1.5,1.8-5.3,6Z"
        fill="#73a977"
      />
      <Path
        d="M105.1,1.3s-9.4.8-15.6,3.6"
        fill="none"
        stroke="#214926"
        strokeWidth={0.4}
        strokeMiterlimit={10}
      />
      <Path
        d="M80,12.4c-5.8-1.4-12.9,3-14.9,7.6-2,4.6-1,10.2-.3,11.6s4.9.1,6.9-2.4c2-2.5,9.3-16.6,8.3-16.8h0Z"
        fill="#73a977"
      />
      <Path
        d="M65.1,31.7c2-.7,4.5-7.4,6.4-11,2.8-5.3,8.4-8.1,8.4-8.1"
        fill="none"
        stroke="#214926"
        strokeWidth={0.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M33.1,33.5s12,3.5,24.8,2.3l-3.8,2.9s-11.5,5-16.5,1.6c-5-3.4-4.3-5.7-4.3-5.7l-.2-1.2h0Z"
        fill="#73a977"
      />
      <Path
        d="M57.9,35.9c-.8,5.4-16.2,13.5-27.2,2.9-3.7-3.6-1.4-11.4,1.3-10.1,0,0,2.7,8.3,9.3,10.7,6,2.2,16.5-3.4,16.5-3.4Z"
        fill="#4b9353"
      />
      <Path
        d="M36.3,35.8s6.5,8.1,21.6,0"
        fill="none"
        stroke="#214926"
        strokeWidth={0.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M24.6,21C15.8,27.4.5,22.4,0,22.2h0s2.6-7.5,10.3-11c6.9-3,9.8,1.8,18.4,1.4,1.1,0,2.3-.2,3.7-.4h0c0,.2.7,2.6-7.8,8.8Z"
        fill="#73a977"
      />
      <Path
        d="M32.4,12.2s-14,1.2-23,5.3"
        fill="none"
        stroke="#214926"
        strokeWidth={0.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { width, height } = useWindowDimensions();

  const [animations] = useState(
    () => LEAVES.map(() => new Animated.Value(0)),
  );

  useEffect(() => {
    const runningAnimations = animations.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 6000,
        delay: LEAVES[index].delay,
        easing: Easing.bezier(0.35, 0.05, 0.65, 1),
        useNativeDriver: true,
      }),
    );

    runningAnimations.forEach((animation) => animation.start());

    return () => {
      runningAnimations.forEach((animation) => animation.stop());
    };
  }, [animations]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {LEAVES.map((leaf, index) => {
            const translateX = animations[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, (width * (leaf.endLeft - leaf.left)) / 100],
            });

            const translateY = animations[index].interpolate({
              inputRange: [0, 1],
              outputRange: [
                height * (leaf.endTop / 100 - leaf.top / 100 - 1),
                height * (leaf.endTop / 100 - leaf.top / 100),
              ],
            });

            const opacity = animations[index].interpolate({
              inputRange: [0, 0.15, 1],
              outputRange: [0, 0.9, 0.9],
            });

            const rotate = animations[index].interpolate({
              inputRange: [0, 1],
              outputRange: ROTATIONS[leaf.animation],
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.leaf,
                  {
                    left: `${leaf.left}%`,
                    top: `${leaf.top}%`,
                    opacity,
                    transform: [{ translateX }, { translateY }, { rotate }],
                  },
                ]}
              >
                <LeafIllustration viewBox={leaf.viewBox} width={leaf.width} />
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.content}>
          <Image
            source={require("../../../assets/images/logo-ecomeans-zielone.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="EcoMeans"
          />

          <AppText style={styles.heading}>
            Czysty dom.
            {"\n"}
            Spokojna głowa.
          </AppText>

          <AppText style={styles.description}>
            Zadbaj o dom w swoim rytmie. Zaplanuj porządki, podziel obowiązki i
            miej wszystko pod kontrolą.
          </AppText>
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={onStart}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <AppText style={styles.buttonText}>Zaczynamy!</AppText>
          </Pressable>

          <AppText style={styles.tagline}>
            Twój dom, Twoje tempo, Twój porządek.
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5e6ce",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 36,
    overflow: "hidden",
  },
  leaf: {
    position: "absolute",
    zIndex: 0,
  },
  content: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  logo: {
    width: 224,
    height: 120,
    marginBottom: 32,
  },
  heading: {
    color: "#3b742f",
    fontSize: 48,
    lineHeight: 56,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: fontFamilies.decorative,
  },
  description: {
    maxWidth: 340,
    color: "#4e4d4d",
    fontSize: 16,
    lineHeight: 25,
    textAlign: "center",
    fontFamily: fontFamilies.regular,
  },
  footer: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    marginTop: 44,
    zIndex: 2,
  },
  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b742f",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 17,
  },
  buttonPressed: {
    backgroundColor: "#315f27",
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: fontFamilies.bold,
  },
  tagline: {
    marginTop: 20,
    color: "#4e4d4d",
    opacity: 0.7,
    fontSize: 14,
    textAlign: "center",
    fontFamily: fontFamilies.regular,
  },
});

import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

interface AuthScreenProps {
  onAuthenticated: () => void;
  onBack: () => void;
}

export function AuthScreen({ onAuthenticated, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    if (!email.trim()) {
      setError("Wpisz adres e-mail.");
      return;
    }

    if (!forgotPassword && !password) {
      setError("Wpisz hasło.");
      return;
    }

    if (!forgotPassword && mode === "register" && password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (forgotPassword) {
        const redirectTo = Linking.createURL("auth/callback", {
          queryParams: { type: "recovery" },
        });

        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo },
        );

        if (error) throw error;

        setMessage(
          "Jeśli konto jest powiązane z tym adresem, otrzymasz wiadomość z linkiem do ustawienia nowego hasła.",
        );
        return;
      }

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: Linking.createURL("auth/callback"),
          },
        });

        if (error) throw error;

        if (data.session) {
          onAuthenticated();
        } else {
          setMessage(
            "Konto zostało utworzone. Sprawdź swoją skrzynkę e-mail i potwierdź adres.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        onAuthenticated();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Wystąpił błąd. Spróbuj ponownie.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const redirectTo = Linking.createURL("auth/callback");
      console.log("[GOOGLE REDIRECT URL]", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (!data.url) {
        throw new Error("Nie udało się rozpocząć logowania Google.");
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );
      console.log("[GOOGLE AUTH RESULT]", result);

      if (result.type === "cancel" || result.type === "dismiss") {
        return;
      }

      if (result.type !== "success") {
        throw new Error("Logowanie Google nie zostało zakończone.");
      }

      const callbackUrl = new URL(result.url);

      const hashParams = new URLSearchParams(
        callbackUrl.hash.replace(/^#/, ""),
      );

      const oauthError =
        callbackUrl.searchParams.get("error_description") ||
        callbackUrl.searchParams.get("error") ||
        hashParams.get("error_description") ||
        hashParams.get("error");

      if (oauthError) {
        throw new Error(oauthError);
      }

      const code = callbackUrl.searchParams.get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) throw exchangeError;
      } else {
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (!accessToken || !refreshToken) {
          throw new Error(
            "Nie otrzymano kompletnych tokenów autoryzacyjnych Google.",
          );
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) throw sessionError;
      }

      onAuthenticated();
    } catch (err) {
      console.error("[GOOGLE ERROR]", err);

      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zalogować przez Google.",
      );
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          <View style={styles.container}>
            <Pressable onPress={onBack} style={styles.backButton}>
              <AppText style={styles.backText}>
                ← Wróć
              </AppText>
            </Pressable>

            <View style={styles.header}>
              <Image
                source={require("../../assets/images/logo-ecomeans-zielone.png")}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="EcoMeans"
              />

              <AppText style={styles.heading}>
                {forgotPassword
                  ? "Odzyskaj dostęp"
                  : mode === "login"
                    ? "Witaj ponownie!"
                    : "Dołącz do EcoMeans"}
              </AppText>

              <AppText style={styles.subtitle}>
                {forgotPassword
                  ? "Podaj adres e-mail powiązany z Twoim kontem."
                  : mode === "login"
                    ? "Zaloguj się do swojego domu."
                    : "Utwórz konto i zadbaj o dom po swojemu."}
              </AppText>
            </View>

            {!forgotPassword ? (
              <View style={styles.tabs}>
                <Pressable
                  onPress={() => changeMode("login")}
                  style={[styles.tab, mode === "login" && styles.activeTab]}
                >
                  <AppText
                    style={[
                      styles.tabText,
                      mode === "login" && styles.activeTabText,
                    ]}
                  >
                    Logowanie
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={() => changeMode("register")}
                  style={[styles.tab, mode === "register" && styles.activeTab]}
                >
                  <AppText
                    style={[
                      styles.tabText,
                      mode === "register" && styles.activeTabText,
                    ]}
                  >
                    Rejestracja
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.form}>
              <View style={styles.field}>
                <AppText style={styles.label}>
                  Adres e-mail
                </AppText>
                <AppTextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!loading}
                  placeholder="np. imie@email.com"
                  placeholderTextColor="#999184"
                  style={styles.input}
                />
              </View>

              {!forgotPassword ? (
                <View style={styles.field}>
                  <AppText style={styles.label}>Hasło</AppText>
                  <AppTextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    textContentType={
                      mode === "login" ? "password" : "newPassword"
                    }
                    editable={!loading}
                    placeholder="Minimum 6 znaków"
                    placeholderTextColor="#999184"
                    style={styles.input}
                  />

                  {mode === "login" ? (
                    <Pressable
                      onPress={() => {
                        setForgotPassword(true);
                        setError("");
                        setMessage("");
                        setPassword("");
                      }}
                      disabled={loading}
                      style={{ alignSelf: "flex-end", paddingVertical: 4 }}
                    >
                      <AppText

                        style={{
                          color: "#3b742f",
                          fontSize: 13,
                        }}
                      >
                        Nie pamiętasz hasła?
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <AppText style={styles.errorText}>{error}</AppText>
                </View>
              ) : null}

              {message ? (
                <View style={styles.messageBox}>
                  <AppText style={styles.messageText}>{message}</AppText>
                </View>
              ) : null}

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && !loading && styles.submitButtonPressed,
                  loading && styles.disabledButton,
                ]}
              >
                <AppText style={styles.submitButtonText}>
                  {loading
                    ? "Chwileczkę..."
                    : forgotPassword
                      ? "Wyślij link do zmiany hasła"
                      : mode === "login"
                        ? "Zaloguj się"
                        : "Utwórz konto"}
                </AppText>
              </Pressable>

              {!forgotPassword ? (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <AppText style={styles.dividerText}>lub</AppText>
                    <View style={styles.dividerLine} />
                  </View>

                  <Pressable
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.googleButton,
                      pressed && !loading && styles.googleButtonPressed,
                      loading && styles.disabledButton,
                    ]}
                  >
                    <Image
                      source={require("../../assets/images/google-g-logo.png")}
                      style={styles.googleLogo}
                      resizeMode="contain"
                      accessibilityLabel="Google"
                    />
                    <AppText style={styles.googleButtonText}>
                      Kontynuuj z Google
                    </AppText>
                  </Pressable>
                </>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5e6ce",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 16,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 14,
    paddingVertical: 5,
  },
  backText: {
    color: "#3b742f",
    fontSize: 14,
  },
  header: {
    alignItems: "center",
    marginBottom: 18,
  },
  logo: {
    width: 140,
    height: 72,
    marginBottom: 10,
  },
  heading: {
    color: "#3b742f",
    fontSize: 27,
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    color: "#4e4d4d",
    fontSize: 13,
    textAlign: "center",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 11,
  },
  activeTab: {
    backgroundColor: "#3b742f",
  },
  tabText: {
    color: "#4e4d4d",
    fontSize: 14,
  },
  activeTabText: {
    color: "#ffffff",
  },
  form: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  field: {
    gap: 6,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9d0bd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: "#4e4d4d",
    fontSize: 14,
    fontFamily: "Sen",
  },
  label: {
    color: "#4e4d4d",
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
  },
  messageBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 12,
  },
  messageText: {
    color: "#166534",
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: "#3b742f",
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  googleButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#747775",
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  submitButtonPressed: {
    backgroundColor: "#315f27",
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#d9d0bd",
  },
  dividerText: {
    color: "#999184",
    fontSize: 13,
  },
  googleButtonPressed: {
    backgroundColor: "#f5f1e9",
    transform: [{ scale: 0.98 }],
  },
  googleLogo: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: "#1f1f1f",
    fontSize: 15,
  },
});

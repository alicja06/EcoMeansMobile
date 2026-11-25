import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
              <Text style={styles.backText}>← Wróć</Text>
            </Pressable>

            <View style={styles.header}>
              <Image
                source={require("../../assets/images/logo-ecomeans-zielone.png")}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="EcoMeans"
              />

              <Text style={styles.heading}>
                {forgotPassword
                  ? "Odzyskaj dostęp"
                  : mode === "login"
                    ? "Witaj ponownie!"
                    : "Dołącz do EcoMeans"}
              </Text>

              <Text style={styles.subtitle}>
                {forgotPassword
                  ? "Podaj adres e-mail powiązany z Twoim kontem."
                  : mode === "login"
                    ? "Zaloguj się do swojego domu."
                    : "Utwórz konto i zadbaj o dom po swojemu."}
              </Text>
            </View>

            {!forgotPassword ? (
              <View style={styles.tabs}>
                <Pressable
                  onPress={() => changeMode("login")}
                  style={[styles.tab, mode === "login" && styles.activeTab]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      mode === "login" && styles.activeTabText,
                    ]}
                  >
                    Logowanie
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => changeMode("register")}
                  style={[styles.tab, mode === "register" && styles.activeTab]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      mode === "register" && styles.activeTabText,
                    ]}
                  >
                    Rejestracja
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Adres e-mail</Text>
                <TextInput
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
                  <Text style={styles.label}>Hasło</Text>
                  <TextInput
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
                      <Text
                        style={{
                          color: "#3b742f",
                          fontSize: 13,
                          fontFamily: "Sen",
                        }}
                      >
                        Nie pamiętasz hasła?
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {message ? (
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{message}</Text>
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
                <Text style={styles.submitButtonText}>
                  {loading
                    ? "Chwileczkę..."
                    : forgotPassword
                      ? "Wyślij link do zmiany hasła"
                      : mode === "login"
                        ? "Zaloguj się"
                        : "Utwórz konto"}
                </Text>
              </Pressable>

              {!forgotPassword ? (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>lub</Text>
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
                    <Text style={styles.googleButtonText}>
                      Kontynuuj z Google
                    </Text>
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
    fontWeight: "600",
    fontFamily: "Sen",
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
  fontFamily: "Sen",
},
subtitle: {
  color: "#4e4d4d",
  fontSize: 13,
  textAlign: "center",
  fontFamily: "Sen",
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
    fontWeight: "700",
    fontFamily: "Sen",
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
    fontWeight: "600",
    fontFamily: "Sen",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontFamily: "Sen",
  },
  messageBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 12,
  },
  messageText: {
    color: "#166534",
    fontSize: 13,
    fontFamily: "Sen",
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
    fontWeight: "700",
    fontFamily: "Sen",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#d9d0bd",
  },
  dividerText: {
    color: "#999184",
    fontSize: 13,
    fontFamily: "Sen",
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
    fontWeight: "700",
    fontFamily: "Sen",
  },
});

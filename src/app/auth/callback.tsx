
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    type?: string;
    error?: string;
    error_description?: string;
  }>();
    console.log("[AUTH CALLBACK ROUTE]", params);

  const [status, setStatus] = useState<
    "loading" | "success" | "recovery" | "error"
  >("loading");

  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function handleCallback() {
      try {
        const oauthError =
          params.error_description || params.error;

        if (oauthError) {
          throw new Error(oauthError);
        }

        if (params.code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(params.code);

          if (error) throw error;
        }

        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          throw new Error(
            "Nie udało się potwierdzić linku. Spróbuj ponownie.",
          );
        }

        if (active) {
          setStatus(
            params.type === "recovery" ? "recovery" : "success",
          );
        }
      } catch (err) {
        if (active) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Wystąpił błąd podczas przetwarzania linku.",
          );
          setStatus("error");
        }
      }
    }

    handleCallback();

    return () => {
      active = false;
    };
  }, [params.code, params.type, params.error, params.error_description]);

  async function handlePasswordUpdate() {
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Wpisane hasła nie są identyczne.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setStatus("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Nie udało się zmienić hasła.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (status === "success") {
    return <Redirect href="/" />;
  }

  if (status === "recovery") {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Ustaw nowe hasło</Text>
        <Text style={styles.subtitle}>
          Wybierz nowe hasło do swojego konta EcoMeans.
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Nowe hasło"
          placeholderTextColor="#999184"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Powtórz nowe hasło"
          placeholderTextColor="#999184"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        {errorMessage ? (
          <Text style={styles.error}>{errorMessage}</Text>
        ) : null}

        <Pressable
          onPress={handlePasswordUpdate}
          disabled={saving}
          style={[styles.button, saving && styles.disabled]}
        >
          <Text style={styles.buttonText}>
            {saving ? "Zapisywanie..." : "Zapisz nowe hasło"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3b742f" />
      <Text style={styles.subtitle}>Przygotowujemy Twoje konto...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5e6ce",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  heading: {
    color: "#3b742f",
    fontSize: 26,
    textAlign: "center",
    fontFamily: "Sen",
  },
  subtitle: {
    color: "#4e4d4d",
    fontSize: 15,
    textAlign: "center",
    fontFamily: "Sen",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9d0bd",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: "#4e4d4d",
    fontSize: 15,
    fontFamily: "Sen",
  },
  error: {
    color: "#b91c1c",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Sen",
  },
  button: {
    backgroundColor: "#3b742f",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Sen",
  },
  disabled: {
    opacity: 0.6,
  },
});

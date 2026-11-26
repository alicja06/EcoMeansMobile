
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { useAuth } from "@/auth/AuthContext";
import { useHousehold } from "@/auth/HouseholdContext";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    invite?: string;
    type?: string;
    error?: string;
    error_description?: string;
  }>();

  const { user } = useAuth();
  const { refreshHousehold } = useHousehold();

  const [status, setStatus] = useState<
    "loading" | "success" | "recovery" | "invite" | "error"
  >("loading");

  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(
    null,
  );
  const [continueToApp, setContinueToApp] = useState(false);
  const handledInviteCode = useRef<string | null>(null);

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

        if (params.invite) {
          if (active) setPendingInviteCode(params.invite);
          return;
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
  }, [
    params.code,
    params.invite,
    params.type,
    params.error,
    params.error_description,
  ]);

  useEffect(() => {
    if (
      !pendingInviteCode ||
      !user ||
      handledInviteCode.current === pendingInviteCode
    ) {
      return;
    }

    handledInviteCode.current = pendingInviteCode;
    let active = true;

    async function acceptHouseholdInvitation() {
      try {
        const { error } = await supabase.rpc(
          "accept_household_invite_code",
          { p_code: pendingInviteCode },
        );

        if (error) throw error;

        await refreshHousehold();

        if (active) {
          setStatus(params.type === "invite" ? "invite" : "success");
        }
      } catch {
        if (active) {
          setErrorMessage(
            "Nie udało się dołączyć do gospodarstwa. Otwórz aplikację i poproś właściciela o nowy kod.",
          );
          setStatus("error");
        }
      }
    }

    void acceptHouseholdInvitation();

    return () => {
      active = false;
    };
  }, [params.type, pendingInviteCode, refreshHousehold, user]);

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

  if (status === "success" || continueToApp) {
    return <Redirect href="/" />;
  }

  if (status === "recovery" || status === "invite") {
    const isInvitation = status === "invite";

    return (
      <View style={styles.container}>
        <AppText style={styles.heading}>
          {isInvitation ? "Ustaw hasło do konta" : "Ustaw nowe hasło"}
        </AppText>

        <AppText style={styles.subtitle}>
          {isInvitation
            ? "Utwórz hasło, aby móc logować się do EcoMeans."
            : "Wybierz nowe hasło do swojego konta EcoMeans."}
        </AppText>

        <AppTextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Nowe hasło"
          placeholderTextColor="#999184"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        <AppTextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Powtórz nowe hasło"
          placeholderTextColor="#999184"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />

        {errorMessage ? (
          <AppText style={styles.error}>{errorMessage}</AppText>
        ) : null}

        <Pressable
          onPress={handlePasswordUpdate}
          disabled={saving}
          style={[styles.button, saving && styles.disabled]}
        >
          <AppText style={styles.buttonText}>
            {saving
              ? "Zapisywanie..."
              : isInvitation
                ? "Ustaw hasło"
                : "Zapisz nowe hasło"}
          </AppText>
        </Pressable>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.container}>
        <AppText style={styles.error}>{errorMessage}</AppText>
        <Pressable
          onPress={() => setContinueToApp(true)}
          style={styles.button}
        >
          <AppText style={styles.buttonText}>Przejdź do aplikacji</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3b742f" />
      <AppText style={styles.subtitle}>
        Przygotowujemy Twoje konto...
      </AppText>
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
  },
  subtitle: {
    color: "#4e4d4d",
    fontSize: 15,
    textAlign: "center",
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
  },
  disabled: {
    opacity: 0.6,
  },
});

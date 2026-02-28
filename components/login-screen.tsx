import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { supabase, isEmailAuthorized } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) throw oauthError;

      const result = await WebBrowser.openAuthSessionAsync(
        data?.url ?? "",
        redirectTo
      );

      if (result.type === "success") {
        const { params, errorCode } = QueryParams.getQueryParams(result.url);

        if (errorCode) throw new Error(errorCode);

        const { access_token, refresh_token } = params;
        if (!access_token) throw new Error("No access token received");

        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({ access_token, refresh_token });

        if (sessionError) throw sessionError;

        // Check if user's email is authorized
        const email = sessionData.user?.email;
        if (!email || !(await isEmailAuthorized(email))) {
          await supabase.auth.signOut();
          setError(
            "You don't have access to REMS. Only REMS members can sign in."
          );
          return;
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>REMS</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {error !== "" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf9f7",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "300",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#94a3b8",
    marginBottom: 28,
  },
  errorBox: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    width: "100%",
  },
  errorText: {
    color: "#be123c",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1e3a5f",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

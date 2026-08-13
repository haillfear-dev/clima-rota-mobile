import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { geocodingService, GeocodingConfigurationError } from '../services/geocoding';
import { colors, radius, spacing } from '../theme';
import type { AddressSuggestion, Place } from '../types';
import { shortAddress } from '../utils/address';

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  onSelect: (place: Place) => void;
  variant?: 'origin' | 'destination';
};

export function AddressAutocomplete({ label, placeholder, value, onChangeText, onSelect, variant = 'origin' }: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();
  const selectedValue = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (value === selectedValue.current || value.trim().length < 3) {
      setSuggestions([]);
      setMessage(undefined);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setMessage(undefined);
      try {
        const results = await geocodingService.autocomplete(value.trim(), controller.signal);
        setSuggestions(results);
        if (!results.length) setMessage('Nenhum endereço encontrado. Tente incluir a cidade.');
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setSuggestions([]);
        setMessage(
          error instanceof GeocodingConfigurationError
            ? error.message
            : 'Não foi possível pesquisar agora. Verifique sua conexão.',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  function select(suggestion: AddressSuggestion) {
    selectedValue.current = shortAddress(suggestion.name);
    setSuggestions([]);
    setMessage(undefined);
    onSelect(suggestion);
  }

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputBox}>
        <View style={[styles.pin, { backgroundColor: variant === 'origin' ? colors.turquoise : colors.orange }]}><Ionicons name={variant === 'origin' ? 'ellipse' : 'location'} size={variant === 'origin' ? 9 : 16} color="#fff" /></View>
        <TextInput
          value={value}
          onChangeText={(text) => {
            selectedValue.current = undefined;
            onChangeText(text);
          }}
          placeholder={placeholder}
          placeholderTextColor="#89938F"
          style={styles.input}
          autoCapitalize="words"
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!suggestions.length && (
        <View style={styles.list}>
          {suggestions.map((suggestion) => (
            <Pressable key={suggestion.id} style={styles.suggestion} onPress={() => select(suggestion)}>
              <Ionicons name="pin-outline" size={18} color={colors.primary} />
              <View style={styles.suggestionText}>
                <Text numberOfLines={1} style={styles.title}>{suggestion.title}</Text>
                {!!suggestion.subtitle && <Text numberOfLines={2} style={styles.subtitle}>{suggestion.subtitle}</Text>}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  inputBox: { minHeight: 58, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  pin: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  message: { color: colors.danger, fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  list: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginTop: spacing.xs, overflow: 'hidden', backgroundColor: colors.surface },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  suggestionText: { flex: 1 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
});

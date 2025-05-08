import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { colors } from '@/constants/colors';
import { Search, X } from 'lucide-react-native';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onSearch: (query: string) => void;
  onClose?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({
  placeholder,
  value,
  onSearch,
  onClose,
  autoFocus = false,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[
      styles.container,
      focused && styles.containerFocused
    ]}>
      <Search size={20} color={colors.textLight} style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        value={value}
        onChangeText={onSearch}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
      />
      {(value.length > 0 || onClose) && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            if (value.length > 0) {
              onSearch('');
            } else if (onClose) {
              onClose();
            }
          }}
        >
          <X size={16} color={colors.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.text,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
});
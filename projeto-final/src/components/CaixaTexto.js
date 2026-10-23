import React, { useContext } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ContextoTema } from '../contexts/ThemeContext';

// ===== COMPONENTE: CAIXA DE TEXTO COM RÓTULO =====
// Props: rotulo, valor, ao_mudar, placeholder, multilinhas.
export default function EntradaTexto({
  rotulo,
  valor,
  ao_mudar,
  placeholder,
  multilinhas = false,
}) {
  const { tema_escuro } = useContext(ContextoTema);

  // ===== CORES DO TEMA =====
  const cor_texto = tema_escuro ? '#FFFFFF' : '#333333';
  const cor_subtexto = tema_escuro ? '#9CA3AF' : '#6B7280';
  const cor_borda = tema_escuro ? '#333333' : '#E5E7EB';

  return (
    <View style={estilos.grupo_entrada}>
      <Text style={[estilos.rotulo, { color: cor_subtexto }]}>{rotulo}</Text>
      <TextInput
        style={[
          estilos.entrada,
          { color: cor_texto, borderColor: cor_borda },
          multilinhas && estilos.area_texto,
        ]}
        value={valor}
        onChangeText={ao_mudar}
        placeholder={placeholder}
        placeholderTextColor={cor_subtexto}
        multiline={multilinhas}
        textAlignVertical={multilinhas ? 'top' : 'center'}
      />
    </View>
  );
}

// ===== ESTILOS DA CAIXA DE TEXTO =====
const estilos = StyleSheet.create({
  grupo_entrada: { marginBottom: 20 },
  rotulo: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
  entrada: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 15,
  },
  area_texto: {
    paddingTop: 15,
    height: 100,
  },
});

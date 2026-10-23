import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ContextoTema } from '../contexts/ThemeContext';

// ===== COMPONENTE: CABEÇALHO COM BOTÃO VOLTAR =====
// Props: titulo.
export default function CabecalhoVoltar({ titulo }) {
  const navegacao = useNavigation();
  const { tema_escuro } = useContext(ContextoTema);

  // ===== COR DO TÍTULO (TEMA) =====
  const cor_titulo = tema_escuro ? '#93C5FD' : '#2A2B8D';

  return (
    <View style={estilos.cabecalho}>
      <TouchableOpacity
        onPress={() => navegacao.goBack()}
        style={estilos.botao_voltar}>
        <Ionicons name="arrow-back" size={28} color={cor_titulo} />
      </TouchableOpacity>
      <Text style={[estilos.titulo_cabecalho, { color: cor_titulo }]}>
        {titulo}
      </Text>
      <View style={{ width: 28 }} />{' '}
    </View>
  );
}

// ===== ESTILOS DO CABEÇALHO =====
const estilos = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 20,
  },
  botao_voltar: { padding: 5 },
  titulo_cabecalho: { fontSize: 24, fontWeight: 'bold' },
});

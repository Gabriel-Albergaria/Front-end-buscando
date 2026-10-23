import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ContextoTema } from '../../contexts/ThemeContext';
import CabecalhoVoltar from '../../components/Cabecalho';

// ===== TELA: SOBRE O APP =====
export default function Sobre() {
  const { tema_escuro } = useContext(ContextoTema);

  // ===== CORES DO TEMA =====
  const fundo_principal = tema_escuro ? '#121212' : '#EEF2F6';
  const fundo_cartao = tema_escuro ? '#1E1E1E' : '#FFFFFF';
  const cor_texto_principal = tema_escuro ? '#FFFFFF' : '#1E1B4B';
  const cor_texto_secundario = tema_escuro ? '#9CA3AF' : '#475569';
  const cor_texto_lista = tema_escuro ? '#E2E8F0' : '#334155';
  const cor_borda = tema_escuro ? '#333333' : '#E2E8F0';
  const azul_principal = '#3B82F6';

  // ===== VISUAL DA TELA (JSX) =====
  return (
    <SafeAreaView
      style={[estilos.container, { backgroundColor: fundo_principal }]}>
      {/* CABEÇALHO */}
      <CabecalhoVoltar titulo="Sobre o app" />

      {/* ÍCONE DO APP */}
      <View style={estilos.espaco_imagem}>
        <Ionicons name="bus" size={100} color={azul_principal} />
      </View>

      {/* SUBTÍTULO */}
      <Text style={[estilos.subtitulo, { color: cor_texto_secundario }]}>
        Seu app de transporte público em tempo real.
      </Text>

      {/* LISTA DE FUNCIONALIDADES */}
      <View style={estilos.container_lista}>
        {/* ITEM: PONTOS DE ÔNIBUS PRÓXIMOS */}
        <View
          style={[
            estilos.item_lista,
            { backgroundColor: fundo_cartao, borderColor: cor_borda },
          ]}>
          <Ionicons
            name="location-outline"
            size={24}
            color={cor_texto_lista}
            style={estilos.icone}
          />
          <Text style={[estilos.texto_lista, { color: cor_texto_lista }]}>
            Localize pontos de ônibus próximos
          </Text>
        </View>

        {/* ITEM: HORÁRIOS E ITINERÁRIOS */}
        <View
          style={[
            estilos.item_lista,
            { backgroundColor: fundo_cartao, borderColor: cor_borda },
          ]}>
          <Ionicons
            name="bus-outline"
            size={24}
            color={cor_texto_lista}
            style={estilos.icone}
          />
          <Text style={[estilos.texto_lista, { color: cor_texto_lista }]}>
            Veja horários e itinerários
          </Text>
        </View>
      </View>

      {/* RODAPÉ COM A VERSÃO */}
      <View style={estilos.rodape}>
        <Text style={[estilos.versao, { color: cor_texto_secundario }]}>
          Versão 1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ===== ESTILOS DA TELA =====
const estilos = StyleSheet.create({
  container: {
    flex: 1,
  },
  espaco_imagem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    marginTop: 10,
  },
  subtitulo: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 30,
  },
  container_lista: {
    paddingHorizontal: 20,
  },
  item_lista: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 25,
    marginBottom: 15,
    borderWidth: 1,
  },
  icone: {
    marginRight: 15,
  },
  texto_lista: {
    fontSize: 15,
  },
  rodape: {
    marginTop: 'auto',
    marginBottom: 30,
    alignItems: 'center',
  },
  versao: {
    fontSize: 16,
    marginBottom: 20,
  },
});

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ContextoTema } from '../../contexts/ThemeContext';

// ===== TELA: CONFIGURAÇÕES =====
export default function Configuracoes() {
  const navegacao = useNavigation();

  // ===== TEMA ESCURO (CONTEXTO GLOBAL) =====
  const { tema_escuro, set_tema_escuro } = useContext(ContextoTema);



  // ===== CORES DO TEMA =====
  const fundo = tema_escuro ? '#121212' : '#F4F7FB';
  const cor_texto = tema_escuro ? '#FFFFFF' : '#333333';
  const cor_titulo = tema_escuro ? '#93C5FD' : '#1E1B8D';
  const fundo_cartao = tema_escuro ? '#1E1E1E' : '#FFFFFF';
  const cor_borda = tema_escuro ? '#333333' : '#D1D5DB';
  const cor_ativa_switch = '#5B4B99';

  // ===== ESTRUTURA DA TELA =====
  return (
    <SafeAreaView style={[estilos.container, { backgroundColor: fundo }]}>
      {/* CABEÇALHO COM BOTÃO VOLTAR */}
      <View style={estilos.cabecalho}>
        <TouchableOpacity
          onPress={() => navegacao.goBack()}
          style={estilos.botao_voltar}>
          <Ionicons name="arrow-back" size={28} color={cor_titulo} />
        </TouchableOpacity>
        <Text style={[estilos.titulo_cabecalho, { color: cor_titulo }]}>
          Configurações
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* OPÇÃO: TEMA ESCURO (SWITCH) */}
      <View style={estilos.conteudo}>
        <View
          style={[
            estilos.item_configuracao,
            { backgroundColor: fundo_cartao, borderColor: cor_borda },
          ]}>
          <Text style={[estilos.texto_configuracao, { color: cor_texto }]}>
            Tema escuro
          </Text>
          <Switch
            value={tema_escuro}
            onValueChange={set_tema_escuro}
            trackColor={{ false: '#D1D5DB', true: cor_ativa_switch }}
            thumbColor={'#FFFFFF'}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ===== ESTILOS DA TELA =====
const estilos = StyleSheet.create({
  container: { flex: 1 },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 25,
  },
  botao_voltar: { padding: 5 },
  titulo_cabecalho: { fontSize: 22, fontWeight: 'bold' },
  conteudo: { paddingHorizontal: 20 },
  item_configuracao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: 12,
  },
  texto_configuracao: { fontSize: 16, fontWeight: '400' },
});

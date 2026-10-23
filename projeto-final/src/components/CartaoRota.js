import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContextoTema } from '../contexts/ThemeContext';

// ===== COMPONENTE: CARTÃO DE ROTA =====
// Item de lista com código, nome, subtítulo e ícone de ação opcional.
export default function CartaoRota({
  codigo,
  nome,
  subtitulo,
  cor_distintivo,
  icone_acao,
  cor_icone,
  ao_pressionar_cartao,
  ao_pressionar_icone,
}) {
  const { tema_escuro } = useContext(ContextoTema);

  // ===== CORES DO TEMA =====
  const fundo_cartao = tema_escuro ? '#1E1E1E' : '#FFFFFF';
  const cor_texto = tema_escuro ? '#FFFFFF' : '#333333';
  const cor_subtexto = tema_escuro ? '#9CA3AF' : '#6B7280';
  const cor_borda = tema_escuro ? '#333333' : '#E5E7EB';

  return (
    <TouchableOpacity
      style={[
        estilos.cartao_rota,
        { backgroundColor: fundo_cartao, borderColor: cor_borda },
      ]}
      onPress={ao_pressionar_cartao}>
      {/* DISTINTIVO COM O CÓDIGO DA ROTA */}
      <View
        style={[
          estilos.distintivo_rota,
          { backgroundColor: cor_distintivo || '#3B82F6' },
        ]}>
        <Text style={estilos.texto_distintivo_rota}>{codigo}</Text>
      </View>

      {/* NOME E SUBTÍTULO */}
      <View style={estilos.info_rota}>
        <Text style={[estilos.nome_rota, { color: cor_texto }]}>{nome}</Text>
        <Text style={[estilos.endereco_rota, { color: cor_subtexto }]}>
          {subtitulo}
        </Text>
      </View>

      {/* ÍCONE DE AÇÃO (OPCIONAL) */}
      {icone_acao && (
        <TouchableOpacity onPress={ao_pressionar_icone} style={{ padding: 10 }}>
          <Ionicons
            name={icone_acao}
            size={24}
            color={cor_icone || cor_subtexto}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ===== ESTILOS DO CARTÃO =====
const estilos = StyleSheet.create({
  cartao_rota: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  distintivo_rota: {
    width: 55,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  texto_distintivo_rota: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  info_rota: { flex: 1 },
  nome_rota: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  endereco_rota: { fontSize: 12 },
});

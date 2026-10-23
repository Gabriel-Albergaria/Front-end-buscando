import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ContextoTema } from '../../contexts/ThemeContext';
import CabecalhoVoltar from '../../components/Cabecalho';
import api from '../../connection/api';

// ===== FORMATAR NÚMERO COM 2 DÍGITOS =====
const dois = (n) => String(n).padStart(2, '0');

// ===== FORMATAR DATA DA SUGESTÃO =====
// "2026-10-21T13:05:00.000Z" -> "21/10/2026 às 10:05" (horário do aparelho)
function formatar_data(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return (
    `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} ` +
    `às ${dois(d.getHours())}:${dois(d.getMinutes())}`
  );
}

// ===== TELA: SUGESTÕES RECEBIDAS (SÓ ADM) =====
export default function SugestoesRecebidas() {
  const { tema_escuro, adm } = useContext(ContextoTema);

  // ===== ESTADOS DA TELA =====
  // sugestoes, filtro (todas/não lidas), carregando, atualizando e erro.
  const [sugestoes, set_sugestoes] = useState([]);
  const [filtro, set_filtro] = useState('todas'); // 'todas' | 'nao_lidas'
  const [carregando, set_carregando] = useState(true);
  const [atualizando, set_atualizando] = useState(false);
  const [erro, set_erro] = useState(false);

  // ===== CORES DO TEMA =====
  const fundo = tema_escuro ? '#121212' : '#F4F7FB';
  const cor_texto = tema_escuro ? '#E2E8F0' : '#333333';
  const cor_subtexto = tema_escuro ? '#9CA3AF' : '#6B7280';
  const cor_cartao = tema_escuro ? '#1E1E1E' : '#FFFFFF';
  const cor_borda = tema_escuro ? '#333333' : '#E5E7EB';
  const azul_principal = '#2563EB';

  // ===== CARREGAR SUGESTÕES (GET /sugestoes) =====
  const carregar = useCallback(async () => {
    set_erro(false);
    try {
      const resposta = await api.get('/sugestoes');
      set_sugestoes(resposta.data);
    } catch (e) {
      console.log('Erro ao carregar sugestões:', e.message);
      set_erro(true);
    } finally {
      set_carregando(false);
      set_atualizando(false);
    }
  }, []);

  // ===== RECARREGAR AO ENTRAR NA TELA =====
  // Atualiza sempre que a tela é aberta
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  // ===== TOTAL DE SUGESTÕES NÃO LIDAS =====
  const total_nao_lidas = useMemo(
    () => sugestoes.filter((s) => !s.lida).length,
    [sugestoes]
  );

  // ===== LISTA FILTRADA (TODAS OU NÃO LIDAS) =====
  const lista = filtro === 'nao_lidas' ? sugestoes.filter((s) => !s.lida) : sugestoes;

  // ===== MARCAR COMO LIDA/NÃO LIDA (PUT /sugestoes/:id/lida) =====
  const marcar_lida = async (sugestao, lida) => {
    try {
      await api.put(`/sugestoes/${sugestao.id}/lida`, { lida });
      set_sugestoes((anterior) =>
        anterior.map((s) => (s.id === sugestao.id ? { ...s, lida } : s))
      );
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar a sugestão.');
    }
  };

  // ===== APAGAR SUGESTÃO (DELETE /sugestoes/:id) =====
  const apagar = (sugestao) => {
    Alert.alert('Apagar sugestão', 'Tem certeza que deseja apagar esta sugestão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/sugestoes/${sugestao.id}`);
            set_sugestoes((anterior) => anterior.filter((s) => s.id !== sugestao.id));
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível apagar a sugestão.');
          }
        },
      },
    ]);
  };

  // ===== BLOQUEIO PARA QUEM NÃO É ADM =====
  // Só administradores veem esta tela
  if (!adm) {
    return (
      <SafeAreaView
        style={[
          estilos.container,
          { backgroundColor: fundo, justifyContent: 'center', alignItems: 'center' },
        ]}>
        <Ionicons name="lock-closed-outline" size={70} color={cor_subtexto} style={{ opacity: 0.6 }} />
        <Text style={{ color: cor_texto, fontSize: 16, marginTop: 15 }}>
          Esta área é exclusiva para administradores.
        </Text>
      </SafeAreaView>
    );
  }

  // ===== CARTÃO DE CADA SUGESTÃO =====
  // Função usada como renderItem da lista.
  const renderizar = ({ item }) => {
    const nome = item.nome_usuario ? item.nome_usuario.trim() : 'Anônimo';
    const inicial = item.nome_usuario ? nome.charAt(0).toUpperCase() : '';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        // tocar numa sugestão nova já a marca como lida
        onPress={() => !item.lida && marcar_lida(item, true)}
        style={[
          estilos.cartao,
          { backgroundColor: cor_cartao, borderColor: cor_borda },
          !item.lida && { borderLeftWidth: 4, borderLeftColor: azul_principal },
        ]}>
        {/* LINHA DO TOPO: AVATAR, NOME E E-MAIL */}
        <View style={estilos.linha_topo}>
          <View style={[estilos.avatar, { backgroundColor: item.nome_usuario ? azul_principal : '#9CA3AF' }]}>
            {item.nome_usuario ? (
              <Text style={estilos.texto_avatar}>{inicial}</Text>
            ) : (
              <Ionicons name="person-outline" size={20} color="#FFF" />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: cor_texto, fontWeight: 'bold', fontSize: 16 }}>{nome}</Text>
            <Text style={{ color: cor_subtexto, fontSize: 13 }}>
              {item.email_usuario || 'Enviada sem login'}
            </Text>
          </View>

          {/* BOLINHA AZUL (SUGESTÃO NOVA) */}
          {!item.lida && <View style={estilos.bolinha_nova} />}
        </View>

        {/* TEXTO DA SUGESTÃO */}
        <Text style={{ color: cor_texto, fontSize: 15, lineHeight: 22, marginTop: 12 }}>
          {item.mensagem}
        </Text>

        {/* RODAPÉ: DATA, MARCAR COMO LIDA E APAGAR */}
        <View style={estilos.linha_rodape}>
          <Text style={{ color: cor_subtexto, fontSize: 12, flex: 1 }}>
            {formatar_data(item.data_envio)}
          </Text>

          {/* BOTÃO: MARCAR COMO LIDA/NÃO LIDA */}
          <TouchableOpacity
            onPress={() => marcar_lida(item, !item.lida)}
            style={[estilos.botao_pequeno, { borderColor: cor_borda }]}>
            <Ionicons
              name={item.lida ? 'mail-unread-outline' : 'checkmark-done-outline'}
              size={16}
              color={azul_principal}
            />
            <Text style={{ color: azul_principal, fontSize: 12, marginLeft: 4, fontWeight: '600' }}>
              {item.lida ? 'Marcar como não lida' : 'Marcar como lida'}
            </Text>
          </TouchableOpacity>

          {/* BOTÃO: APAGAR */}
          <TouchableOpacity onPress={() => apagar(item)} style={{ padding: 6, marginLeft: 6 }}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ===== ESTADOS VAZIOS =====
  // Carregando, erro de conexão e lista vazia.
  const estado_vazio = () => {
    if (carregando) {
      return (
        <View style={estilos.vazio}>
          <ActivityIndicator size="large" color={azul_principal} />
        </View>
      );
    }
    if (erro) {
      return (
        <View style={estilos.vazio}>
          <MaterialCommunityIcons name="cloud-off-outline" size={70} color="#9CA3AF" style={{ opacity: 0.6 }} />
          <Text style={{ color: cor_texto, fontSize: 16, marginTop: 15, textAlign: 'center' }}>
            Não foi possível carregar as sugestões.
          </Text>
          <TouchableOpacity style={estilos.botao_tentar} onPress={carregar}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={estilos.vazio}>
        <MaterialCommunityIcons name="message-off-outline" size={70} color="#9CA3AF" style={{ opacity: 0.5 }} />
        <Text style={{ color: cor_texto, fontSize: 16, marginTop: 15, textAlign: 'center' }}>
          {filtro === 'nao_lidas'
            ? 'Nenhuma sugestão não lida.'
            : 'Nenhuma sugestão recebida ainda.'}
        </Text>
      </View>
    );
  };

  // ===== OPÇÕES DO FILTRO =====
  const filtros = [
    { id: 'todas', rotulo: `Todas (${sugestoes.length})` },
    { id: 'nao_lidas', rotulo: `Não lidas (${total_nao_lidas})` },
  ];

  // ===== VISUAL DA TELA (JSX) =====
  return (
    <SafeAreaView style={[estilos.container, { backgroundColor: fundo }]}>
      {/* CABEÇALHO */}
      <CabecalhoVoltar titulo="Sugestões recebidas" />

      {/* BOTÕES DE FILTRO (TODAS / NÃO LIDAS) */}
      <View style={estilos.filtros}>
        {filtros.map((f) => {
          const ativo = filtro === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[
                estilos.filtro,
                { borderColor: ativo ? azul_principal : cor_borda },
                ativo && { backgroundColor: tema_escuro ? '#1E3A8A' : '#EFF6FF' },
              ]}
              onPress={() => set_filtro(f.id)}>
              <Text
                style={{
                  color: ativo ? azul_principal : cor_subtexto,
                  fontWeight: ativo ? 'bold' : 'normal',
                }}>
                {f.rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* LISTA DE SUGESTÕES */}
      <FlatList
        data={lista}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderizar}
        ListEmptyComponent={estado_vazio}
        contentContainerStyle={{ padding: 20, paddingTop: 10, flexGrow: 1 }}
        refreshing={atualizando}
        onRefresh={() => {
          set_atualizando(true);
          carregar();
        }}
      />
    </SafeAreaView>
  );
}

// ===== ESTILOS DA TELA =====
const estilos = StyleSheet.create({
  container: { flex: 1 },
  filtros: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 6 },
  filtro: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginRight: 8,
  },
  vazio: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  botao_tentar: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  cartao: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  linha_topo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  texto_avatar: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  bolinha_nova: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
    marginLeft: 8,
  },
  linha_rodape: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  botao_pequeno: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
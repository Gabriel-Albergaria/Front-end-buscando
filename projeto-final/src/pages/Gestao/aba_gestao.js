// ARQUIVO: src/pages/Gestao/aba_gestao.js no Frontend
import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ContextoTema } from '../../contexts/ThemeContext';
import CabecalhoVoltar from '../../components/Cabecalho';
import CartaoRota from '../../components/CartaoRota';
import api from '../../connection/api';

// ===== TELA: GESTÃO DE ROTAS (SÓ ADM) =====
// Lista as rotas, mostra contadores por status e abre o menu de editar/simular/apagar.
export default function GestaoRotas() {
  // ===== NAVEGAÇÃO E CONTEXTO GLOBAL =====
  const navegacao = useNavigation();
  const { tema_escuro, rotas_globais, set_rotas_globais } =
    useContext(ContextoTema);

  // ===== ESTADOS DA TELA =====
  // filtro_ativo = filtro de status 
  //  rota_selecionada = rota tocada 
  //  menu_acao_visivel = menu inferior.
  const [filtro_ativo, set_filtro_ativo] = useState('Todas');
  const [rota_selecionada, set_rota_selecionada] = useState(null);
  const [indice_selecionado, set_indice_selecionado] = useState(null);
  const [menu_acao_visivel, set_menu_acao_visivel] = useState(false);

  // FUNDOS E CORES
  const fundo = tema_escuro ? '#121212' : '#F4F7FB';
  const fundo_cartao = tema_escuro ? '#1E1E1E' : '#FFFFFF';
  const cor_texto = tema_escuro ? '#FFFFFF' : '#333333';
  const cor_subtexto = tema_escuro ? '#9CA3AF' : '#6B7280';
  const cor_borda = tema_escuro ? '#333333' : '#E5E7EB';
  const azul_principal = '#3B82F6';
  const filtros = ['Todas', 'Ativas', 'Em and.', 'Inativas'];

  // BUSCA ROTAS DO BANCO DE DADOS
  const buscarRotas = async () => {
    try {
      const resposta = await api.get('/rotas');
      set_rotas_globais(resposta.data);
    } catch (erro) {
      console.error('Erro ao buscar rotas no banco: ', erro);
    }
  };

  // ATUALIZA QUANDO A TELA É ABERTA
  useFocusEffect(
    useCallback(() => {
      buscarRotas();
    }, [])
  );

  // ===== COR DE CADA STATUS DA ROTA =====
  const obter_cor_status = (status) => {
    switch (status) {
      case 'Ativa':
        return '#10B981';
      case 'Em and.':
        return '#F59E0B';
      case 'Inativa':
        return '#EF4444';
      default:
        return azul_principal;
    }
  };

  // ===== CONTADORES DO PAINEL =====
  // Total, ativas, em andamento e inativas.
  const total_rotas = rotas_globais.length;
  const total_ativas = rotas_globais.filter(
    (r) => r.status_rota === 'Ativa'
  ).length;
  const total_andamento = rotas_globais.filter(
    (r) => r.status_rota === 'Em and.'
  ).length;
  const total_inativas = rotas_globais.filter(
    (r) => r.status_rota === 'Inativa'
  ).length;

  // ===== FILTRO POR STATUS =====
  const rotas_filtradas = rotas_globais.filter((rota) => {
    if (filtro_ativo === 'Todas') return true;
    if (filtro_ativo === 'Ativas' && rota.status_rota === 'Ativa') return true;
    if (filtro_ativo === 'Em and.' && rota.status_rota === 'Em and.')
      return true;
    if (filtro_ativo === 'Inativas' && rota.status_rota === 'Inativa')
      return true;
    return false;
  });

  // ===== ABRIR MENU DE OPÇÕES DA ROTA =====
  const abrir_opcoes_rota = (rota, indice) => {
    set_rota_selecionada(rota);
    set_indice_selecionado(indice);
    set_menu_acao_visivel(true);
  };

  // ===== IR PARA A TELA DE EDIÇÃO =====
  const ir_edicao = () => {
    set_menu_acao_visivel(false);
    navegacao.navigate('EditarRota', {
      rota_original: rota_selecionada,
      indice_original: indice_selecionado,
    });
  };

  // ===== IR PARA A TELA DE SIMULAÇÃO =====
  const ir_simulacao = () => {
    set_menu_acao_visivel(false);
    navegacao.navigate('SimulacaoOnibus', { rota: rota_selecionada });
  };

  // APAGA A ROTA DO BANCO DE DADOS
  const apagar_rota = () => {
    Alert.alert(
      'Apagar Rota',
      `Tem certeza que deseja apagar a rota "${rota_selecionada?.codigo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/rotas/${rota_selecionada.codigo}`);
              buscarRotas(); // Puxa do banco atualizado
              set_menu_acao_visivel(false);
              Alert.alert('Sucesso', 'Rota removida permanentemente!');
            } catch (erro) {
              console.error(erro);
              Alert.alert(
                'Erro',
                'Não foi possível apagar a rota no servidor.'
              );
            }
          },
        },
      ]
    );
  };

  // ===== VISUAL DA TELA (JSX) =====
  return (
    <SafeAreaView style={[estilos.container, { backgroundColor: fundo }]}>
      {/* CABEÇALHO */}
      <CabecalhoVoltar titulo="Gestão de rotas" />

      {/* ÁREA ROLÁVEL */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.conteudo_rolagem}>
        {/* PAINEL DE NÚMEROS (CARTÕES DE RESUMO) */}
        <View style={estilos.cartoes_painel}>
          {/* CARTÃO: TOTAL */}
          <View style={estilos.item_cartao}>
            <View
              style={[
                estilos.quadrado_icone,
                { backgroundColor: tema_escuro ? '#1E3A8A' : '#EFF6FF' },
              ]}>
              <Text
                style={{ fontSize: 20, fontWeight: 'bold', color: '#3B82F6' }}>
                {total_rotas}
              </Text>
            </View>
            <Text style={[estilos.texto_cartao, { color: cor_texto }]}>
              Total
            </Text>
          </View>
          {/* CARTÃO: ATIVAS */}
          <View style={estilos.item_cartao}>
            <View
              style={[
                estilos.quadrado_icone,
                { backgroundColor: tema_escuro ? '#064E3B' : '#F0FDF4' },
              ]}>
              <Text
                style={{ fontSize: 20, fontWeight: 'bold', color: '#10B981' }}>
                {total_ativas}
              </Text>
            </View>
            <Text style={[estilos.texto_cartao, { color: cor_texto }]}>
              Ativas
            </Text>
          </View>
          {/* CARTÃO: EM ANDAMENTO */}
          <View style={estilos.item_cartao}>
            <View
              style={[
                estilos.quadrado_icone,
                { backgroundColor: tema_escuro ? '#78350F' : '#FFFBEB' },
              ]}>
              <Text
                style={{ fontSize: 20, fontWeight: 'bold', color: '#F59E0B' }}>
                {total_andamento}
              </Text>
            </View>
            <Text style={[estilos.texto_cartao, { color: cor_texto }]}>
              Em And.
            </Text>
          </View>
          {/* CARTÃO: INATIVAS */}
          <View style={estilos.item_cartao}>
            <View
              style={[
                estilos.quadrado_icone,
                { backgroundColor: tema_escuro ? '#7F1D1D' : '#FEF2F2' },
              ]}>
              <Text
                style={{ fontSize: 20, fontWeight: 'bold', color: '#EF4444' }}>
                {total_inativas}
              </Text>
            </View>
            <Text style={[estilos.texto_cartao, { color: cor_texto }]}>
              Inativas
            </Text>
          </View>
        </View>

        {/* FILTROS DE STATUS (CHIPS) */}
        <View style={estilos.container_filtro}>
          {filtros.map((filtro) => (
            <TouchableOpacity
              key={filtro}
              style={[
                estilos.chip_filtro,
                { backgroundColor: fundo_cartao, borderColor: cor_borda },
                filtro_ativo === filtro && {
                  backgroundColor: tema_escuro ? '#1E3A8A' : '#E0E7FF',
                  borderColor: '#3B82F6',
                },
              ]}
              onPress={() => set_filtro_ativo(filtro)}>
              <Text
                style={[
                  estilos.texto_filtro,
                  { color: cor_subtexto },
                  filtro_ativo === filtro && {
                    color: tema_escuro ? '#93C5FD' : '#2A2B8D',
                    fontWeight: 'bold',
                  },
                ]}>
                {filtro}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LISTA DE ROTAS OU MENSAGEM DE LISTA VAZIA */}
        {rotas_filtradas.length === 0 ? (
          /* LISTA VAZIA */
          <View style={estilos.estado_vazio}>
            <View
              style={[
                estilos.bola_icone_vazio,
                { backgroundColor: tema_escuro ? '#1E1E1E' : '#F3F4F6' },
              ]}>
              <MaterialCommunityIcons
                name="clipboard-text-off-outline"
                size={60}
                color={cor_subtexto}
              />
            </View>
            <Text style={[estilos.titulo_vazio, { color: cor_texto }]}>
              Sem rotas por aqui
            </Text>
            <Text style={[estilos.subtitulo_vazio, { color: cor_subtexto }]}>
              Nenhuma rota cadastrada ou encontrada no filtro.
            </Text>
          </View>
        ) : (
          /* CARTÃO DE CADA ROTA */
          rotas_filtradas.map((rota, indice) => {
            const cor_rota = obter_cor_status(rota.status_rota);
            return (
              <CartaoRota
                key={indice}
                codigo={rota.codigo}
                nome={rota.nome}
                subtitulo={`Status: ${rota.status_rota} • ${rota.veiculo}`}
                cor_distintivo={cor_rota}
                icone_acao="ellipsis-vertical"
                ao_pressionar_cartao={() => abrir_opcoes_rota(rota, indice)}
                ao_pressionar_icone={() => abrir_opcoes_rota(rota, indice)}
              />
            );
          })
        )}

        {/* BOTÃO: NOVA ROTA */}
        <TouchableOpacity
          style={estilos.botao_criar}
          onPress={() => navegacao.navigate('CriarRota')}>
          <Text style={estilos.texto_botao_criar}>+ Nova Rota</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MENU DE AÇÕES DA ROTA (EDITAR, SIMULAR, APAGAR) */}
      <Modal visible={menu_acao_visivel} transparent animationType="slide">
        {/* FUNDO ESCURO (TOCAR FECHA O MENU) */}
        <TouchableOpacity
          style={estilos.sobreposicao_modal}
          activeOpacity={1}
          onPress={() => set_menu_acao_visivel(false)}>
          {/* PAINEL INFERIOR (BOTTOM SHEET) */}
          <View
            style={[
              estilos.conteudo_bottom_sheet,
              { backgroundColor: fundo_cartao },
            ]}>
            <View style={estilos.puxador_bottom_sheet} />
            <Text style={[estilos.titulo_modal, { color: cor_texto }]}>
              Rota: {rota_selecionada?.codigo}
            </Text>

            {/* OPÇÃO: EDITAR ROTA */}
            <TouchableOpacity
              style={[estilos.opcao_menu, { borderBottomColor: cor_borda }]}
              onPress={ir_edicao}>
              <Ionicons
                name="pencil-outline"
                size={22}
                color={azul_principal}
                style={{ marginRight: 15 }}
              />
              <Text
                style={{ color: cor_texto, fontSize: 16, fontWeight: '500' }}>
                Editar Rota
              </Text>
            </TouchableOpacity>

            {/* OPÇÃO: SIMULAÇÃO DO ÔNIBUS */}
            <TouchableOpacity
              style={[estilos.opcao_menu, { borderBottomColor: cor_borda }]}
              onPress={ir_simulacao}>
              <Ionicons
                name="bus-outline"
                size={22}
                color={azul_principal}
                style={{ marginRight: 15 }}
              />
              <Text
                style={{ color: cor_texto, fontSize: 16, fontWeight: '500' }}>
                Simulação ônibus
              </Text>
            </TouchableOpacity>

            {/* OPÇÃO: APAGAR ROTA */}
            <TouchableOpacity
              style={[estilos.opcao_menu, { borderBottomColor: cor_borda }]}
              onPress={apagar_rota}>
              <Ionicons
                name="trash-outline"
                size={22}
                color="#EF4444"
                style={{ marginRight: 15 }}
              />
              <Text
                style={{ color: '#EF4444', fontSize: 16, fontWeight: '500' }}>
                Apagar Rota
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ===== ESTILOS DA TELA =====
const estilos = StyleSheet.create({
  container: { flex: 1 },
  conteudo_rolagem: { paddingHorizontal: 20, paddingBottom: 40 },
  cartoes_painel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  item_cartao: { alignItems: 'center', width: '23%' },
  quadrado_icone: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  texto_cartao: { fontSize: 11, textAlign: 'center', fontWeight: '600' },
  container_filtro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  chip_filtro: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
  },
  texto_filtro: { fontSize: 13 },
  estado_vazio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  bola_icone_vazio: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  titulo_vazio: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  subtitulo_vazio: { fontSize: 14, textAlign: 'center' },
  botao_criar: {
    backgroundColor: '#2563EB',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  texto_botao_criar: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  sobreposicao_modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0)',
    justifyContent: 'flex-end',
  },
  conteudo_bottom_sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingTop: 15,
    paddingBottom: 40,
    elevation: 10,
  },
  puxador_bottom_sheet: {
    width: 45,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  titulo_modal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  opcao_menu: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
});

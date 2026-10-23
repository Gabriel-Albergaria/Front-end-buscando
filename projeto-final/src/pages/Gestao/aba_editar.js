import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ContextoTema } from '../../contexts/ThemeContext';
// IMPORTAÇÃO DA API AQUI
import api from '../../connection/api';
import EditorTrajeto from '../../components/EditorTrajeto';

// ===== TELA: EDITAR ROTA (SÓ ADM) =====
export default function EditarRota() {
  // ===== NAVEGAÇÃO E CONTEXTO GLOBAL =====
  const navegacao = useNavigation();
  const rota = useRoute();
  const { tema_escuro } = useContext(ContextoTema);

  // ===== ROTA RECEBIDA DA TELA ANTERIOR =====
  // Pegamos a rota que o utilizador clicou na tela anterior
  const { rota_original } = rota.params;

  // ===== CAMPOS DO FORMULÁRIO =====
  // Já começam preenchidos com os dados da rota escolhida.
  const [aba_ativa, set_aba_ativa] = useState('Geral');

  // O código normalmente não se altera (é a chave primária), mas mantemos para exibição
  const [codigo, set_codigo] = useState(rota_original.codigo);

  // Carregamos os dados originais nos formulários
  const [nome, set_nome] = useState(rota_original.nome);
  const [distancia, set_distancia] = useState(rota_original.distancia || '');
  const [observacoes, set_observacoes] = useState(
    rota_original.observacoes || ''
  );
  const [tipo_rota, set_tipo_rota] = useState(
    rota_original.tipo_rota || 'Urbano'
  );
  const [veiculo, set_veiculo] = useState(
    rota_original.veiculo || 'Ônibus padrão'
  );
  const [status_rota, set_status_rota] = useState(
    rota_original.status_rota || 'Ativa'
  );
  const [dias_operacao, set_dias_operacao] = useState(
    rota_original.dias_operacao || 'Letivos'
  );

  // ===== ITINERÁRIO INICIAL (LOCAIS E HORÁRIOS) =====
  // Lógica local para os pontos (temporário no frontend até criar tabela própria)
  const itinerario_inicial = Array.isArray(rota_original.itinerarios)
    ? rota_original.itinerarios.map((i) => ({
        local: i.local || '',
        horarios: i.horarios || i.saidas || [],
      }))
    : [{ local: '', horarios: [] }];
  const [itinerarios, set_itinerarios] = useState(itinerario_inicial);
  const [entrada_horario, set_entrada_horario] = useState({});

  // ===== ESTADOS DOS MODAIS E DO TRAJETO =====
  const [modal_tipo_visivel, set_modal_tipo_visivel] = useState(false);
  const [modal_veiculo_visivel, set_modal_veiculo_visivel] = useState(false);
  const [trajeto, set_trajeto] = useState(
    Array.isArray(rota_original.coordenadas_trajeto)
      ? rota_original.coordenadas_trajeto
      : []
  );
  const [modal_trajeto_visivel, set_modal_trajeto_visivel] = useState(false);

  // ===== OPÇÕES DAS LISTAS =====
  // Tipos de rota, veículos, status e dias de operação.
  const tipos_rota = ['Urbano', 'Rural', 'Escolar', 'Intermunicipal'];
  const tipos_veiculo = ['Ônibus padrão', 'Micro-ônibus', 'Van', 'Articulado'];
  const opcoes_status = ['Ativa', 'Em and.', 'Inativa'];
  const opcoes_dias = [
    'Seg-Sex',
    'Seg-Sab',
    'Seg-Dom',
    'Sab/Dom',
    'Dom/Fer',
    'Só Dom',
    'Letivos',
  ];

  // ===== CORES DO TEMA =====
  const fundo = tema_escuro ? '#121212' : '#F4F7FB';
  const fundo_cartao = tema_escuro ? '#1E1E1E' : '#FFFFFF';
  const cor_texto = tema_escuro ? '#FFFFFF' : '#333333';
  const cor_subtexto = tema_escuro ? '#9CA3AF' : '#6B7280';
  const cor_titulo = tema_escuro ? '#93C5FD' : '#2A2B8D';
  const cor_borda = tema_escuro ? '#333333' : '#E5E7EB';
  const azul_principal = '#2563EB';

  // ===== ABAS DO FORMULÁRIO (GERAL / OPERAÇÃO) =====
  const abas = [
    { nome: 'Geral', icone: 'pencil-outline' },
    { nome: 'Operação', icone: 'clock-outline' },
  ];

  // ===== FORMATAR HORA =====
  // Digitar 0830 vira 08:30.
  const formatar_hora = (texto) => {
    let limpo = texto.replace(/\D/g, '');
    if (limpo.length > 4) limpo = limpo.slice(0, 4);
    if (limpo.length > 2) {
      return limpo.slice(0, 2) + ':' + limpo.slice(2);
    }
    return limpo;
  };

  // ===== ATUALIZAR HORÁRIO DIGITADO =====
  const mudar_horario = (txt, indice) => {
    set_entrada_horario({ ...entrada_horario, [indice]: formatar_hora(txt) });
  };

  // ===== ADICIONAR LOCAL AO ITINERÁRIO =====
  const adicionar_local = () =>
    set_itinerarios([...itinerarios, { local: '', horarios: [] }]);

  // ===== REMOVER LOCAL DO ITINERÁRIO =====
  const remover_local = (indice) => {
    const nova_lista = [...itinerarios];
    nova_lista.splice(indice, 1);
    set_itinerarios(nova_lista);
  };

  // ===== ALTERAR NOME DO LOCAL =====
  const atualizar_nome_local = (texto, indice) => {
    const nova_lista = [...itinerarios];
    nova_lista[indice].local = texto;
    set_itinerarios(nova_lista);
  };

  // ===== ADICIONAR HORÁRIO A UM LOCAL =====
  const adicionar_horario = (indice) => {
    const hora = entrada_horario[indice];
    if (hora && hora.trim().length >= 4) {
      const nova_lista = [...itinerarios];
      nova_lista[indice].horarios.push(hora.trim());
      set_itinerarios(nova_lista);
      set_entrada_horario({ ...entrada_horario, [indice]: '' });
    } else {
      alert('Digite uma hora válida!');
    }
  };

  // ===== REMOVER HORÁRIO DE UM LOCAL =====
  const remover_horario = (indice_local, indice_hora) => {
    const nova_lista = [...itinerarios];
    nova_lista[indice_local].horarios.splice(indice_hora, 1);
    set_itinerarios(nova_lista);
  };

  // ===== SALVAR EDIÇÃO NO SERVIDOR (PUT /rotas/:codigo) =====
  // FUNÇÃO ATUALIZADA PARA ENVIAR AS EDIÇÕES AO BANCO DE DADOS
  const salvar_edicao = async () => {
    if (!codigo || !nome) {
      alert('Preencha os campos obrigatórios (Código e Nome)!');
      return;
    }

    const rota_atualizada = {
      nome: nome,
      tipo_rota: tipo_rota,
      distancia: distancia,
      veiculo: veiculo,
      observacoes: observacoes,
      status_rota: status_rota,
      dias_operacao: dias_operacao,
      itinerarios: itinerarios,
      coordenadas_trajeto: trajeto
    };

    try {
      // Faz o pedido PUT usando o código original da rota para procurá-la no banco
      await api.put(`/rotas/${rota_original.codigo}`, rota_atualizada);

      alert('Rota editada com sucesso no servidor!');
      navegacao.goBack(); // O ecrã "Gestão de Rotas" vai atualizar automaticamente com os novos dados
    } catch (erro) {
      console.error('Erro ao editar rota: ', erro);
      alert('Erro ao atualizar a rota no banco de dados.');
    }
  };

  // ===== MODAL DE ESCOLHA (COMBOBOX) =====
  // Lista usada para escolher o tipo da rota e o veículo.
  const ModalCombobox = ({ visivel, fechar, opcoes, ao_selecionar }) => (
    <Modal visible={visivel} transparent animationType="fade">
      <TouchableOpacity style={estilos.sobreposicao_modal} onPress={fechar}>
        <View
          style={[estilos.conteudo_modal, { backgroundColor: fundo_cartao }]}>
          <FlatList
            data={opcoes}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={estilos.opcao_modal}
                onPress={() => {
                  ao_selecionar(item);
                  fechar();
                }}>
                <Text style={{ color: cor_texto, fontSize: 16 }}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ===== VISUAL DA TELA (JSX) =====
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
          Editar rota
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* ABAS: GERAL / OPERAÇÃO */}
      <View style={estilos.container_abas}>
        {abas.map((aba) => {
          const ativa = aba_ativa === aba.nome;
          return (
            <TouchableOpacity
              key={aba.nome}
              style={[
                estilos.botao_aba,
                { backgroundColor: fundo_cartao, borderColor: cor_borda },
                ativa && {
                  backgroundColor: tema_escuro ? '#1E3A8A' : '#EFF6FF',
                  borderColor: azul_principal,
                },
              ]}
              onPress={() => set_aba_ativa(aba.nome)}>
              <MaterialCommunityIcons
                name={aba.icone}
                size={18}
                color={ativa ? azul_principal : cor_subtexto}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  estilos.texto_aba,
                  { color: cor_subtexto },
                  ativa && { color: azul_principal, fontWeight: 'bold' },
                ]}>
                {aba.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* FORMULÁRIO (ROLÁVEL) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.conteudo_rolagem}>
        {/* ABA GERAL: IDENTIFICAÇÃO E TRAJETO */}
        {aba_ativa === 'Geral' && (
          <View
            style={[
              estilos.container_formulario,
              { backgroundColor: fundo_cartao, borderColor: cor_borda },
            ]}>
            <View style={estilos.cabecalho_secao}>
              <Text style={[estilos.titulo_secao, { color: cor_texto }]}>
                Identificação e Trajeto
              </Text>
            </View>
            {/* CAMPO: CÓDIGO (NÃO EDITÁVEL) */}
            <View style={estilos.grupo_entrada}>
              <Text style={[estilos.rotulo, { color: cor_subtexto }]}>
                Código (Não editável)
              </Text>
              <TextInput
                style={[
                  estilos.entrada,
                  {
                    color: cor_subtexto,
                    borderColor: cor_borda,
                    backgroundColor: tema_escuro ? '#2A2A2A' : '#F3F4F6',
                  },
                ]}
                value={codigo}
                editable={false}
              />
            </View>
            {/* CAMPO: TIPO DA ROTA (ABRE LISTA) */}
            <View style={estilos.grupo_entrada}>
              <Text style={[estilos.rotulo, { color: cor_subtexto }]}>
                Tipo da rota: 
              </Text>
              <TouchableOpacity
                style={[estilos.container_entrada, { borderColor: cor_borda }]}
                onPress={() => set_modal_tipo_visivel(true)}>
                <Text style={[estilos.campo_entrada, { color: cor_texto }]}>
                  {tipo_rota}
                </Text>
                <Ionicons name="chevron-down" size={20} color={cor_subtexto} />
              </TouchableOpacity>
            </View>
            {/* CAMPO: NOME DA ROTA */}
            <View style={estilos.grupo_entrada}>
              <Text style={[estilos.rotulo, { color: cor_subtexto }]}>
                Nome da rota: 
              </Text>
              <TextInput
                style={[
                  estilos.entrada,
                  { color: cor_texto, borderColor: cor_borda },
                ]}
                value={nome}
                onChangeText={set_nome}
              />
            </View>
            {/* LINHA: DISTÂNCIA E VEÍCULO */}
            <View style={estilos.linha}>
              <View
                style={[estilos.grupo_entrada, { flex: 1, marginRight: 10 }]}>
                <Text style={[estilos.rotulo, { color: cor_subtexto }]}>
                  Distância
                </Text>
                <TextInput
                  style={[
                    estilos.entrada,
                    { color: cor_texto, borderColor: cor_borda },
                  ]}
                  value={distancia}
                  onChangeText={set_distancia}
                />
              </View>
              <View
                style={[estilos.grupo_entrada, { flex: 1, marginLeft: 10 }]}>
                <Text style={[estilos.rotulo, { color: cor_subtexto }]}>
                  Veículo
                </Text>
                <TouchableOpacity
                  style={[
                    estilos.container_entrada,
                    { borderColor: cor_borda },
                  ]}
                  onPress={() => set_modal_veiculo_visivel(true)}>
                  <Text style={[estilos.campo_entrada, { color: cor_texto }]}>
                    {veiculo}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={cor_subtexto}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {/* BOTÃO: EDITAR TRAJETO NO MAPA */}
            <View style={{ marginTop: 20 }}>
              <Text style={[estilos.rotulo, { color: cor_subtexto }]}>
                Trajeto no mapa 
              </Text>
              <TouchableOpacity
                style={[estilos.botao_trajeto, { borderColor: azul_principal }]}
                onPress={() => set_modal_trajeto_visivel(true)}>
                <MaterialCommunityIcons
                  name="map-marker-path"
                  size={20}
                  color={azul_principal}
                />
                <Text
                  style={{
                    color: azul_principal,
                    fontWeight: 'bold',
                    marginLeft: 8,
                  }}>
                  {trajeto.length > 0
                    ? `Trajeto traçado - editar`
                    : 'Traçar trajeto da rota'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ABA OPERAÇÃO: HORÁRIOS E STATUS */}
        {aba_ativa === 'Operação' && (
          <View
            style={[
              estilos.container_formulario,
              { backgroundColor: fundo_cartao, borderColor: cor_borda },
            ]}>
            <View style={estilos.cabecalho_secao}>
              <Text style={[estilos.titulo_secao, { color: cor_texto }]}>
                Horários e Operação
              </Text>
            </View>

            {/* LOCAIS DO ITINERÁRIO E HORÁRIOS DE SAÍDA */}
            <View style={estilos.grupo_entrada}>
              {/* CARTÃO DE CADA LOCAL */}
              {itinerarios.map((item, indice) => (
                <View
                  key={indice}
                  style={[
                    estilos.cartao_itinerario,
                    { borderColor: cor_borda },
                  ]}>
                  {/* NOME DO LOCAL E BOTÃO REMOVER */}
                  <View style={estilos.cabecalho_itinerario}>
                    <TextInput
                      style={[
                        estilos.entrada_itinerario,
                        { color: cor_texto, borderColor: cor_borda },
                      ]}
                      value={item.local}
                      onChangeText={(txt) => atualizar_nome_local(txt, indice)}
                      placeholder="Nome do lugar de saída"
                      placeholderTextColor={cor_subtexto}
                    />
                    {itinerarios.length > 1 && (
                      <TouchableOpacity
                        onPress={() => remover_local(indice)}
                        style={estilos.botao_apagar_local}>
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* HORÁRIOS DE SAÍDA DO LOCAL */}
                  <View style={estilos.envolvedor_horarios}>
                    <Text style={[estilos.rotulo_coluna, { color: cor_texto }]}>
                      Horários de Saída
                    </Text>
                    <View style={estilos.grade_horarios}>
                      {item.horarios.map((h, indice_hora) => (
                        <View
                          key={indice_hora}
                          style={[
                            estilos.chip_horario,
                            {
                              backgroundColor: tema_escuro
                                ? '#f0f0f0'
                                : '#EFF6FF',
                              borderColor: azul_principal,
                            },
                          ]}>
                          <Text style={{ color: azul_principal, fontSize: 13 }}>
                            {h}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              remover_horario(indice, indice_hora)
                            }>
                            <Ionicons
                              name="close-circle"
                              size={16}
                              color={azul_principal}
                              style={{ marginLeft: 5 }}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                    {/* CAMPO PARA NOVO HORÁRIO */}
                    <View style={estilos.linha_adicionar_horario}>
                      <TextInput
                        style={[
                          estilos.entrada_pequena,
                          { color: cor_texto, borderColor: cor_borda },
                        ]}
                        placeholder="12:30"
                        placeholderTextColor={cor_subtexto}
                        value={entrada_horario[indice] || ''}
                        onChangeText={(txt) => mudar_horario(txt, indice)}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                      <TouchableOpacity
                        style={estilos.botao_adicionar_horario}
                        onPress={() => adicionar_horario(indice)}>
                        <Ionicons name="add" size={18} color="#FFF" />
                        <Text
                          style={{
                            color: '#FFF',
                            fontWeight: 'bold',
                            marginLeft: 4,
                          }}>
                          Adicionar Horário
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
              {/* BOTÃO: ADICIONAR NOVO LOCAL */}
              <TouchableOpacity
                style={estilos.botao_adicionar_local}
                onPress={adicionar_local}>
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={azul_principal}
                />
                <Text
                  style={{
                    color: azul_principal,
                    fontWeight: 'bold',
                    marginLeft: 5,
                  }}>
                  Adicionar novo ponto de saída
                </Text>
              </TouchableOpacity>
            </View>

            {/* STATUS DA ROTA (ATIVA / EM AND. / INATIVA) */}
            <View style={estilos.grupo_entrada}>
              <Text style={[estilos.rotulo, { color: cor_subtexto }]}>
                Status da Rota: 
              </Text>
              <View style={estilos.linha_chip}>
                {opcoes_status.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      estilos.chip,
                      { backgroundColor: fundo_cartao, borderColor: cor_borda },
                      status_rota === status && {
                        backgroundColor: tema_escuro ? '#1E3A8A' : '#EFF6FF',
                        borderColor: azul_principal,
                      },
                    ]}
                    onPress={() => set_status_rota(status)}>
                    <Text
                      style={[
                        estilos.texto_chip,
                        { color: cor_subtexto },
                        status_rota === status && {
                          color: azul_principal,
                          fontWeight: 'bold',
                        },
                      ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* DIAS DE OPERAÇÃO */}
            <View style={estilos.grupo_entrada}>
              <Text style={[estilos.rotulo, { color: cor_subtexto }]}>
                Dias de Operação
              </Text>
              <View style={estilos.grade_chip}>
                {opcoes_dias.map((dia) => (
                  <TouchableOpacity
                    key={dia}
                    style={[
                      estilos.item_grade_chip,
                      { backgroundColor: fundo_cartao, borderColor: cor_borda },
                      dias_operacao === dia && {
                        backgroundColor: tema_escuro ? '#1E3A8A' : '#EFF6FF',
                        borderColor: azul_principal,
                      },
                    ]}
                    onPress={() => set_dias_operacao(dia)}>
                    <Text
                      style={[
                        estilos.texto_chip,
                        { color: cor_subtexto },
                        dias_operacao === dia && {
                          color: azul_principal,
                          fontWeight: 'bold',
                        },
                      ]}>
                      {dia}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* BOTÃO: SALVAR ALTERAÇÕES */}
        <TouchableOpacity style={estilos.botao_salvar} onPress={salvar_edicao}>
          <Text style={estilos.texto_botao_salvar}>Salvar Alterações</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL: ESCOLHER TIPO DE ROTA */}
      <ModalCombobox
        visivel={modal_tipo_visivel}
        fechar={() => set_modal_tipo_visivel(false)}
        opcoes={tipos_rota}
        ao_selecionar={set_tipo_rota}
      />
      {/* MODAL: ESCOLHER VEÍCULO */}
      <ModalCombobox
        visivel={modal_veiculo_visivel}
        fechar={() => set_modal_veiculo_visivel(false)}
        opcoes={tipos_veiculo}
        ao_selecionar={set_veiculo}
      />
      {/* MODAL DO MAPA: EDITAR O TRAJETO */}
      <EditorTrajeto
        visivel={modal_trajeto_visivel}
        fechar={() => set_modal_trajeto_visivel(false)}
        trajeto={trajeto}
        tema_escuro={tema_escuro}
        ao_confirmar={(coords, km) => {
          set_trajeto(coords);
          if (!distancia) set_distancia(km.toFixed(1) + 'km');
        }}
      />
    </SafeAreaView>
  );
}

// ===== ESTILOS DA TELA =====
const estilos = StyleSheet.create({
  botao_trajeto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  container: { flex: 1 },
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
  container_abas: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    justifyContent: 'center',
  },
  botao_aba: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  texto_aba: { fontSize: 13 },
  conteudo_rolagem: { paddingHorizontal: 20, paddingBottom: 40 },
  container_formulario: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    paddingTop: 30,
  },
  cabecalho_secao: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  titulo_secao: { fontSize: 16, fontWeight: 'bold' },
  grupo_entrada: { marginBottom: 20 },
  rotulo: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
  entrada: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 15,
  },
  container_entrada: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  campo_entrada: { flex: 1, fontSize: 15 },
  linha: { flexDirection: 'row', justifyContent: 'space-between' },
  area_texto: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingTop: 15,
    height: 100,
    fontSize: 15,
  },
  cartao_itinerario: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  cabecalho_itinerario: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  entrada_itinerario: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 45,
    fontSize: 15,
    fontWeight: '500',
  },
  botao_apagar_local: { padding: 8, marginLeft: 10 },
  envolvedor_horarios: { width: '100%' },
  rotulo_coluna: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  grade_horarios: { flexDirection: 'row', flexWrap: 'wrap', minHeight: 40 },
  chip_horario: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  linha_adicionar_horario: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  entrada_pequena: {
    width: 90,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 15,
    marginRight: 10,
    textAlign: 'center',
  },
  botao_adicionar_horario: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingHorizontal: 15,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botao_adicionar_local: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2563EB',
    borderRadius: 12,
    marginTop: 5,
  },
  linha_chip: { flexDirection: 'row', justifyContent: 'space-between' },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  grade_chip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item_grade_chip: {
    width: '48%',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  texto_chip: { fontSize: 14 },
  botao_salvar: {
    backgroundColor: '#2563EB',
    borderRadius: 25,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  texto_botao_salvar: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  sobreposicao_modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conteudo_modal: { width: '80%', borderRadius: 12, padding: 20, elevation: 5 },
  opcao_modal: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
});
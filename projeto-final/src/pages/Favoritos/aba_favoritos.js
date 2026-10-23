import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ContextoTema } from '../../contexts/ThemeContext';
import api from '../../connection/api';

// ===== TELA: FAVORITOS =====
export default function Favoritos() {
  const navegacao = useNavigation();
  // ===== CONTEXTO GLOBAL =====
  // Tema, login, favoritos e rotas compartilhados entre as telas.
  const {
    tema_escuro,
    logado,
    id_usuario,
    favoritos_globais,
    set_favoritos_globais,
    rotas_globais,
    set_rotas_globais,
  } = useContext(ContextoTema);

  // ===== ESTADOS DA TELA =====
  // aba = favoritas/todas 
  //  rota_aberta = menu de ações 
  //  rota_itinerario = modal de itinerário.
  const [aba, set_aba] = useState('favoritas'); // 'favoritas' | 'todas'
  const [busca, set_busca] = useState('');
  const [carregando, set_carregando] = useState(true);
  const [erro, set_erro] = useState(false);
  const [alternando, set_alternando] = useState({}); // códigos com requisição em andamento
  const [rota_aberta, set_rota_aberta] = useState(null); // rota do menu de ações
  const [rota_itinerario, set_rota_itinerario] = useState(null); // rota do modal de itinerário

  // ===== CORES DO TEMA =====
  const fundo = tema_escuro ? '#121212' : '#F3F4F6';
  const cor_texto = tema_escuro ? '#E2E8F0' : '#333333';
  const cor_subtexto = tema_escuro ? '#9CA3AF' : '#6B7280';
  const cor_cartao = tema_escuro ? '#1E1E1E' : '#FFFFFF';
  const cor_borda = tema_escuro ? '#333333' : '#E5E7EB';
  const azul_principal = '#2563EB';

  // ===== CARREGAR ROTAS E FAVORITOS (GET /rotas e GET /favoritos/:id) =====
  // Busca no servidor todas as rotas cadastradas e os favoritos deste usuário
  const carregar = useCallback(async () => {
    if (!logado || !id_usuario) return;
    set_erro(false);
    try {
      const [resp_rotas, resp_favoritos] = await Promise.all([
        api.get('/rotas'),
        api.get(`/favoritos/${id_usuario}`),
      ]);
      set_rotas_globais(resp_rotas.data);
      set_favoritos_globais(resp_favoritos.data);
    } catch (e) {
      console.log('Erro ao carregar favoritos:', e.message);
      set_erro(true);
    } finally {
      set_carregando(false);
    }
  }, [logado, id_usuario]);

  // ===== RECARREGAR AO ENTRAR NA TELA =====
  // Atualiza sempre que a aba é aberta (ex.: uma rota foi criada/apagada pelo admin)
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  // ===== CÓDIGOS DOS FAVORITOS =====
  // Serve para saber rápido se uma rota é favorita.
  const codigos_favoritos = useMemo(
    () => new Set(favoritos_globais.map((f) => f.codigo)),
    [favoritos_globais]
  );

  // ===== LISTA DA ABA FAVORITAS =====
  // Favoritas: usa os dados completos da rota (itinerário e trajeto) quando existirem
  const lista_favoritas = useMemo(
    () =>
      favoritos_globais.map(
        (f) =>
          rotas_globais.find((r) => r.codigo === f.codigo) || {
            codigo: f.codigo,
            nome: f.nome,
            veiculo: f.veiculo,
            status_rota: f.status_rota,
            itinerarios: [],
            coordenadas_trajeto: [],
          }
      ),
    [favoritos_globais, rotas_globais]
  );

  // ===== LISTA DA ABA TODAS (COM BUSCA) =====
  const lista_todas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (termo === '') return rotas_globais;
    return rotas_globais.filter((rota) => {
      const passa_no_local =
        rota.itinerarios &&
        rota.itinerarios.some((it) =>
          (it.local || '').toLowerCase().includes(termo)
        );
      return (
        (rota.nome || '').toLowerCase().includes(termo) ||
        (rota.codigo || '').toLowerCase().includes(termo) ||
        passa_no_local
      );
    });
  }, [rotas_globais, busca]);

  // ===== FAVORITAR / DESFAVORITAR (POST /favoritos) =====
  // Favorita / desfavorita (o servidor decide: se já existe remove, senão adiciona)
  const alternar_favorito = async (rota) => {
    if (alternando[rota.codigo]) return;
    set_alternando((anterior) => ({ ...anterior, [rota.codigo]: true }));
    try {
      const resposta = await api.post('/favoritos', {
        id_usuario,
        codigo_rota: rota.codigo,
      });
      if (resposta.data.status === 'adicionado') {
        set_favoritos_globais((anterior) =>
          anterior.some((f) => f.codigo === rota.codigo)
            ? anterior
            : [
                ...anterior,
                {
                  codigo: rota.codigo,
                  nome: rota.nome,
                  veiculo: rota.veiculo,
                  status_rota: rota.status_rota,
                },
              ]
        );
      } else {
        set_favoritos_globais((anterior) =>
          anterior.filter((f) => f.codigo !== rota.codigo)
        );
      }
    } catch (e) {
      console.log('Erro ao alterar favorito:', e.message);
      Alert.alert(
        'Erro',
        'Não foi possível atualizar o favorito. Tente novamente.'
      );
    } finally {
      set_alternando((anterior) => {
        const novo = { ...anterior };
        delete novo[rota.codigo];
        return novo;
      });
    }
  };

  // ===== ABRIR ITINERÁRIO DA ROTA =====
  const abrir_itinerario = () => {
    const rota = rota_aberta;
    set_rota_aberta(null);
    set_rota_itinerario(rota);
  };

  // ===== ABRIR LOCALIZAÇÃO (TELA DE RASTREAMENTO) =====
  const abrir_localizacao = () => {
    const rota = rota_aberta;
    set_rota_aberta(null);
    navegacao.navigate('Rastreamento', { rota });
  };

  // ===== TELA PARA QUEM NÃO ESTÁ LOGADO =====
  // ---------- NÃO LOGADO ----------
  if (!logado) {
    return (
      <SafeAreaView
        style={[
          estilos.container,
          {
            backgroundColor: fundo,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}>
        <Ionicons
          name="star-outline"
          size={80}
          color="#9CA3AF"
          style={{ opacity: 0.5, marginBottom: 20 }}
        />
        <Text style={{ color: cor_texto, fontSize: 18, fontWeight: 'bold' }}>
          Sessão não iniciada!
        </Text>
        <Text style={{ color: '#9CA3AF', marginTop: 10 }}>
          Faça login para ver as suas rotas favoritas.
        </Text>
        <TouchableOpacity
          style={estilos.botao_login}
          onPress={() => navegacao.navigate('Login')}>
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
            Fazer Login
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ===== DADOS DA LISTA ATUAL (FAVORITAS OU TODAS) =====
  const dados = aba === 'favoritas' ? lista_favoritas : lista_todas;

  // ===== CARTÃO DE CADA ROTA =====
  // Função usada como renderItem da lista.
  const renderizar_rota = ({ item }) => {
    const favorita = codigos_favoritos.has(item.codigo);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          estilos.cartao,
          { backgroundColor: cor_cartao, borderColor: cor_borda },
        ]}
        onPress={() => set_rota_aberta(item)}>
        <View style={[estilos.distintivo, { backgroundColor: azul_principal }]}>
          <Text style={estilos.texto_distintivo}>{item.codigo}</Text>
        </View>

        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ color: cor_texto, fontSize: 16, fontWeight: 'bold' }}>
            {item.nome}
          </Text>
          <Text style={{ color: cor_subtexto, fontSize: 13 }}>
            {item.veiculo} • {item.status_rota}
          </Text>
        </View>

        {/* ESTRELA DE FAVORITO */}
        <TouchableOpacity
          onPress={() => alternar_favorito(item)}
          disabled={!!alternando[item.codigo]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {alternando[item.codigo] ? (
            <ActivityIndicator color="#F59E0B" />
          ) : (
            <Ionicons
              name={favorita ? 'star' : 'star-outline'}
              size={28}
              color={favorita ? '#F59E0B' : cor_subtexto}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ===== ESTADOS VAZIOS =====
  // Carregando, erro, sem favoritos e sem rotas.
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
          <MaterialCommunityIcons
            name="cloud-off-outline"
            size={70}
            color="#9CA3AF"
            style={{ opacity: 0.6 }}
          />
          <Text
            style={{
              color: cor_texto,
              fontSize: 16,
              marginTop: 15,
              textAlign: 'center',
            }}>
            Não foi possível carregar as rotas.
          </Text>
          <TouchableOpacity style={estilos.botao_login} onPress={carregar}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (aba === 'favoritas') {
      return (
        <View style={estilos.vazio}>
          <MaterialCommunityIcons
            name="star-off-outline"
            size={80}
            color="#9CA3AF"
            style={{ opacity: 0.5 }}
          />
          <Text
            style={{
              color: cor_texto,
              fontSize: 16,
              marginTop: 20,
              textAlign: 'center',
            }}>
            Nenhum favorito guardado ainda.
          </Text>
          <Text
            style={{ color: cor_subtexto, marginTop: 6, textAlign: 'center' }}>
            Toque na estrela de uma rota para favoritá-la.
          </Text>
          <TouchableOpacity
            style={estilos.botao_login}
            onPress={() => set_aba('todas')}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
              Ver todas as rotas
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={estilos.vazio}>
        <MaterialCommunityIcons
          name="bus-off"
          size={70}
          color="#9CA3AF"
          style={{ opacity: 0.5 }}
        />
        <Text
          style={{
            color: cor_texto,
            fontSize: 16,
            marginTop: 15,
            textAlign: 'center',
          }}>
          {busca.trim() !== ''
            ? `Nenhuma rota encontrada para "${busca}".`
            : 'Nenhuma rota cadastrada ainda.'}
        </Text>
      </View>
    );
  };

  // ===== ABAS (FAVORITAS / TODAS) =====
  const abas = [
    { id: 'favoritas', rotulo: `Favoritas (${lista_favoritas.length})` },
    { id: 'todas', rotulo: 'Todas as rotas' },
  ];

  // ===== VISUAL DA TELA (JSX) =====
  return (
    <SafeAreaView style={[estilos.container, { backgroundColor: fundo }]}>
      {/* CABEÇALHO COM BOTÃO VOLTAR */}
      <View style={estilos.cabecalho}>
        <TouchableOpacity
          onPress={() => navegacao.goBack()}
          style={{ marginRight: 15 }}>
          <Ionicons name="arrow-back" size={28} color={cor_texto} />
        </TouchableOpacity>
        <Text style={[estilos.titulo, { color: cor_texto }]}>
          Meus Favoritos
        </Text>
      </View>

      {/* ABAS: FAVORITAS / TODAS AS ROTAS */}
      <View style={estilos.abas}>
        {abas.map((a) => {
          const ativa = aba === a.id;
          return (
            <TouchableOpacity
              key={a.id}
              style={[
                estilos.aba,
                { borderColor: ativa ? azul_principal : cor_borda },
                ativa && {
                  backgroundColor: tema_escuro ? '#1E3A8A' : '#EFF6FF',
                },
              ]}
              onPress={() => set_aba(a.id)}>
              <Text
                style={{
                  color: ativa ? azul_principal : cor_subtexto,
                  fontWeight: ativa ? 'bold' : 'normal',
                }}>
                {a.rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CAMPO DE BUSCA (SÓ NA ABA TODAS) */}
      {aba === 'todas' && (
        <View
          style={[
            estilos.caixa_busca,
            { backgroundColor: cor_cartao, borderColor: cor_borda },
          ]}>
          <Ionicons name="search" size={20} color={cor_subtexto} />
          <TextInput
            style={[estilos.entrada_busca, { color: cor_texto }]}
            placeholder="Buscar linha ou destino"
            placeholderTextColor={cor_subtexto}
            value={busca}
            onChangeText={set_busca}
          />
          {busca !== '' && (
            <TouchableOpacity onPress={() => set_busca('')}>
              <Ionicons name="close-circle" size={20} color={cor_subtexto} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* LISTA DE ROTAS */}
      <FlatList
        data={dados}
        keyExtractor={(item) => item.codigo}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingTop: 10, flexGrow: 1 }}
        renderItem={renderizar_rota}
        ListEmptyComponent={estado_vazio}
      />

      {/* MENU DA ROTA: itinerário ou localização do ônibus (igual ao da Home) */}
      <Modal
        visible={rota_aberta !== null}
        transparent
        animationType="slide"
        onRequestClose={() => set_rota_aberta(null)}>
        <View style={estilos.sobreposicao_modal}>
          {/* FUNDO ESCURO (TOCAR FECHA O MENU) */}
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => set_rota_aberta(null)}
          />
          {/* PAINEL INFERIOR (BOTTOM SHEET) */}
          <View style={[estilos.bottom_sheet, { backgroundColor: cor_cartao }]}>
            <View style={estilos.puxador} />

            {/* CABEÇALHO DO MENU: CÓDIGO, NOME, ESTRELA E FECHAR */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[
                  estilos.distintivo,
                  { backgroundColor: azul_principal },
                ]}>
                <Text style={estilos.texto_distintivo}>
                  {rota_aberta?.codigo}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: cor_texto,
                    fontWeight: 'bold',
                    fontSize: 18,
                  }}>
                  {rota_aberta?.nome}
                </Text>
                <Text style={{ color: cor_subtexto, fontSize: 13 }}>
                  {rota_aberta?.veiculo} • {rota_aberta?.status_rota}
                </Text>
              </View>
              {rota_aberta && (
                <TouchableOpacity
                  onPress={() => alternar_favorito(rota_aberta)}
                  disabled={!!alternando[rota_aberta.codigo]}
                  style={{ padding: 5 }}>
                  <Ionicons
                    name={
                      codigos_favoritos.has(rota_aberta.codigo)
                        ? 'star'
                        : 'star-outline'
                    }
                    size={28}
                    color={
                      codigos_favoritos.has(rota_aberta.codigo)
                        ? '#F59E0B'
                        : cor_subtexto
                    }
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => set_rota_aberta(null)}
                style={{ padding: 5 }}>
                <Ionicons name="close-circle" size={32} color={cor_subtexto} />
              </TouchableOpacity>
            </View>

            {/* INFORMAÇÕES: DIAS DE OPERAÇÃO E DISTÂNCIA */}
            {(rota_aberta?.dias_operacao || rota_aberta?.distancia) && (
              <Text
                style={{ color: cor_subtexto, fontSize: 13, marginTop: 12 }}>
                {[rota_aberta?.dias_operacao, rota_aberta?.distancia]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
            )}

            {/* BOTÕES: VER ITINERÁRIO E LOCALIZAÇÃO */}
            <View style={estilos.container_botoes}>
              <TouchableOpacity
                style={[
                  estilos.botao_acao,
                  {
                    backgroundColor: tema_escuro ? '#f0f0f0' : '#EFF6FF',
                    borderColor: azul_principal,
                    borderWidth: 1,
                  },
                ]}
                onPress={abrir_itinerario}>
                <Ionicons
                  name="list-outline"
                  size={16}
                  color={azul_principal}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    color: azul_principal,
                    fontWeight: 'bold',
                    fontSize: 13,
                  }}>
                  Ver Itinerário
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  estilos.botao_acao,
                  { backgroundColor: azul_principal },
                ]}
                onPress={abrir_localizacao}>
                <MaterialCommunityIcons
                  name="bus-marker"
                  size={16}
                  color="#FFF"
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>
                  Localização
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ITINERÁRIO: onde passa e horários */}
      <Modal
        visible={rota_itinerario !== null}
        transparent
        animationType="slide"
        onRequestClose={() => set_rota_itinerario(null)}>
        <View style={estilos.sobreposicao_modal}>
          {/* FUNDO ESCURO (TOCAR FECHA O ITINERÁRIO) */}
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => set_rota_itinerario(null)}
          />
          {/* PAINEL DO ITINERÁRIO */}
          <View
            style={[
              estilos.bottom_sheet,
              {
                backgroundColor: cor_cartao,
                minHeight: '40%',
                maxHeight: '85%',
              },
            ]}>
            <View style={estilos.puxador} />

            {/* CABEÇALHO DO ITINERÁRIO */}
            <View
              style={[
                estilos.cabecalho_modal,
                { borderBottomColor: cor_borda },
              ]}>
              <View
                style={[
                  estilos.distintivo,
                  { backgroundColor: azul_principal },
                ]}>
                <Text style={estilos.texto_distintivo}>
                  {rota_itinerario?.codigo}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: cor_texto,
                    fontWeight: 'bold',
                    fontSize: 18,
                  }}>
                  {rota_itinerario?.nome}
                </Text>
                <Text style={{ color: cor_subtexto, fontSize: 13 }}>
                  {rota_itinerario?.veiculo} • {rota_itinerario?.status_rota}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => set_rota_itinerario(null)}
                style={{ padding: 5 }}>
                <Ionicons name="close-circle" size={32} color={cor_subtexto} />
              </TouchableOpacity>
            </View>

            {/* LISTA DE LOCAIS E HORÁRIOS */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: cor_texto,
                  marginBottom: 15,
                  marginTop: 5,
                }}>
                Onde ela passa e Horários
              </Text>

              {rota_itinerario?.itinerarios &&
              rota_itinerario.itinerarios.length > 0 ? (
                /* LOCAL DO ITINERÁRIO E SEUS HORÁRIOS */
                rota_itinerario.itinerarios.map((itinerario, idx) => (
                  <View
                    key={idx}
                    style={[
                      estilos.container_local,
                      {
                        borderColor: cor_borda,
                        backgroundColor: tema_escuro ? '#1E1E1E' : '#F9FAFB',
                      },
                    ]}>
                    <View style={estilos.cabecalho_local}>
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color={azul_principal}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: cor_texto,
                        }}>
                        {itinerario.local || 'Local não informado'}
                      </Text>
                    </View>
                    {/* HORÁRIOS (CHIPS) */}
                    <View style={estilos.grade_horarios}>
                      {itinerario.horarios && itinerario.horarios.length > 0 ? (
                        itinerario.horarios.map((hora, h_idx) => (
                          <View
                            key={h_idx}
                            style={[
                              estilos.chip_horario,
                              {
                                borderColor: azul_principal,
                                backgroundColor: tema_escuro
                                  ? '#f0f0f0'
                                  : '#EFF6FF',
                              },
                            ]}>
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color={azul_principal}
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={{
                                color: azul_principal,
                                fontWeight: 'bold',
                                fontSize: 13,
                              }}>
                              {hora}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text
                          style={{
                            color: cor_subtexto,
                            fontSize: 13,
                            fontStyle: 'italic',
                          }}>
                          Sem horários cadastrados
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                /* ROTA SEM ITINERÁRIO CADASTRADO */
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <MaterialCommunityIcons
                    name="timeline-alert-outline"
                    size={50}
                    color={cor_subtexto}
                    style={{ opacity: 0.3 }}
                  />
                  <Text style={{ color: cor_subtexto, marginTop: 10 }}>
                    Nenhum itinerário cadastrado para esta linha.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ===== ESTILOS DA TELA =====
const estilos = StyleSheet.create({
  container: { flex: 1 },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  titulo: { fontSize: 22, fontWeight: 'bold' },
  abas: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12 },
  aba: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginRight: 8,
  },
  caixa_busca: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 6,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
  },
  entrada_busca: { flex: 1, fontSize: 15, marginLeft: 8 },
  vazio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  botao_login: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  distintivo: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto_distintivo: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  sobreposicao_modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0)',
    justifyContent: 'flex-end',
  },
  bottom_sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  puxador: {
    width: 45,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  container_botoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 6,
  },
  botao_acao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cabecalho_modal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 15,
  },
  container_local: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
  },
  cabecalho_local: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  grade_horarios: { flexDirection: 'row', flexWrap: 'wrap' },
  chip_horario: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
});

import React, {
  useState,
  useContext,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  Modal,
  Text,
  FlatList,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { ContextoTema } from '../contexts/ThemeContext';
import api from '../connection/api';

// ===== TELA HOME (MAPA) =====
// Mapa com os pontos, busca de linhas e os modais de ponto/rota.
export default function Home() {
  // ===== ESTADOS E CONTEXTO GLOBAL =====
  const [busca, set_busca] = useState('');
  const navegacao = useNavigation();
  const {
    tema_escuro,
    adm,
    rotas_globais,
    set_rotas_globais,
    pontos_globais,
    set_pontos_globais,
  } = useContext(ContextoTema);

  const escuro = tema_escuro;
  const ref_mapa = useRef(null);

  // ===== ESTADOS DOS MODAIS =====
  // modal_ponto = ponto tocado no mapa
  // modal_rota = itinerário de uma rota
  const [modal_ponto_visivel, set_modal_ponto_visivel] = useState(false);
  const [ponto_selecionado, set_ponto_selecionado] = useState(null);
  const [modal_rota_visivel, set_modal_rota_visivel] = useState(false);
  const [rota_pesquisada, set_rota_pesquisada] = useState(null);

  // ===== ESTADOS DE TRAJETO E ÔNIBUS =====
  // Declarados aqui, mas não usados na tela atualmente.
  const [coordenadas_rota, set_coordenadas_rota] = useState([]);
  const [modo_desenho, set_modo_desenho] = useState(false);
  const [posicao_onibus, set_posicao_onibus] = useState(null);

  // ===== PERMISSÃO DE GPS =====
  // Pede permissão de localização ao abrir a tela.
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permissao de GPS negada');
      }
    })();
  }, []);

  // ===== BUSCAR PONTOS E ROTAS NO SERVIDOR =====
  // GET /pontos e GET /rotas, guardando no contexto global.
  const buscarDadosServidor = async () => {
    try {
      const [respostaPontos, respostaRotas] = await Promise.all([
        api.get('/pontos'),
        api.get('/rotas'),
      ]);

      const pontosFormatados = respostaPontos.data.map((ponto) => {
        let rotas = [];
        if (typeof ponto.rotas_assinaladas === 'string') {
          try {
            rotas = JSON.parse(ponto.rotas_assinaladas);
          } catch (e) {
            rotas = [];
          }
        } else if (Array.isArray(ponto.rotas_assinaladas)) {
          rotas = ponto.rotas_assinaladas;
        }
        return { ...ponto, rotas_assinaladas: rotas };
      });

      set_pontos_globais(pontosFormatados);
      set_rotas_globais(respostaRotas.data);
    } catch (erro) {
      console.error('Erro ao buscar dados do servidor:', erro);
    }
  };

  // ===== RECARREGAR DADOS AO ENTRAR NA TELA =====
  useFocusEffect(
    useCallback(() => {
      buscarDadosServidor();
    }, [])
  );

  // ===== REGIÃO INICIAL DO MAPA =====
  const regiao_inicial = {
    latitude: -20.4158,
    longitude: -42.8988,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  // ===== CORES DO TEMA (CLARO/ESCURO) =====
  const fundo_container = escuro ? '#121212' : '#F3F4F6';
  const fundo_elemento = escuro ? '#1E1E1E' : '#FFFFFF';
  const cor_texto = escuro ? '#E2E8F0' : '#333333';
  const cor_subtexto = escuro ? '#9CA3AF' : '#6B7280';
  const cor_icone = escuro ? '#A0AEC0' : '#666666';
  const cor_borda = escuro ? '#333333' : '#E5E7EB';
  const azul_principal = '#2563EB';

  // ===== ESTILO DO MAPA NO TEMA ESCURO =====
  const estilo_mapa_escuro = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
  ];

  // ===== CENTRALIZAR O MAPA NA LOCALIZAÇÃO DO USUÁRIO =====
  const centralizar_usuario = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Precisamos de permissão para acessar sua localização.');
      return;
    }
    let localizacao = await Location.getCurrentPositionAsync({});
    if (ref_mapa.current) {
      ref_mapa.current.animateToRegion(
        {
          latitude: localizacao.coords.latitude,
          longitude: localizacao.coords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  };

  // ===== FILTRO DA BUSCA DE LINHAS =====
  // Procura por nome, código ou local do itinerário.
  const resultados_busca =
    busca.trim() === ''
      ? []
      : rotas_globais.filter((rota) => {
          const termo = busca.toLowerCase();
          const passaNoLocal =
            rota.itinerarios &&
            rota.itinerarios.some((it) =>
              it.local.toLowerCase().includes(termo)
            );
          return (
            rota.nome.toLowerCase().includes(termo) ||
            rota.codigo.toLowerCase().includes(termo) ||
            passaNoLocal
          );
        });

  // ===== ABRIR MODAL DO PONTO =====
  const abrir_ponto = (ponto) => {
    set_ponto_selecionado(ponto);
    set_modal_ponto_visivel(true);
  };

  // ===== APAGAR PONTO (ADM) =====
  const apagar_ponto = () => {
    Alert.alert(
      'Apagar Ponto',
      `Tem certeza que deseja remover o ponto "${
        ponto_selecionado?.nome_ponto || ponto_selecionado?.nome
      }" do mapa?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              const id = ponto_selecionado.id_pontos || ponto_selecionado.id;
              await api.delete(`/pontos/${id}`);
              buscarDadosServidor();
              set_modal_ponto_visivel(false);
              Alert.alert('Sucesso', 'Ponto apagado permanentemente!');
            } catch (erro) {
              console.error(erro);
              Alert.alert(
                'Erro',
                'Não foi possível apagar o ponto no servidor.'
              );
            }
          },
        },
      ]
    );
  };

  // ===== MARCAR/DESMARCAR ROTA NO PONTO (ADM) =====
  // Atualiza a tela na hora e salva no servidor (PUT /pontos/:id).
  const alternar_rota_ponto = async (codigo_rota) => {
    const idUnico = ponto_selecionado.id_pontos || ponto_selecionado.id;
    const rotasAssinaladas = Array.isArray(ponto_selecionado.rotas_assinaladas)
      ? ponto_selecionado.rotas_assinaladas
      : [];

    const ja_tem = rotasAssinaladas.includes(codigo_rota);
    const novas_rotas = ja_tem
      ? rotasAssinaladas.filter((c) => c !== codigo_rota)
      : [...rotasAssinaladas, codigo_rota];

    const pontoAtualizado = {
      ...ponto_selecionado,
      rotas_assinaladas: novas_rotas,
    };
    set_ponto_selecionado(pontoAtualizado);

    const novos_pontos = pontos_globais.map((p) => {
      const currentId = p.id_pontos || p.id;
      if (currentId === idUnico) {
        return pontoAtualizado;
      }
      return p;
    });
    set_pontos_globais(novos_pontos);

    try {
      await api.put(`/pontos/${idUnico}`, {
        nome: pontoAtualizado.nome_ponto || pontoAtualizado.nome,
        latitude: pontoAtualizado.latitude_ponto || pontoAtualizado.latitude,
        longitude: pontoAtualizado.longitude_ponto || pontoAtualizado.longitude,
        rotas_assinaladas: JSON.stringify(novas_rotas),
      });
    } catch (erro) {
      console.error('Erro ao salvar rotas do ponto:', erro);
      Alert.alert('Erro', 'Não foi possível gravar a rota no servidor.');
    }
  };

  // ===== ROTAS QUE PASSAM NO PONTO SELECIONADO =====
  const rotas_ponto =
    ponto_selecionado && Array.isArray(ponto_selecionado.rotas_assinaladas)
      ? rotas_globais.filter((rota) =>
          ponto_selecionado.rotas_assinaladas.includes(rota.codigo)
        )
      : [];

  // ===== VISUAL DA TELA (JSX) =====
  return (
    <View style={[estilos.container, { backgroundColor: fundo_container }]}>
      {/* ESCONDER BARRA DE STATUS */}
      <StatusBar hidden={true} />
      {/* MAPA */}
      <MapView
        ref={ref_mapa}
        style={estilos.mapa}
        initialRegion={regiao_inicial}
        customMapStyle={escuro ? estilo_mapa_escuro : []}
        showsUserLocation={true}
        showsMyLocationButton={false}>
        {/* MARCADORES (PINOS) DOS PONTOS - Vermelho para ADM, azul para usuário. */}
        {pontos_globais.map((ponto, index) => (
          <Marker
            key={ponto.id_pontos || ponto.id || index.toString()}
            coordinate={{
              latitude: Number(ponto.latitude_ponto || ponto.latitude),
              longitude: Number(ponto.longitude_ponto || ponto.longitude),
            }}
            onPress={() => abrir_ponto(ponto)}>
            <View style={estilos.pino_mapa}>
              <View
                style={[
                  estilos.pino_bola,
                  { backgroundColor: adm ? '#EF4444' : azul_principal },
                ]}>
                <FontAwesome5 name="bus" size={14} color="#FFF" />
              </View>
              <View
                style={[
                  estilos.pino_triangulo,
                  { borderBottomColor: adm ? '#EF4444' : azul_principal },
                ]}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* INTERFACE SOBRE O MAPA - Menu, pesquisa e botão de localização. */}
      <SafeAreaView style={estilos.container_ui} pointerEvents="box-none">
        <View style={estilos.container_topo} pointerEvents="box-none">
          {/* BARRA DO TOPO: MENU + PESQUISA */}
          <View style={estilos.barra_topo}>
            {/* BOTÃO DO MENU (ABRE O MENU LATERAL) */}
            <TouchableOpacity
              style={[
                estilos.botao_menu,
                { backgroundColor: fundo_elemento, borderColor: cor_borda },
              ]}
              onPress={() => navegacao.openDrawer()}>
              <Ionicons name="menu" size={28} color={cor_texto} />
            </TouchableOpacity>
            {/* CAMPO DE PESQUISA */}
            <View
              style={[
                estilos.caixa_pesquisa,
                { backgroundColor: fundo_elemento },
              ]}>
              <TextInput
                style={[estilos.entrada_pesquisa, { color: cor_texto }]}
                placeholder="Pesquisar linhas ou destinos"
                placeholderTextColor={cor_icone}
                value={busca}
                onChangeText={set_busca}
              />
              <TouchableOpacity style={estilos.icone_pesquisa}>
                <Ionicons name="search" size={20} color={cor_icone} />
              </TouchableOpacity>
            </View>
          </View>
          {/* LISTA DE RESULTADOS DA PESQUISA */}
          {busca.trim() !== '' && (
            <View
              style={[
                estilos.caixa_resultados,
                { backgroundColor: fundo_elemento, borderColor: cor_borda },
              ]}>
              {resultados_busca.length > 0 ? (
                <FlatList
                  data={resultados_busca}
                  keyExtractor={(item) => item.codigo}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        estilos.item_resultado,
                        { borderBottomColor: cor_borda },
                      ]}
                      onPress={() => {
                        set_rota_pesquisada(item);
                        set_modal_rota_visivel(true);
                        set_busca('');
                      }}>
                      <View style={estilos.resultado_cabecalho}>
                        <View
                          style={[
                            estilos.distintivo_pequeno,
                            { backgroundColor: azul_principal },
                          ]}>
                          <Text
                            style={{
                              color: '#FFF',
                              fontWeight: 'bold',
                              fontSize: 12,
                            }}>
                            {item.codigo}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: cor_texto,
                            fontWeight: 'bold',
                            fontSize: 15,
                            flex: 1,
                          }}>
                          {item.nome}
                        </Text>
                      </View>                     
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name="bus-off"
                    size={40}
                    color={cor_subtexto}
                    style={{ opacity: 0.5, marginBottom: 10 }}
                  />
                  <Text style={{ color: cor_subtexto, textAlign: 'center' }}>
                    Nenhuma linha encontrada para "{busca}".
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* BOTÃO: CENTRALIZAR NA MINHA LOCALIZAÇÃO */}
        <TouchableOpacity
          style={[
            estilos.botao_localizacao,
            { backgroundColor: fundo_elemento, borderColor: cor_borda },
          ]}
          onPress={centralizar_usuario}>
          <Ionicons name="navigate-outline" size={26} color={cor_texto} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* MODAL DO PONTO */}
      <Modal visible={modal_ponto_visivel} transparent animationType="slide">
        <View style={estilos.sobreposicao_modal}>
          <View
            style={[
              estilos.conteudo_bottom_sheet,
              { backgroundColor: fundo_elemento },
            ]}>
            <View style={estilos.puxador_bottom_sheet} />
            <View style={estilos.cabecalho_modal}>
              <View>
                <Text style={[estilos.titulo_modal, { color: cor_texto }]}>
                  {ponto_selecionado?.nome_ponto || ponto_selecionado?.nome}
                </Text>
                <Text style={{ color: cor_subtexto, fontSize: 13 }}>
                  {adm
                    ? 'Gerencie as rotas deste local'
                    : 'Rotas que passam aqui'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {adm && (
                  <TouchableOpacity
                    onPress={apagar_ponto}
                    style={estilos.botao_lixeira}>
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => set_modal_ponto_visivel(false)}
                  style={{ padding: 5 }}>
                  <Ionicons
                    name="close-circle"
                    size={32}
                    color={cor_subtexto}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* CONTEÚDO DO MODAL DO PONTO: ADM OU USUÁRIO */}
            {adm ? (
              /* ADM: LISTA DE ROTAS PARA MARCAR/DESMARCAR NO PONTO */
              rotas_globais.length === 0 ? (
                <View style={estilos.estado_vazio}>
                  <MaterialCommunityIcons
                    name="map-marker-off"
                    size={60}
                    color={cor_subtexto}
                    style={{ opacity: 0.3 }}
                  />
                  <Text
                    style={{
                      color: cor_subtexto,
                      textAlign: 'center',
                      marginTop: 10,
                    }}>
                    Nenhuma rota cadastrada no sistema.
                  </Text>
                </View>
              ) : (
                /* ADM: LISTA DE ROTAS COM CHECK */
                <FlatList
                  data={rotas_globais}
                  keyExtractor={(item) => item.codigo}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const rotasAssinaladas = Array.isArray(
                      ponto_selecionado?.rotas_assinaladas
                    )
                      ? ponto_selecionado.rotas_assinaladas
                      : [];
                    const marcada = rotasAssinaladas.includes(item.codigo);
                    return (
                      <TouchableOpacity
                        style={[
                          estilos.cartao_rota_adm,
                          {
                            borderColor: cor_borda,
                            backgroundColor: marcada
                              ? escuro
                                ? '#1E3A8A'
                                : '#EFF6FF'
                              : fundo_elemento,
                          },
                        ]}
                        onPress={() => alternar_rota_ponto(item.codigo)}>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: cor_texto,
                              fontWeight: 'bold',
                              fontSize: 16,
                            }}>
                            {item.codigo} - {item.nome}
                          </Text>
                          <Text style={{ color: cor_subtexto, fontSize: 12 }}>
                            {item.tipo_rota} • {item.status_rota}
                          </Text>
                        </View>
                        {marcada ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={28}
                            color={azul_principal}
                          />
                        ) : (
                          <Ionicons
                            name="ellipse-outline"
                            size={28}
                            color={cor_subtexto}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              )
            ) : rotas_ponto.length === 0 ? (
              /* USUÁRIO: PONTO SEM ROTAS */
              <View style={estilos.estado_vazio}>
                <MaterialCommunityIcons
                  name="bus-clock"
                  size={60}
                  color={cor_subtexto}
                  style={{ opacity: 0.3 }}
                />
                <Text
                  style={{
                    color: cor_subtexto,
                    textAlign: 'center',
                    marginTop: 10,
                  }}>
                  Não há rotas programadas para este ponto.
                </Text>
              </View>
            ) : (
              /* VISÃO DO USUÁRIO COMUM (ITINERÁRIO + LOCALIZAÇÃO DO ÔNIBUS) */
              <FlatList
                data={rotas_ponto}
                keyExtractor={(item) => item.codigo}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View
                    style={[
                      estilos.cartao_rota_usuario,
                      {
                        borderColor: cor_borda,
                        backgroundColor: fundo_elemento,
                      },
                    ]}>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={[
                          estilos.distintivo_rota,
                          { backgroundColor: azul_principal },
                        ]}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                          {item.codigo}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: cor_texto,
                            fontWeight: 'bold',
                            fontSize: 16,
                          }}>
                          {item.nome}
                        </Text>
                        <Text style={{ color: cor_subtexto, fontSize: 13 }}>
                          {item.veiculo} • {item.status_rota}
                        </Text>
                      </View>
                    </View>

                    {/* BOTÕES DE AÇÃO: VER ITINERÁRIO E LOCALIZAÇÃO DO ÔNIBUS */}
                    <View style={estilos.container_botoes_rota}>
                      {/* BOTÃO: VER ITINERÁRIO */}
                      <TouchableOpacity
                        style={[
                          estilos.botao_acao,
                          {
                            backgroundColor: escuro ? '#f0f0f0' : '#EFF6FF',
                            borderColor: azul_principal,
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() => {
                          set_modal_ponto_visivel(false);
                          set_rota_pesquisada(item);
                          set_modal_rota_visivel(true);
                        }}>
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

                      {/* BOTÃO: LOCALIZAÇÃO (ABRE O RASTREAMENTO) */}
                      <TouchableOpacity
                        style={[
                          estilos.botao_acao,
                          { backgroundColor: azul_principal },
                        ]}
                        onPress={() => {
                          set_modal_ponto_visivel(false);
                          try {
                            navegacao.navigate('Rastreamento', { rota: item });
                          } catch (e) {
                            Alert.alert(
                              'Rastreamento',
                              `Acompanhando veículo da rota ${item.codigo}`
                            );
                          }
                        }}>
                        <MaterialCommunityIcons
                          name="bus-marker"
                          size={16}
                          color="#FFF"
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            color: '#FFF',
                            fontWeight: 'bold',
                            fontSize: 13,
                          }}>
                          Localização
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DE DETALHES DA ROTA E ITINERÁRIO */}
      <Modal visible={modal_rota_visivel} transparent animationType="slide">
        <View style={estilos.sobreposicao_modal}>
          <View
            style={[
              estilos.conteudo_bottom_sheet,
              { backgroundColor: fundo_elemento },
            ]}>
            <View style={estilos.puxador_bottom_sheet} />
            <View
              style={[
                estilos.cabecalho_modal,
                { borderBottomColor: cor_borda },
              ]}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={[
                    estilos.distintivo_rota,
                    { backgroundColor: azul_principal },
                  ]}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                    {rota_pesquisada?.codigo}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      estilos.titulo_modal,
                      { color: cor_texto, marginBottom: 2 },
                    ]}>
                    {rota_pesquisada?.nome}
                  </Text>
                  <Text style={{ color: cor_subtexto, fontSize: 13 }}>
                    {rota_pesquisada?.veiculo} • {rota_pesquisada?.status_rota}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => set_modal_rota_visivel(false)}
                style={{ padding: 5 }}>
                <Ionicons name="close-circle" size={32} color={cor_subtexto} />
              </TouchableOpacity>
            </View>
            {/* LISTA DE LOCAIS E HORÁRIOS DA ROTA */}
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
              {rota_pesquisada?.itinerarios &&
              rota_pesquisada.itinerarios.length > 0 ? (
                /* LOCAL DO ITINERÁRIO E SEUS HORÁRIOS */
                rota_pesquisada.itinerarios.map((itinerario, idx) => (
                  <View
                    key={idx}
                    style={[
                      estilos.container_local,
                      {
                        borderColor: cor_borda,
                        backgroundColor: escuro ? '#1E1E1E' : '#F9FAFB',
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
                        itinerario.horarios.map((hora, hIdx) => (
                          <View
                            key={hIdx}
                            style={[
                              estilos.chip_horario,
                              {
                                borderColor: azul_principal,
                                backgroundColor: escuro ? '#f0f0f0' : '#EFF6FF',
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
                <View style={estilos.estado_vazio}>
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
    </View>
  );
}

// ===== ESTILOS DA TELA HOME =====
const estilos = StyleSheet.create({
  container: { flex: 1 },
  mapa: { ...StyleSheet.absoluteFillObject },
  container_ui: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  container_topo: { zIndex: 10, elevation: 10 },
  barra_topo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: Platform.OS === 'android' ? 40 : 10,
  },
  botao_menu: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    elevation: 3,
  },
  caixa_pesquisa: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    elevation: 5,
  },
  entrada_pesquisa: { flex: 1, fontSize: 16 },
  icone_pesquisa: { padding: 5 },
  caixa_resultados: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 95 : 65,
    left: 15,
    right: 15,
    borderRadius: 15,
    borderWidth: 1,
    maxHeight: 250,
    overflow: 'hidden',
    elevation: 10,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  item_resultado: { padding: 15, borderBottomWidth: 1 },
  resultado_cabecalho: { flexDirection: 'row', alignItems: 'center' },
  distintivo_pequeno: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  pino_mapa: { alignItems: 'center' },
  pino_bola: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  pino_triangulo: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '180deg' }],
    marginTop: -2,
  },
  botao_localizacao: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    padding: 15,
    borderRadius: 30,
    borderWidth: 1,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    minHeight: '40%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
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
  estado_vazio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  botao_lixeira: {
    padding: 8,
    marginRight: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
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
  cabecalho_modal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 15,
  },
  titulo_modal: { fontSize: 20, fontWeight: 'bold' },
  cartao_rota_adm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  cartao_rota_usuario: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  distintivo_rota: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 15,
  },
  container_botoes_rota: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  botao_acao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
});

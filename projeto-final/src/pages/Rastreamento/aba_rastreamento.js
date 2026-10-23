import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import * as Location from 'expo-location';
import { ContextoTema } from '../../contexts/ThemeContext';
import api from '../../connection/api';
import MapaLeaflet from '../../components/MapaLeaflet';

// ===== TELA: RASTREAMENTO DO ÔNIBUS =====
// Mostra no mapa a rota e a posição do ônibus. O ADM também pode iniciar/parar a simulação aqui.
export default function Rastreamento() {
  // ===== NAVEGAÇÃO, ROTA RECEBIDA E CONTEXTO =====
  const navegacao = useNavigation();
  const route = useRoute();
  const { rota } = route.params;
  const { tema_escuro, adm } = useContext(ContextoTema);
  const mapa = useRef(null);

  // ===== TRAJETO DA ROTA =====
  const trajeto = Array.isArray(rota.coordenadas_trajeto)
    ? rota.coordenadas_trajeto
    : [];

  // ===== ESTADOS DA TELA =====
  // posição atual do ônibus (null = nenhum ônibus em operação)
  const [onibus, set_onibus] = useState(null);
  const [velocidade, set_velocidade] = useState(40);

  // ===== BUSCAR POSIÇÃO DO ÔNIBUS (GET /onibus/:codigo) =====
  const buscar_onibus = async () => {
    try {
      const resposta = await api.get(`/onibus/${rota.codigo}`);
      const pos = resposta.data.ativo
        ? {
            latitude: resposta.data.latitude,
            longitude: resposta.data.longitude,
          }
        : null;
      set_onibus(pos);
      if (mapa.current) mapa.current.atualizar_onibus(pos);
    } catch (erro) {
      console.log('Erro ao buscar o ônibus:', erro.message);
    }
  };

  // ===== REFERÊNCIA PARA A VERSÃO MAIS RECENTE DA BUSCA =====
  // Sempre aponta para a versão mais recente de buscar_onibus (com a rota atual)
  const buscar_ref = useRef(buscar_onibus);
  buscar_ref.current = buscar_onibus;

  // ===== ATUALIZAR POSIÇÃO DO ÔNIBUS A CADA 1,5 SEGUNDO =====
  // Consulta a posição do ônibus a cada 1,5 s, só enquanto a tela está em foco.
  // Recomeça quando a rota muda (o menu lateral mantém a tela montada).
  useFocusEffect(
    useCallback(() => {
      set_onibus(null);
      buscar_ref.current();
      const timer = setInterval(() => buscar_ref.current(), 1500);
      return () => clearInterval(timer);
    }, [rota.codigo])
  );

  // ===== MOSTRAR A POSIÇÃO DO USUÁRIO NO MAPA =====
  // Mostra a posição do próprio usuário no mapa (uma vez)
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const local = await Location.getCurrentPositionAsync({});
        if (mapa.current) {
          mapa.current.mostrar_minha_posicao(
            local.coords.latitude,
            local.coords.longitude
          );
        }
      } catch (e) {
        // sem localização: o mapa funciona normalmente sem o ponto azul
      }
    })();
  }, []);

  // ===== INICIAR SIMULAÇÃO (SÓ ADM) =====
  // ADM: inicia / para a simulação no servidor
  const iniciar_simulacao = async () => {
    try {
      await api.post(`/simulacao/${rota.codigo}`, {
        velocidade_kmh: velocidade,
      });
      buscar_onibus();
    } catch (erro) {
      const msg =
        erro.response?.data?.erro || 'Não foi possível iniciar a simulação.';
      alert(msg);
    }
  };

  // ===== PARAR SIMULAÇÃO (SÓ ADM) =====
  const parar_simulacao = async () => {
    try {
      await api.delete(`/simulacao/${rota.codigo}`);
      set_onibus(null);
      if (mapa.current) mapa.current.atualizar_onibus(null);
    } catch (erro) {
      alert('Não foi possível parar a simulação.');
    }
  };

  // ===== CORES DO TEMA =====
  const fundo_cartao = tema_escuro ? '#1E1E1E' : '#FFF';
  const cor_texto = tema_escuro ? '#FFF' : '#333';
  const cor_subtexto = tema_escuro ? '#9CA3AF' : '#6B7280';
  const azul = '#2563EB';

  // ===== TEXTO E COR DO STATUS =====
  let status_texto = 'Nenhum ônibus em operação';
  let status_cor = '#EF4444';
  if (trajeto.length < 2) {
    status_texto = 'Esta rota ainda não tem trajeto';
    status_cor = '#F59E0B';
  } else if (onibus) {
    status_texto = 'Ônibus em Trânsito';
    status_cor = '#10B981';
  }

  // ===== VISUAL DA TELA (JSX) =====
  return (
    <SafeAreaView style={estilos.container}>
      {/* MAPA (MapaLeaflet) */}
      <MapaLeaflet
        ref={mapa}
        trajeto={trajeto}
        escuro={tema_escuro}
        cor={azul}
        margem_baixo={adm ? 240 : 130}
      />

      {/* CABEÇALHO FLUTUANTE: VOLTAR, NOME E STATUS */}
      <View
        style={[
          estilos.cabecalho_flutuante,
          { backgroundColor: fundo_cartao },
        ]}>
        <TouchableOpacity
          onPress={() => navegacao.goBack()}
          style={estilos.botao_voltar}>
          <Ionicons name="arrow-back" size={24} color={cor_texto} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[estilos.titulo, { color: cor_texto }]}>
            Linha {rota.codigo}
          </Text>
          <Text style={{ color: status_cor, fontWeight: 'bold' }}>
            {status_texto}
          </Text>
        </View>
      </View>

      {/* PAINEL DE SIMULAÇÃO (SÓ ADM) */}
      {adm && (
        <View
          style={[estilos.painel_simulacao, { backgroundColor: fundo_cartao }]}>
          <Text style={[estilos.titulo_painel, { color: cor_texto }]}>
            Simulação (administrador)
          </Text>
          {/* ESCOLHA DA VELOCIDADE (20, 40 OU 60 km/h) */}
          <View style={estilos.linha_velocidades}>
            {[20, 40, 60].map((v) => (
              <TouchableOpacity
                key={v}
                style={[
                  estilos.chip_velocidade,
                  { borderColor: velocidade === v ? azul : cor_subtexto },
                  velocidade === v && {
                    backgroundColor: tema_escuro ? '#1E3A8A' : '#EFF6FF',
                  },
                ]}
                onPress={() => set_velocidade(v)}>
                <Text
                  style={{
                    color: velocidade === v ? azul : cor_subtexto,
                    fontWeight: velocidade === v ? 'bold' : 'normal',
                  }}>
                  {v} km/h
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* BOTÃO INICIAR / PARAR SIMULAÇÃO */}
          <TouchableOpacity
            style={[
              estilos.botao_simulacao,
              { backgroundColor: onibus ? '#EF4444' : azul },
              trajeto.length < 2 && { opacity: 0.5 },
            ]}
            disabled={trajeto.length < 2}
            onPress={onibus ? parar_simulacao : iniciar_simulacao}>
            <Ionicons name={onibus ? 'stop' : 'play'} size={18} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 8 }}>
              {onibus ? 'Parar simulação' : 'Iniciar simulação'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ===== ESTILOS DA TELA =====
const estilos = StyleSheet.create({
  container: { flex: 1 },
  cabecalho_flutuante: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  botao_voltar: { padding: 5 },
  titulo: { fontSize: 18, fontWeight: 'bold' },
  painel_simulacao: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  titulo_painel: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  linha_velocidades: { flexDirection: 'row', marginBottom: 12 },
  chip_velocidade: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 10,
    marginRight: 8,
  },
  botao_simulacao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
  },
});

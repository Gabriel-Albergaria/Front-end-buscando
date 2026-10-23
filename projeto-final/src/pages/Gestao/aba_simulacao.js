import React, { useCallback, useContext, useRef, useState } from 'react';
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
import { ContextoTema } from '../../contexts/ThemeContext';
import api from '../../connection/api';
import MapaLeaflet from '../../components/MapaLeaflet';

// ===== INTERVALO DE ATUALIZAÇÃO =====
// Tempo em milissegundos entre cada consulta da posição do ônibus ao servidor.
const INTERVALO_MS = 1000; // a posição do ônibus é atualizada de 10 em 10 segundos

// ===== TELA: SIMULAÇÃO DO ÔNIBUS (SÓ ADM) =====
// Liga/desliga a simulação de um ônibus na rota e mostra o movimento no mapa.
export default function SimulacaoOnibus() {
  // ===== NAVEGAÇÃO, ROTA RECEBIDA E CONTEXTO =====
  const navegacao = useNavigation();
  const route = useRoute();
  const { rota } = route.params;
  const { tema_escuro } = useContext(ContextoTema);
  const mapa = useRef(null);

  // ===== TRAJETO DA ROTA =====
  // Lista de coordenadas desenhadas na criação/edição da rota.
  const trajeto = Array.isArray(rota.coordenadas_trajeto)
    ? rota.coordenadas_trajeto
    : [];

  // ===== ESTADOS DA TELA =====
  // onibus = posição atual (null = parado) 
  //  velocidade = km/h escolhida 
  //  atualizado_em = hora da última consulta.
  const [onibus, set_onibus] = useState(null); // null = parado
  const [velocidade, set_velocidade] = useState(40);
  const [atualizado_em, set_atualizado_em] = useState('');

  // ===== REFERÊNCIAS (useRef) =====
  // Valores que persistem entre renderizações sem recarregar a tela.
  const velocidade_ref = useRef(40);
  const iniciei_aqui = useRef(false); // fui eu que liguei a simulação ao abrir a tela?
  const buscar_ref = useRef(null);

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
      set_atualizado_em(new Date().toLocaleTimeString('pt-BR'));
      // o ônibus desliza pela rota durante o intervalo inteiro (+5% de folga,
      // para nunca ficar parado esperando a próxima atualização)
      if (mapa.current) mapa.current.atualizar_onibus(pos, INTERVALO_MS * 1.05);
    } catch (erro) {
      console.log('Erro ao buscar o ônibus:', erro.message);
    }
  };
  buscar_ref.current = buscar_onibus;

  // ===== LIGAR SIMULAÇÃO NO SERVIDOR (POST /simulacao/:codigo) =====
  const ligar_simulacao = async (kmh) => {
    await api.post(`/simulacao/${rota.codigo}`, { velocidade_kmh: kmh });
  };

  // ===== AO ENTRAR E AO SAIR DA TELA =====
  // Ao entrar na tela: liga a simulação (se já não estiver ligada) e consulta de 10 em 10 s.
  // Ao sair: desliga, mas só se foi esta tela que ligou.
  // (useFocusEffect porque o menu lateral mantém a tela montada depois de sair dela)
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      iniciei_aqui.current = false;
      set_onibus(null);
      set_atualizado_em('');

      (async () => {
        try {
          const r = await api.get(`/onibus/${rota.codigo}`);
          if (!r.data.ativo && trajeto.length >= 2) {
            await ligar_simulacao(velocidade_ref.current);
            iniciei_aqui.current = true;
          }
        } catch (erro) {
          const msg = erro.response?.data?.erro;
          if (msg) alert(msg);
        }
        if (ativo) buscar_ref.current();
      })();

      const timer = setInterval(() => buscar_ref.current(), INTERVALO_MS);

      return () => {
        ativo = false;
        clearInterval(timer);
        if (iniciei_aqui.current) {
          api.delete(`/simulacao/${rota.codigo}`).catch(() => {});
          iniciei_aqui.current = false;
        }
        if (mapa.current) mapa.current.atualizar_onibus(null);
      };
    }, [rota.codigo, trajeto.length])
  );

  // ===== BOTÃO INICIAR: LIGAR A SIMULAÇÃO =====
  const iniciar = async () => {
    try {
      await ligar_simulacao(velocidade);
      iniciei_aqui.current = true;
      buscar_onibus();
    } catch (erro) {
      alert(
        erro.response?.data?.erro || 'Não foi possível iniciar a simulação.'
      );
    }
  };

  // ===== BOTÃO PARAR: DESLIGAR A SIMULAÇÃO (DELETE /simulacao/:codigo) =====
  const parar = async () => {
    try {
      await api.delete(`/simulacao/${rota.codigo}`);
      iniciei_aqui.current = false;
      set_onibus(null);
      if (mapa.current) mapa.current.atualizar_onibus(null);
    } catch (erro) {
      alert('Não foi possível parar a simulação.');
    }
  };

  // ===== TROCAR A VELOCIDADE DA SIMULAÇÃO =====
  // trocar a velocidade com a simulação rodando reinicia o percurso na nova velocidade
  const escolher_velocidade = async (v) => {
    set_velocidade(v);
    velocidade_ref.current = v;
    if (onibus) {
      try {
        await ligar_simulacao(v);
        buscar_onibus();
      } catch (erro) {
        alert('Não foi possível mudar a velocidade.');
      }
    }
  };

  // ===== CORES DO TEMA =====
  const fundo_cartao = tema_escuro ? '#1E1E1E' : '#FFF';
  const cor_texto = tema_escuro ? '#FFF' : '#333';
  const cor_subtexto = tema_escuro ? '#9CA3AF' : '#6B7280';
  const azul = '#2563EB';

  // ===== TEXTO E COR DO STATUS =====
  let status_texto = 'Simulação parada';
  let status_cor = '#EF4444';
  if (trajeto.length < 2) {
    status_texto = 'Esta rota ainda não tem trajeto';
    status_cor = '#F59E0B';
  } else if (onibus) {
    status_texto = 'Ônibus em movimento';
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
        margem_baixo={250}
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
            Simulação · Linha {rota.codigo}
          </Text>
          <Text style={{ color: status_cor, fontWeight: 'bold' }}>
            {status_texto}
          </Text>
        </View>
      </View>

      {/* PAINEL INFERIOR: VELOCIDADE E BOTÃO INICIAR/PARAR */}
      <View style={[estilos.painel, { backgroundColor: fundo_cartao }]}>
        {/* TEXTO: HORA DA ÚLTIMA ATUALIZAÇÃO */}
        <View style={estilos.linha_info}>
          <Ionicons name="time-outline" size={16} color={cor_subtexto} />
          <Text style={{ color: cor_subtexto, marginLeft: 6, fontSize: 12 }}>
            Posição atualizada a cada 10 s
            {atualizado_em ? ` · última: ${atualizado_em}` : ''}
          </Text>
        </View>

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
              onPress={() => escolher_velocidade(v)}>
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
            estilos.botao,
            { backgroundColor: onibus ? '#EF4444' : azul },
            trajeto.length < 2 && { opacity: 0.5 },
          ]}
          disabled={trajeto.length < 2}
          onPress={onibus ? parar : iniciar}>
          <Ionicons name={onibus ? 'stop' : 'play'} size={18} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 8 }}>
            {onibus ? 'Parar simulação' : 'Iniciar simulação'}
          </Text>
        </TouchableOpacity>
      </View>
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
  painel: {
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
  linha_info: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  linha_velocidades: { flexDirection: 'row', marginBottom: 12 },
  chip_velocidade: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 10,
    marginRight: 8,
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
  },
});

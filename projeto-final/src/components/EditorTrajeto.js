import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

// ===== REGIÃO PADRÃO DO MAPA =====
const REGIAO_PADRAO = {
  latitude: -20.4158,
  longitude: -42.8988,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

// ===== ARREDONDAR COORDENADA =====
// Mantém 6 casas decimais.
const arredondar = (n) => Math.round(n * 1e6) / 1e6;

// ===== CALCULAR DISTÂNCIA TOTAL DO TRAJETO (KM) =====
// Distância total do trajeto em km (fórmula de Haversine)
export function calcular_distancia_km(coords) {
  const raio = 6371;
  const rad = (g) => (g * Math.PI) / 180;
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1];
    const b = coords[i];
    const dLat = rad(b.latitude - a.latitude);
    const dLon = rad(b.longitude - a.longitude);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.latitude)) *
        Math.cos(rad(b.latitude)) *
        Math.sin(dLon / 2) ** 2;
    total += 2 * raio * Math.asin(Math.sqrt(h));
  }
  return total;
}

// ===== BUSCAR CAMINHO PELAS RUAS (API OSRM) =====
// Pede ao OSRM (serviço gratuito, sem chave) o caminho pelas ruas entre 2 pontos
async function buscar_trecho_nas_ruas(de, para) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${de.longitude},${de.latitude};${para.longitude},${para.latitude}` +
    `?overview=full&geometries=geojson`;
  const resposta = await fetch(url);
  const dados = await resposta.json();
  if (dados.code !== 'Ok' || !dados.routes || !dados.routes.length) {
    throw new Error('Sem rota');
  }
  return dados.routes[0].geometry.coordinates.map(([longitude, latitude]) => ({
    latitude: arredondar(latitude),
    longitude: arredondar(longitude),
  }));
}

// ===== COMPONENTE: EDITOR DE TRAJETO (MODAL COM MAPA) =====
// Props: visivel, fechar, trajeto, ao_confirmar e tema_escuro. Usado nas telas de criar e editar rota.
export default function EditorTrajeto({
  visivel,
  fechar,
  trajeto,
  ao_confirmar,
  tema_escuro,
}) {
  // ===== ESTADOS DO EDITOR =====
  // Cada toque no mapa vira um "segmento", assim dá para desfazer um por um
  const [segmentos, set_segmentos] = useState([]);
  const [seguir_ruas, set_seguir_ruas] = useState(true);
  const [carregando, set_carregando] = useState(false);
  const [aviso, set_aviso] = useState('');

  // ===== CORES DO TEMA =====
  const azul = '#2563EB';
  const fundo = tema_escuro ? '#121212' : '#FFFFFF';
  const cor_texto = tema_escuro ? '#FFFFFF' : '#333333';
  const cor_subtexto = tema_escuro ? '#9CA3AF' : '#6B7280';
  const cor_borda = tema_escuro ? '#333333' : '#E5E7EB';

  // ===== CARREGAR O TRAJETO EXISTENTE AO ABRIR =====
  // Ao abrir, carrega o trajeto que já existe (se houver)
  useEffect(() => {
    if (visivel) {
      set_segmentos(trajeto && trajeto.length > 0 ? [trajeto] : []);
      set_aviso('');
    }
  }, [visivel]);

  // ===== TODOS OS PONTOS E DISTÂNCIA EM KM =====
  const todos = segmentos.flat();
  const km = calcular_distancia_km(todos);

  // ===== REGIÃO INICIAL DO MAPA =====
  const regiao_inicial =
    trajeto && trajeto.length > 0
      ? {
          latitude: trajeto[0].latitude,
          longitude: trajeto[0].longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }
      : REGIAO_PADRAO;

  // ===== TOQUE NO MAPA: ADICIONA UM PONTO AO TRAJETO =====
  // Com "Seguir ruas" ligado, busca o caminho pelas ruas até o novo ponto.
  const ao_tocar = async (evento) => {
    if (carregando) return;
    const c = evento.nativeEvent.coordinate;
    const novo = {
      latitude: arredondar(c.latitude),
      longitude: arredondar(c.longitude),
    };

    if (todos.length === 0) {
      set_segmentos([[novo]]);
      return;
    }

    let trecho = [novo];
    if (seguir_ruas) {
      set_carregando(true);
      try {
        trecho = await buscar_trecho_nas_ruas(todos[todos.length - 1], novo);
        set_aviso('');
      } catch (erro) {
        set_aviso(
          'Não foi possível seguir as ruas; usei linha reta neste trecho.'
        );
      }
      set_carregando(false);
    }
    set_segmentos((anterior) => [...anterior, trecho]);
  };

  // ===== DESFAZER ÚLTIMO TRECHO E LIMPAR TUDO =====
  const desfazer = () => set_segmentos((anterior) => anterior.slice(0, -1));
  const limpar = () => set_segmentos([]);

  // ===== CONCLUIR: DEVOLVE O TRAJETO PARA A TELA ANTERIOR =====
  const concluir = () => {
    ao_confirmar(todos, km);
    fechar();
  };

  // ===== VISUAL DO EDITOR (JSX) =====
  return (
    <Modal visible={visivel} animationType="slide" onRequestClose={fechar}>
      <SafeAreaView style={[estilos.container, { backgroundColor: fundo }]}>
        {/* TOPO: BOTÃO FECHAR E TÍTULO */}
        <View style={[estilos.topo, { borderBottomColor: cor_borda }]}>
          <TouchableOpacity onPress={fechar} style={estilos.botao_fechar}>
            <Ionicons name="close" size={26} color={cor_texto} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[estilos.titulo, { color: cor_texto }]}>
              Traçar trajeto
            </Text>
            <Text style={{ color: cor_subtexto, fontSize: 12 }}>
              Toque no mapa, na ordem em que o ônibus passa
            </Text>
          </View>
        </View>

        {/* ÁREA DO MAPA */}
        <View style={{ flex: 1 }}>
          {/* MAPA (TOQUE PARA ADICIONAR PONTOS) */}
          <MapView
            style={{ flex: 1 }}
            initialRegion={regiao_inicial}
            onPress={ao_tocar}
            showsUserLocation={true}
            showsMyLocationButton={false}>
            {/* LINHA DO TRAJETO */}
            {todos.length > 1 && (
              <Polyline
                coordinates={todos}
                strokeColor={azul}
                strokeWidth={5}
              />
            )}
            {/* MARCADOR DE INÍCIO (VERDE) */}
            {todos.length > 0 && (
              <Marker coordinate={todos[0]} pinColor="green" title="Início" />
            )}
            {/* MARCADOR DE FIM */}
            {todos.length > 1 && (
              <Marker
                coordinate={todos[todos.length - 1]}
                pinColor="red"
                title="Fim"
              />
            )}
          </MapView>

          {/* AVISO: BUSCANDO RUAS */}
          {carregando && (
            <View style={estilos.carregando}>
              <ActivityIndicator color="#FFF" />
              <Text style={{ color: '#FFF', marginLeft: 8 }}>
                Buscando ruas...
              </Text>
            </View>
          )}
          {/* AVISO: NÃO FOI POSSÍVEL SEGUIR AS RUAS */}
          {aviso !== '' && (
            <View style={[estilos.carregando, { backgroundColor: '#B45309' }]}>
              <Text style={{ color: '#FFF', fontSize: 12 }}>{aviso}</Text>
            </View>
          )}
        </View>

        {/* RODAPÉ: DISTÂNCIA, SWITCH E BOTÕES */}
        <View
          style={[
            estilos.rodape,
            { backgroundColor: fundo, borderTopColor: cor_borda },
          ]}>
          {/* DISTÂNCIA TOTAL E SWITCH "SEGUIR RUAS" */}
          <View style={estilos.linha_info}>
            <Text style={{ color: cor_texto, fontWeight: 'bold' }}>
              {km.toFixed(1)} km
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: cor_subtexto, marginRight: 8 }}>
                Seguir ruas
              </Text>
              <Switch value={seguir_ruas} onValueChange={set_seguir_ruas} />
            </View>
          </View>

          {/* BOTÕES: DESFAZER, LIMPAR E CONCLUIR */}
          <View style={estilos.linha_botoes}>
            <TouchableOpacity
              style={[estilos.botao_secundario, { borderColor: cor_borda }]}
              onPress={desfazer}
              disabled={segmentos.length === 0}>
              <Ionicons name="arrow-undo" size={18} color={cor_texto} />
              <Text style={{ color: cor_texto, marginLeft: 6 }}>Desfazer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.botao_secundario, { borderColor: cor_borda }]}
              onPress={limpar}
              disabled={segmentos.length === 0}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={{ color: '#EF4444', marginLeft: 6 }}>Limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                estilos.botao_concluir,
                { opacity: todos.length < 2 ? 0.5 : 1 },
              ]}
              onPress={concluir}
              disabled={todos.length < 2}>
              <Ionicons name="checkmark" size={18} color="#FFF" />
              <Text
                style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 6 }}>
                Concluir
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ===== ESTILOS DO EDITOR =====
const estilos = StyleSheet.create({
  container: { flex: 1 },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  botao_fechar: { padding: 6, marginRight: 8 },
  titulo: { fontSize: 18, fontWeight: 'bold' },
  carregando: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rodape: { padding: 16, borderTopWidth: 1 },
  linha_info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  linha_botoes: { flexDirection: 'row', alignItems: 'center' },
  botao_secundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  botao_concluir: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
  },
});

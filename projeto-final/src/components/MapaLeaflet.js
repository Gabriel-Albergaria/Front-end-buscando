import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// ===== CENTRO PADRÃO DO MAPA =====
const CENTRO_PADRAO = [-20.4158, -42.8988];

// ===== MONTAR A PÁGINA HTML DO MAPA =====
// Tudo dentro da string abaixo é HTML/CSS/JavaScript do Leaflet, carregado dentro do WebView.
// Monta a página HTML do mapa. Só é montada de novo se o trajeto ou o tema mudarem.
function montar_html({ trajeto, escuro, cor, margem_baixo }) {
  const pontos = trajeto.map((p) => [p.latitude, p.longitude]);
  const fundo = escuro ? '#1a1a1a' : '#e5e3df';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #mapa { height: 100%; margin: 0; padding: 0; background: ${fundo}; }

  /* O TRACEJADO ANDANDO: o navegador anima o deslocamento do tracejado.
     Valor negativo = os traços avançam no sentido do desenho (início -> fim).
     28 = tamanho do padrão "14 de traço + 14 de espaço". */
  .formigas { animation: marcha 0.9s linear infinite; }
  @keyframes marcha {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: -28; }
  }

  .onibus {
    width: 40px; height: 40px; border-radius: 50%;
    background: #10B981; border: 3px solid #fff;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.45); font-size: 20px;
  }
  .leaflet-control-attribution { font-size: 9px; }

  /* Tema escuro: escurece o mapa claro invertendo as cores */
  .tiles-escuros { filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9); }
</style>
</head>
<body>
<div id="mapa"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  // ===== COMUNICAÇÃO COM O APP (postMessage) =====
  function avisar(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
  }
  window.onerror = function () { avisar('erro'); };

  // ===== TRAJETO E COR VINDOS DO APP =====
  var TRAJETO = ${JSON.stringify(pontos)};
  var COR = '${cor}';

  // ===== CRIAR O MAPA LEAFLET =====
  var map = L.map('mapa', { zoomControl: false, attributionControl: false });
  L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);
  // ===== CAMADA DO MAPA (TILES) COM TROCA AUTOMÁTICA DE PROVEDOR =====
  // Fontes do mapa, sem chave de API. Se a primeira falhar (bloqueio, erro),
  // troca sozinho para a próxima.
  var ESCURO = ${escuro ? 'true' : 'false'};
  var PROVEDORES = [
    { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attr: '&copy; OpenStreetMap' },
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attr: 'Tiles &copy; Esri' }
  ];
  var provedor = 0, erros = 0, camada = null;

  function usarProvedor(i) {
    if (camada) map.removeLayer(camada);
    erros = 0;
    camada = L.tileLayer(PROVEDORES[i].url, {
      maxZoom: 19,
      attribution: PROVEDORES[i].attr,
      className: ESCURO ? 'tiles-escuros' : ''
    }).addTo(map);
    camada.on('tileerror', function () {
      erros++;
      if (erros === 4 && provedor < PROVEDORES.length - 1) {
        provedor++;
        usarProvedor(provedor);
      }
    });
  }
  usarProvedor(0);

  // ===== DESENHAR O TRAJETO, INÍCIO, FIM E ENQUADRAR NA TELA =====
  if (TRAJETO.length > 1) {
    // faixa translúcida por baixo (dá corpo à linha)
    L.polyline(TRAJETO, { color: COR, weight: 9, opacity: 0.22, lineCap: 'round' }).addTo(map);
    // tracejado animado por cima
    L.polyline(TRAJETO, {
      color: COR, weight: 5, opacity: 1,
      dashArray: '14 14', lineCap: 'butt', className: 'formigas'
    }).addTo(map);

    L.circleMarker(TRAJETO[0], { radius: 8, color: '#fff', weight: 3, fillColor: '#16A34A', fillOpacity: 1 })
      .bindTooltip('Início').addTo(map);
    L.circleMarker(TRAJETO[TRAJETO.length - 1], { radius: 8, color: '#fff', weight: 3, fillColor: '#DC2626', fillOpacity: 1 })
      .bindTooltip('Fim').addTo(map);

    map.fitBounds(L.latLngBounds(TRAJETO), {
      paddingTopLeft: [40, 150],
      paddingBottomRight: [40, ${margem_baixo}]
    });
  } else {
    map.setView([${CENTRO_PADRAO[0]}, ${CENTRO_PADRAO[1]}], 14);
  }

  // ---------- ÔNIBUS ----------
  var iconeOnibus = L.divIcon({
    html: '<div class="onibus">🚌</div>',
    className: '', iconSize: [40, 40], iconAnchor: [20, 20]
  });
  var onibus = null;
  var animacao = null;
  var s_atual = null; // quantos metros o ônibus já andou ao longo do trajeto

  // ===== DISTÂNCIA ENTRE DOIS PONTOS (METROS) =====
  function dist_m(a, b) {
    var rad = Math.PI / 180;
    var dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
    var h = Math.pow(Math.sin(dLat / 2), 2) +
      Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.pow(Math.sin(dLon / 2), 2);
    return 2 * 6371000 * Math.asin(Math.sqrt(h));
  }

  // distância acumulada do início do trajeto até cada ponto
  var ACUM = [0];
  for (var i = 1; i < TRAJETO.length; i++) {
    ACUM.push(ACUM[i - 1] + dist_m(TRAJETO[i - 1], TRAJETO[i]));
  }
  var TOTAL = ACUM[ACUM.length - 1] || 0;

  // ponto do trajeto que fica a "s" metros do início
  function pontoEm(s) {
    var baixo = 1, alto = ACUM.length - 1;
    while (baixo < alto) {
      var meio = (baixo + alto) >> 1;
      if (ACUM[meio] < s) baixo = meio + 1; else alto = meio;
    }
    var tam = ACUM[baixo] - ACUM[baixo - 1];
    var t = tam === 0 ? 0 : Math.min(1, Math.max(0, (s - ACUM[baixo - 1]) / tam));
    var a = TRAJETO[baixo - 1], b = TRAJETO[baixo];
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }

  // ponto do trajeto mais perto de (lat, lng), olhando só entre smin e smax metros
  function projetar(lat, lng, smin, smax) {
    var kx = Math.cos(lat * Math.PI / 180) * 111320, ky = 111320;
    var melhor = null;
    for (var i = 1; i < TRAJETO.length; i++) {
      if (ACUM[i] < smin || ACUM[i - 1] > smax) continue;
      var a = TRAJETO[i - 1], b = TRAJETO[i];
      var ax = (a[1] - lng) * kx, ay = (a[0] - lat) * ky;
      var bx = (b[1] - lng) * kx, by = (b[0] - lat) * ky;
      var dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
      var t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
      var px = ax + dx * t, py = ay + dy * t;
      var d = Math.sqrt(px * px + py * py);
      if (!melhor || d < melhor.dist) {
        melhor = { s: ACUM[i - 1] + (ACUM[i] - ACUM[i - 1]) * t, dist: d };
      }
    }
    return melhor;
  }

  // ===== COLOCAR O ÔNIBUS A UMA DISTÂNCIA DO INÍCIO =====
  function colocar(s) {
    s_atual = s;
    var p = pontoEm(s);
    if (!onibus) onibus = L.marker(p, { icon: iconeOnibus, zIndexOffset: 1000 }).addTo(map);
    else onibus.setLatLng(p);
  }

  // Leva o ônibus até (lat, lng) deslizando PELO trajeto durante "duracao" ms.
  function moverOnibus(lat, lng, duracao) {
    duracao = duracao || 1400;
    if (animacao) cancelAnimationFrame(animacao);

    // sem trajeto desenhado: só posiciona
    if (TRAJETO.length < 2 || TOTAL === 0) {
      if (!onibus) onibus = L.marker([lat, lng], { icon: iconeOnibus, zIndexOffset: 1000 }).addTo(map);
      else onibus.setLatLng([lat, lng]);
      return;
    }

    // primeira posição: só coloca
    if (s_atual === null || !onibus) { colocar(projetar(lat, lng, 0, TOTAL).s); return; }

    // procura a nova posição um pouco à frente da atual; se não achar perto
    // (ex.: o ônibus voltou ao início do trajeto), salta direto
    var alvo = projetar(lat, lng, s_atual - 30, s_atual + 800);
    if (!alvo || alvo.dist > 40) { colocar(projetar(lat, lng, 0, TOTAL).s); return; }

    var de = s_atual, ate = alvo.s, inicio = performance.now();
    function passo(agora) {
      var k = Math.min(1, (agora - inicio) / duracao);
      colocar(de + (ate - de) * k);
      if (k < 1) animacao = requestAnimationFrame(passo);
    }
    animacao = requestAnimationFrame(passo);
  }

  // ===== REMOVER O ÔNIBUS DO MAPA =====
  function removerOnibus() {
    if (animacao) cancelAnimationFrame(animacao);
    if (onibus) { map.removeLayer(onibus); onibus = null; }
    s_atual = null;
  }

  // ---------- POSIÇÃO DO USUÁRIO ----------
  var eu = null;
  function minhaPosicao(lat, lng) {
    if (eu) { eu.setLatLng([lat, lng]); return; }
    eu = L.circleMarker([lat, lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }).addTo(map);
  }

  avisar('pronto');
</script>
</body>
</html>`;
}

// ===== COMPONENTE: MAPA LEAFLET (WEBVIEW) =====
// Usado nas telas de Rastreamento e Simulação.
/**
 * Mapa Leaflet. Métodos expostos pelo ref:
 *   atualizar_onibus({ latitude, longitude } | null, duracao_ms?)
 *     duracao_ms = quanto tempo o ônibus leva deslizando até a nova posição
 *   mostrar_minha_posicao(latitude, longitude)
 */
const MapaLeaflet = forwardRef(function MapaLeaflet(
  { trajeto, escuro = false, cor = '#2563EB', margem_baixo = 130 },
  ref
) {
  // ===== REFERÊNCIAS E ESTADOS =====
  const web = useRef(null);
  const pronto = useRef(false);
  // comandos que chegaram antes da página terminar de carregar (guarda só o último de cada tipo)
  const pendentes = useRef({});
  const memoria = useRef({}); // últimos comandos que precisam sobreviver a um recarregamento
  const [carregando, set_carregando] = useState(true);
  const [erro, set_erro] = useState(false);

  // ===== HTML DO MAPA =====
  // Só é refeito quando o trajeto, o tema ou a cor mudam.
  const html = useMemo(
    () => montar_html({ trajeto, escuro, cor, margem_baixo }),
    [trajeto, escuro, cor, margem_baixo]
  );

  // ===== VOLTAR AO ESTADO "CARREGANDO" QUANDO O HTML MUDA =====
  // Se o trajeto/tema mudar, a página recarrega: volta ao estado "carregando"
  useEffect(() => {
    pronto.current = false;
    set_carregando(true);
    set_erro(false);
  }, [html]);

  // ===== ENVIAR COMANDO JAVASCRIPT PARA O MAPA =====
  // Se o mapa ainda não carregou, guarda o comando para executar depois.
  const executar = (tipo, js) => {
    if (tipo === 'eu') memoria.current.eu = js;
    if (pronto.current && web.current) {
      web.current.injectJavaScript(js + '; true;');
    } else {
      pendentes.current[tipo] = js;
    }
  };

  // ===== MÉTODOS EXPOSTOS PARA AS TELAS (ref) =====
  // atualizar_onibus e mostrar_minha_posicao.
  useImperativeHandle(ref, () => ({
    atualizar_onibus: (pos, duracao_ms) =>
      executar(
        'onibus',
        pos
          ? `moverOnibus(${pos.latitude}, ${pos.longitude}, ${
              duracao_ms || 1400
            })`
          : 'removerOnibus()'
      ),
    mostrar_minha_posicao: (latitude, longitude) =>
      executar('eu', `minhaPosicao(${latitude}, ${longitude})`),
  }));

  // ===== MENSAGENS VINDAS DO MAPA =====
  // "pronto" = mapa carregado 
  //  "erro" = falha ao carregar.
  const ao_receber_mensagem = (evento) => {
    const msg = evento.nativeEvent.data;
    if (msg === 'pronto') {
      pronto.current = true;
      set_carregando(false);
      const lista = { ...memoria.current, ...pendentes.current };
      Object.values(lista).forEach((js) => {
        web.current && web.current.injectJavaScript(js + '; true;');
      });
      pendentes.current = {};
    } else if (msg === 'erro') {
      set_erro(true);
    }
  };

  // ===== VISUAL DO COMPONENTE (JSX) =====
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* WEBVIEW QUE MOSTRA O MAPA */}
      <WebView
        ref={web}
        style={estilos.web}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://buscando.app/' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={ao_receber_mensagem}
        onError={() => set_erro(true)}
        onHttpError={() => set_erro(true)}
        overScrollMode="never"
        bounces={false}
      />
      {/* AVISO: CARREGANDO OU ERRO DE CONEXÃO */}
      {(carregando || erro) && (
        <View style={estilos.aviso} pointerEvents="none">
          {erro ? (
            <Text style={estilos.texto_aviso}>
              Não foi possível carregar o mapa. Verifique a conexão com a
              internet.
            </Text>
          ) : (
            <ActivityIndicator size="large" color="#2563EB" />
          )}
        </View>
      )}
    </View>
  );
});

export default MapaLeaflet;

// ===== ESTILOS DO MAPA =====
const estilos = StyleSheet.create({
  web: { flex: 1, backgroundColor: 'transparent' },
  aviso: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  texto_aviso: { textAlign: 'center', color: '#EF4444', fontWeight: 'bold' },
});

let viewer;
let vehiculosCache = {};

// Coordenadas pre-resueltas cuando el usuario elige una sugerencia
const resolvedCoords = { origen: null, destino: null };

const routeState = {
  origenCoords: null,
  destinoCoords: null,
  distancia_km: null,
  duracion_min: null,
  geometry: null,
  toll_distance_km: 0
};

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

async function fetchSuggestions(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=0`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'es', 'User-Agent': 'EmpresaRutaPlanner/1.0' }
  });
  return res.json();
}

function setupAutocomplete(field) {
  const input = document.getElementById(field);
  const list = document.getElementById(`${field}Suggestions`);
  let activeIndex = -1;

  function closeList() {
    list.style.display = 'none';
    activeIndex = -1;
  }

  function setActive(items) {
    items.forEach((li, i) => li.classList.toggle('active', i === activeIndex));
  }

  const search = debounce(async (value) => {
    if (value.length < 3) { closeList(); return; }
    try {
      const results = await fetchSuggestions(value);
      list.innerHTML = '';
      activeIndex = -1;
      if (!results.length) { closeList(); return; }
      results.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.display_name;
        li.addEventListener('mousedown', () => {
          input.value = item.display_name;
          resolvedCoords[field] = { lat: parseFloat(item.lat), lon: parseFloat(item.lon) };
          closeList();
        });
        list.appendChild(li);
      });
      list.style.display = 'block';
    } catch (_) { closeList(); }
  }, 350);

  input.addEventListener('input', e => {
    resolvedCoords[field] = null;
    search(e.target.value);
  });

  input.addEventListener('keydown', e => {
    const items = list.querySelectorAll('li');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      setActive(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, -1);
      setActive(items);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].dispatchEvent(new Event('mousedown'));
    } else if (e.key === 'Escape') {
      closeList();
    }
  });

  input.addEventListener('blur', () => setTimeout(closeList, 150));
}

function initCesium() {
  try {
    Cesium.Ion.defaultAccessToken = '';

    viewer = new Cesium.Viewer('cesiumContainer', {
      imageryProvider: new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/'
      }),
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      baseLayerPicker: false,
      sceneModePicker: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      navigationHelpButton: false,
      geocoder: false,
      homeButton: false,
      scene3DOnly: true
    });
  } catch (e) {
    console.error('Error al inicializar Cesium:', e);
  }

  setupAutocomplete('origen');
  setupAutocomplete('destino');
  cargarVehiculos();
}

async function cargarVehiculos() {
  try {
    const response = await fetch('/api/vehiculos');
    const vehiculos = await response.json();

    vehiculosCache = {};
    vehiculos.forEach(v => { vehiculosCache[v.id] = v; });

    const select = document.getElementById('vehiculo');
    select.innerHTML = '<option value="">Seleccionar vehículo</option>';

    vehiculos.forEach(v => {
      const option = document.createElement('option');
      option.value = v.id;
      option.textContent = `${v.nombre} (${v.tipo})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar vehículos:', error);
  }
}

async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'es',
      'User-Agent': 'EmpresaRutaPlanner/1.0'
    }
  });
  const data = await response.json();
  if (!data.length) {
    throw new Error(`No se encontró la dirección: "${address}"`);
  }
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

function getORSProfile(vehiculo) {
  if (!vehiculo) return 'driving-car';
  if (vehiculo.tiene_tacografo) return 'driving-hgv';
  return 'driving-car';
}

function estimarCostoPeajes(toll_km, vehiculo) {
  if (!vehiculo || toll_km <= 0) return 0;

  const tipo = (vehiculo.tipo || '').toLowerCase();
  let tarifa = 0.08;

  if (tipo.includes('camión') || tipo.includes('camion')) {
    tarifa = 0.15;
  } else if (tipo.includes('furg')) {
    tarifa = 0.10;
  } else if (tipo.includes('camioneta')) {
    tarifa = 0.08;
  }

  return toll_km * tarifa;
}

function dibujarRutaEnMapa(geometry, origenCoords, destinoCoords) {
  if (!viewer) return;
  viewer.entities.removeAll();

  const positions = geometry.coordinates.map(c =>
    Cesium.Cartesian3.fromDegrees(c[0], c[1])
  );

  viewer.entities.add({
    polyline: {
      positions,
      width: 4,
      material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.BLUE)
    }
  });

  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(origenCoords.lon, origenCoords.lat),
    point: {
      pixelSize: 12,
      color: Cesium.Color.GREEN,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2
    },
    label: {
      text: 'Origen',
      font: '12pt Arial',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -15)
    }
  });

  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(destinoCoords.lon, destinoCoords.lat),
    point: {
      pixelSize: 12,
      color: Cesium.Color.RED,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2
    },
    label: {
      text: 'Destino',
      font: '12pt Arial',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -15)
    }
  });

  viewer.zoomTo(viewer.entities);
}

async function calcularRuta() {
  const origenInput = document.getElementById('origen').value.trim();
  const destinoInput = document.getElementById('destino').value.trim();
  const vehiculoId = document.getElementById('vehiculo').value;

  if (!origenInput || !destinoInput) {
    alert('Por favor, introduce el origen y el destino');
    return;
  }

  const btnCalc = document.getElementById('btnCalcular');
  const statusEl = document.getElementById('routeStatus');

  btnCalc.disabled = true;
  statusEl.textContent = 'Geocodificando direcciones...';
  statusEl.className = 'route-status loading';

  try {
    const [origenCoords, destinoCoords] = await Promise.all([
      resolvedCoords.origen  ? Promise.resolve(resolvedCoords.origen)  : geocodeAddress(origenInput),
      resolvedCoords.destino ? Promise.resolve(resolvedCoords.destino) : geocodeAddress(destinoInput)
    ]);

    const vehiculo = vehiculosCache[vehiculoId] || null;
    const profile = getORSProfile(vehiculo);

    statusEl.textContent = 'Calculando ruta...';

    const response = await fetch('/api/rutas/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_coords: origenCoords,
        end_coords: destinoCoords,
        vehicle_profile: profile
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al calcular la ruta');
    }

    const routeData = await response.json();

    routeState.origenCoords = origenCoords;
    routeState.destinoCoords = destinoCoords;
    routeState.distancia_km = routeData.distance_m / 1000;
    routeState.duracion_min = Math.round(routeData.duration_s / 60);
    routeState.geometry = routeData.geometry;
    routeState.toll_distance_km = routeData.toll_distance_m / 1000;

    const costoPeajes = estimarCostoPeajes(routeState.toll_distance_km, vehiculo);

    dibujarRutaEnMapa(routeData.geometry, origenCoords, destinoCoords);

    document.getElementById('infoDistancia').textContent = `${routeState.distancia_km.toFixed(1)} km`;
    document.getElementById('infoDuracion').textContent = `${routeState.duracion_min} min`;
    document.getElementById('infoPeajes').textContent = `€${costoPeajes.toFixed(2)}`;
    document.getElementById('routeInfo').style.display = 'block';

    document.getElementById('peajes').value = costoPeajes.toFixed(2);

    statusEl.textContent = 'Ruta calculada correctamente';
    statusEl.className = 'route-status success';
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
    statusEl.className = 'route-status error';
  } finally {
    btnCalc.disabled = false;
  }
}

async function guardarRuta() {
  const nombre = document.getElementById('nombreRuta').value.trim();
  const id_vehiculo = document.getElementById('vehiculo').value;
  const combustible = document.getElementById('combustible').value;
  const peajes = document.getElementById('peajes').value;
  const personal = document.getElementById('personal').value;
  const mantenimiento = document.getElementById('mantenimiento').value;
  const margen = document.getElementById('margen').value;

  if (!nombre) {
    alert('Por favor, introduce el nombre de la ruta');
    return;
  }

  if (!routeState.distancia_km) {
    alert('Por favor, calcula la ruta antes de guardarla');
    return;
  }

  const puntos_ruta = routeState.geometry
    ? routeState.geometry.coordinates.map(c => ({ lon: c[0], lat: c[1] }))
    : [];

  const rutaData = {
    nombre,
    distancia: routeState.distancia_km,
    duracion_estimada: routeState.duracion_min,
    puntos_ruta,
    origen: document.getElementById('origen').value.trim(),
    destino: document.getElementById('destino').value.trim(),
    origen_coords: routeState.origenCoords,
    destino_coords: routeState.destinoCoords,
    id_vehiculo: id_vehiculo ? parseInt(id_vehiculo) : null,
    costo_combustible: parseFloat(combustible) || 0,
    costo_peajes: parseFloat(peajes) || 0,
    costo_personal: parseFloat(personal) || 0,
    costo_mantenimiento: parseFloat(mantenimiento) || 0,
    margen_ganancia: parseFloat(margen) || 20
  };

  try {
    const response = await fetch('/api/rutas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rutaData)
    });

    const result = await response.json();

    if (response.ok) {
      mostrarResultados(result);
    } else {
      alert('Error al crear la ruta: ' + result.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión al servidor');
  }
}

function mostrarResultados(ruta) {
  document.getElementById('costoTotal').textContent = `€${parseFloat(ruta.costo_total).toFixed(2)}`;
  document.getElementById('pvpRecomendado').textContent = `€${parseFloat(ruta.pvp_recomendado).toFixed(2)}`;

  const descansoInfo = document.getElementById('descansoInfo');
  const descansoTexto = document.getElementById('descansoTexto');

  if (ruta.tiempo_descanso_total > 0) {
    descansoInfo.style.display = 'block';
    descansoTexto.textContent = `Tiempo de descanso adicional: ${ruta.tiempo_descanso_total} minutos`;
  } else {
    descansoInfo.style.display = 'none';
  }

  document.getElementById('resultados').style.display = 'block';
}

window.addEventListener('load', initCesium);
window.calcularRuta = calcularRuta;
window.guardarRuta = guardarRuta;

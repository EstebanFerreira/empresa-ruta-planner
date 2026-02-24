let viewer;

function initCesium() {
    viewer = new Cesium.Viewer('cesiumContainer', {
        imageryProvider: Cesium.createOpenStreetMapImageryProvider({
            url: 'https://a.tile.openstreetmap.org/'
        }),
        sceneMode: Cesium.SceneMode.SCENE3D,
        navigationHelpButton: false,
        geocoder: false,
        homeButton: false,
        scene3DOnly: true
    });

    agregarPuntosEjemplo();
    cargarVehiculos();
}

function agregarPuntosEjemplo() {
    const puntos = [
        { lat: 40.4168, lon: -3.7038, nombre: "Madrid" },
        { lat: 41.3851, lon: 2.1734, nombre: "Barcelona" },
        { lat: 37.3891, lon: -5.9845, nombre: "Sevilla" }
    ];

    puntos.forEach(punto => {
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(punto.lon, punto.lat),
            point: {
                pixelSize: 10,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            label: {
                text: punto.nombre,
                font: '14pt monospace',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.TOP,
                pixelOffset: new Cesium.Cartesian2(0, -15)
            }
        });
    });

    const positions = puntos.map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat));

    viewer.entities.add({
        polyline: {
            positions: positions,
            width: 3,
            material: new Cesium.Material({
                fabric: {
                    type: 'PolylineArrow',
                    uniforms: { color: Cesium.Color.BLUE }
                }
            })
        }
    });
}

async function cargarVehiculos() {
    try {
        const response = await fetch('/api/vehiculos');
        const vehiculos = await response.json();

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

async function crearRuta() {
    const nombre = document.getElementById('nombreRuta').value;
    const distancia = document.getElementById('distancia').value;
    const duracion = document.getElementById('duracion').value;
    const id_vehiculo = document.getElementById('vehiculo').value;
    const combustible = document.getElementById('combustible').value;
    const peajes = document.getElementById('peajes').value;
    const personal = document.getElementById('personal').value;
    const mantenimiento = document.getElementById('mantenimiento').value;
    const margen = document.getElementById('margen').value;

    if (!nombre || !distancia) {
        alert('Por favor, complete los campos obligatorios');
        return;
    }

    const rutaData = {
        nombre,
        distancia: parseFloat(distancia),
        duracion_estimada: parseInt(duracion),
        id_vehiculo: id_vehiculo ? parseInt(id_vehiculo) : null,
        puntos_ruta: [
            { lat: 40.4168, lon: -3.7038, nombre: "Punto Inicial" },
            { lat: 41.3851, lon: 2.1734, nombre: "Punto Final" }
        ],
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
window.crearRuta = crearRuta;

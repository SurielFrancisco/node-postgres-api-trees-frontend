var url = "https://node-postgres-api-trees.onrender.com/api/trees";

// --- CONFIGURACIÓN DE CLOUDINARY ---
const cloudName = 'dbrjpx8jx'; 
const uploadPreset = 'mis_arboles'; 

// --- LÓGICA DE SUBIDA DE IMAGEN ---
$(document).ready(function() {
    // Cuando el usuario selecciona una imagen, se sube automáticamente
    $('#file_input').on('change', function(e) {
        var file = e.target.files[0];
        if (file) {
            subirACloudinary(file);
        }
    });
});

function subirACloudinary(file) {
    $('#upload-status').html('<span style="color:blue">Subiendo imagen a Cloudinary... ⏳</span>');
    $('#imagen_url').val(''); // Limpiamos el input por si había una imagen antes

    var formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    $.ajax({
        url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(res) {
            console.log("Subida a Cloudinary exitosa:", res);
            // Guardamos el link en el input oculto para que postTree/putTree lo lean
            $('#imagen_url').val(res.secure_url);
            $('#upload-status').html(
                `<span style="color:green">¡Imagen subida con éxito! </span> <br>
                 <img src="${res.secure_url}" style="width:80px; margin-top:5px; border-radius:4px; border: 1px solid #ccc;">`
            );
        },
        error: function(err) {
            console.error("Error al subir a Cloudinary:", err);
            $('#upload-status').html('<span style="color:red">Error al subir imagen . Revisa tu consola.</span>');
        }
    });
}

// --- FUNCIONES CRUD ---

function getTrees() {
    $('#resultado').html('<p>Cargando datos...</p>');

    $.getJSON(url, function(json) {
        var arrTrees = json.trees;
        var htmlTableTrees = '<table>';
        htmlTableTrees += '<tr><th>Imagen</th><th>ID</th><th>Nombre Común</th><th>Nombre Científico</th><th>Familia</th><th>Origen</th><th>Altura Máx (m)</th><th>Tipo de Hoja</th><th>Clima</th><th>Conservación</th><th class="acciones">Acciones</th></tr>';

        arrTrees.forEach(function(item) {
            var imagenHtml = item.imagen_url ? `<img src="${item.imagen_url}" alt="${item.nombre_comun}">` : 'Sin imagen';

            htmlTableTrees += `<tr>
                <td>${imagenHtml}</td>
                <td>${item.id}</td>
                <td>${item.nombre_comun}</td>
                <td>${item.nombre_cientifico}</td>
                <td>${item.familia}</td>
                <td>${item.origen}</td>
                <td>${item.altura_maxima_metros}</td>
                <td>${item.tipo_hoja}</td>
                <td>${item.clima_ideal}</td>
                <td>${item.estado_conservacion}</td>
                <td>
                    <button class="btn-azul" onclick="cargarArbol(${item.id})">Editar</button>
                    <button class="btn-rojo" onclick="deleteTree(${item.id})">Eliminar</button>
                </td>
                </tr>`;
        });

        htmlTableTrees += '</table>';
        $('#resultado').html(htmlTableTrees);
    }).fail(function() {
        $('#resultado').html('<p style="color:red;">Error al cargar los datos de la API.</p>');
    });
}

function postTree() {
    var myTree = obtenerDatosFormulario();
    
    // Validación: Evitar guardar si seleccionó archivo pero Cloudinary no ha devuelto el link
    if($('#file_input').val() && !myTree.imagen_url) {
        alert("Por favor, espera a que la imagen termine de subirse (aparecerá la palomita verde) antes de guardar.");
        return;
    }

    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(myTree),
        success: function () {
            alert("¡Árbol guardado correctamente!");
            cancelarEdicion();
            getTrees(); 
        },
        error: function() {
            alert("Hubo un error al guardar el árbol.");
        }
    });
}

function deleteTree(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este árbol?")) {
        $.ajax({
            url: url + "/" + id,
            type: 'DELETE',
            success: function() {
                alert("Árbol eliminado correctamente");
                getTrees(); 
            },
            error: function() {
                alert("Error al eliminar el árbol");
            }
        });
    }
}

function cargarArbol(id) {
    $.getJSON(url + "/" + id, function(json) {
        var tree = json.tree; 

        $('#id_arbol').val(tree.id);
        $('#nombre_comun').val(tree.nombre_comun);
        $('#nombre_cientifico').val(tree.nombre_cientifico);
        $('#familia').val(tree.familia);
        $('#origen').val(tree.origen);
        $('#altura_maxima_metros').val(tree.altura_maxima_metros);
        $('#tipo_hoja').val(tree.tipo_hoja);
        $('#clima_ideal').val(tree.clima_ideal);
        $('#estado_conservacion').val(tree.estado_conservacion);
        
        // --- Manejo de la imagen en edición ---
        $('#file_input').val(''); // Limpiamos el selector de archivos
        $('#imagen_url').val(tree.imagen_url || ''); // Ponemos el link actual en el input oculto
        
        if(tree.imagen_url) {
            $('#upload-status').html(`Imagen actual guardada: <br><img src="${tree.imagen_url}" style="width:80px; margin-top:5px; border-radius:4px; border: 1px solid #ccc;">`);
        } else {
            $('#upload-status').html('Sin imagen guardada.');
        }

        $('#form-titulo').text("Editar Árbol ID: " + tree.id);
        $('#btn-guardar').hide();
        $('#btn-actualizar').show();
        $('#btn-cancelar').show();
        
        window.scrollTo(0, 0);
    });
}

function putTree() {
    var id = $('#id_arbol').val();
    var myTree = obtenerDatosFormulario();

    if($('#file_input').val() && !myTree.imagen_url) {
        alert("Espera a que la nueva imagen termine de subirse antes de actualizar.");
        return;
    }

    $.ajax({
        url: url + "/" + id,
        type: 'PUT',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(myTree),
        success: function () {
            alert("¡Árbol actualizado correctamente!");
            cancelarEdicion(); 
            getTrees(); 
        },
        error: function() {
            alert("Hubo un error al actualizar el árbol.");
        }
    });
}

function obtenerDatosFormulario() {
    return {
        nombre_comun: $('#nombre_comun').val(),
        nombre_cientifico: $('#nombre_cientifico').val(),
        familia: $('#familia').val(),
        origen: $('#origen').val(),
        // Usamos || 0 para evitar que Postgres colapse si el campo está vacío
        altura_maxima_metros: parseInt($('#altura_maxima_metros').val()) || 0,
        tipo_hoja: $('#tipo_hoja').val(),
        clima_ideal: $('#clima_ideal').val(),
        estado_conservacion: $('#estado_conservacion').val(),
        imagen_url: $('#imagen_url').val()
    };
}

function cancelarEdicion() {
    $('input[type="text"], input[type="number"], input[type="hidden"], input[type="file"]').val('');
    $('#id_arbol').val('');
    $('#form-titulo').text("Agregar Nuevo Árbol");
    $('#btn-guardar').show();
    $('#btn-actualizar').hide();
    $('#btn-cancelar').hide();
    $('#upload-status').html(''); 
}
// Configuración de Supabase - USA TUS CREDENCIALES
const SUPABASE_URL = 'https://hgafvptrqxjqhjqnoezo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnYWZ2cHRycXhqcWhqcW5vZXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjQ5NzQsImV4cCI6MjA3NjA0MDk3NH0.GjMxKNHJfg__fdRRm3QG30C5Sr89FeT1Aq-05ZRGHYQ';

// Inicializar Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
let estudianteActual = null;
let candidatos = [];

// Cuando la página carga
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de votación iniciado');
    
    // Mostrar sección de login
    mostrarSeccion('login-section');
    
    // Configurar eventos
    document.getElementById('login-form').addEventListener('submit', login);
    document.getElementById('voto-form').addEventListener('submit', enviarVoto);
    
    // Cargar candidatos
    cargarCandidatos();
});

// Función para mostrar secciones
function mostrarSeccion(idSeccion) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(seccion => {
        seccion.classList.remove('active');
    });
    
    // Mostrar la sección deseada
    const seccion = document.getElementById(idSeccion);
    seccion.classList.add('active');
}

// Función para mostrar mensajes
function mostrarMensaje(elementId, mensaje, tipo = '') {
    const elemento = document.getElementById(elementId);
    elemento.textContent = mensaje;
    elemento.className = `mensaje ${tipo}`;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        elemento.style.display = 'none';
    }, 5000);
}

// Función de login con DNI
async function login(event) {
    event.preventDefault();
    
    const dni = document.getElementById('dni').value.trim();
    const loginBtn = document.getElementById('login-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoading = document.getElementById('btn-loading');
    
    // Validar DNI
    if (!/^\d{8}$/.test(dni)) {
        mostrarMensaje('mensaje-login', '❌ Por favor, ingresa un DNI válido de 8 dígitos', 'error');
        return;
    }
    
    // Mostrar loading
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    loginBtn.disabled = true;
    
    try {
        console.log('Buscando estudiante con DNI:', dni);
        
        // Buscar estudiante en Supabase
        const { data: estudiante, error } = await supabase
            .from('estudiantes')
            .select('*')
            .eq('dni', dni)
            .single();
        
        if (error) {
            console.error('Error Supabase:', error);
            
            if (error.code === 'PGRST116') {
                mostrarMensaje('mensaje-login', '❌ DNI no encontrado. Verifica que seas estudiante matriculado 2025.', 'error');
            } else {
                throw error;
            }
            return;
        }
        
        console.log('Estudiante encontrado:', estudiante);
        
        // Verificar si ya votó
        if (estudiante.votado) {
            mostrarMensaje('mensaje-login', '❌ Ya has ejercido tu derecho al voto. Solo se permite un voto por estudiante.', 'error');
            return;
        }
        
        // Guardar información del estudiante
        estudianteActual = estudiante;
        
        // Mostrar información en la sección de votación
        document.getElementById('student-name').textContent = estudiante.nombre_completo;
        document.getElementById('student-grade').textContent = `${estudiante.grado}° "${estudiante.seccion}"`;
        
        // Ir a la sección de votación
        mostrarSeccion('votacion-section');
        mostrarMensaje('mensaje-voto', '', ''); // Limpiar mensajes anteriores
        
    } catch (error) {
        console.error('Error en login:', error);
        mostrarMensaje('mensaje-login', '❌ Error de conexión. Por favor, intenta nuevamente.', 'error');
    } finally {
        // Restaurar botón
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        loginBtn.disabled = false;
    }
}

// Cargar candidatos desde Supabase
async function cargarCandidatos() {
    try {
        console.log('Cargando candidatos...');
        
        const { data, error } = await supabase
            .from('candidatos')
            .select('*')
            .eq('activo', true)
            .order('id');
        
        if (error) {
            console.error('Error cargando candidatos:', error);
            throw error;
        }
        
        candidatos = data;
        console.log('Candidatos cargados:', candidatos);
        mostrarCandidatos();
        
    } catch (error) {
        console.error('Error cargando candidatos:', error);
        document.getElementById('candidatos-container').innerHTML = 
            '<div class="mensaje error">Error cargando candidatos. Recarga la página.</div>';
    }
}

// Mostrar candidatos en la interfaz
function mostrarCandidatos() {
    const container = document.getElementById('candidatos-container');
    
    if (candidatos.length === 0) {
        container.innerHTML = '<div class="loading">No hay candidatos disponibles</div>';
        return;
    }
    
    container.innerHTML = candidatos.map(candidato => `
        <label class="candidato-card">
            <img src="${candidato.foto_url || 'https://cdn-icons-png.flaticon.com/512/194/194938.png'}" 
                 alt="${candidato.nombre}" 
                 onerror="this.src='https://cdn-icons-png.flaticon.com/512/194/194938.png'">
            <input type="radio" name="candidato" value="${candidato.id}" required>
            <p><strong>${candidato.nombre}</strong><br>${candidato.propuesta || 'Representante estudiantil'}</p>
        </label>
    `).join('');
    
    // Agregar evento de selección visual
    document.querySelectorAll('.candidato-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.candidato-card').forEach(c => {
                c.classList.remove('selected');
            });
            this.classList.add('selected');
            this.querySelector('input').checked = true;
        });
    });
}

// Enviar voto
async function enviarVoto(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const candidatoId = formData.get('candidato');
    const votoBtn = document.getElementById('voto-btn');
    const btnText = document.getElementById('voto-btn-text');
    const btnLoading = document.getElementById('voto-btn-loading');
    
    if (!candidatoId) {
        mostrarMensaje('mensaje-voto', '❌ Por favor, selecciona un candidato', 'error');
        return;
    }
    
    if (!estudianteActual) {
        mostrarMensaje('mensaje-voto', '❌ Error: sesión inválida', 'error');
        return;
    }
    
    // Mostrar loading
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    votoBtn.disabled = true;
    
    try {
        console.log('Registrando voto para:', estudianteActual.dni, 'candidato:', candidatoId);
        
        // Registrar voto en Supabase
        const { data: votoData, error: votoError } = await supabase
            .from('votos')
            .insert([
                {
                    estudiante_dni: estudianteActual.dni,
                    candidato_id: parseInt(candidatoId)
                }
            ]);
        
        if (votoError) {
            console.error('Error registrando voto:', votoError);
            throw votoError;
        }
        
        // Marcar estudiante como que ya votó
        const { error: updateError } = await supabase
            .from('estudiantes')
            .update({ votado: true })
            .eq('dni', estudianteActual.dni);
        
        if (updateError) {
            console.error('Error actualizando estudiante:', updateError);
            throw updateError;
        }
        
        console.log('Voto registrado exitosamente');
        
        // Mostrar confirmación
        mostrarSeccion('confirmacion-section');
        
    } catch (error) {
        console.error('Error registrando voto:', error);
        mostrarMensaje('mensaje-voto', '❌ Error al registrar el voto. Intenta nuevamente.', 'error');
    } finally {
        // Restaurar botón
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        votoBtn.disabled = false;
    }
}

// Volver al login
function volverALogin() {
    estudianteActual = null;
    document.getElementById('dni').value = '';
    document.getElementById('login-form').reset();
    document.getElementById('voto-form').reset();
    document.querySelectorAll('.candidato-card').forEach(card => {
        card.classList.remove('selected');
    });
    mostrarSeccion('login-section');
}

// Función global para debugging
window.debugSupabase = function() {
    console.log('=== DEBUG SUPABASE ===');
    console.log('URL:', SUPABASE_URL);
    console.log('Estudiante actual:', estudianteActual);
    console.log('Candidatos:', candidatos);
    
    // Probar conexión
    supabase.from('estudiantes').select('count').then(result => {
        console.log('Conexión test:', result);
    });
};

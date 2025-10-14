// Duración en ms que debe coincidir con CSS transition (0.6s = 600ms)
const TRANSITION_MS = 600;

function login(event) {
  event.preventDefault();

  const apellido = document.getElementById("apellido").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();

  if (!nombre || !apellido || !correo) {
    alert("Por favor ingrese sus datos completos y válidos.");
    return;
  }

  if (!correo.includes("@") || !correo.includes(".")) {
    alert("Por favor ingresa un correo válido.");
    return;
  }

  const estudiante = { nombre, apellido, correo };
  localStorage.setItem("estudianteActual", JSON.stringify(estudiante));

  const loginSection = document.getElementById("login-section");
  const votacionSection = document.getElementById("votacion-section");

  // 1) Iniciar la animación de salida del login
  // asegurarnos de que la sección tiene la clase 'transition'
  loginSection.classList.remove('fade-in');
  // Forzar recálculo para asegurar que el navegador registre la clase removida
  void loginSection.offsetWidth;
  loginSection.classList.add('fade-out');

  // 2) Después de la transición, ocultar completamente y preparar la votación
  const onLoginTransitionEnd = (e) => {
    // solo reaccionar a la transición de opacity (evita dobles llamadas)
    if (e && e.propertyName && e.propertyName !== 'opacity') return;

    // quitar listener para evitar múltiples ejecuciones
    loginSection.removeEventListener('transitionend', onLoginTransitionEnd);

    // ocultar login y limpiar clases
    loginSection.classList.add('hidden');
    loginSection.classList.remove('fade-out');

    // mostrar votacion (remover hidden) y preparar animación de entrada
    votacionSection.classList.remove('hidden');

    // Asegurar que el estado inicial de la votación sea invisible (fade-init)
    votacionSection.classList.remove('fade-in');
    votacionSection.classList.add('fade-init');

    // Forzar reflow para que la próxima adición de clase dispare la transición
    void votacionSection.offsetWidth;

    // añadir la clase visible para disparar la transición
    votacionSection.classList.remove('fade-init');
    votacionSection.classList.add('fade-in');
  };

  // Si el navegador soporta transitionend, usarlo para sincronizar; sino fallback con setTimeout
  loginSection.addEventListener('transitionend', onLoginTransitionEnd);

  // Fallback: si transitionend no se dispara por alguna razón, forzamos con timeout
  setTimeout(() => {
    // Si login ya está hidden, ya pasó; de lo contrario llamamos manualmente handler
    if (!loginSection.classList.contains('hidden')) {
      onLoginTransitionEnd({ propertyName: 'opacity' });
    }
  }, TRANSITION_MS + 50);

  // Limpiar formulario de login
  document.getElementById("login-form").reset();
}

function enviarVoto(event) {
  event.preventDefault();

  const candidato = document.querySelector('input[name="candidato"]:checked');
  const mensaje = document.getElementById("mensaje-voto");

  if (!candidato) {
    alert("Por favor selecciona un candidato.");
    return;
  }

  const estudiante = JSON.parse(localStorage.getItem("estudianteActual"));

  if (!estudiante) {
    alert("Error: no se encontró la sesión del estudiante.");
    return;
  }

  // Verificar si ya votó
  if (localStorage.getItem(`voto_${estudiante.correo}`)) {
    mensaje.textContent = "Ya has emitido tu voto anteriormente.";
    mensaje.style.color = "red";
    return;
  }

  // Guardar voto (temporal)
  localStorage.setItem(`voto_${estudiante.correo}`, candidato.value);

  // Mostrar mensaje de éxito
  mensaje.textContent = `✅ Gracias, ${estudiante.nombre}. Tu voto por "${candidato.value}" ha sido registrado.`;
  mensaje.style.color = "lightgreen";

  // Bloquear formulario
  document.getElementById("voto-form").reset();
  document.querySelectorAll('#voto-form input, #voto-form button').forEach(el => el.disabled = true);
}
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. OBTENER ELEMENTOS DEL DOM ---
    
    // Inputs de Distancia
    const presetSelect = document.getElementById('preset');
    const distanceInput = document.getElementById('distance');

    // Inputs de Tiempo
    const timeHH = document.getElementById('time_hh');
    const timeMM = document.getElementById('time_mm');
    const timeSS = document.getElementById('time_ss');

    // Inputs de Ritmo
    const paceMM = document.getElementById('pace_mm');
    const paceSS = document.getElementById('pace_ss');

    // Botones
    const calculateBtn = document.getElementById('calculate-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    // (NUEVO) Contenedor de parciales
    const splitsResults = document.getElementById('splits-results');
    
    // Lista de todos los inputs para limpiar
    const allInputs = [distanceInput, timeHH, timeMM, timeSS, paceMM, paceSS];

    // --- 2. DEFINIR EVENTOS ---

    presetSelect.addEventListener('change', () => {
        if (presetSelect.value !== 'custom') {
            distanceInput.value = presetSelect.value;
        }
    });

    clearBtn.addEventListener('click', () => {
        allInputs.forEach(input => input.value = '');
        presetSelect.value = 'custom';
        splitsResults.innerHTML = ''; // (NUEVO) Limpiar también los parciales
    });

    calculateBtn.addEventListener('click', () => {
        
        // (NUEVO) Limpiar parciales antiguos antes de cada cálculo
        splitsResults.innerHTML = '';
        
        // --- 3. RECOGER Y CONVERTIR VALORES ---
        
        let distance = parseFloat(distanceInput.value) || 0;
        let timeTotalSeconds = (parseFloat(timeHH.value) || 0) * 3600 +
                               (parseFloat(timeMM.value) || 0) * 60 +
                               (parseFloat(timeSS.value) || 0);
        let paceTotalSeconds = (parseFloat(paceMM.value) || 0) * 60 +
                               (parseFloat(paceSS.value) || 0);

        // --- 4. LÓGICA DE CÁLCULO ---
        
        // Caso 1: Calcular Ritmo (Tenemos Distancia y Tiempo)
        if (distance > 0 && timeTotalSeconds > 0 && paceTotalSeconds === 0) {
            const pacePerKm = timeTotalSeconds / distance;
            
            const paceMin = Math.floor(pacePerKm / 60);
            const paceSec = Math.round(pacePerKm % 60);

            paceMM.value = paceMin;
            paceSS.value = paceSec;
            
            // (NUEVO) Asignar el valor calculado para los parciales
            paceTotalSeconds = pacePerKm;
        } 
        
        // Caso 2: Calcular Tiempo (Tenemos Distancia y Ritmo)
        else if (distance > 0 && paceTotalSeconds > 0 && timeTotalSeconds === 0) {
            const timeNeeded = paceTotalSeconds * distance;
            
            const hours = Math.floor(timeNeeded / 3600);
            const minutes = Math.floor((timeNeeded % 3600) / 60);
            const seconds = Math.round(timeNeeded % 60);

            timeHH.value = hours;
            timeMM.value = minutes;
            timeSS.value = seconds;

            // (NUEVO) Asignar el valor calculado para los parciales
            timeTotalSeconds = timeNeeded;
        } 
        
        // Caso 3: Calcular Distancia (Tenemos Tiempo y Ritmo)
        else if (timeTotalSeconds > 0 && paceTotalSeconds > 0 && distance === 0) {
            const distanceCovered = timeTotalSeconds / paceTotalSeconds;
            
            distanceInput.value = distanceCovered.toFixed(3);

             // (NUEVO) Asignar el valor calculado para los parciales
            distance = distanceCovered;
        } 
        
        // Caso 4: No hay suficientes datos
        else {
            // Solo alertar si no se rellenaron al menos 2 campos. Si se rellenaron 3, no alertamos.
            if (!((distance > 0 && timeTotalSeconds > 0) || (distance > 0 && paceTotalSeconds > 0) || (timeTotalSeconds > 0 && paceTotalSeconds > 0))) {
                 alert('Por favor, completa exactamente DOS de las tres secciones (Distancia, Tiempo o Ritmo) para calcular la tercera.');
                 return; // Salir de la función si no hay datos
            }
        }

        // --- 5. (NUEVO) CÁLCULO DE PARCIALES ---
        // Se ejecuta si tenemos valores finales de distancia y ritmo
        if (distance > 0 && paceTotalSeconds > 0) {
            calculateAndDisplaySplits(distance, paceTotalSeconds);
        }
    });

    // --- 6. (NUEVAS) FUNCIONES AUXILIARES ---

    /**
     * Formatea un tiempo total en segundos a un string (HH:MM:SS o MM:SS)
     * @param {number} totalSeconds - El tiempo total en segundos
     * @returns {string} - El tiempo formateado
     */
    function formatTime(totalSeconds) {
        const roundedSeconds = Math.round(totalSeconds);
        const sec = roundedSeconds % 60;
        const min = Math.floor(roundedSeconds / 60) % 60;
        const hr = Math.floor(roundedSeconds / 3600);
        
        const pad = (num) => String(num).padStart(2, '0');

        if (hr > 0) {
            return `${hr}:${pad(min)}:${pad(sec)}`;
        } else {
            return `${pad(min)}:${pad(sec)}`;
        }
    }

    /**
     * Crea un elemento de lista (LI) para un parcial
     * @param {string} label - Ej: "1 km" o "400 m"
     * @param {number} timeInSeconds - El tiempo acumulado para ese parcial
     * @returns {HTMLElement} - El elemento <li> formateado
     */
    function createSplitItem(label, timeInSeconds) {
        const li = document.createElement('li');
        const timeString = formatTime(timeInSeconds);
        li.innerHTML = `<strong>${label}:</strong> <span>${timeString}</span>`;
        return li;
    }

    /**
     * Calcula y muestra la lista de parciales en el DOM
     * @param {number} distance - Distancia final en km
     * @param {number} pacePerKm - Ritmo final en segundos/km
     */
    function calculateAndDisplaySplits(distance, pacePerKm) {
        // Redondear la distancia a 3 decimales para comparaciones seguras
        const d = parseFloat(distance.toFixed(3));

        const kmDistances = [42.195, 21.097, 10.0, 5.0];
        const mDistances = [3.0, 1.5, 0.8, 0.4];

        // Comprobar si es una de las distancias que requiere parciales
        const isKmSplit = kmDistances.includes(d);
        const isMSplit = mDistances.includes(d);

        if (!isKmSplit && !isMSplit) {
            return; // No es una distancia para la que mostramos parciales
        }

        // Añadir título y lista al contenedor
        splitsResults.innerHTML = '<h3>Tiempos Parciales</h3>';
        const splitsList = document.createElement('ul');

        if (isKmSplit) {
            // Lógica para parciales por KM
            let totalTimeInSeconds = 0;
            for (let km = 1; km <= Math.floor(distance); km++) {
                totalTimeInSeconds = pacePerKm * km;
                splitsList.appendChild(createSplitItem(`${km} km`, totalTimeInSeconds));
            }
            
            // Añadir el parcial final para Maratón y Media Maratón (que no son exactos)
            if (d === 42.195 || d === 21.097) {
                totalTimeInSeconds = pacePerKm * d;
                splitsList.appendChild(createSplitItem(`${d} km (Meta)`, totalTimeInSeconds));
            }
        } 
        
        else if (isMSplit) {
            // Lógica para parciales por 400m
            const pacePer400m = pacePerKm * 0.4; // Ritmo cada 400m
            const totalLaps = d / 0.4; // Total de "vueltas" de 400m
            let totalTimeInSeconds = 0;
            
            for (let lap = 1; lap <= totalLaps; lap++) {
                totalTimeInSeconds = pacePer400m * lap;
                let distanceMark = lap * 400;
                splitsList.appendChild(createSplitItem(`${distanceMark} m`, totalTimeInSeconds));
            }
        }

        // Añadir la lista al DOM
        splitsResults.appendChild(splitsList);
    }

});
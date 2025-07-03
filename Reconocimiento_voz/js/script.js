 // Variables globales
        let audioContext;
        let analyser;
        let microphone;
        let isRecording = false;
        let frequencyData = [];
        let amplitudeData = [];
        let puntosHombre = 0;
        let puntosMujer = 0;
        let currentCategory = "general";
        let recognition;
        let currentAnswer = "";
        let lastQuestionIndex = -1;
        let currentCategoryQuestions = [];
        let recordingTimer;
        
        // Preguntas y respuestas por categoría
        const preguntas = {
            general: [
                { pregunta: "¿En qué año llegó el hombre a la Luna por primera vez?", respuesta: "1969" },
                { pregunta: "¿Cuál es el río más largo del mundo?", respuesta: "amazonas" },
                { pregunta: "¿Cuál es el país más grande del mundo?", respuesta: "rusia" },
                { pregunta: "¿Qué planeta es conocido como el planeta rojo?", respuesta: "marte" },
                { pregunta: "¿En qué ciudad se encuentra la Torre Eiffel?", respuesta: "paris" }
            ],
            videojuegos: [
                { pregunta: "¿Quién es el protagonista de la saga The Legend of Zelda?", respuesta: "link" },
                { pregunta: "¿Qué juego popular tiene personajes como 'Creeper' y 'Enderman'?", respuesta: "minecraft" },
                { pregunta: "¿En qué año fue lanzado Super Mario Bros?", respuesta: "1985" },
                { pregunta: "¿Qué compañía desarrolló la serie de juegos 'The Sims'?", respuesta: "ea" },
                { pregunta: "¿Cómo se llama el héroe de la serie de juegos 'Halo'?", respuesta: "master chief" }
            ],
            series: [
                { pregunta: "¿En qué serie aparecen dragones y tronos de hierro?", respuesta: "juego de tronos" },
                { pregunta: "¿Cómo se llama el científico loco en 'Stranger Things'?", respuesta: "once" },
                { pregunta: "¿Qué serie sigue las vidas de médicos en el hospital Seattle Grace?", respuesta: "anatomia de grey" },
                { pregunta: "¿Cuál es el apellido de la familia en 'Los Simpson'?", respuesta: "simpson" },
                { pregunta: "¿En qué serie un profesor de química se convierte en fabricante de metanfetamina?", respuesta: "breaking bad" }
            ],
            anime: [
                { pregunta: "¿Quién quiere convertirse en el Hokage de su aldea?", respuesta: "naruto" },
                { pregunta: "¿Qué anime sigue las aventuras de piratas buscando el One Piece?", respuesta: "one piece" },
                { pregunta: "¿Cómo se llama el protagonista de 'Death Note'?", respuesta: "light" },
                { pregunta: "¿En qué anime los humanos luchan contra titanes?", respuesta: "ataque a los titanes" },
                { pregunta: "¿Cuál es el nombre del gato robot en 'Doraemon'?", respuesta: "doraemon" }
            ],
            celebrities: [
                { pregunta: "¿Qué actriz interpretó a Wonder Woman en la película de 2017?", respuesta: "gal gadot" },
                { pregunta: "¿Quién es conocido como el 'Rey del Pop'?", respuesta: "michael jackson" },
                { pregunta: "¿Qué cantante es famoso por sus canciones 'Shape of You' y 'Bad Habits'?", respuesta: "ed sheeran" },
                { pregunta: "¿Qué actor interpretó a Iron Man en el Universo Cinematográfico de Marvel?", respuesta: "robert downey jr" },
                { pregunta: "¿Qué cantante colombiana es conocida por canciones como 'Hips Don't Lie'?", respuesta: "shakira" }
            ]
        };
        
        // Elementos del DOM
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const status = document.getElementById('status');
        const result = document.getElementById('result');
        const details = document.getElementById('details');
        const puntosHombreEl = document.getElementById('puntosHombre');
        const puntosMujerEl = document.getElementById('puntosMujer');
        const questionEl = document.getElementById('question');
        const answerEl = document.getElementById('answer');
        const categoryTagEl = document.getElementById('categoryTag');
        const categoryBtns = document.querySelectorAll('.category-btn');
        const visualizerEl = document.querySelector('.visualizer');
        const pulseEl = document.getElementById('pulse');
        const winnerBanner = document.getElementById('winnerBanner');
        const winnerTeamEl = document.getElementById('winnerTeam');
        const winnerPointsEl = document.getElementById('winnerPoints');
        const restartBtn = document.getElementById('restartBtn');
        
        // Inicializar reconocimiento de voz
        function initSpeechRecognition() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'es-ES';
                
                recognition.onresult = function(event) {
                    const transcript = event.results[0][0].transcript.trim();
                    const normalizedTranscript = normalizeText(transcript);
                    answerEl.textContent = `Dijiste: "${transcript}"`;
                    
                    if (normalizedTranscript.includes(normalizeText(currentAnswer))) {
                        status.textContent = '¡Respuesta correcta! Detectando género...';
                        stopRecording();
                    } else {
                        status.textContent = 'Respuesta incorrecta. Intenta de nuevo.';
                        // Reiniciar reconocimiento después de un breve retraso
                        setTimeout(() => {
                            if (isRecording) {
                                recognition.start();
                                status.textContent = 'Grabando... di la respuesta';
                                answerEl.textContent = "";
                            }
                        }, 2000);
                    }
                };
                
                recognition.onerror = function(event) {
                    console.error('Error en reconocimiento de voz:', event.error);
                    status.textContent = `Error: ${event.error}`;
                };
                
                recognition.onend = function() {
                    if (isRecording) {
                        recognition.start();
                    }
                };
            } else {
                console.warn('El reconocimiento de voz no es compatible con este navegador.');
                status.textContent = 'Reconocimiento de voz no disponible. Usa los botones para detener.';
            }
        }
        
        // Normalizar texto para comparación
        function normalizeText(text) {
            return text
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();
        }
        
        // Crear visualizador de audio
        function createVisualizer() {
            visualizerEl.innerHTML = '';
            const barCount = 64;
            const width = visualizerEl.clientWidth / barCount;
            
            for (let i = 0; i < barCount; i++) {
                const bar = document.createElement('div');
                bar.className = 'bar';
                bar.style.left = `${i * width}px`;
                bar.style.width = `${width - 2}px`;
                bar.style.height = '10px';
                visualizerEl.appendChild(bar);
            }
        }
        
        // Actualizar visualizador
        function updateVisualizer(dataArray) {
            if (!isRecording) return;
            
            const bars = document.querySelectorAll('.bar');
            const barCount = bars.length;
            const step = Math.floor(dataArray.length / barCount);
            
            for (let i = 0; i < barCount; i++) {
                let sum = 0;
                for (let j = 0; j < step; j++) {
                    sum += dataArray[i * step + j] || 0;
                }
                const height = (sum / step) * 0.7;
                
                bars[i].style.height = `${height}px`;
                
                // Optimización de colores
                if (height > 70) {
                    bars[i].style.background = '#ff4b2b';
                } else if (height > 40) {
                    bars[i].style.background = '#ff9966';
                } else {
                    bars[i].style.background = '#00c6ff';
                }
            }
        }
        
        // Seleccionar categoría
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = btn.dataset.category;
                categoryTagEl.textContent = btn.textContent;
                selectRandomQuestion();
            });
        });
        
        // Seleccionar pregunta aleatoria
        function selectRandomQuestion() {
            // Reiniciar lista de preguntas si es una nueva categoría o se acabaron
            if (currentCategoryQuestions.length === 0) {
                currentCategoryQuestions = [...preguntas[currentCategory]];
            }
            
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * currentCategoryQuestions.length);
            } while (currentCategoryQuestions.length > 1 && randomIndex === lastQuestionIndex);
            
            lastQuestionIndex = randomIndex;
            const questionObj = currentCategoryQuestions[randomIndex];
            
            questionEl.textContent = questionObj.pregunta;
            currentAnswer = questionObj.respuesta;
            answerEl.textContent = "";
            
            // Eliminar pregunta usada para evitar repeticiones
            currentCategoryQuestions.splice(randomIndex, 1);
        }
        
        // Event listeners
        startBtn.addEventListener('click', startRecording);
        stopBtn.addEventListener('click', stopRecording);
        restartBtn.addEventListener('click', restartGame);
        
        // Iniciar grabación
        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
                // Crear contexto de audio
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                
                analyser.fftSize = 2048;
                microphone.connect(analyser);
                
                isRecording = true;
                startBtn.disabled = true;
                stopBtn.disabled = false;
                status.textContent = 'Grabando... di la respuesta';
                result.textContent = '';
                details.textContent = '';
                pulseEl.style.display = 'block';
                
                frequencyData = [];
                amplitudeData = [];
                
                // Iniciar reconocimiento de voz
                if (recognition) {
                    recognition.start();
                }
                
                // Crear visualizador si no existe
                if (visualizerEl.children.length === 0) {
                    createVisualizer();
                }
                
                // Iniciar análisis de audio
                analyzeAudio();
                
                // Configurar temporizador para límite de tiempo (15 segundos)
                recordingTimer = setTimeout(() => {
                    status.textContent = 'Tiempo agotado. Intenta de nuevo.';
                    stopRecording();
                }, 15000);
                
            } catch (err) {
                status.textContent = 'Error: No se pudo acceder al micrófono';
                startBtn.disabled = false;
                stopBtn.disabled = true;
                pulseEl.style.display = 'none';
                details.innerHTML = 'Asegúrate de otorgar permisos de micrófono. ' + 
                    '<a href="#" onclick="location.reload()" style="color: #4facfe;">Recargar página</a>';
                console.error('Error de micrófono:', err);
            }
        }
        
        // Detener grabación
        function stopRecording() {
            clearTimeout(recordingTimer);
            
            isRecording = false;
            startBtn.disabled = false;
            stopBtn.disabled = true;
            status.innerHTML = 'Analizando<span class="loading-dots"></span>';
            pulseEl.style.display = 'none';
            
            if (recognition) {
                recognition.stop();
            }
            
            if (microphone) {
                microphone.disconnect();
            }
            if (audioContext) {
                audioContext.close();
            }
            
            // Dar tiempo para cerrar recursos antes de analizar
            setTimeout(() => {
                analyzeGender();
            }, 500);
        }
        
        // Analizar audio
        function analyzeAudio() {
            if (!isRecording) return;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);
            
            // Actualizar visualizador
            updateVisualizer(dataArray);
            
            // Calcular frecuencia fundamental y amplitud
            let maxValue = 0;
            let maxIndex = 0;
            const sampleRate = audioContext.sampleRate;
            
            // Buscar en todo el rango vocal (80-400 Hz)
            const minIndex = Math.floor(80 * bufferLength / (sampleRate / 2));
            const maxIndexRange = Math.floor(400 * bufferLength / (sampleRate / 2));
            
            for (let i = minIndex; i < maxIndexRange; i++) {
                if (dataArray[i] > maxValue) {
                    maxValue = dataArray[i];
                    maxIndex = i;
                }
            }
            
            if (maxValue > 50) {
                const frequency = maxIndex * sampleRate / (2 * bufferLength);
                frequencyData.push(frequency);
                amplitudeData.push(maxValue);
            }
            
            requestAnimationFrame(analyzeAudio);
        }
        
        // Analizar género
        function analyzeGender() {
            if (frequencyData.length < 5) {
                status.textContent = 'No se detectó suficiente voz. Intenta hablar más fuerte.';
                return;
            }
            
            // Filtrar valores extremos usando percentiles
            const sortedFreqs = frequencyData.sort((a, b) => a - b);
            const q1 = sortedFreqs[Math.floor(sortedFreqs.length * 0.25)];
            const q3 = sortedFreqs[Math.floor(sortedFreqs.length * 0.75)];
            const iqr = q3 - q1;
            
            const filteredFreqs = sortedFreqs.filter(
                f => f >= (q1 - 1.5 * iqr) && f <= (q3 + 1.5 * iqr)
            );
            
            if (filteredFreqs.length === 0) {
                status.textContent = 'No se pudo analizar la voz. Intenta de nuevo.';
                return;
            }
            
            const avgFreq = filteredFreqs.reduce((a, b) => a + b, 0) / filteredFreqs.length;
            
            // Detección mejorada de género
            let gender, confidence;
            
            // Mujeres: frecuencia alta
            if (avgFreq > 190) {
                gender = 'Mujer';
                confidence = Math.min(95, 60 + (avgFreq - 190));
            } 
            // Hombres: frecuencia baja
            else if (avgFreq < 130) {
                gender = 'Hombre';
                confidence = Math.min(95, 60 + (130 - avgFreq));
            }
            // Voces ambiguas o con mucho ruido
            else {
                // Usar amplitud promedio para decidir
                const avgAmplitude = amplitudeData.reduce((a, b) => a + b, 0) / amplitudeData.length;
                gender = avgAmplitude > 150 ? 'Mujer' : 'Hombre';
                confidence = 70;
            }
            
            confidence = Math.max(50, Math.min(95, confidence));
            const team = gender === 'Hombre' ? 'Hombres' : 'Mujeres';
            
            // Actualizar UI
            status.textContent = 'Análisis completado';
            result.innerHTML = `Punto para: <span style="color: ${gender === 'Hombre' ? '#4facfe' : '#ff4b2b'}">${team}</span>`;
            details.innerHTML = `
                Frecuencia promedio: ${avgFreq.toFixed(1)} Hz<br>
                Confianza: ${confidence.toFixed(1)}%<br>
                Muestras: ${filteredFreqs.length}
            `;
            
            // Sumar punto
            if (gender === 'Hombre') {
                puntosHombre++;
                puntosHombreEl.textContent = puntosHombre;
                createPointAnimation(document.querySelector('.team-men'), '+1');
            } else {
                puntosMujer++;
                puntosMujerEl.textContent = puntosMujer;
                createPointAnimation(document.querySelector('.team-women'), '+1');
            }
            
            // Verificar si hay ganador
            if (puntosHombre >= 5 || puntosMujer >= 5) {
                showWinner();
            } else {
                // Seleccionar nueva pregunta después de 3 segundos
                setTimeout(() => {
                    selectRandomQuestion();
                    status.textContent = 'Presiona "Iniciar Grabación" para la siguiente pregunta';
                    answerEl.textContent = "";
                }, 3000);
            }
        }
        
        // Crear animación de punto
        function createPointAnimation(element, text) {
            const rect = element.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            const pointEl = document.createElement('div');
            pointEl.className = 'point-animation';
            pointEl.textContent = text;
            pointEl.style.color = element.classList.contains('team-men') ? '#4facfe' : '#ff4b2b';
            pointEl.style.position = 'fixed';
            pointEl.style.left = `${x}px`;
            pointEl.style.top = `${y}px`;
            pointEl.style.transform = 'translate(-50%, -50%)';
            
            document.body.appendChild(pointEl);
            
            // Eliminar después de la animación
            setTimeout(() => {
                pointEl.remove();
            }, 1000);
        }
        
        // Mostrar ganador
        function showWinner() {
            const winner = puntosHombre > puntosMujer ? 'Hombres' : 'Mujeres';
            const points = Math.max(puntosHombre, puntosMujer);
            
            winnerTeamEl.textContent = winner;
            winnerTeamEl.style.color = winner === 'Hombres' ? '#4facfe' : '#ff4b2b';
            winnerPointsEl.textContent = points;
            
            setTimeout(() => {
                winnerBanner.classList.add('show');
            }, 1000);
        }
        
        // Reiniciar juego
        function restartGame() {
            puntosHombre = 0;
            puntosMujer = 0;
            puntosHombreEl.textContent = '0';
            puntosMujerEl.textContent = '0';
            winnerBanner.classList.remove('show');
            currentCategoryQuestions = []; // Reiniciar preguntas
            selectRandomQuestion();
            status.textContent = 'Presiona "Iniciar Grabación" para comenzar';
            result.textContent = '';
            details.textContent = '';
            answerEl.textContent = "";
        }
        
        // Inicializar
        window.addEventListener('load', () => {
            createVisualizer();
            selectRandomQuestion();
            initSpeechRecognition();
        });
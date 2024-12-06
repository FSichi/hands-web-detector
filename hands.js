window.onload = async function () {
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    const canvasCtx = canvasElement.getContext('2d');

    // Asegurarnos de que la librería se haya cargado antes de instanciar
    if (typeof Hands === 'undefined') {
        console.error('MediaPipe Hands no está disponible.');
        return;
    }

    // Crear la instancia de Hands de MediaPipe
    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    // Configuración de MediaPipe Hands
    hands.setOptions({
        maxNumHands: 2, // Detectar hasta 2 manos
        modelComplexity: 1, // Complejidad del modelo (0 o 1)
        minDetectionConfidence: 0.5, // Confianza mínima para la detección de manos
        minTrackingConfidence: 0.5 // Confianza mínima para el seguimiento de las manos
    });

    // Manejar los resultados de la detección
    hands.onResults(onResults);

    // Configurar la cámara
    async function setupCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }, // Tamaño de la cámara
        });
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            detect();
        };
    }

    // Función para detectar las manos en cada cuadro de video
    async function detect() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(detect);
    }

    // Función para dibujar los resultados en el canvas
    function onResults(results) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    
        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                drawHandLandmarks(landmarks); // Dibujar puntos
                drawHandConnections(landmarks); // Dibujar conexiones
            }
        }
    
        canvasCtx.restore(); // Finalizar el dibujo
    }

    // Función para dibujar los puntos clave de la mano
    function drawHandLandmarks(landmarks) {
        for (const landmark of landmarks) {
            const { x, y } = landmark;
            canvasCtx.beginPath();
            canvasCtx.arc(x * canvasElement.width, y * canvasElement.height, 5, 0, 2 * Math.PI);
            canvasCtx.fillStyle = 'red';
            canvasCtx.fill();
        }
    }

    // Función para dibujar las conexiones entre los puntos de la mano
    function drawHandConnections(landmarks) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15],
            [15, 16], [13, 17], [17, 18], [18, 19], [19, 20]
        ];

        for (const [startIdx, endIdx] of connections) {
            const start = landmarks[startIdx];
            const end = landmarks[endIdx];
            canvasCtx.beginPath();
            canvasCtx.moveTo(start.x * canvasElement.width, start.y * canvasElement.height);
            canvasCtx.lineTo(end.x * canvasElement.width, end.y * canvasElement.height);
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'green';
            canvasCtx.stroke();
        }
    }

    // Iniciar la cámara
    setupCamera();
}
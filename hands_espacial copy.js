window.onload = async function () {
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    const canvasCtx = canvasElement.getContext('2d');

    if (typeof Hands === 'undefined') {
        console.error('MediaPipe Hands no está disponible.');
        return;
    }

    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    hands.onResults((results) => {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
        if (results.multiHandLandmarks) {
            results.multiHandLandmarks.forEach((handLandmarks) => {
                drawHandLandmarks(handLandmarks);
                drawHandConnections(handLandmarks);
    
                // Detectar gestos
                const gesture = detectGestures(handLandmarks);
                // const handPosition = detectHandPosition(handLandmarks);  // Detectar posición de la mano

                // Mostrar los gestos detectados
                if (gesture) {
                    console.log(`Gesto detectado: ${gesture}`);
                    showToast(gesture);
                }

                // // Mostrar la posición de la mano
                // if (handPosition) {
                //     console.log(`Posición de la mano: ${handPosition}`);
                //     showToast(`Posición: ${handPosition}`);  // Mostrar posición en un toast
                // }
            });
        }
    });

    async function setupCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }
        });
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            detect();
        };
    }

    async function detect() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(detect);
    }

    function drawHandLandmarks(landmarks) {
        for (const landmark of landmarks) {
            const { x, y } = landmark;
            canvasCtx.beginPath();
            canvasCtx.arc(x * canvasElement.width, y * canvasElement.height, 5, 0, 2 * Math.PI);
            canvasCtx.fillStyle = 'red';
            canvasCtx.fill();
        }
    }

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

    function detectGestures(landmarks) {
        if (isPeaceSign(landmarks)) {
            return "PAZ";
        } else if (isFist(landmarks)) {
            return "PUÑO";
        } else if (isOpenHand(landmarks)) {
            return "MANO ABIERTA";
        } else if (isThumbsUp(landmarks)) {
            return "PULGAR ARRIBA";
        } else if (isOKSign(landmarks)) {
            return "OK";
        } else if (isPinch(landmarks)) {
            return "PINZAMIENTO";
        }

        return null;
    }

    function detectHandPosition(landmarks) {
        const palmCenter = landmarks[9]; // Usamos el centro de la palma (índice 9 como ejemplo)
        const x = palmCenter.x;
        const y = palmCenter.y;

        // Definimos posiciones posibles basadas en las coordenadas (ajustar según lo necesitado)
        if (y < 0.3) {
            return x < 0.5 ? "Arriba Izquierda" : "Arriba Derecha";
        } else if (y > 0.7) {
            return x < 0.5 ? "Abajo Izquierda" : "Abajo Derecha";
        }
        return x < 0.5 ? "Centro Izquierda" : "Centro Derecha";
    }

    function isPeaceSign(landmarks) {
        const indexFinger = landmarks[8];
        const middleFinger = landmarks[12];

        const isIndexExtended = indexFinger.y < landmarks[6].y;
        const isMiddleExtended = middleFinger.y < landmarks[10].y;

        const isFingersBent = (
            landmarks[4].y > landmarks[3].y && 
            landmarks[16].y > landmarks[15].y && 
            landmarks[20].y > landmarks[19].y
        );

        return isIndexExtended && isMiddleExtended && isFingersBent;
    }

    function isFist(landmarks) {
        const isAllFingersBent = (
            landmarks[4].y > landmarks[3].y && 
            landmarks[8].y > landmarks[6].y && 
            landmarks[12].y > landmarks[10].y && 
            landmarks[16].y > landmarks[14].y && 
            landmarks[20].y > landmarks[18].y
        );

        const isClosedFist = (
            landmarks[8].x < landmarks[7].x && landmarks[8].y > landmarks[7].y && 
            landmarks[12].x < landmarks[11].x && landmarks[12].y > landmarks[11].y && 
            landmarks[16].x < landmarks[15].x && landmarks[16].y > landmarks[15].y && 
            landmarks[20].x < landmarks[19].x && landmarks[20].y > landmarks[19].y
        );

        return isAllFingersBent && isClosedFist;
    }

    function isOpenHand(landmarks) {
        const isOpen = (
            landmarks[4].y < landmarks[3].y && 
            landmarks[8].y < landmarks[6].y && 
            landmarks[12].y < landmarks[10].y && 
            landmarks[16].y < landmarks[14].y && 
            landmarks[20].y < landmarks[18].y
        );
        return isOpen;
    }

    function isPinch(landmarks) {
        return landmarks[8].y > landmarks[6].y && landmarks[12].y > landmarks[10].y; // Dedo índice y medio doblados
    }

    function isThumbsUp(landmarks) {
        const thumbExtended = landmarks[4].y < landmarks[3].y;
        const areOtherFingersBent = (
            landmarks[8].y > landmarks[6].y && 
            landmarks[12].y > landmarks[10].y && 
            landmarks[16].y > landmarks[14].y && 
            landmarks[20].y > landmarks[18].y
        );
        return thumbExtended && areOtherFingersBent;
    }

    function isOKSign(landmarks) {
        const thumbAndIndexClose = Math.abs(landmarks[4].x - landmarks[8].x) < 0.05 && Math.abs(landmarks[4].y - landmarks[8].y) < 0.05;
        const areOtherFingersBent = (
            landmarks[12].y > landmarks[10].y && 
            landmarks[16].y > landmarks[14].y && 
            landmarks[20].y > landmarks[18].y
        );
        return thumbAndIndexClose && areOtherFingersBent;
    }

    let lastToastTime = 0; // Almacena el tiempo del último toast
    const toastCooldown = 1000; // Tiempo en milisegundos entre cada toast (1 segundo)
    
    function showToast(message) {
        const currentTime = Date.now();
        
        // Evita mostrar un toast si no ha pasado suficiente tiempo desde el último
        if (currentTime - lastToastTime < toastCooldown) {
            return; // No mostrar el toast si no ha pasado el tiempo suficiente
        }
    
        lastToastTime = currentTime; // Actualiza el tiempo del último toast
    
        const toastContainer = document.getElementById("toast-container");
        
        // Limita la cantidad de toasts visibles a 3
        if (toastContainer.children.length >= 3) {
            toastContainer.removeChild(toastContainer.children[0]); // Elimina el primer toast
        }
    
        const toast = document.createElement("div");
        toast.classList.add("toast");
        toast.innerText = message;
    
        toastContainer.appendChild(toast);
    
        setTimeout(() => {
            toast.remove();
        }, 4000); // Elimina el toast después de 4 segundos
    }

    setupCamera();
}

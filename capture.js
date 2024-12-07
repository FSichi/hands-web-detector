document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('canvas');
    const captureButton = document.getElementById('capture-img');

    captureButton.addEventListener('click', () => {
        // console.log("Contenido del canvas antes de la captura:", canvasElement);
        captureImage();
        showToast("¡Imagen capturada exitosamente!");
    });

    // Acceder al video de la cámara
    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                videoElement.srcObject = stream;
            })
            .catch((err) => {
                console.error("Error al acceder al video", err);
            });
    };

    // Función para capturar una imagen desde el video
    // Función para capturar una imagen desde el canvas
    const captureImage = () => {
        // Solicitar un frame para asegurarse de que el dibujo esté listo
        requestAnimationFrame(() => {
            // Convertir el canvas (ya dibujado con puntos) a un blob
            canvasElement.toBlob((blob) => {
                if (blob) {
                    saveImageToIndexedDB(blob); // Guardar la imagen
                    console.log("Imagen con puntos y conexiones capturada y guardada.");
                    sendImageToFlask(blob); // Enviar al servicio Flask
                }
            }, 'image/jpeg'); // Cambiar a 'image/png' si prefieres ese formato
        });
    };

     // Función para enviar la imagen al servicio Flask
    const sendImageToFlask = async (imageBlob) => {
        const formData = new FormData();
        formData.append('image', imageBlob, 'captured_image.jpg');

        try {
            const response = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                showToast(`Predicción recibida: ${result.predicted_label}`);
                console.log('Predicción:', result.predicted_label);
            } else {
                const error = await response.json();
                showToast(`Error: ${error.error}`);
                console.error('Error del servicio Flask:', error);
            }
        } catch (err) {
            showToast('Error al comunicarse con el servicio Flask');
            console.error('Error al enviar la imagen:', err);
        }
    };

    // Función para guardar la imagen en IndexedDB
    const saveImageToIndexedDB = (imageBlob) => {
        const imageId = Date.now().toString(); // Genera un ID único basado en el timestamp
        openDatabase().then((db) => {
            const transaction = db.transaction('images', 'readwrite');
            const store = transaction.objectStore('images');

            const imageObject = {
                id: imageId,
                blob: imageBlob,
                timestamp: new Date().toISOString(),
            };

            const request = store.add(imageObject);
            request.onsuccess = () => {
                console.log('Imagen guardada correctamente en IndexedDB');
            };
            request.onerror = () => {
                console.error('Error al guardar la imagen');
            };
        }).catch((error) => {
            console.error('Error al abrir la base de datos:', error);
        });
    };

    // Abre o crea la base de datos en IndexedDB
    const openDatabase = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('imageStore', 1);
            request.onerror = (event) => {
                reject('Error al abrir la base de datos');
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('images')) {
                    db.createObjectStore('images', { keyPath: 'id' });
                }
            };
        });
    };

    function showToast(message) {
        const toastContainer = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.classList.add("toast");
        toast.innerText = message;
    
        toastContainer.appendChild(toast);
    
        // Eliminar el toast después de que desaparezca
        setTimeout(() => {
            toast.remove();
        }, 4000); // El toast desaparece después de 4 segundos
    }

    // Evento para capturar la imagen cuando se presiona el botón
    // captureButton.addEventListener('click', captureImage);

    // Iniciar el video al cargar la página
    startVideo();
});

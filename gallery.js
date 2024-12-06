document.addEventListener('DOMContentLoaded', () => {
    const galleryElement = document.getElementById('gallery');

    // Abrir la base de datos en IndexedDB
    const openDatabase = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('imageStore', 1);
            request.onerror = () => reject('Error al abrir la base de datos');
            request.onsuccess = (event) => resolve(event.target.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('images')) {
                    db.createObjectStore('images', { keyPath: 'id' });
                }
            };
        });
    };

    // Obtener todas las imágenes de IndexedDB
    const fetchImagesFromDatabase = async () => {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('images', 'readonly');
            const store = transaction.objectStore('images');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error al obtener las imágenes');
        });
    };

    // Renderizar las imágenes en la galería
    const renderGallery = async () => {
        try {
            const images = await fetchImagesFromDatabase();

            if (images.length === 0) {
                galleryElement.innerHTML = '<p>No hay imágenes disponibles.</p>';
                return;
            }

            images.forEach((imageObj) => {
                const imgElement = document.createElement('img');
                const url = URL.createObjectURL(imageObj.blob); // Crear una URL para el blob
                imgElement.src = url;
                imgElement.alt = 'Imagen capturada';
                galleryElement.appendChild(imgElement);
            });
        } catch (error) {
            console.error(error);
            galleryElement.innerHTML = '<p>Error al cargar la galería.</p>';
        }
    };

    // Llamar a la función para renderizar la galería
    renderGallery();
});

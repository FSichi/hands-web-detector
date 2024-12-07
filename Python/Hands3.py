import cv2
import mediapipe as mp
import numpy as np
import tkinter as tk
from tkinter import messagebox

# Inicializar MediaPipe
mp_drawing = mp.solutions.drawing_utils
mp_holistic = mp.solutions.holistic
mp_hands = mp.solutions.hands

cap = cv2.VideoCapture(0)

# Configurar ventanas
cv2.namedWindow('MediaPipe Holistic', cv2.WINDOW_NORMAL)
cv2.resizeWindow('MediaPipe Holistic', 1920, 1080)

# Variables para controlar los filtros
show_hands_only = False
apply_blur = False
apply_gray = False
apply_canny = False
apply_sepia = False
invert_colors = False

def toggle_filter(filter_name):
    global apply_blur, apply_gray, apply_canny, apply_sepia, invert_colors, show_hands_only

    # Desactivar todos los filtros antes de activar uno nuevo
    apply_blur = apply_gray = apply_canny = apply_sepia = invert_colors = show_hands_only = False

    if filter_name == "hands":
        show_hands_only = True
    elif filter_name == "blur":
        apply_blur = True
    elif filter_name == "gray":
        apply_gray = True
    elif filter_name == "canny":
        apply_canny = True
    elif filter_name == "sepia":
        apply_sepia = True
    elif filter_name == "invert":
        invert_colors = True

def reset_filters():
    global apply_blur, apply_gray, apply_canny, apply_sepia, invert_colors, show_hands_only
    # Resetear todos los filtros
    apply_blur = apply_gray = apply_canny = apply_sepia = invert_colors = show_hands_only = False

def create_control_window():
    window = tk.Tk()
    window.title("Controles de Filtros")

    # Crear botones para los filtros
    hands_button = tk.Button(window, text="Solo manos", command=lambda: toggle_filter("hands"))
    hands_button.pack(padx=20, pady=5)

    blur_button = tk.Button(window, text="Desenfoque", command=lambda: toggle_filter("blur"))
    blur_button.pack(padx=20, pady=5)

    gray_button = tk.Button(window, text="Escala de grises", command=lambda: toggle_filter("gray"))
    gray_button.pack(padx=20, pady=5)

    canny_button = tk.Button(window, text="Canny", command=lambda: toggle_filter("canny"))
    canny_button.pack(padx=20, pady=5)

    sepia_button = tk.Button(window, text="Sepia", command=lambda: toggle_filter("sepia"))
    sepia_button.pack(padx=20, pady=5)

    invert_button = tk.Button(window, text="Invertir Colores", command=lambda: toggle_filter("invert"))
    invert_button.pack(padx=20, pady=5)

    # Botón para resetear los filtros
    reset_button = tk.Button(window, text="Restablecer", command=reset_filters)
    reset_button.pack(padx=20, pady=5)

    window.mainloop()

# Crear la ventana de controles en un hilo separado para que no bloquee la ejecución del video
import threading
control_thread = threading.Thread(target=create_control_window)
control_thread.daemon = True
control_thread.start()

def apply_filter(image):
    if apply_blur:
        image = cv2.GaussianBlur(image, (15, 15), 0)
    if apply_gray:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)  # Aseguramos que sigue siendo BGR
    if apply_canny:
        image = cv2.Canny(image, 100, 200)
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)  # Convertimos la imagen a BGR después de Canny
    if apply_sepia:
        kernel = np.array([[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]])
        image = cv2.transform(image, kernel)
        image = np.clip(image, 0, 255)
    if invert_colors:
        image = cv2.bitwise_not(image)
    return image


# Función para detectar gestos de la mano
def detect_hand_gesture(landmarks):
    thumb_tip = landmarks[mp_hands.HandLandmark.THUMB_TIP]
    index_tip = landmarks[mp_hands.HandLandmark.INDEX_FINGER_TIP]
    middle_tip = landmarks[mp_hands.HandLandmark.MIDDLE_FINGER_TIP]
    ring_tip = landmarks[mp_hands.HandLandmark.RING_FINGER_TIP]
    pinky_tip = landmarks[mp_hands.HandLandmark.PINKY_TIP]

    thumb_ip = landmarks[mp_hands.HandLandmark.THUMB_IP]
    index_mcp = landmarks[mp_hands.HandLandmark.INDEX_FINGER_MCP]
    middle_mcp = landmarks[mp_hands.HandLandmark.MIDDLE_FINGER_MCP]
    ring_mcp = landmarks[mp_hands.HandLandmark.RING_FINGER_MCP]
    pinky_mcp = landmarks[mp_hands.HandLandmark.PINKY_MCP]

    base_distance = np.sqrt(
        (index_mcp.x - pinky_mcp.x) ** 2 + (index_mcp.y - pinky_mcp.y) ** 2
    )

    if base_distance == 0:
        base_distance = 1e-6

    thumb_index_distance = np.sqrt((thumb_tip.x - index_tip.x) ** 2 + (thumb_tip.y - index_tip.y) ** 2) / base_distance
    thumb_pinky_distance = np.sqrt((thumb_tip.x - pinky_tip.x) ** 2 + (thumb_tip.y - pinky_tip.y) ** 2) / base_distance
    index_middle_distance = np.sqrt((index_tip.x - middle_tip.x) ** 2 + (index_tip.y - middle_tip.y) ** 2) / base_distance

    # Verificar si los dedos están extendidos (mano abierta)
    def is_hand_open():
        return (
            thumb_tip.y < thumb_ip.y and
            index_tip.y < index_mcp.y and
            middle_tip.y < middle_mcp.y and
            ring_tip.y < ring_mcp.y and
            pinky_tip.y < pinky_mcp.y and
            thumb_index_distance > 0.2 and
            thumb_pinky_distance > 0.2
        )

    # Detección de gestos
    if is_hand_open():
        return "Mano abierta"
    elif index_tip.y < index_mcp.y and middle_tip.y < middle_mcp.y and ring_tip.y > middle_mcp.y and pinky_tip.y > pinky_mcp.y:
        return "Señal de paz"
    elif (
        thumb_tip.x < index_tip.x < middle_tip.x
        and ring_tip.y > middle_tip.y
        and pinky_tip.y > ring_tip.y
    ):
        return "OK"
    elif index_tip.y < index_mcp.y and pinky_tip.y < pinky_mcp.y and middle_tip.y > index_mcp.y and ring_tip.y > middle_mcp.y:
        return "Rock on (cuernos)"
    else:
        return ""


# Iniciar MediaPipe Holistic
with mp_holistic.Holistic(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5) as holistic:

    hand_detected = False

    while cap.isOpened():
        success, image = cap.read()
        if not success:
            print("Ignoring empty camera frame.")
            continue

        # Convertir BGR a RGB para procesamiento
        image = cv2.cvtColor(cv2.flip(image, 1), cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        results = holistic.process(image)

        # Convertir de nuevo a BGR para mostrar
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        # -----------------------------
        # Filtro de mostrar solo manos
        # -----------------------------
        if show_hands_only:
            image = np.zeros_like(image)  # Limpiar todo el fondo
            if results.left_hand_landmarks or results.right_hand_landmarks:
                for hand_landmarks in [results.left_hand_landmarks, results.right_hand_landmarks]:
                    if hand_landmarks:
                        # Dibujar conexiones de las manos
                        mp_drawing.draw_landmarks(
                            image, hand_landmarks, mp_hands.HAND_CONNECTIONS
                        )

        # -----------------------------
        # Detección de Manos
        # -----------------------------
        if results.left_hand_landmarks or results.right_hand_landmarks:
            hand_detected = True

            for hand_landmarks in [results.left_hand_landmarks, results.right_hand_landmarks]:
                if hand_landmarks:
                    # Dibujar conexiones de las manos
                    mp_drawing.draw_landmarks(
                        image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                    # Calcular el ROI para la mano
                    coords = []
                    for landmark in hand_landmarks.landmark:
                        x, y, z = image.shape
                        coords.append((int(landmark.x * y), int(landmark.y * x)))

                    RECTANGLE_SIZE = 20
                    x, y, w, h = cv2.boundingRect(np.array(coords))

                    # Ajustar el tamaño del rectángulo
                    x -= RECTANGLE_SIZE
                    y -= RECTANGLE_SIZE
                    w += RECTANGLE_SIZE * 2
                    h += RECTANGLE_SIZE * 2

                    # Dibujar el rectángulo
                    cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)

                    # Determinar el gesto
                    gesture = detect_hand_gesture(hand_landmarks.landmark)

                    # Mostrar mensaje del gesto
                    cv2.putText(image, gesture, (x, y - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)

                    # Ventana secundaria: Mostrar solo la mano
                    hand_roi = image[y:y + h, x:x + w]
                    cv2.namedWindow('Hand ROI', cv2.WINDOW_NORMAL)
                    cv2.resizeWindow('Hand ROI', 600, 600)

                    if hand_roi.shape[0] > 0 and hand_roi.shape[1] > 0:
                        cv2.imshow('Hand ROI', hand_roi)

        elif hand_detected:
            hand_detected = False
            cv2.destroyWindow('Hand ROI')

        # -----------------------------
        # Aplicar filtro de desenfoque
        # -----------------------------
        image = apply_filter(image)

        # -----------------------------
        # Detección de Rostro
        # -----------------------------
        if results.face_landmarks:
            mp_drawing.draw_landmarks(
                image, results.face_landmarks, 
                landmark_drawing_spec=mp_drawing.DrawingSpec(color=(80, 110, 10), thickness=1, circle_radius=1)
            )

        # -----------------------------
        # Detección de Postura (Cuerpo)
        # -----------------------------
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(
                image, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(128, 0, 255), thickness=2, circle_radius=1),
                mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=2))

        # Mostrar imagen principal con todas las detecciones
        cv2.imshow('MediaPipe Holistic', image)

        # Salir con la tecla ESC
        key = cv2.waitKey(5) & 0xFF
        if key == 27:
            break
        elif key == ord('h'):  # Alternar visualización de manos solamente
            show_hands_only = not show_hands_only
        elif key == ord('b'):  # Alternar aplicación de filtro de desenfoque
            apply_blur = not apply_blur
        elif key == ord('g'):
            apply_gray = not apply_gray
        elif key == ord('c'):
            apply_canny = not apply_canny
        elif key == ord('s'):
            apply_sepia = not apply_sepia
        elif key == ord('i'):
            invert_colors = not invert_colors

    cap.release()
    cv2.destroyAllWindows()

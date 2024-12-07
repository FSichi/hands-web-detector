import cv2
import mediapipe as mp
import numpy as np

mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands
cap = cv2.VideoCapture(0)

cv2.namedWindow('MediaPipe Hands', cv2.WINDOW_NORMAL)
cv2.resizeWindow('MediaPipe Hands', 1920, 1080)

with mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5) as hands:
    hand_detected = False
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            print("Ignoring empty camera frame.")
            continue

        image = cv2.cvtColor(cv2.flip(image, 1), cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        results = hands.process(image)

        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        if results.multi_hand_landmarks:
            hand_detected = True
            for hand_landmarks in results.multi_hand_landmarks:
                # print("HAND LANDMARKS: ",hand_landmarks)
                mp_drawing.draw_landmarks(
                    image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                coords = []
                for landmark in hand_landmarks.landmark:
                    x, y, z = image.shape
                    coords.append((int(landmark.x * y), int(landmark.y * x)))

                RECTANGLE_SIZE = 20
                x, y, w, h = cv2.boundingRect(np.array(coords))

                # Aumentar el tamaño del rectángulo
                x -= RECTANGLE_SIZE * 1
                y -= RECTANGLE_SIZE * 1
                w += RECTANGLE_SIZE * 2
                h += RECTANGLE_SIZE * 2

                # Dibujar el rectángulo
                cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)

                # SEGUNDA VENTANA, SOLO LA MANO.

                hand_roi = image[y:y+h, x:x+w]
                cv2.namedWindow('Hand ROI', cv2.WINDOW_NORMAL)
                cv2.resizeWindow('Hand ROI', 600, 600)

                if hand_roi.shape[0] > 0 and hand_roi.shape[1] > 0:
                    cv2.imshow('Hand ROI', hand_roi)
                    

        elif hand_detected:
            hand_detected = False
            cv2.destroyWindow('Hand ROI')

        cv2.imshow('MediaPipe Hands', image)
        if cv2.waitKey(5) & 0xFF == 27:
            break

cap.release()
cv2.destroyAllWindows()
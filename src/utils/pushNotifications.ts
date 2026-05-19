import { API_BASE_URL } from '../config/api';

/**
 * Solicitar permiso para notificaciones push
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('Ya tienes permisos de notificación');
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Suscribir el navegador a notificaciones push
 */
export async function subscribeToPushNotifications(): Promise<boolean> {
  try {
    // Verificar que el navegador soporte Service Workers
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers no soportados');
      return false;
    }

    // Verificar que el navegador soporte Push API
    if (!('PushManager' in window)) {
      console.log('Push Manager no soportado');
      return false;
    }

    // Solicitar permiso
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Permiso de notificación denegado');
      return false;
    }

    // Obtener la clave pública VAPID
    const vapidResponse = await fetch(`${API_BASE_URL}/api/notificaciones/vapid-public-key`);
    if (!vapidResponse.ok) {
      throw new Error('Error obteniendo clave VAPID');
    }

    const { publicKey } = await vapidResponse.json();

    // Registrar o conseguir el Service Worker
    const registration = await navigator.serviceWorker.ready;

    // Suscribir a push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Enviar suscripción al servidor
    const response = await fetch(`${API_BASE_URL}/api/notificaciones/suscribir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error('Error al suscribir en el servidor');
    }

    console.log('Suscripción a notificaciones push exitosa');
    return true;
  } catch (error) {
    console.error('Error suscribiendo a notificaciones push:', error);
    return false;
  }
}

/**
 * Desuscribir de notificaciones push
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('No hay suscripción activa');
      return true;
    }

    // Notificar al servidor
    await fetch(`${API_BASE_URL}/api/notificaciones/desuscribir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    });

    // Desuscribir localmente
    await subscription.unsubscribe();

    console.log('Desuscripción de notificaciones push exitosa');
    return true;
  } catch (error) {
    console.error('Error desuscribiendo de notificaciones push:', error);
    return false;
  }
}

/**
 * Enviar notificación de prueba
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notificaciones/probar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error enviando notificación de prueba');
    }

    console.log('Notificación de prueba enviada');
    return true;
  } catch (error) {
    console.error('Error enviando notificación de prueba:', error);
    return false;
  }
}

/**
 * Convertir VAPID key de base64 a Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Hook para usar en componentes
 */
import { useEffect, useState } from 'react';

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error verificando suscripción:', error);
    }
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const success = await subscribeToPushNotifications();
      if (success) {
        setIsSubscribed(true);
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPushNotifications();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTest = async () => {
    setIsLoading(true);
    try {
      return await sendTestNotification();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTest,
  };
}

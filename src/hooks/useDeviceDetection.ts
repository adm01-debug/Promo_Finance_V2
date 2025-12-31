import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeviceInfo {
  fingerprint: string;
  browser: string;
  os: string;
  deviceType: string;
  userAgent: string;
}

async function sendDeviceAlertEmail(userId: string, email: string, deviceInfo: DeviceInfo) {
  try {
    const { error } = await supabase.functions.invoke('send-device-alert', {
      body: {
        userId,
        email,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.deviceType,
        timestamp: new Date().toISOString()
      }
    });
    
    if (error) {
      console.error('Error sending device alert email:', error);
    } else {
      console.log('Device alert email sent successfully');
    }
  } catch (error) {
    console.error('Error invoking send-device-alert function:', error);
  }
}

function generateDeviceFingerprint(): DeviceInfo {
  const userAgent = navigator.userAgent;
  const screenResolution = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const platform = navigator.platform;
  
  // Simple fingerprint based on available browser data
  const fingerprintData = `${userAgent}|${screenResolution}|${timezone}|${language}|${platform}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprintData.length; i++) {
    const char = fingerprintData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const fingerprint = Math.abs(hash).toString(36);
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
  
  // Detect OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  
  // Detect device type
  let deviceType = 'Desktop';
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
    deviceType = /iPad|Tablet/i.test(userAgent) ? 'Tablet' : 'Mobile';
  }
  
  return {
    fingerprint,
    browser,
    os,
    deviceType,
    userAgent
  };
}

export function useDeviceDetection() {
  const [isNewDevice, setIsNewDevice] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkDevice = useCallback(async (userId: string): Promise<boolean> => {
    setIsChecking(true);
    try {
      const deviceInfo = generateDeviceFingerprint();
      
      // Check if device is known
      const { data: existingDevice, error: checkError } = await supabase
        .from('known_devices')
        .select('id, last_seen_at')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceInfo.fingerprint)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking device:', checkError);
        return false;
      }
      
      if (existingDevice) {
        // Update last seen
        await supabase
          .from('known_devices')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', existingDevice.id);
        
        setIsNewDevice(false);
        return false;
      }
      
      // New device detected - register it
      const { data: newDevice, error: insertError } = await supabase
        .from('known_devices')
        .insert({
          user_id: userId,
          device_fingerprint: deviceInfo.fingerprint,
          user_agent: deviceInfo.userAgent,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          device_type: deviceInfo.deviceType
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Error registering device:', insertError);
        return false;
      }
      
      // Create alert for new device
      await supabase
        .from('new_device_alerts')
        .insert({
          user_id: userId,
          device_id: newDevice.id,
          user_agent: deviceInfo.userAgent
        });
      
      setIsNewDevice(true);
      
      // Get user email to send alert
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      // Send email notification in background
      if (profile?.email) {
        sendDeviceAlertEmail(userId, profile.email, deviceInfo);
      }
      
      // Show toast notification
      toast.warning('Novo dispositivo detectado', {
        description: `Login de ${deviceInfo.browser} no ${deviceInfo.os}. Se não foi você, altere sua senha imediatamente.`,
        duration: 10000,
        action: {
          label: 'Ver dispositivos',
          onClick: () => window.location.href = '/seguranca'
        }
      });
      
      return true;
    } catch (error) {
      console.error('Device detection error:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const getKnownDevices = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('known_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching devices:', error);
      return [];
    }
    
    return data;
  }, []);

  const removeDevice = useCallback(async (deviceId: string) => {
    const { error } = await supabase
      .from('known_devices')
      .delete()
      .eq('id', deviceId);
    
    if (error) {
      toast.error('Erro ao remover dispositivo');
      return false;
    }
    
    toast.success('Dispositivo removido');
    return true;
  }, []);

  const trustDevice = useCallback(async (deviceId: string, trusted: boolean) => {
    const { error } = await supabase
      .from('known_devices')
      .update({ is_trusted: trusted })
      .eq('id', deviceId);
    
    if (error) {
      toast.error('Erro ao atualizar dispositivo');
      return false;
    }
    
    toast.success(trusted ? 'Dispositivo marcado como confiável' : 'Dispositivo desmarcado');
    return true;
  }, []);

  return {
    isNewDevice,
    isChecking,
    checkDevice,
    getKnownDevices,
    removeDevice,
    trustDevice
  };
}

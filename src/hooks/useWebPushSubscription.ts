// ============================================
// HOOK: useWebPushSubscription (P10)
// ============================================
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VAPID_PUBLIC_KEY = "BOaMVurXnKZYI6zlQDzQbSrDCMjA8nO-DqrQ7-zh3pVlKYx8b3iVnqEWXKYwNYUDCpJ2ISIR2_HHbXlh1Z-nCho";
// ⚠️ Para produção real, substitua por VITE_VAPID_PUBLIC_KEY ou busque do backend.

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function useWebPushSubscription() {
  const { toast } = useToast();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ok = typeof window !== "undefined"
      && "serviceWorker" in navigator
      && "PushManager" in window
      && "Notification" in window;
    setSupported(ok);
    if (ok) {
      navigator.serviceWorker.getRegistration().then(async (reg) => {
        const sub = await reg?.pushManager.getSubscription();
        setSubscribed(!!sub);
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported) {
      toast({ title: "Não suportado", description: "Navegador sem suporte a push.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast({ title: "Permissão negada", variant: "destructive" });
        return;
      }
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        // registra um SW mínimo apenas para push (não interfere em PWA)
        reg = await navigator.serviceWorker.register("/sw-push.js").catch(() => null) ?? undefined;
      }
      if (!reg) {
        toast({ title: "Service Worker indisponível", variant: "destructive" });
        return;
      }
      const keyBytes = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes.buffer.slice(
          keyBytes.byteOffset,
          keyBytes.byteOffset + keyBytes.byteLength,
        ) as ArrayBuffer,
      });
      const json = sub.toJSON();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Usuário não autenticado");
      const { error } = await (supabase as unknown as {
        from: (t: string) => {
          upsert: (v: Record<string, unknown>, o: { onConflict: string }) => Promise<{ error: Error | null }>;
        };
      })
        .from("push_subscriptions")
        .upsert({
          user_id: u.user.id,
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
          user_agent: navigator.userAgent,
          ativo: true,
        }, { onConflict: "user_id,endpoint" });
      if (error) throw error;
      setSubscribed(true);
      toast({ title: "Notificações ativadas", description: "Você receberá alertas críticos." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [supported, toast]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await (supabase as unknown as {
          from: (t: string) => {
            update: (v: Record<string, unknown>) => {
              eq: (c: string, v: string) => Promise<{ error: Error | null }>;
            };
          };
        })
          .from("push_subscriptions")
          .update({ ativo: false })
          .eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast({ title: "Notificações desativadas" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { supported, subscribed, loading, subscribe, unsubscribe };
}

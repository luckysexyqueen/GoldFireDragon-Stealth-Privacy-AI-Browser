import { useState, useCallback, useEffect } from 'react';
import { GenerationConfig } from '@/types/engine';
import { supabase, DBModelProfile } from '@/lib/supabase';
import { toast } from 'sonner';

export function useModelProfiles() {
  const [profiles, setProfiles] = useState<DBModelProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('model_profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setProfiles(data as DBModelProfile[]);
    }
    setLoading(false);
  }, []);

  const saveProfile = useCallback(async (name: string, description: string, config: GenerationConfig): Promise<boolean> => {
    const payload = {
      name,
      description: description || null,
      system_prompt: config.system_prompt,
      temperature: config.temperature,
      top_p: config.top_p,
      max_tokens: config.max_tokens,
      repetition_penalty: config.repetition_penalty,
      stream: config.stream,
      stop_sequences: config.stop_sequences || [],
      updated_at: new Date().toISOString(),
    };

    // Upsert by name
    const { data, error } = await supabase
      .from('model_profiles')
      .upsert(payload, { onConflict: 'name' })
      .select()
      .single();

    if (error) {
      toast.error(`프로필 저장 실패: ${error.message}`);
      return false;
    }

    const saved = data as DBModelProfile;
    setProfiles(prev => {
      const existing = prev.findIndex(p => p.name === name);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = saved;
        return updated;
      }
      return [saved, ...prev];
    });

    toast.success(`프로필 "${name}" 저장됨`);
    return true;
  }, []);

  const deleteProfile = useCallback(async (id: string, name: string) => {
    const { error } = await supabase
      .from('model_profiles')
      .delete()
      .eq('id', id);

    if (!error) {
      setProfiles(prev => prev.filter(p => p.id !== id));
      toast.success(`프로필 "${name}" 삭제됨`);
    } else {
      toast.error('프로필 삭제 실패');
    }
  }, []);

  const profileToConfig = useCallback((profile: DBModelProfile): Partial<GenerationConfig> => ({
    system_prompt: profile.system_prompt,
    temperature: profile.temperature,
    top_p: profile.top_p,
    max_tokens: profile.max_tokens,
    repetition_penalty: profile.repetition_penalty,
    stream: profile.stream,
    stop_sequences: profile.stop_sequences,
  }), []);

  return {
    profiles,
    loading,
    loadProfiles,
    saveProfile,
    deleteProfile,
    profileToConfig,
  };
}

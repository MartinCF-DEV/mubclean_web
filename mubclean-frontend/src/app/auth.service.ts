import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private supabase: SupabaseClient;
    user = signal<User | null>(null);
    session = signal<Session | null>(null);

    userProfile = signal<any>(null);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

        // Initialize session
        this.supabase.auth.getSession().then(({ data: { session } }) => {
            this.setSession(session);
            if (session) this.loadUserProfile();
        });

        // Listen for changes
        this.supabase.auth.onAuthStateChange((_event, session) => {
            this.setSession(session);
            if (session) {
                this.loadUserProfile();
            } else {
                this.userProfile.set(null);
            }
        });
    }

    async checkSession() {
        const { data: { session } } = await this.supabase.auth.getSession();
        this.setSession(session);
        if (session) await this.loadUserProfile();
    }

    private setSession(session: Session | null) {
        this.session.set(session);
        this.user.set(session?.user ?? null);
    }

    async loadUserProfile() {
        const user = this.user();
        if (!user) return;

        const { data, error } = await this.supabase
            .from('perfiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!error && data) {
            this.userProfile.set(data);
        }
    }

    get profile() {
        return this.userProfile();
    }

    async signIn(email: string, password: string) {
        const { error } = await this.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        await this.loadUserProfile();
    }

    async signUp(email: string, password: string, fullName: string, phone?: string, role: string = 'cliente', businessName?: string) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nombre_completo: fullName,
                }
            }
        });

        if (error) throw error;

        if (data.user) {
            // 1. Create Profile
            await this.supabase.from('perfiles').upsert({
                id: data.user.id,
                email: email,
                nombre_completo: fullName,
                telefono: phone,
                rol: role
            });

            // 2. Create Business if needed
            if (role === 'negocio' && businessName) {
                await this.supabase.from('negocios').insert({
                    owner_id: data.user.id,
                    nombre: businessName,
                    telefono: phone, // Optional: use personal phone as business phone initially
                    descripcion: 'Descripción pendiente',
                    direccion: 'Dirección pendiente'
                });
            }

            await this.loadUserProfile();
        }
    }

    async signOut() {
        await this.supabase.auth.signOut();
        this.userProfile.set(null);
    }

    async updatePhone(phone: string) {
        const user = this.user();
        if (!user) return;

        const { error } = await this.supabase
            .from('perfiles')
            .update({ telefono: phone })
            .eq('id', user.id);

        if (error) throw error;
        await this.loadUserProfile();
    }

    async resetPassword(email: string) {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
    }

    async uploadProfileImage(file: File): Promise<void> {
        const user = this.user();
        if (!user) throw new Error("No authenticated user");

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await this.supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = this.supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        const publicUrl = data.publicUrl;

        const { error: updateError } = await this.supabase
            .from('perfiles')
            .update({ foto_url: publicUrl })
            .eq('id', user.id);

        if (updateError) throw updateError;

        await this.loadUserProfile();
    }

    async deleteAccount() {
        const user = this.user();
        if (!user) return;

        // Note: Supabase Client SDK usually doesn't allow deleting the user directly from the client side 
        // unless 'delete user' is enabled in policies or using a server function.
        // Assuming we rely on the backend or a specific RPC if enforced.
        // However, for this demo we will try calling the admin API via our backend proxy if we had one,
        // OR we just use the RPC if it exists. 
        // Flutter code seemed to call auth.deleteAccount() which might be a custom extension or standard if enabled.

        // Standard way is calling an Edge Function, but here we'll try the direct method 
        // or a placeholder if it requires Service Role.
        // Actually, in the frontend, we can't easily delete the user from auth.users without a function.
        // We will just clear the profile data to simulate "deletion" for now, or assume an RPC exists.

        // For safety/demo in this refactor:
        throw new Error("Functionality requires backend support (Admin API).");
    }

    get currentUser() {
        return this.user();
    }

    get client() {
        return this.supabase;
    }
}

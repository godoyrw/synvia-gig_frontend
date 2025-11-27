// src/stores/users.js
import { defineStore } from 'pinia';
import { getUsers, createUser, updateUser, deleteUser } from '@/services/users';

export const useUsersStore = defineStore('users', {
    state: () => ({
        users: [],
        loading: false,
        error: null
    }),

    getters: {
        getUserById: (state) => (id) => state.users.find((u) => u.id === id)
    },

    actions: {
        /**
         * Load all users
         */
        async loadUsers() {
            this.loading = true;
            this.error = null;
            try {
                this.users = await getUsers();
            } catch (err) {
                this.error = err.message || 'Erro ao carregar usuários';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Add a new user
         */
        async addUser(userData) {
            this.loading = true;
            this.error = null;
            try {
                const newUser = await createUser(userData);
                this.users.push(newUser);
                return newUser;
            } catch (err) {
                this.error = err.message || 'Erro ao criar usuário';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Update an existing user
         */
        async editUser(id, userData) {
            this.loading = true;
            this.error = null;
            try {
                const updatedUser = await updateUser(id, userData);
                const index = this.users.findIndex((u) => u.id === id);
                if (index !== -1) {
                    this.users[index] = updatedUser;
                }
                return updatedUser;
            } catch (err) {
                this.error = err.message || 'Erro ao atualizar usuário';
                throw err;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Remove a user
         */
        async removeUser(id) {
            this.loading = true;
            this.error = null;
            try {
                await deleteUser(id);
                this.users = this.users.filter((u) => u.id !== id);
            } catch (err) {
                this.error = err.message || 'Erro ao deletar usuário';
                throw err;
            } finally {
                this.loading = false;
            }
        }
    }
});

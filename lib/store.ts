// Compatibilidad. La capa de datos vive ahora en lib/data (interfaz Repo, asíncrona,
// con implementación en memoria y adaptador de Supabase). Usa getRepo().
export { getRepo } from "./data";

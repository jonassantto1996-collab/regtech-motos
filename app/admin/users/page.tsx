import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../AdminShell";
import { requireAdminSession } from "../products/actions";
import { inviteAdminUser, setAdminUserActive } from "./actions";
import "../admin.css";

const errorMessages: Record<string, string> = {
  invalid_name: "Informe o nome do usuário.",
  invalid_email: "Informe um e-mail válido.",
  invite_failed: "Não foi possível enviar o convite. Verifique a configuração de e-mail do Supabase.",
  authorization_failed: "A conta foi criada, mas não foi possível liberar o acesso ao dashboard.",
  cannot_disable_self: "Você não pode desativar a própria conta.",
  server_error: "Não foi possível concluir a operação. Tente novamente.",
};

const successMessages: Record<string, string> = {
  invited: "Convite enviado. O usuário deve abrir o e-mail e criar a própria senha.",
  enabled: "Usuário autorizado com sucesso.",
  disabled: "Usuário desativado com sucesso.",
};

type AdminRow = {
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const currentUserId = await requireAdminSession();

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/admin/login");

  const params = await searchParams;
  const admin = createAdminClient();

  const { data: adminRows, error: adminRowsError } = await admin
    .from("admin_users")
    .select("user_id,role,is_active,created_at")
    .order("created_at", { ascending: true });

  const rows = (adminRows ?? []) as AdminRow[];

  const users = await Promise.all(
    rows.map(async (row) => {
      const { data, error } = await admin.auth.admin.getUserById(row.user_id);
      const authUser = error ? null : data.user;
      const displayName =
        typeof authUser?.user_metadata?.display_name === "string"
          ? authUser.user_metadata.display_name
          : "Usuário";

      const status = !row.is_active
        ? "Desativado"
        : authUser?.email_confirmed_at
          ? "Ativo"
          : authUser?.invited_at
            ? "Convite enviado"
            : "Pendente";

      return {
        ...row,
        email: authUser?.email ?? "Conta não encontrada",
        displayName,
        status,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
        isCurrent: row.user_id === currentUserId,
      };
    })
  );

  return (
    <AdminShell active="users" email={claims.claims.email}>
      <section className="admin-content admin-page">
        <div className="page-heading">
          <div>
            <span>SISTEMA</span>
            <h1>Usuários</h1>
            <p>Convide pessoas autorizadas para acessar o dashboard da Regtech Motors.</p>
          </div>
        </div>

        {params.error && (
          <p className="admin-alert error" role="alert">
            {errorMessages[params.error] ?? errorMessages.server_error}
          </p>
        )}
        {params.success && (
          <p className="admin-alert success" role="status">
            {successMessages[params.success] ?? "Operação concluída."}
          </p>
        )}

        <div className="users-admin-grid">
          <article className="panel users-invite-panel">
            <div className="panel-title">
              <h2>Adicionar usuário</h2>
            </div>
            <p className="users-helper">
              O sistema envia um convite para o e-mail informado. A pessoa abre o link, cria a própria senha e passa a entrar pelo login administrativo.
            </p>

            <form action={inviteAdminUser} className="users-invite-form">
              <label className="admin-field">
                Nome
                <input className="admin-control" type="text" name="name" maxLength={120} required placeholder="Ex.: Maria Souza" />
              </label>
              <label className="admin-field">
                E-mail
                <input className="admin-control" type="email" name="email" required placeholder="nome@empresa.com.br" />
              </label>
              <button className="admin-primary-button" type="submit">
                Enviar convite
              </button>
            </form>

            <p className="users-security-note">
              Por enquanto, todos os usuários cadastrados aqui recebem o perfil Administrador, com acesso às mesmas áreas do painel.
            </p>
          </article>

          <article className="panel users-list-panel">
            <div className="panel-title">
              <h2>Usuários com acesso</h2>
              <span className="users-count">{users.length}</span>
            </div>

            {adminRowsError ? (
              <p className="admin-alert error">Não foi possível carregar os usuários.</p>
            ) : users.length === 0 ? (
              <p className="form-muted">Nenhum usuário administrativo cadastrado.</p>
            ) : (
              <div className="users-list">
                {users.map((user) => (
                  <div className="users-row" key={user.user_id}>
                    <div className="users-avatar">
                      {user.displayName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="users-identity">
                      <strong>
                        {user.displayName}
                        {user.isCurrent ? <small className="users-you">Você</small> : null}
                      </strong>
                      <span>{user.email}</span>
                      <small>
                        {user.lastSignInAt
                          ? `Último acesso: ${new Intl.DateTimeFormat("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                              timeZone: "America/Belem",
                            }).format(new Date(user.lastSignInAt))}`
                          : "Ainda não entrou no painel"}
                      </small>
                    </div>
                    <div className="users-access">
                      <span className={`users-status ${user.status === "Ativo" ? "active" : user.status === "Desativado" ? "disabled" : "pending"}`}>
                        {user.status}
                      </span>
                      {!user.isCurrent && (
                        <form action={setAdminUserActive.bind(null, user.user_id, !user.is_active)}>
                          <button className={user.is_active ? "users-disable" : "users-enable"} type="submit">
                            {user.is_active ? "Desativar" : "Reativar"}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </AdminShell>
  );
}

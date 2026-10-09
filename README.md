# Sistema Cad

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sistema-cad.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e2f95ca0-0410-4622-b55e-89560ff42eb2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Acesso do administrador

O login administrativo valida a senha no servidor e mantém a sessão em um cookie `HttpOnly`, com expiração de 8 horas. Configure os segredos localmente em `.env.local` (use `.env.example` como referência):

```env
ADMIN_PASSWORD=uma-senha-forte-e-unica-com-no-minimo-12-caracteres
SESSION_SECRET=um-segredo-aleatorio-com-no-minimo-32-caracteres
```

Não use os valores de exemplo em produção, não compartilhe esses segredos e configure-os também como secrets no ambiente de hospedagem. Reinicie o servidor depois de alterar `.env.local`. Sem os dois segredos válidos, o login administrativo falha de forma explícita.

Somente uma sessão administrativa válida pode abrir e salvar cadastros de alunos e professores. Os cadastros continuam armazenados no navegador (`localStorage`), não em um banco: portanto, não são compartilhados com outros dispositivos ou usuários e podem ser apagados pelo navegador. Contas individuais para alunos e professores e armazenamento centralizado exigem a etapa futura de banco de dados e autenticação desses perfis.

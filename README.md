# AgendaHub API

Backend de um sistema de agendamentos para salões, barbearias e prestadores de serviços.

Cada negócio possui serviços, horários de funcionamento, bloqueios e agendamentos próprios. Clientes podem solicitar agendamentos sem criar uma conta; operações administrativas exigem autenticação.

## Tecnologias

- Node.js e TypeScript
- Express
- PostgreSQL
- Prisma ORM 8 — versão release candidate
- JWT e bcrypt
- CORS e limitação de requisições na autenticação

## Funcionalidades

- Cadastro de negócio com administrador.
- Login com token JWT de uma hora.
- Autorização administrativa por negócio.
- Cadastro, edição e ativação de serviços.
- Consulta pública de horários disponíveis.
- Criação, cancelamento, conclusão e reativação de agendamentos.
- Configuração do funcionamento semanal.
- Cadastro e remoção de períodos bloqueados.
- Controle de concorrência nas operações da agenda.
- Validação das variáveis de ambiente na inicialização.
- Encerramento controlado do servidor e das conexões com o banco.

## Requisitos

- Node.js: execução local validada com a versão 22.18.0.
- npm.
- PostgreSQL disponível e um banco criado.
- Git.

O projeto utiliza APIs do Prisma 8 RC. Instale as versões registradas
no package-lock.json; os comandos podem ser diferentes dos utilizados
em versões anteriores do Prisma.

## Instalação

```bash
git clone https://github.com/FellipeBordin/agendahub-api.git
cd agendahub-api
npm ci
```

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite o `.env` com as configurações locais.

| Variável     | Descrição                                                    |
| ------------ | ------------------------------------------------------------ |
| DATABASE_URL | URL de conexão com o PostgreSQL, incluindo o nome do banco   |
| JWT_SECRET   | Chave de assinatura dos tokens, com pelo menos 64 caracteres |
| PORT         | Porta da API; padrão: 3000                                   |
| CORS_ORIGINS | Origens autorizadas para o frontend, separadas por vírgula   |

Gere uma chave JWT:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copie somente o valor gerado para `JWT_SECRET`.

Não publique o `.env`, senhas ou tokens. Cada computador precisa de sua
própria configuração. Bancos locais independentes não compartilham usuários
ou agendamentos automaticamente.

## Banco de dados

Crie o banco PostgreSQL informado em `DATABASE_URL` antes de aplicar
as migrations.

Confira os arquivos e visualize o caminho de aplicação:

```bash
npx prisma migration check
npx prisma db migrate --show
```

Aplique as migrations existentes:

```bash
npx prisma db migrate
npx prisma migration status
```

As migrations criam a estrutura do banco. Elas não copiam os dados
de outro ambiente.

O contrato gerado do Prisma fica em `src/prisma`. Para emiti-lo novamente
quando necessário:

```bash
npm run contract:emit
```

Emitir o contrato não substitui a aplicação de migrations.

## Execução

Durante o desenvolvimento:

```bash
npm run dev
```

Verificação de tipos:

```bash
npm run typecheck
```

Compilação e execução do JavaScript:

```bash
npm run build
npm start
```

Por padrão, a API fica disponível em:

```text
http://localhost:3000
```

Após alterações no código, execute novamente o build antes de usar
`npm start`.

A compilação da API exclui `src/tests` e `src/scripts`.

## Autenticação

### Cadastro

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "businessName": "Salão Exemplo",
  "slug": "salao-exemplo",
  "userName": "Responsável Exemplo",
  "email": "responsavel@example.com",
  "password": "SUBSTITUA_POR_UMA_SENHA"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "responsavel@example.com",
  "password": "SUBSTITUA_POR_UMA_SENHA"
}
```

O login retorna `accessToken`, `tokenType`, `expiresIn`, usuário e negócio.

Nas rotas administrativas, envie:

```http
Authorization: Bearer SEU_ACCESS_TOKEN
```

O administrador somente pode acessar o negócio ao qual está vinculado.

## Rotas

Todos os caminhos abaixo começam com `/api`.

| Método | Caminho                                                | Acesso                   |
| ------ | ------------------------------------------------------ | ------------------------ |
| POST   | /auth/register                                         | Público                  |
| POST   | /auth/login                                            | Público                  |
| GET    | /services/:slug                                        | Público                  |
| GET    | /services/:slug/:id                                    | Público                  |
| POST   | /services/:slug                                        | Administrador do negócio |
| PUT    | /services/:slug/:id                                    | Administrador do negócio |
| PATCH  | /services/:slug/:id/status                             | Administrador do negócio |
| GET    | /availability/:slug/slots?date=YYYY-MM-DD&serviceId=ID | Público                  |
| POST   | /availability/:slug                                    | Administrador do negócio |
| PATCH  | /availability/:slug                                    | Administrador do negócio |
| POST   | /appointments/:slug                                    | Público                  |
| GET    | /appointments/:slug                                    | Administrador do negócio |
| GET    | /appointments/:slug/:id                                | Administrador do negócio |
| PATCH  | /appointments/:slug/:id/status                         | Administrador do negócio |
| POST   | /blocked-periods/:slug                                 | Administrador do negócio |
| GET    | /blocked-periods/:slug                                 | Administrador do negócio |
| DELETE | /blocked-periods/:slug/:id                             | Administrador do negócio |

Substitua `:slug` pelo identificador do negócio e `:id` pelo ID do registro.

## Regras da agenda

- Inícios de atendimento em minutos `00` ou `30`, sem segundos ou milissegundos.
- A duração completa do serviço deve caber no funcionamento.
- Serviços podem ter duração diferente de 30 minutos, como 40 ou 60.
- Não é possível criar uma reserva no passado.
- Agendamentos marcados e períodos bloqueados impedem reservas sobrepostas.
- Serviços inativos não permitem novas reservas ou reativações.
- Desativar um serviço não cancela automaticamente suas reservas.
- Alterar a duração de um serviço não modifica o intervalo das reservas existentes.
- Alterações de funcionamento são recusadas quando deixam agendamentos
  ativos, futuros ou em andamento fora do novo horário.

Os intervalos de 30 minutos representam opções de início, não uma pausa
obrigatória entre atendimentos.

### Status

- `SCHEDULED`: marcado.
- `COMPLETED`: concluído.
- `CANCELED`: cancelado.

Um agendamento marcado pode ser concluído ou cancelado. Um cancelado
pode ser reativado se passar pelas verificações de disponibilidade.
Agendamentos concluídos não podem ser reativados ou cancelados.

### Datas e fuso

Envie datas com horário, segundos e fuso explícito:

```text
2026-11-04T10:00:00-03:00
2026-11-04T13:00:00Z
```

Esses exemplos representam o mesmo instante. Ao criar uma reserva,
utilize uma data futura.

Os dados são normalizados para UTC. Atualmente, a geração de slots
e os bloqueios de dia inteiro usam o deslocamento fixo `-03:00`.
As verificações locais de funcionamento usam `America/Sao_Paulo`.

Ainda não há configuração individual de fuso por negócio.

### Bloqueio de dia inteiro

Com `allDay: true`, o bloqueio corresponde a um único dia no fuso
do negócio, determinado por `startAt`.

`startAt` e `endAt` continuam obrigatórios e devem formar um intervalo
válido. Depois da validação, o período é ajustado da meia-noite local
até a meia-noite seguinte.

### Concorrência

As operações protegidas utilizam uma transação e uma trava por negócio
para coordenar verificações e alterações da agenda.

Essa proteção depende do uso dos serviços que participam da mesma
trava. Escritas diretas no banco não recebem automaticamente essa proteção.

## Formatos de entrada

- Preço: texto decimal positivo com até duas casas, como `"60.00"`.
- Duração: número inteiro positivo, em minutos.
- Dia da semana: inteiro de `0` a `6`, sendo `0` domingo.
- Funcionamento: horários no formato `HH:mm`, com término após o início.
- Senha de cadastro: mínimo de 8 caracteres e máximo de 72 bytes.
- O limite de senha considera bytes; caracteres acentuados podem ocupar mais de um.

## Respostas de erro

As respostas de erro utilizam JSON com o campo `error`.

| Status | Exemplos                                                  |
| ------ | --------------------------------------------------------- |
| 400    | Entrada inválida, JSON malformado ou reserva recusada     |
| 401    | Token ausente/inválido ou credenciais incorretas          |
| 403    | Acesso a outro negócio ou negócio indisponível            |
| 404    | Rota ou registro não encontrado                           |
| 409    | Cadastro duplicado ou conflito de operação administrativa |
| 413    | Corpo JSON acima do limite de 100 KB                      |
| 429    | Limite de requisições de autenticação atingido            |
| 500    | Erro interno inesperado                                   |

## Limites de autenticação

- Login: 10 requisições por IP a cada 15 minutos.
- Cadastro: 5 requisições por IP a cada hora.
- As duas rotas possuem contadores independentes.
- Tentativas bem-sucedidas também são contabilizadas.
- Respostas `429` incluem `Retry-After`.

Os contadores ficam em memória e são reiniciados com o processo.
Uma implantação com múltiplas instâncias exige revisão do armazenamento
dos contadores e da configuração de proxy.

## CORS

`CORS_ORIGINS` define quais origens podem acessar as respostas pelo navegador.

Exemplo local:

```env
CORS_ORIGINS=http://localhost:5173
```

O frontend pode enviar o JWT no cabeçalho `Authorization`.
A configuração atual não habilita credenciais por cookies.

CORS não substitui autenticação e não impede chamadas feitas por
ferramentas como Thunder Client.

## Testes

Os testes ficam em `src/tests`. As tarefas auxiliares, como criação
de administrador de teste, ficam em `src/scripts`.

### Validações sem API ou banco

```bash
npx tsx src/tests/test-input-validators.ts
npx tsx src/tests/test-register-validator.ts
npx tsx src/tests/test-schedule-validators.ts
```

### Tokens

Requer `JWT_SECRET` configurada:

```bash
npx tsx src/tests/test-auth-tokens.ts
```

### Testes HTTP

Requerem a API rodando em `localhost:3000`.

```bash
npx tsx src/tests/test-request-body.ts
npx tsx src/tests/test-auth-rate-limit.ts
```

Para o teste de rate limit, reinicie a API antes de executar e não
faça outras chamadas de autenticação durante o teste. Reinicie novamente
depois, para liberar os limites consumidos.

### Integração e concorrência

Exemplos disponíveis:

```bash
npx tsx src/tests/test-api-business-access.ts
npx tsx src/tests/test-service-appointments.ts
npx tsx src/tests/test-concurrent-availability.ts
npx tsx src/tests/test-concurrent-block.ts
npx tsx src/tests/test-concurrent-reactivation-block.ts
```

Esses testes utilizam o banco. O teste de acesso por negócio também
precisa da API ligada e apontando para o mesmo banco.

Execute testes que criam ou removem registros somente em um ambiente
de desenvolvimento ou teste. Confira as configurações e a preparação
dos dados de cada script antes de executá-lo.

## Encerramento

A API trata `SIGINT` e `SIGTERM` para:

1. Parar de aceitar novas conexões.
2. Aguardar o encerramento das requisições HTTP.
3. Fechar as conexões com o banco.

O prazo total é de 15 segundos. Se excedido, o processo encerra
forçadamente com código de erro.

## Estrutura

- `src/config`: validação das variáveis de ambiente.
- `src/controllers`: entrada e resposta HTTP.
- `src/routes`: definição das rotas.
- `src/services`: regras de negócio e acesso aos dados.
- `src/validators`: validação das entradas.
- `src/middlewares`: autenticação, rate limit e tratamento de erros.
- `src/prisma`: cliente e contrato do banco.
- `src/utils`: funções compartilhadas.
- `src/tests`: testes automatizados.
- `src/scripts`: tarefas auxiliares.
- `migrations`: histórico de alterações do banco.

## Estado do projeto

Backend em desenvolvimento, com testes de validação, autenticação,
isolamento entre negócios e concorrência executados durante a implementação.

Build e execução compilada foram verificados localmente.
O frontend e o deploy ainda não foram concluídos.

# Camadas de Domínio

Este diretório concentra regras de negócio e serviços de domínio, isolando lógica dos handlers de API/roteamento.

Estrutura proposta:

- invoices/: regras de faturamento (geração, atualização, validação)
- transactions/: regras financeiras (lançamentos, reconciliação, sumarização)
- clients/: regras de clientes (status, instalação, mídia)

Princípios:

- Serviços puros onde possível (sem efeitos). Dependências externas via portas (repositories/adapters).
- Retornar objetos de resultado (sucesso/erro) com mensagens consistentes.
- Validar entrada com Zod nos serviços quando útil; os handlers continuam validando requests.

# Camadas de Domínio

Este diretório concentra regras de negócio e serviços de domínio, isolando lógica dos handlers de API/roteamento.

Estrutura proposta:

- invoices/: regras de faturamento (geração, atualização, validação)
- transactions/: regras financeiras (lançamentos, reconciliação, sumarização)
- clients/: regras de clientes (status, instalação, mídia)

Princípios:

- Serviços puros onde possível (sem efeitos). Dependências externas via portas (repositories/adapters).
- Retornar objetos de resultado (sucesso/erro) com mensagens consistentes.
- Validar entrada com Zod nos serviços quando útil; os handlers continuam validando requests.
